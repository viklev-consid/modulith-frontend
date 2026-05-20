import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.app");
  return { title: t("dashboard") };
}

export default async function Page() {
  const t = await getTranslations("app.dashboard");
  return (
    <section className="grid gap-3 text-sm">
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
    </section>
  );
}
