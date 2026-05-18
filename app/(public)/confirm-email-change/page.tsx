import type { Metadata } from "next";
import { Suspense } from "react";

import { ConfirmEmailChangeContent } from "@/components/settings/confirm-email-change-content";

export const metadata: Metadata = {
  title: "Confirm email change | Modulith",
};

export default function ConfirmEmailChangePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Suspense>
        <ConfirmEmailChangeContent />
      </Suspense>
    </main>
  );
}
