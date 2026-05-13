"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { handleProblem, problemFromResponse } from "@/api/problems";
import type { GetCurrentUserResponse } from "@/api/generated";
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
  login(email: string, password: string): Promise<void>;
  register(data: RegisterInput): Promise<void>;
  googleLogin(idToken: string): Promise<void>;
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
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: () =>
      fetchJson<AuthUser>("/api/auth/session", {
        redirectOnUnauthorized: false,
      }),
    retry: false,
  });

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetchJson<GetCurrentUserResponse>("/api/proxy/v1/users/me"),
    enabled: Boolean(sessionQuery.data),
    retry: false,
  });

  useEffect(() => {
    if (!sessionQuery.data || !currentUserQuery.data) {
      return;
    }

    const isOnboarding = pathname === "/onboarding";
    const isPublic =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname === "/confirm-email" ||
      pathname === "/goodbye" ||
      pathname.startsWith("/auth/google/confirm");

    if (!currentUserQuery.data.hasCompletedOnboarding && !isOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (
      currentUserQuery.data.hasCompletedOnboarding &&
      (isOnboarding || isPublic)
    ) {
      router.replace("/");
    }
  }, [currentUserQuery.data, pathname, router, sessionQuery.data]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data ?? null,
      currentUser: currentUserQuery.data ?? null,
      permissions: currentUserQuery.data?.permissions ?? [],
      isAuthenticated: Boolean(sessionQuery.data),
      isLoading: sessionQuery.isLoading || currentUserQuery.isFetching,
      async login(email, password) {
        const user = await fetchJson<AuthUser>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        queryClient.setQueryData(["auth", "session"], user);
        const profile = await queryClient.fetchQuery({
          queryKey: ["current-user"],
          queryFn: () =>
            fetchJson<GetCurrentUserResponse>("/api/proxy/v1/users/me"),
        });
        router.push(profile.hasCompletedOnboarding ? "/" : "/onboarding");
      },
      async register(data) {
        const user = await fetchJson<AuthUser>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        queryClient.setQueryData(["auth", "session"], user);
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.push("/onboarding");
      },
      async googleLogin(idToken) {
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
            router.push(`/auth/google/confirm?${params.toString()}`);
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

        const user = (await response.json()) as AuthUser;
        queryClient.setQueryData(["auth", "session"], user);
        const profile = await queryClient.fetchQuery({
          queryKey: ["current-user"],
          queryFn: () =>
            fetchJson<GetCurrentUserResponse>("/api/proxy/v1/users/me"),
        });
        router.push(profile.hasCompletedOnboarding ? "/" : "/onboarding");
      },
      async googleConfirm(data) {
        const user = await fetchJson<AuthUser>("/api/auth/google/confirm", {
          method: "POST",
          body: JSON.stringify(data),
        });
        queryClient.setQueryData(["auth", "session"], user);
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.push("/onboarding");
      },
      async completeOnboarding(data) {
        await fetchJson<void>("/api/auth/onboarding", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.push("/");
      },
      async setInitialPassword(data) {
        await fetchJson<void>("/api/proxy/v1/users/me/password/initial", {
          method: "POST",
          body: JSON.stringify(data),
        });
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      },
      async logout() {
        await fetch("/api/auth/logout", { method: "POST" });
        queryClient.clear();
        router.push("/login");
      },
    }),
    [
      currentUserQuery.data,
      currentUserQuery.isFetching,
      queryClient,
      router,
      sessionQuery.data,
      sessionQuery.isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderInner>{children}</AuthProviderInner>
      <Toaster />
    </QueryClientProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function useCurrentUser() {
  return useAuth().currentUser;
}
