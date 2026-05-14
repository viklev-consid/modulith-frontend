import type { ReactNode } from "react";

import { AuthHydration } from "@/components/auth-hydration";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AuthHydration>{children}</AuthHydration>;
}
