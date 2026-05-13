import { LogOutIcon } from "lucide-react";

import { Can } from "@/components/can";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="min-h-svh px-6 py-5">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-sm font-medium">Modulith</h1>
          <p className="text-xs text-muted-foreground">
            Auth foundation is ready for the next feature slice.
          </p>
        </div>
        <form action="/api/auth/logout" method="post">
          <Button size="sm" variant="outline" type="submit">
            <LogOutIcon />
            Sign out
          </Button>
        </form>
      </header>
      <div className="grid max-w-3xl gap-3 py-6 text-sm">
        <h2 className="font-medium">Dashboard</h2>
        <p className="text-muted-foreground">
          The application shell will grow here once profile, notifications, and
          admin workflows are wired.
        </p>
        <Can permission="audit.trail.read">
          <p className="text-xs text-muted-foreground">
            Audit permissions detected for this user.
          </p>
        </Can>
      </div>
    </div>
  );
}
