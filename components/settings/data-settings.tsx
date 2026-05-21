"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { fetchJson } from "@/components/settings/client-fetch";
import { LegalAcceptancesCard } from "@/components/settings/legal-acceptances-card";
import { LegalPendingCard } from "@/components/settings/legal-pending-card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function DataSettings() {
  const t = useTranslations("settingsForms.data");
  const tCommon = useTranslations("common.actions");
  const { currentUser } = useAuth();
  const { replace } = useRouter();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const email = currentUser?.email ?? "";
  const canDelete = confirmEmail === email;

  async function downloadPersonalData() {
    setIsExporting(true);
    try {
      const data = await fetchJson<unknown>(
        "/api/proxy/v1/users/me/personal-data",
      );
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "modulith-personal-data.json";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteAccount() {
    setIsDeleting(true);
    try {
      await fetchJson("/api/proxy/v1/users/me", { method: "DELETE" });
      await fetch("/api/auth/logout", { method: "POST" });
      replace("/goodbye");
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <LegalPendingCard />
      <LegalAcceptancesCard />
      <Card>
        <CardHeader>
          <CardTitle>{t("export.title")}</CardTitle>
          <CardDescription>{t("export.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void downloadPersonalData();
            }}
            disabled={isExporting}
          >
            <DownloadIcon />
            {isExporting ? t("export.submitting") : t("export.submit")}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("delete.title")}
          </CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button type="button" variant="destructive">
                  <Trash2Icon />
                  {t("delete.trigger")}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  {t("delete.confirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("delete.confirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Field>
                <FieldLabel htmlFor="delete-confirm-email">
                  {t("delete.confirmLabel")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="delete-confirm-email"
                    value={confirmEmail}
                    onChange={(event) => setConfirmEmail(event.target.value)}
                  />
                  <FieldDescription>{email}</FieldDescription>
                </FieldContent>
              </Field>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setConfirmEmail("");
                  }}
                >
                  {tCommon("cancel")}
                </AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!canDelete || isDeleting}
                  onClick={() => {
                    if (!canDelete) {
                      toast.error(t("delete.emailMismatch"));
                      return;
                    }
                    void deleteAccount();
                  }}
                >
                  {isDeleting ? t("delete.submitting") : t("delete.submit")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
