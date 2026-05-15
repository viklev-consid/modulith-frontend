import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityFeed } from "@/components/activity-feed";

export const metadata: Metadata = {
  title: "Your activity | Modulith",
};

export default function ActivityPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6 md:px-6">
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
    </main>
  );
}
