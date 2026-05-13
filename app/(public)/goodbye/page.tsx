import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Account deleted | Modulith",
};

export default function GoodbyePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
            <CheckCircle2Icon className="size-6 text-emerald-600" />
          </div>
          <CardTitle>Account deleted</CardTitle>
          <CardDescription>
            Your account and all associated data have been permanently removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/login" className={buttonVariants()}>
            Return to home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
