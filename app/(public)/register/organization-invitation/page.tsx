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

/**
 * Public landing page for organization invitation links.
 *
 * URL is dictated by the backend: it embeds
 * `${origin}/register/organization-invitation?token=...&email=...`
 * in invitation emails. The path lives under `/register/...` because
 * the dominant case is a new user joining via the invite — but the
 * `<InviteLanding>` component also handles signed-in acceptance.
 */
export default function OrganizationInvitationPage() {
  return (
    <Suspense>
      <InviteLanding />
    </Suspense>
  );
}
