"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { problemFromResponse, handleProblem } from "@/api/problems";
import { zForgotPasswordRequest } from "@/api/generated/zod.gen";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setEmailError("");
      const parsed = zForgotPasswordRequest.safeParse(value);

      if (!parsed.success) {
        setEmailError(parsed.error.flatten().fieldErrors.email?.[0] ?? "");
        return;
      }

      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const problem = await problemFromResponse(response);
        handleProblem(problem);
        return;
      }

      setSentEmail(parsed.data.email);
    },
  });

  if (sentEmail) {
    return (
      <AuthShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CheckIcon className="mb-2 size-5 text-muted-foreground" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a password reset link to <strong>{sentEmail}</strong>. The
              link expires in 30 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={() => void form.handleSubmit()}
            >
              Resend
            </Button>
            <BackToSignIn />
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a reset link.
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
            <FieldGroup>
              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      aria-invalid={Boolean(emailError)}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                    <FieldError>{emailError}</FieldError>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            <Button className="w-full" type="submit">
              Send reset link
            </Button>
            <BackToSignIn />
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}

function BackToSignIn() {
  return (
    <Link
      href="/login"
      className="block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Back to sign in
    </Link>
  );
}
