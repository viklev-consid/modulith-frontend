"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useQueryClient } from "@tanstack/react-query";
import { CircleIcon, KeyRoundIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { fetchJson } from "@/components/settings/client-fetch";
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
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isUnlinking, setIsUnlinking] = useState(false);
  const googleAccount = currentUser?.linkedAccounts.find(
    (account) => account.provider === "Google",
  );
  const isLinked = Boolean(googleAccount);
  const canUnlink = currentUser?.hasPassword ?? false;

  const {
    containerId,
    isReady,
    isAvailable,
    initialize: initializeGoogleButton,
  } = useGoogleCredential({
    disabled: isLinked,
    onCredential: (credential) => {
      void (async () => {
        try {
          await fetchJson("/api/proxy/v1/users/me/auth/google/link", {
            method: "POST",
            body: JSON.stringify({ idToken: credential }),
          });
          await queryClient.invalidateQueries({ queryKey: ["current-user"] });
          toast.success("Google account linked");
        } catch (error) {
          console.error("Failed to link Google account", error);
          toast.error("Failed to link Google account");
        }
      })();
    },
  });

  async function unlinkGoogle() {
    setIsUnlinking(true);
    try {
      await fetchJson("/api/proxy/v1/users/me/auth/google/unlink", {
        method: "DELETE",
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success("Google account unlinked");
    } catch (error) {
      console.error("Failed to unlink Google account", error);
      toast.error("Failed to unlink Google account");
    } finally {
      setIsUnlinking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
        <CardDescription>
          Linking an account lets you sign in with it.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <LinkIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Google</h2>
              <p className="text-sm text-muted-foreground">
                {isLinked
                  ? googleAccount?.providerEmail
                  : "No Google account is connected."}
              </p>
            </div>
          </div>
          {isLinked ? (
            canUnlink ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={<Button variant="outline">Unlink</Button>}
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unlink Google account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will need to use your email and password the next time
                      you sign in.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void unlinkGoogle();
                      }}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? "Unlinking..." : "Unlink"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" disabled>
                Unlink
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
                  Link Google account
                </Button>
              )}
            </div>
          )}
        </div>
        {isLinked && !canUnlink && (
          <Alert>
            <KeyRoundIcon />
            <AlertTitle>Set a password before unlinking</AlertTitle>
            <AlertDescription className="grid gap-3">
              <span>
                Without a password you would lose access to your account.
              </span>
              <Button
                className="w-fit"
                size="sm"
                render={
                  <Link href="/app/settings/password">Set a password</Link>
                }
              />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
