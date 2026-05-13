"use client";

import { useId, useState } from "react";
import Script from "next/script";
import { useQueryClient } from "@tanstack/react-query";
import { CircleIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-provider";
import { fetchJson } from "@/components/settings/client-fetch";
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

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | boolean | number>,
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

export function ConnectionsSettings() {
  const id = useId().replace(/:/g, "");
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isLinked = currentUser?.linkedProviders.includes("Google") ?? false;

  function initializeGoogleButton() {
    if (!clientId || !window.google?.accounts?.id || isLinked) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (!credential) {
          return;
        }

        fetchJson("/api/proxy/v1/users/me/auth/google/link", {
          method: "POST",
          body: JSON.stringify({ idToken: credential }),
        })
          .then(async () => {
            await queryClient.invalidateQueries({ queryKey: ["current-user"] });
            toast.success("Google account linked");
          })
          .catch(() => undefined);
      },
    });

    const target = document.getElementById(id);
    if (target) {
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        width: 260,
        text: "continue_with",
        shape: "rectangular",
      });
      setIsReady(true);
    }
  }

  async function unlinkGoogle() {
    setIsUnlinking(true);
    try {
      await fetchJson("/api/proxy/v1/users/me/auth/google/unlink", {
        method: "DELETE",
      });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success("Google account unlinked");
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
      <CardContent>
        <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <LinkIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-medium">Google</h2>
              <p className="text-sm text-muted-foreground">
                {isLinked
                  ? currentUser?.email
                  : "No Google account is connected."}
              </p>
            </div>
          </div>
          {isLinked ? (
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
            <div className="min-w-64">
              {clientId && (
                <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
                  onLoad={initializeGoogleButton}
                />
              )}
              <div id={id} className={isReady ? "" : "hidden"} />
              {(!clientId || !isReady) && (
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
      </CardContent>
    </Card>
  );
}
