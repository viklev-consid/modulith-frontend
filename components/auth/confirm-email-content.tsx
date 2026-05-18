"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, LoaderCircleIcon, XCircleIcon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
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

export function ConfirmEmailContent() {
  const { resendEmailConfirmation } = useAuth();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<Status>(
    initialToken ? "loading" : "idle",
  );
  const attempted = useRef(false);

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

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
      await fetchJson("/api/auth/email/confirm", {
        method: "POST",
        body: JSON.stringify({ token: value }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  async function onResendSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!resendEmail.trim()) return;
    setIsResending(true);
    try {
      await resendEmailConfirmation(resendEmail.trim());
      setShowResend(false);
      setResendEmail("");
    } catch {
      // handleProblem surfaces a toast.
    } finally {
      setIsResending(false);
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
            ? "Confirming your account"
            : isConfirmed
              ? "Account confirmed"
              : isError
                ? "Invalid or expired link"
                : "Confirm your account"}
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Please wait while we verify your confirmation link."
            : isConfirmed
              ? "You can now sign in to your account."
              : isError
                ? "Request a new confirmation email and try again."
                : "Paste the confirmation token from your email to activate your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfirmed ? (
          <Link href="/login" className={`${buttonVariants()} w-full`}>
            Continue to sign in
          </Link>
        ) : (
          <>
            {!isLoading && (
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
                  <FieldLabel htmlFor="confirm-token">
                    Confirmation token
                  </FieldLabel>
                  <Input
                    id="confirm-token"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Paste the token from your email"
                  />
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!token.trim()}
                >
                  Confirm account
                </Button>
              </form>
            )}
            {!isLoading &&
              (showResend ? (
                <form className="space-y-3" onSubmit={onResendSubmit}>
                  <Field>
                    <FieldLabel htmlFor="resend-email">
                      Email address
                    </FieldLabel>
                    <Input
                      id="resend-email"
                      type="email"
                      autoComplete="email"
                      value={resendEmail}
                      onChange={(event) => setResendEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => {
                        setShowResend(false);
                        setResendEmail("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="flex-1"
                      disabled={isResending || !resendEmail.trim()}
                    >
                      {isResending ? "Resending…" : "Send"}
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowResend(true)}
                >
                  Resend confirmation email
                </Button>
              ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
