"use client";

import "@/api/client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import { BellIcon } from "lucide-react";

import {
  archiveNotificationMutation,
  listMyNotificationsOptions,
} from "@/api/generated/@tanstack/react-query.gen";
import {
  notificationCategoryLabel,
  notificationQueryKeyPrefix,
  notificationTime,
} from "@/components/notifications-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const filters = ["all", "unread", "archived"] as const;

export function NotificationsPageClient() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useQueryState("filter", {
    defaultValue: "all",
    parse: (value) => (filters.includes(value as never) ? value : "all"),
  });
  const [before, setBefore] = useQueryState("before");
  const notificationsQuery = useQuery(
    listMyNotificationsOptions({
      query: {
        status: filter === "all" ? undefined : filter,
        limit: 10,
        before: before ?? undefined,
      },
    }),
  );
  const archive = useMutation(archiveNotificationMutation());
  const notifications = notificationsQuery.data?.items ?? [];

  async function archiveOne(notificationId: string) {
    await archive.mutateAsync({ path: { notificationId } });
    await queryClient.invalidateQueries(notificationQueryKeyPrefix());
  }

  return (
    <main className="mx-auto grid min-h-svh w-full max-w-4xl gap-5 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Review recent account and workspace activity.
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(value) => {
            void setBefore(null);
            void setFilter(value);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="grid gap-2 p-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between",
                  !notification.isRead &&
                    "border-sky-200 bg-sky-50/70 dark:bg-sky-950/20",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <span className="size-2 rounded-full bg-sky-500" />
                    )}
                    <h2 className="truncate text-sm font-medium">
                      {notification.title}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {notificationCategoryLabel(notification.category)} ·{" "}
                    {notificationTime(notification.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={archive.isPending}
                  onClick={() => {
                    void archiveOne(notification.id);
                  }}
                >
                  Archive
                </Button>
              </div>
            ))
          ) : (
            <Card className="border-dashed">
              <CardHeader className="items-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <BellIcon className="size-6 text-muted-foreground" />
                </div>
                <CardTitle>All caught up</CardTitle>
                <CardDescription>
                  You have no unread notifications.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </CardContent>
      </Card>
      {notificationsQuery.data?.nextBefore && (
        <Button
          type="button"
          variant="outline"
          className="mx-auto"
          onClick={() => {
            void setBefore(notificationsQuery.data.nextBefore);
          }}
        >
          Load more
        </Button>
      )}
    </main>
  );
}
