"use client";

import { createContext, useMemo, use, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { handleProblem, problemFromResponse } from "@/api/problems";
import type { GetCurrentUserResponse } from "@/api/generated";
import {
  currentUserQueryKey,
  fetchCurrentUserQuery,
  fetchSessionQuery,
  sessionQueryKey,
} from "@/lib/auth-query";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  clearTwoFactorChallenge,
  readTwoFactorChallenge,
  saveTwoFactorChallenge,
} from "@/lib/two-factor-challenge";
import { Toaster } from "@/components/ui/sonner";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type RegisterInput = {
  displayName: string;
  email: string;
  password: string;
  invitationToken?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  currentUser: GetCurrentUserResponse | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login(
    email: string,
    password: string,
    nextPath?: string | null,
  ): Promise<void>;
  completeTwoFactorLogin(code: string, nextPath?: string | null): Promise<void>;
  register(data: RegisterInput): Promise<void>;
  googleLogin(idToken: string, nextPath?: string | null): Promise<void>;
  googleConfirm(data: {
    token: string;
    invitationToken?: string | null;
  }): Promise<void>;
  completeOnboarding(data: {
    acceptTerms: boolean;
    acceptMarketingEmails: boolean;
  }): Promise<void>;
  setInitialPassword(data: {
    password: string;
    googleIdToken: string;
  }): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { redirectOnUnauthorized?: boolean },
) {
  const { redirectOnUnauthorized = true, ...requestInit } = init ?? {};
  const response = await fetch(input, {
    ...requestInit,
    headers: {
      "content-type": "application/json",
      ...requestInit.headers,
    },
  });

  if (!response.ok) {
    const problem = await problemFromResponse(response);
    if (redirectOnUnauthorized || problem.status !== 401) {
      handleProblem(problem);
    }
    throw problem;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSessionQuery,
    retry: false,
  });

  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: fetchCurrentUserQuery,
    enabled: Boolean(sessionQuery.data),
    retry: false,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data ?? null,
      currentUser: currentUserQuery.data ?? null,
      permissions: currentUserQuery.data?.permissions ?? [],
      isAuthenticated: Boolean(sessionQuery.data),
      isLoading: sessionQuery.isLoading || currentUserQuery.isFetching,
      async login(email, password, nextPath) {
        type LoginResult =
          | { status: "Authenticated"; user: AuthUser }
          | {
              status: "TwoFactorRequired";
              challengeToken: string;
              expiresAt: string;
            };

        const result = await fetchJson<LoginResult>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        if (result.status === "TwoFactorRequired") {
          saveTwoFactorChallenge({
            challengeToken: result.challengeToken,
            expiresAt: result.expiresAt,
            nextPath: nextPath ?? null,
          });
          push("/login/two-factor");
          return;
        }

        queryClient.setQueryData(sessionQueryKey, result.user);
        const profile = await queryClient.fetchQuery({
          queryKey: currentUserQueryKey,
          queryFn: fetchCurrentUserQuery,
        });
        push(
          profile.hasCompletedOnboarding
            ? safeNextPath(nextPath)
            : "/onboarding",
        );
      },
      async completeTwoFactorLogin(code, nextPath) {
        const challenge = readTwoFactorChallenge();
        if (!challenge) {
          push("/login");
          throw {
            title: "Verification challenge expired",
            status: 401,
          };
        }

        const user = await fetchJson<AuthUser>("/api/auth/login/two-factor", {
          method: "POST",
          redirectOnUnauthorized: false,
          body: JSON.stringify({
            challengeToken: challenge.challengeToken,
            code,
          }),
        });

        clearTwoFactorChallenge();
        queryClient.setQueryData(sessionQueryKey, user);
        const profile = await queryClient.fetchQuery({
          queryKey: currentUserQueryKey,
          queryFn: fetchCurrentUserQuery,
        });
        const target = nextPath ?? challenge.nextPath;
        push(
          profile.hasCompletedOnboarding ? safeNextPath(target) : "/onboarding",
        );
      },
      async register(data) {
        const user = await fetchJson<AuthUser>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        queryClient.setQueryData(sessionQueryKey, user);
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
        push("/onboarding");
      },
      async googleLogin(idToken, nextPath) {
        const response = await fetch("/api/auth/google/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (response.status === 202) {
          const pending = (await response.json()) as {
            pendingToken?: string;
            email?: string;
            displayName?: string;
            detail?: string;
          };
          const params = new URLSearchParams();
          if (pending.pendingToken) {
            params.set("token", pending.pendingToken);
          }
          if (pending.email) {
            params.set("email", pending.email);
          }
          if (pending.displayName) {
            params.set("displayName", pending.displayName);
          }

          if (pending.pendingToken) {
            push(`/auth/google/confirm?${params.toString()}`);
            return;
          }

          toast.success("Check your email", {
            description:
              pending.detail ??
              "Use the confirmation link to finish Google sign-in.",
          });
          return;
        }

        if (!response.ok) {
          const problem = await problemFromResponse(response);
          handleProblem(problem);
          throw problem;
        }

        type GoogleLoginResult =
          | { status: "Authenticated"; user: AuthUser }
          | {
              status: "TwoFactorRequired";
              challengeToken: string;
              expiresAt: string;
            };

        const result = (await response.json()) as GoogleLoginResult;

        if (result.status === "TwoFactorRequired") {
          saveTwoFactorChallenge({
            challengeToken: result.challengeToken,
            expiresAt: result.expiresAt,
            nextPath: nextPath ?? null,
          });
          push("/login/two-factor");
          return;
        }

        queryClient.setQueryData(sessionQueryKey, result.user);
        const profile = await queryClient.fetchQuery({
          queryKey: currentUserQueryKey,
          queryFn: fetchCurrentUserQuery,
        });
        push(
          profile.hasCompletedOnboarding
            ? safeNextPath(nextPath)
            : "/onboarding",
        );
      },
      async googleConfirm(data) {
        const user = await fetchJson<AuthUser>("/api/auth/google/confirm", {
          method: "POST",
          body: JSON.stringify(data),
        });
        queryClient.setQueryData(sessionQueryKey, user);
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
        push("/onboarding");
      },
      async completeOnboarding(data) {
        await fetchJson<void>("/api/auth/onboarding", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
        push("/app");
      },
      async setInitialPassword(data) {
        await fetchJson<void>("/api/proxy/v1/users/me/password/initial", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      },
      async logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        queryClient.clear();
        push("/login");
      },
    }),
    [
      currentUserQuery.data,
      currentUserQuery.isFetching,
      push,
      queryClient,
      sessionQuery.data,
      sessionQuery.isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthProviderInner>{children}</AuthProviderInner>
      <Toaster />
    </>
  );
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function useCurrentUser() {
  return useAuth().currentUser;
}
