"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useQueryClient } from "@tanstack/react-query";
import { CircleIcon, KeyRoundIcon, LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { fetchJson } from "@/components/settings/client-fetch";
import { decodeGoogleCredential } from "@/lib/decode-google-credential";
import {
  GOOGLE_GSI_SRC,
  useGoogleCredential,
} from "@/lib/use-google-credential";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
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

export function ConnectionsSettings() {
  const t = useTranslations("settingsForms.connections");
  const tCommon = useTranslations("common.actions");
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<string | null>(
    null,
  );
  const [isLinking, setIsLinking] = useState(false);
  const googleAccount = currentUser?.linkedAccounts.find(
    (account) => account.provider === "Google",
  );
  const isLinked = Boolean(googleAccount);
  const canUnlink = currentUser?.hasPassword ?? false;
  const hasLocalAvatar = Boolean(currentUser?.avatar);

  async function linkWithGoogle(
    credential: string,
    overrideAvatarWithGoogleAvatar?: boolean,
  ) {
    setIsLinking(true);
    try {
      await fetchJson("/api/proxy/v1/users/me/auth/google/link", {
        method: "POST",
        body: JSON.stringify({
          idToken: credential,
          ...(overrideAvatarWithGoogleAvatar !== undefined
            ? { overrideAvatarWithGoogleAvatar }
            : {}),
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success(t("google.linkSuccess"));
    } catch (error) {
      console.error("Failed to link Google account", error);
      toast.error(t("google.linkError"));
    } finally {
      setIsLinking(false);
      setPendingCredential(null);
    }
  }

  const {
    containerId,
    isReady,
    isAvailable,
    initialize: initializeGoogleButton,
  } = useGoogleCredential({
    disabled: isLinked,
    onCredential: (credential) => {
      const claims = decodeGoogleCredential(credential);
      const hasGooglePicture = Boolean(claims?.picture);

      if (hasGooglePicture && hasLocalAvatar) {
        setPendingCredential(credential);
        return;
      }

      void linkWithGoogle(credential, hasGooglePicture ? true : undefined);
    },
  });

  async function unlinkGoogle() {
    setIsUnlinking(true);
    try {
      await fetchJson("/api/proxy/v1/users/me/auth/google/unlink", {
        method: "DELETE",
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success(t("google.unlinkSuccess"));
    } catch (error) {
      console.error("Failed to unlink Google account", error);
      toast.error(t("google.unlinkError"));
    } finally {
      setIsUnlinking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <LinkIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">{t("google.label")}</h2>
              <p className="text-sm text-muted-foreground">
                {isLinked
                  ? googleAccount?.providerEmail
                  : t("google.notLinked")}
              </p>
            </div>
          </div>
          {isLinked ? (
            canUnlink ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline">{t("google.unlink")}</Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("google.confirmDialog.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("google.confirmDialog.description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void unlinkGoogle();
                      }}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? t("google.unlinking") : t("google.unlink")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" disabled>
                {t("google.unlink")}
              </Button>
            )
          ) : (
            <div className="min-w-64">
              {isAvailable && (
                <Script
                  src={GOOGLE_GSI_SRC}
                  strategy="afterInteractive"
                  onReady={initializeGoogleButton}
                />
              )}
              <div id={containerId} className={isReady ? "" : "hidden"} />
              {(!isAvailable || !isReady) && (
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  disabled
                >
                  <CircleIcon />
                  {t("google.linkButton")}
                </Button>
              )}
            </div>
          )}
        </div>
        {isLinked && !canUnlink && (
          <Alert>
            <KeyRoundIcon />
            <AlertTitle>{t("needsPassword.title")}</AlertTitle>
            <AlertDescription className="grid gap-3">
              <span>{t("needsPassword.description")}</span>
              <Button
                className="w-fit"
                size="sm"
                render={
                  <Link href="/app/settings/password">
                    {t("needsPassword.cta")}
                  </Link>
                }
              />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <AlertDialog
        open={pendingCredential !== null}
        onOpenChange={(open) => {
          if (!open && !isLinking) {
            setPendingCredential(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("google.overrideDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("google.overrideDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLinking}
              onClick={() => {
                if (pendingCredential) {
                  void linkWithGoogle(pendingCredential, false);
                }
              }}
            >
              {t("google.overrideDialog.keepCurrent")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLinking}
              onClick={(event) => {
                event.preventDefault();
                if (pendingCredential) {
                  void linkWithGoogle(pendingCredential, true);
                }
              }}
            >
              {t("google.overrideDialog.useGoogle")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
