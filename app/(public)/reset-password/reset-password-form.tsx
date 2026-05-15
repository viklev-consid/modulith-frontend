"use client";

import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";

import {
  mapProblemToFieldErrors,
  problemFromResponse,
  type ProblemDetails,
} from "@/api/problems";
import { zResetPasswordRequest } from "@/api/generated/zod.gen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState("");

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});
      setPageError("");

      if (value.newPassword !== value.confirmPassword) {
        setFieldErrors({ confirmPassword: "Passwords must match." });
        return;
      }

      const parsed = zResetPasswordRequest.safeParse({
        token,
        newPassword: value.newPassword,
      });

      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.error.flatten().fieldErrors).map(
              ([field, messages]) => [field, messages?.[0] ?? ""],
            ),
          ),
        );
        return;
      }

      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const problem = await problemFromResponse(response);
        setFieldErrors(mapProblemToFieldErrors(problem as ProblemDetails));
        setPageError(
          problem.detail ??
            problem.title ??
            "This reset link is invalid or has expired.",
        );
        return;
      }

      toast.success("Password reset", {
        description: "You can now sign in with your new password.",
      });
      window.location.assign("/login");
    },
  });

  if (!token) {
    return (
      <ResetMessage
        title="Reset link missing"
        description="Use the password reset link from your email, or request a new one."
      />
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            {pageError && (
              <p className="text-xs text-destructive">
                {pageError}{" "}
                <Link href="/forgot-password" className="underline">
                  Request a new link.
                </Link>
              </p>
            )}

            <FieldGroup>
              <form.Field name="newPassword">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                    <Input
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      aria-invalid={Boolean(fieldErrors.newPassword)}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldDescription>Minimum 10 characters.</FieldDescription>
                    <FieldError>{fieldErrors.newPassword}</FieldError>
                  </Field>
                )}
              </form.Field>
              <form.Field name="confirmPassword">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Confirm password
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <Button className="w-full" type="submit">
              Reset password
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export function ResetShell() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Loading reset link.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function ResetMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <AlertTriangleIcon className="mb-2 size-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className="inline-flex h-8 w-full items-center justify-center border border-border px-2.5 text-xs font-medium hover:bg-muted"
          >
            Request reset link
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
