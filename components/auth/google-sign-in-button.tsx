"use client";

import Script from "next/script";
import { CircleIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

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
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleSignInButton() {
  const id = useId().replace(/:/g, "");
  const { googleLogin } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  function initializeGoogleButton() {
    if (!clientId || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (credential) {
          void googleLogin(credential);
        }
      },
    });

    const target = document.getElementById(id);
    if (target) {
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
      });
      setIsReady(true);
    }
  }

  if (!clientId) {
    return (
      <Button className="w-full" type="button" variant="outline" disabled>
        <CircleIcon />
        Continue with Google
      </Button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleButton}
      />
      <div id={id} className={isReady ? "flex justify-center" : "hidden"} />
      {!isReady && (
        <Button className="w-full" type="button" variant="outline" disabled>
          <CircleIcon />
          Continue with Google
        </Button>
      )}
    </>
  );
}
