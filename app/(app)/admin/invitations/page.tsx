import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { serverClient } from "@/api/server-client";
import { listInvitationsOptions } from "@/api/generated/@tanstack/react-query.gen";
import { InvitationsPage } from "@/components/admin/invitations-page";
import { createQueryClient } from "@/lib/query-client";

export const metadata: Metadata = {
  title: "Invitations | Admin | Modulith",
};

export default async function AdminInvitationsPage() {
  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(
    listInvitationsOptions({ client: serverClient }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InvitationsPage />
    </HydrationBoundary>
  );
}
