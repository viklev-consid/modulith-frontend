"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MyNotificationResponse } from "@/api/generated";
import {
  notificationCategoryLabel,
  notificationQueryKeyPrefix,
  safeNotificationHref,
  unreadCountQueryKeyPrefix,
} from "@/components/notifications-utils";
import { useAuth } from "@/components/auth-provider";

let notificationSource: EventSource | null = null;
let notificationSourceSubscribers = 0;
let notificationSourceCloseTimer: ReturnType<typeof setTimeout> | null = null;
let cachedClientId: string | null = null;

const NOTIFICATION_CLIENT_ID_KEY = "modulith.notifications.clientId";

function getOrCreateClientId(): string {
  if (cachedClientId) {
    return cachedClientId;
  }

  // Per-tab stable ID: sessionStorage is scoped to the tab so separate tabs
  // get separate IDs, but reloads and reconnects within the tab reuse it.
  try {
    const existing = window.sessionStorage.getItem(NOTIFICATION_CLIENT_ID_KEY);
    if (existing) {
      cachedClientId = existing;
      return existing;
    }
  } catch {
    // sessionStorage unavailable (e.g. privacy mode); fall through to generate.
  }

  const generated =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

  try {
    window.sessionStorage.setItem(NOTIFICATION_CLIENT_ID_KEY, generated);
  } catch {
    // Ignore storage write failures; the module-level cache still keeps it
    // stable for the lifetime of this page.
  }

  cachedClientId = generated;
  return generated;
}

function acquireNotificationSource() {
  notificationSourceSubscribers += 1;

  if (notificationSourceCloseTimer) {
    clearTimeout(notificationSourceCloseTimer);
    notificationSourceCloseTimer = null;
  }

  if (!notificationSource) {
    const clientId = getOrCreateClientId();
    notificationSource = new EventSource(
      `/api/proxy/v1/me/notifications/stream?clientId=${encodeURIComponent(clientId)}`,
    );
  }

  return notificationSource;
}

function releaseNotificationSource() {
  notificationSourceSubscribers = Math.max(
    0,
    notificationSourceSubscribers - 1,
  );

  if (notificationSourceSubscribers > 0 || notificationSourceCloseTimer) {
    return;
  }

  notificationSourceCloseTimer = setTimeout(() => {
    if (notificationSourceSubscribers === 0) {
      notificationSource?.close();
      notificationSource = null;
    }

    notificationSourceCloseTimer = null;
  }, 1000);
}

export function NotificationToast() {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const source = acquireNotificationSource();

    function handleNotificationCreated(event: MessageEvent<string>) {
      const notification = JSON.parse(
        event.data,
      ) as Partial<MyNotificationResponse>;

      void queryClient.invalidateQueries(notificationQueryKeyPrefix());
      void queryClient.invalidateQueries(unreadCountQueryKeyPrefix());

      const href = safeNotificationHref(notification.link?.href);

      toast(notification.title ?? "New notification", {
        description: `${notificationCategoryLabel(
          Number(notification.category ?? 0),
        )} · just now`,
        duration: 5000,
        action: href
          ? {
              label: "Open",
              onClick: () => push(href),
            }
          : undefined,
      });
    }

    source.addEventListener("notification.created", handleNotificationCreated);

    return () => {
      source.removeEventListener(
        "notification.created",
        handleNotificationCreated,
      );
      releaseNotificationSource();
    };
  }, [isAuthenticated, push, queryClient]);

  return null;
}
