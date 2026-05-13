import type { Metadata } from "next";
import { Suspense } from "react";

import { ConfirmEmailContent } from "@/components/settings/confirm-email-content";

export const metadata: Metadata = {
  title: "Confirm email | Modulith",
};

export default function ConfirmEmailPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Suspense>
        <ConfirmEmailContent />
      </Suspense>
    </main>
  );
}
