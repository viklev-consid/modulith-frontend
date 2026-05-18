"use client";

import Link from "next/link";
import { KeyRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/components/auth-provider";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailSettingsForm() {
  const t = useTranslations("settingsForms.email");
  const { currentUser } = useAuth();

  if (currentUser && !currentUser.hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-5">
          <Alert>
            <KeyRoundIcon />
            <AlertTitle>{t("needsPassword.title")}</AlertTitle>
            <AlertDescription>
              {t("needsPassword.description")}
            </AlertDescription>
          </Alert>
          <Button
            className="w-fit"
            render={
              <Link href="/app/settings/password">
                {t("needsPassword.cta")}
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return <ChangeEmailForm />;
}
