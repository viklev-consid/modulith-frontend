"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, LoaderCircleIcon, XCircleIcon } from "lucide-react";

import { fetchJson } from "@/components/settings/client-fetch";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Status = "idle" | "loading" | "success" | "error";

export function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<Status>(
    initialToken ? "loading" : "idle",
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (!initialToken || attempted.current) {
      return;
    }
    attempted.current = true;
    void confirm(initialToken);
  }, [initialToken]);

  async function confirm(value: string) {
    setStatus("loading");
    try {
      await fetchJson("/api/proxy/v1/users/me/email/confirm", {
        method: "POST",
        body: JSON.stringify({ token: value }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const isLoading = status === "loading";
  const isConfirmed = status === "success";
  const isError = status === "error";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
          {isLoading ? (
            <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
          ) : isConfirmed ? (
            <CheckCircle2Icon className="size-6 text-emerald-600" />
          ) : isError ? (
            <XCircleIcon className="size-6 text-destructive" />
          ) : (
            <CheckCircle2Icon className="size-6 text-muted-foreground" />
          )}
        </div>
        <CardTitle>
          {isLoading
            ? "Confirming email change"
            : isConfirmed
              ? "Email updated"
              : isError
                ? "Invalid or expired link"
                : "Confirm email change"}
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Please wait while we verify the confirmation link."
            : isConfirmed
              ? "Your new email address is ready to use."
              : isError
                ? "Request a fresh confirmation link from Email settings."
                : "Paste the confirmation token from your email to finish the change."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isConfirmed || isError ? (
          <Link
            href={isConfirmed ? "/app" : "/app/settings/email"}
            className={buttonVariants()}
          >
            {isConfirmed ? "Go to app" : "Back to Email settings"}
          </Link>
        ) : (
          !isLoading && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (token.trim()) {
                  void confirm(token.trim());
                }
              }}
            >
              <Field>
                <FieldLabel htmlFor="change-token">
                  Confirmation token
                </FieldLabel>
                <Input
                  id="change-token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste the token from your email"
                />
              </Field>
              <Button type="submit" className="w-full" disabled={!token.trim()}>
                Confirm email change
              </Button>
            </form>
          )
        )}
      </CardContent>
    </Card>
  );
}
