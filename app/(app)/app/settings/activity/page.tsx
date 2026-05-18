import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityFeed } from "@/components/activity-feed";

export const metadata: Metadata = {
  title: "Activity | Modulith",
};

export default function ActivityPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-lg font-semibold">Your activity</h1>
        <p className="text-xs text-muted-foreground">
          Recent security and account events on your profile.
        </p>
      </div>
      <Suspense>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
