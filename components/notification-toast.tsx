"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MyNotificationResponse } from "@/api/generated";
import {
  notificationCategoryLabel,
  notificationQueryKeyPrefix,
  unreadCountQueryKeyPrefix,
} from "@/components/notifications-utils";

export function NotificationToast() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/proxy/v1/me/notifications/stream");

    source.addEventListener("notification.created", (event) => {
      const notification = JSON.parse(
        event.data,
      ) as Partial<MyNotificationResponse>;

      void queryClient.invalidateQueries(notificationQueryKeyPrefix());
      void queryClient.invalidateQueries(unreadCountQueryKeyPrefix());

      toast(notification.title ?? "New notification", {
        description: `${notificationCategoryLabel(
          Number(notification.category ?? 0),
        )} · just now`,
        duration: 5000,
        action: notification.link?.href
          ? {
              label: "Open",
              onClick: () => router.push(notification.link!.href),
            }
          : undefined,
      });
    });

    return () => source.close();
  }, [queryClient, router]);

  return null;
}
