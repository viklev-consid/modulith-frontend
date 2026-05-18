"use client";

import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  mapProblemToFieldErrors,
  problemHasErrorCode,
  type ProblemDetails,
} from "@/api/problems";
import { zLoginRequest } from "@/api/generated/zod.gen";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access your Modulith workspace.</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}

export function LoginForm() {
  const { login, resendEmailConfirmation } = useAuth();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});
      setUnconfirmedEmail(null);
      const parsed = zLoginRequest.safeParse(value);

      if (!parsed.success) {
        setFieldErrors({
          email: parsed.error.flatten().fieldErrors.email?.[0] ?? "",
          password: parsed.error.flatten().fieldErrors.password?.[0] ?? "",
        });
        return;
      }

      try {
        await login(parsed.data.email, parsed.data.password, nextPath);
      } catch (error) {
        const problem = error as ProblemDetails;
        if (problemHasErrorCode(problem, "Users.Email.NotConfirmed")) {
          setUnconfirmedEmail(parsed.data.email);
          return;
        }
        setFieldErrors(mapProblemToFieldErrors(problem));
      }
    },
  });

  async function onResend(email: string) {
    setIsResending(true);
    try {
      await resendEmailConfirmation(email);
    } catch {
      // handleProblem already surfaced a toast.
    } finally {
      setIsResending(false);
    }
  }

  return (
    <LoginShell>
      {unconfirmedEmail && (
        <Alert className="mb-5">
          <AlertTitle>Confirm your email first</AlertTitle>
          <AlertDescription>
            <p>
              We sent a confirmation link to{" "}
              <strong className="text-foreground">{unconfirmedEmail}</strong>.
              Click it to activate your account before signing in.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={isResending}
              onClick={() => onResend(unconfirmedEmail)}
            >
              {isResending ? "Resending…" : "Resend confirmation email"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
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
                  aria-invalid={Boolean(fieldErrors.email)}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError>{fieldErrors.email}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  aria-invalid={Boolean(fieldErrors.password)}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError>{fieldErrors.password}</FieldError>
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <Button className="w-full" type="submit">
          Sign in
        </Button>

        <FieldSeparator>or</FieldSeparator>

        <GoogleSignInButton nextPath={nextPath} />

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </form>
    </LoginShell>
  );
}
