"use client";

import {
  handleProblem,
  problemFromResponse,
  type ProblemDetails,
} from "@/api/problems";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const problem = await problemFromResponse(response);
    handleProblem(problem);
    throw problem;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function fieldMessage(
  problem: ProblemDetails,
  fieldName: string,
  fallback = "Invalid value",
) {
  const entries = Object.entries(problem.errors ?? {});
  const match = entries.find(
    ([key]) => key.toLowerCase() === fieldName.toLowerCase(),
  );

  return match?.[1][0] ?? problem.detail ?? problem.title ?? fallback;
}
