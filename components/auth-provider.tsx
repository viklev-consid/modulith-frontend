"use client";

import {
  createContext,
  useContext,
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
import { useRouter } from "next/navigation";

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

  return (await response.json()) as T;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
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
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.push("/");
      },
      async register(data) {
        const user = await fetchJson<AuthUser>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(data),
        });
        queryClient.setQueryData(["auth", "session"], user);
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        router.push("/");
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
