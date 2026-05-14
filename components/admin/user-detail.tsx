"use client";

import "@/api/client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";

import {
  getAuditTrailOptions,
  getUserByIdOptions,
} from "@/api/generated/@tanstack/react-query.gen";
import type { AuditEntryDto } from "@/api/generated";
import { RoleBadge } from "@/components/admin/role-badge";
import { RoleChangeDialog } from "@/components/admin/role-change-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelative(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

function formatDate(iso: string) {
  try {
    return format(parseISO(iso), "PP");
  } catch {
    return iso;
  }
}

function ActivityRow({ entry }: { entry: AuditEntryDto }) {
  return (
    <li className="flex items-start gap-3 border-b py-2 last:border-b-0">
      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary/60" />
      <div className="grid gap-0.5">
        <span className="text-sm font-medium">{entry.eventType}</span>
        <span className="text-xs text-muted-foreground">
          {formatRelative(entry.occurredAt)}
        </span>
      </div>
    </li>
  );
}

export function UserDetail({ userId }: { userId: string }) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const userQuery = useQuery(getUserByIdOptions({ path: { userId } }));
  const activityQuery = useQuery(
    getAuditTrailOptions({
      query: { actorId: userId, page: 1, pageSize: 5 },
    }),
  );

  if (userQuery.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (userQuery.error || !userQuery.data) {
    return (
      <div className="grid gap-4">
        <BackLink />
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            We couldn&apos;t load this user. They may have been removed.
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = userQuery.data;
  const hasGoogle = user.linkedProviders.includes("Google");
  const activity = activityQuery.data?.entries ?? [];

  return (
    <div className="grid gap-4">
      <BackLink />

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">
          {user.displayName || user.email}
        </h2>
        <RoleBadge role={user.role} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account info</CardTitle>
          <CardDescription>
            Read-only profile details from the user&apos;s record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Joined</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Login method</dt>
              <dd className="flex items-center gap-2">
                {user.hasPassword ? (
                  <Badge variant="outline">Password</Badge>
                ) : null}
                {hasGoogle ? <Badge variant="outline">Google</Badge> : null}
                {!user.hasPassword && !hasGoogle ? (
                  <span className="text-muted-foreground">None</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Onboarding</dt>
              <dd>
                {user.hasCompletedOnboarding ? (
                  <Badge variant="secondary">Completed</Badge>
                ) : (
                  <Badge variant="destructive">Pending</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Admin-only changes to this user&apos;s account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setRoleDialogOpen(true)}>Change role</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Latest audit entries with this user as the actor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityQuery.isLoading ? (
            <div className="grid gap-2">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity recorded.
            </p>
          ) : (
            <ul className="grid">
              {activity.map((entry) => (
                <ActivityRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RoleChangeDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        userId={user.userId}
        userName={user.displayName || user.email}
        currentRole={user.role}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/users"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      Back to users
    </Link>
  );
}
