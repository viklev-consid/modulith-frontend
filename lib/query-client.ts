import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import {
  emitLegalComplianceRequired,
  type ProblemDetails,
} from "@/api/problems";

function maybeHandleLegalComplianceRequired(error: unknown) {
  const problem = error as ProblemDetails | undefined;
  if (!problem || problem.status !== 428) return;

  const extensionsMissing = (
    problem.extensions as Record<string, unknown> | undefined
  )?.missingDocuments;
  const inlineMissing = (problem as Record<string, unknown>).missingDocuments;
  const missingDocuments = Array.isArray(extensionsMissing)
    ? extensionsMissing
    : Array.isArray(inlineMissing)
      ? inlineMissing
      : undefined;

  emitLegalComplianceRequired({
    missingDocuments: missingDocuments as
      | Parameters<typeof emitLegalComplianceRequired>[0]["missingDocuments"]
      | undefined,
  });
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
    queryCache: new QueryCache({
      onError: maybeHandleLegalComplianceRequired,
    }),
    mutationCache: new MutationCache({
      onError: maybeHandleLegalComplianceRequired,
    }),
  });
}
