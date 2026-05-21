import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  getLegalComplianceQueryKey,
  getLegalDocumentQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import { LegalDocumentSheet } from "@/components/settings/legal-document-sheet";
import {
  createTestQueryClient,
  renderWithProviders,
} from "@/tests/test-wrappers";

// Mock the underlying SDK call so the mutation goes through the generated
// hook (real cache invalidation, real error mapping) but never touches the
// network.
const acceptLegalDocumentsMock = vi.fn();
vi.mock("@/api/generated/sdk.gen", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/generated/sdk.gen")>();
  return {
    ...actual,
    acceptLegalDocuments: (...args: unknown[]) =>
      acceptLegalDocumentsMock(...args),
  };
});

const TYPE = "terms-of-service";
const VERSION = "2.0";
const DOC_ID = "doc-1";
const CONTENT_HASH = "hash-1";

function seedSheetCache() {
  const client = createTestQueryClient();
  client.setQueryData(
    getLegalDocumentQueryKey({ path: { type: TYPE, version: VERSION } }),
    {
      id: DOC_ID,
      type: TYPE,
      title: "Terms of Service",
      version: VERSION,
      effectiveAt: "2026-04-01T00:00:00Z",
      publishedAt: "",
      contentHash: CONTENT_HASH,
      markdown: "# Terms v2",
    },
  );
  client.setQueryData(getLegalComplianceQueryKey(), {
    isCompliant: false,
    blockingLevel: "soft",
    missingDocuments: [],
    acceptedDocuments: [],
  });
  return client;
}

describe("LegalDocumentSheet (accept mode)", () => {
  it("disables Accept until the acknowledgement checkbox is ticked", () => {
    const onAccepted = vi.fn();
    renderWithProviders(
      <LegalDocumentSheet
        mode="accept"
        open
        onOpenChange={() => {}}
        type={TYPE}
        version={VERSION}
        documentId={DOC_ID}
        contentHash={CONTENT_HASH}
        onAccepted={onAccepted}
      />,
      { queryClient: seedSheetCache() },
    );

    const accept = screen.getByRole("button", { name: /^accept$/i });
    expect(accept).toBeDisabled();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /i have read and accept/i }),
    );
    expect(accept).toBeEnabled();
  });

  it("posts the (documentId, version, contentHash) payload, invalidates queries, and calls onAccepted on success", async () => {
    acceptLegalDocumentsMock.mockResolvedValueOnce({ data: {}, error: null });
    const onAccepted = vi.fn();
    const { queryClient } = renderWithProviders(
      <LegalDocumentSheet
        mode="accept"
        open
        onOpenChange={() => {}}
        type={TYPE}
        version={VERSION}
        documentId={DOC_ID}
        contentHash={CONTENT_HASH}
        onAccepted={onAccepted}
      />,
      { queryClient: seedSheetCache() },
    );

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    fireEvent.click(
      screen.getByRole("checkbox", { name: /i have read and accept/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

    await waitFor(() => expect(onAccepted).toHaveBeenCalledTimes(1));

    expect(acceptLegalDocumentsMock).toHaveBeenCalledTimes(1);
    const callArg = acceptLegalDocumentsMock.mock.calls[0]?.[0] as {
      body: { acceptedDocuments: unknown[] };
    };
    expect(callArg.body).toEqual({
      acceptedDocuments: [
        { documentId: DOC_ID, version: VERSION, contentHash: CONTENT_HASH },
      ],
    });

    // Both the compliance ledger and the current-user query should be
    // invalidated so any downstream consumer (gate, account menu) refreshes.
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (call) => call[0]?.queryKey,
    );
    expect(invalidatedKeys).toContainEqual(getLegalComplianceQueryKey());
    expect(invalidatedKeys).toContainEqual(["current-user"]);
  });

  it("renders an error and does not call onAccepted on a 400 response", async () => {
    acceptLegalDocumentsMock.mockRejectedValueOnce({
      status: 400,
      title: "Bad request",
      detail: "Stale acceptance",
    });
    const onAccepted = vi.fn();
    renderWithProviders(
      <LegalDocumentSheet
        mode="accept"
        open
        onOpenChange={() => {}}
        type={TYPE}
        version={VERSION}
        documentId={DOC_ID}
        contentHash={CONTENT_HASH}
        onAccepted={onAccepted}
      />,
      { queryClient: seedSheetCache() },
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /i have read and accept/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /couldn't record your acceptance/i,
      );
    });
    expect(onAccepted).not.toHaveBeenCalled();
  });

  it("surfaces problem.detail when the backend returns a non-400 problem", async () => {
    acceptLegalDocumentsMock.mockRejectedValueOnce({
      status: 409,
      title: "Conflict",
      detail: "Already superseded by a newer version",
    });
    const onAccepted = vi.fn();
    renderWithProviders(
      <LegalDocumentSheet
        mode="accept"
        open
        onOpenChange={() => {}}
        type={TYPE}
        version={VERSION}
        documentId={DOC_ID}
        contentHash={CONTENT_HASH}
        onAccepted={onAccepted}
      />,
      { queryClient: seedSheetCache() },
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: /i have read and accept/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /already superseded/i,
      );
    });
    expect(onAccepted).not.toHaveBeenCalled();
  });
});

describe("LegalDocumentSheet (view mode)", () => {
  it("renders the document title and markdown from the seeded cache without calling the SDK", () => {
    renderWithProviders(
      <LegalDocumentSheet
        mode="view"
        open
        onOpenChange={() => {}}
        type={TYPE}
        version={VERSION}
        acceptedAt="2026-01-20T10:00:00Z"
      />,
      { queryClient: seedSheetCache() },
    );

    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText(/Terms v2/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^accept$/i }),
    ).not.toBeInTheDocument();
  });
});
