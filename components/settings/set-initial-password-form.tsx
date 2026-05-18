"use client";

import { useState } from "react";
import Script from "next/script";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { CircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { zSetInitialPasswordRequest } from "@/api/generated/zod.gen";
import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { fetchJson } from "@/components/settings/client-fetch";
import {
  GOOGLE_GSI_SRC,
  useGoogleCredential,
} from "@/lib/use-google-credential";
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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SetInitialPasswordForm() {
  const t = useTranslations("settingsForms.setPassword");
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
      googleIdToken: "",
    },
    onSubmit: async ({ value, formApi }) => {
      setFieldErrors({});
      if (value.password !== value.confirmPassword) {
        setFieldErrors({ confirmPassword: t("mismatch") });
        return;
      }

      const parsed = zSetInitialPasswordRequest.safeParse({
        password: value.password,
        googleIdToken: value.googleIdToken,
      });

      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.error.flatten().fieldErrors).map(
              ([field, messages]) => [field, messages[0] ?? t("invalidValue")],
            ),
          ),
        );
        return;
      }

      try {
        await fetchJson("/api/proxy/v1/users/me/password/initial", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        });
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        formApi.reset();
        toast.success(t("saved"));
      } catch (error) {
        setFieldErrors(mapProblemToFieldErrors(error as ProblemDetails));
      }
    },
  });

  const {
    containerId,
    isReady,
    isAvailable,
    initialize: initializeGoogleButton,
  } = useGoogleCredential({
    onCredential: (credential) => {
      form.setFieldValue("googleIdToken", credential);
      setFieldErrors((current) => {
        if (!current.googleIdToken) {
          return current;
        }
        const next = { ...current };
        delete next.googleIdToken;
        return next;
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid max-w-xl gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="password">
              {(field) => (
                <Field data-invalid={Boolean(fieldErrors.password)}>
                  <FieldLabel htmlFor={field.name}>{t("newLabel")}</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <FieldError>{fieldErrors.password}</FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <Field data-invalid={Boolean(fieldErrors.confirmPassword)}>
                  <FieldLabel htmlFor={field.name}>
                    {t("confirmLabel")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="password"
                      autoComplete="new-password"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    />
                    <FieldError>{fieldErrors.confirmPassword}</FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <Field>
              <FieldLabel htmlFor={containerId}>{t("verifyLabel")}</FieldLabel>
              <FieldContent>
                {isAvailable && (
                  <Script
                    src={GOOGLE_GSI_SRC}
                    strategy="afterInteractive"
                    onReady={initializeGoogleButton}
                  />
                )}
                <div id={containerId} className={isReady ? "" : "hidden"} />
                {(!isAvailable || !isReady) && (
                  <Button
                    className="w-fit"
                    type="button"
                    variant="outline"
                    disabled
                  >
                    <CircleIcon />
                    {t("continueWithGoogle")}
                  </Button>
                )}
                <FieldDescription>{t("verifyHint")}</FieldDescription>
                <FieldError>{fieldErrors.googleIdToken}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>
          <form.Subscribe
            selector={(state) => ({
              isSubmitting: state.isSubmitting,
              hasCredential: Boolean(state.values.googleIdToken),
            })}
          >
            {({ isSubmitting, hasCredential }) => (
              <>
                {!hasCredential && (
                  <Alert>
                    <AlertTitle>{t("needsVerification.title")}</AlertTitle>
                    <AlertDescription>
                      {t("needsVerification.description")}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  className="w-fit"
                  type="submit"
                  disabled={isSubmitting || !hasCredential}
                >
                  {isSubmitting ? t("submitting") : t("submit")}
                </Button>
              </>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
