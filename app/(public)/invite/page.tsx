import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { InviteLanding } from "@/components/invite/invite-landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.invite");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteLanding />
    </Suspense>
  );
}
