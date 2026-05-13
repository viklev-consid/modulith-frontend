"use client";

import { toast } from "sonner";

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

function toCamelCase(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

export function mapProblemToFieldErrors(problem: ProblemDetails) {
  return Object.fromEntries(
    Object.entries(problem.errors ?? {}).map(([field, messages]) => [
      toCamelCase(field),
      messages[0] ?? problem.title ?? "Invalid value",
    ]),
  );
}

export function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

export function handleProblem(problem: ProblemDetails) {
  if (problem.status === 401) {
    redirectToLogin();
    return;
  }

  if (problem.errors) {
    return;
  }

  if (problem.status >= 500) {
    toast.error("Something went wrong", {
      description: "Please try again in a moment.",
    });
    return;
  }

  toast.error(problem.title ?? "Request failed", {
    description: problem.detail,
  });
}

export async function problemFromResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {
      title: response.statusText,
      status: response.status,
    } satisfies ProblemDetails;
  }

  try {
    return JSON.parse(text) as ProblemDetails;
  } catch {
    return {
      title: response.statusText,
      detail: text,
      status: response.status,
    } satisfies ProblemDetails;
  }
}
