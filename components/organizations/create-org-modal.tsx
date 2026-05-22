"use client";

import { useRouter } from "next/navigation";

import { CreateOrgForm } from "@/components/organizations/create-org-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Intercepted-route modal wrapper around the shared `<CreateOrgForm/>`.
 *
 * Behaviour:
 * - `onSuccess` — close the modal (back nav) and the form will already
 *   have invalidated /my. The modal closes by popping the soft-pushed
 *   URL, returning the user to wherever they were.
 * - `onCancel` — same: pop back.
 *
 * The modal is always considered "open" (the route IS the modal). Base
 * UI's Dialog still needs an `open` boolean — we tie its close to the
 * router so any close gesture (overlay click, Escape) navigates back,
 * which causes Next to unmount this slot's route.
 *
 * Hard-refresh on `/app/organizations/new` bypasses the slot entirely
 * and renders the standalone page at `app/(app)/app/organizations/new/`.
 */
export function CreateOrgModal() {
  const { back, push } = useRouter();

  const close = () => {
    // Prefer `back` so the user returns to where they came from. If
    // they hard-typed the URL (no history entry to pop), this is a
    // no-op; in practice the standalone page handles that case.
    back();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-w-xl">
        {/* Visually hidden title for a11y — the form renders its own
            visible heading via the Card primitive. */}
        <DialogTitle className="sr-only">Create organization</DialogTitle>
        <CreateOrgForm
          onSuccess={(data) => {
            // Navigate INTO the new org rather than `back()` then push,
            // which would leave a back-button trail through the modal.
            push(`/app/o/${data.slug}`);
          }}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  );
}
