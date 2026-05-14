import type { Metadata } from "next";

import { UserDetail } from "@/components/admin/user-detail";

export const metadata: Metadata = {
  title: "User detail | Admin | Modulith",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetail userId={id} />;
}
