import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { serverClient } from "@/api/server-client";
import { getMyNotificationPreferencesOptions } from "@/api/generated/@tanstack/react-query.gen";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { createQueryClient } from "@/lib/query-client";

export const metadata: Metadata = {
  title: "Notification settings | Modulith",
};

export default async function NotificationSettingsPage() {
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(
    getMyNotificationPreferencesOptions({ client: serverClient }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationPreferencesForm />
    </HydrationBoundary>
  );
}
