"use client";

import { useEffect, useId, useRef, useState } from "react";

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

export const GOOGLE_GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleButtonOptions = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  width?: number;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
};

type UseGoogleCredentialOptions = {
  onCredential: (credential: string) => void;
  buttonOptions?: GoogleButtonOptions;
  disabled?: boolean;
};

const DEFAULT_BUTTON_OPTIONS: Required<
  Pick<GoogleButtonOptions, "theme" | "size" | "width" | "text" | "shape">
> = {
  theme: "outline",
  size: "large",
  width: 260,
  text: "continue_with",
  shape: "rectangular",
};

export function useGoogleCredential({
  onCredential,
  buttonOptions,
  disabled = false,
}: UseGoogleCredentialOptions) {
  const containerId = useId().replace(/:/g, "");
  const [isReady, setIsReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  function initialize() {
    if (!clientId || !window.google?.accounts?.id || disabled) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (!credential) {
          return;
        }
        onCredentialRef.current(credential);
      },
    });

    const target = document.getElementById(containerId);
    if (target) {
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        ...DEFAULT_BUTTON_OPTIONS,
        ...buttonOptions,
      });
      setIsReady(true);
    }
  }

  return {
    containerId,
    isReady,
    isAvailable: Boolean(clientId),
    initialize,
  };
}
