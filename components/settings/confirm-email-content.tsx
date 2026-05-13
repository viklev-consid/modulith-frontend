"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, LoaderCircleIcon, XCircleIcon } from "lucide-react";

import { fetchJson } from "@/components/settings/client-fetch";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "loading" | "success" | "error";

export function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchJson("/api/proxy/v1/users/me/email/confirm", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  const isConfirmed = status === "success";
  const isLoading = status === "loading";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
          {isLoading ? (
            <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
          ) : isConfirmed ? (
            <CheckCircle2Icon className="size-6 text-emerald-600" />
          ) : (
            <XCircleIcon className="size-6 text-destructive" />
          )}
        </div>
        <CardTitle>
          {isLoading
            ? "Confirming email"
            : isConfirmed
              ? "Email updated"
              : "Invalid or expired link"}
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Please wait while we verify the confirmation link."
            : isConfirmed
              ? "Your new email address is ready to use."
              : "Request a fresh confirmation link from Email settings."}
        </CardDescription>
      </CardHeader>
      {!isLoading && (
        <CardContent className="flex justify-center">
          <Link
            href={isConfirmed ? "/" : "/settings/email"}
            className={buttonVariants()}
          >
            {isConfirmed ? "Go to app" : "Back to Email settings"}
          </Link>
        </CardContent>
      )}
    </Card>
  );
}
