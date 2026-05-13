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

export function NotificationToast() {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    const source = new EventSource("/api/proxy/v1/me/notifications/stream");

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
      source.close();
    };
  }, [isAuthenticated, isLoading, push, queryClient]);

  return null;
}
