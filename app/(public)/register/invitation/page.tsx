import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.invite");
  return { title: t("title") };
}

/**
 * System-level (Users module) invitation landing.
 *
 * The backend emails users a link to
 * `${origin}/register/invitation?token=...` for non-org platform
 * invitations. There's no separate "accept" endpoint for this kind —
 * the token is consumed inline during registration via
 * `RegisterRequest.invitationToken`. So this route just normalises
 * the params into the existing register form's expected shape and
 * redirects.
 *
 * `lockEmail=1` is only forwarded when an email param was actually
 * present, so manual visits with just `?token=` still leave the
 * email editable.
 */
export default async function SystemInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  if (!token) {
    // No token ⇒ no invite to honour. Fall through to plain registration.
    redirect("/register");
  }

  const qs = new URLSearchParams({ token });
  if (email) {
    qs.set("email", email);
    qs.set("lockEmail", "1");
  }
  redirect(`/register?${qs.toString()}`);
}
