import type { Metadata } from "next";
import { Suspense } from "react";

import { NotificationsPageClient } from "@/components/settings/notifications-page-client";

export const metadata: Metadata = {
  title: "Notifications | Modulith",
};

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsPageClient />
    </Suspense>
  );
}
