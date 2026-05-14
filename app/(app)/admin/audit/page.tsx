import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditTrail } from "@/components/admin/audit-trail";

export const metadata: Metadata = {
  title: "Audit trail | Admin | Modulith",
};

export default function AdminAuditPage() {
  return (
    <Suspense>
      <AuditTrail />
    </Suspense>
  );
}
