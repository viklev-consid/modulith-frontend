import type { Metadata } from "next";

import { InvitationsPage } from "@/components/admin/invitations-page";

export const metadata: Metadata = {
  title: "Invitations | Admin | Modulith",
};

export default function AdminInvitationsPage() {
  return <InvitationsPage />;
}
