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

function acquireNotificationSource() {
  notificationSourceSubscribers += 1;

  if (notificationSourceCloseTimer) {
    clearTimeout(notificationSourceCloseTimer);
    notificationSourceCloseTimer = null;
  }

  if (!notificationSource) {
    notificationSource = new EventSource(
      "/api/proxy/v1/me/notifications/stream",
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
