import type { Metadata } from "next";
import { Suspense } from "react";

import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Users | Admin | Modulith",
};

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersTable />
    </Suspense>
  );
}
