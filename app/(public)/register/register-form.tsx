"use client";

import Link from "next/link";
import { LockIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useState, type ReactNode } from "react";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { zRegisterRequest } from "@/api/generated/zod.gen";
import { useAuth } from "@/components/auth-provider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
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

type RegisterMode = "Open" | "InviteOnly" | "Disabled";

const registrationMode = (process.env.NEXT_PUBLIC_REGISTRATION_MODE ??
  "Open") as RegisterMode;

export function RegisterContent() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("token");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});

      if (value.password !== value.confirmPassword) {
        setFieldErrors({ confirmPassword: "Passwords must match." });
        return;
      }

      const parsed = zRegisterRequest.safeParse({
        displayName: value.displayName,
        email: value.email,
        password: value.password,
        invitationToken,
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

      try {
        await register(parsed.data);
      } catch (error) {
        setFieldErrors(mapProblemToFieldErrors(error as ProblemDetails));
      }
    },
  });

  if (registrationMode === "Disabled") {
    return <RegisterMessage title="Registration closed" />;
  }

  if (registrationMode === "InviteOnly" && !invitationToken) {
    return (
      <RegisterMessage
        title="Invitation required"
        description="Registration is currently by invitation only."
      />
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {invitationToken ? "You're invited" : "Create account"}
          </CardTitle>
          <CardDescription>
            Set up your Modulith workspace access.
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
              <FormInput
                form={form}
                name="displayName"
                label="Display name"
                error={fieldErrors.displayName}
                autoComplete="name"
              />
              <FormInput
                form={form}
                name="email"
                label="Email"
                error={fieldErrors.email}
                type="email"
                autoComplete="email"
              />
              <FormInput
                form={form}
                name="password"
                label="Password"
                error={fieldErrors.password}
                type="password"
                autoComplete="new-password"
              />
              <FormInput
                form={form}
                name="confirmPassword"
                label="Confirm password"
                error={fieldErrors.confirmPassword}
                type="password"
                autoComplete="new-password"
              />
            </FieldGroup>

            <Button className="w-full" type="submit">
              Create account
            </Button>

            <FieldSeparator>or</FieldSeparator>

            <GoogleSignInButton />

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export function RegisterShell() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Loading registration options.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function RegisterMessage({
  title,
  description = "New account registration is not available at this time.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <LockIcon className="mb-2 size-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex h-8 w-full items-center justify-center border border-border px-2.5 text-xs font-medium hover:bg-muted"
          >
            Already have an account? Sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

function FormInput({
  form,
  name,
  label,
  error,
  type = "text",
  autoComplete,
}: {
  form: {
    Field: React.ComponentType<{
      name: "displayName" | "email" | "password" | "confirmPassword";
      children: (field: {
        name: string;
        state: { value: string };
        handleBlur: () => void;
        handleChange: (value: string) => void;
      }) => ReactNode;
    }>;
  };
  name: "displayName" | "email" | "password" | "confirmPassword";
  label: string;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <form.Field name={name}>
      {(field) => (
        <Field>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            type={type}
            autoComplete={autoComplete}
            value={field.state.value}
            aria-invalid={Boolean(error)}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          <FieldError>{error}</FieldError>
        </Field>
      )}
    </form.Field>
  );
}
