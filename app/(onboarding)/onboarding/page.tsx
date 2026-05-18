"use client";

import {
  CheckCircle2Icon,
  CheckIcon,
  ImageIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Script from "next/script";
import { useForm } from "@tanstack/react-form";
import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import {
  zCompleteOnboardingRequest,
  zSetInitialPasswordRequest,
} from "@/api/generated/zod.gen";
import { AvatarUploader } from "@/components/avatar-uploader";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | boolean | number>,
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

type Step = "terms" | "password" | "avatar" | "complete";

export default function OnboardingPage() {
  const t = useTranslations("onboarding.page");
  const { currentUser, completeOnboarding, setInitialPassword } = useAuth();
  const [step, setStep] = useState<Step>("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const googleButtonId = useId().replace(/:/g, "");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const needsPasswordStep = currentUser ? !currentUser.hasPassword : false;
  const steps = useMemo(
    () =>
      needsPasswordStep
        ? (["terms", "password", "avatar", "complete"] as Step[])
        : (["terms", "avatar", "complete"] as Step[]),
    [needsPasswordStep],
  );

  const passwordForm = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
      googleIdToken: "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});

      if (value.password !== value.confirmPassword) {
        setFieldErrors({ confirmPassword: t("password.mismatch") });
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
              ([field, messages]) => [field, messages?.[0] ?? ""],
            ),
          ),
        );
        return;
      }

      try {
        await setInitialPassword(parsed.data);
        setStep("avatar");
      } catch (error) {
        setFieldErrors(mapProblemToFieldErrors(error as ProblemDetails));
      }
    },
  });

  async function finishOnboarding() {
    setFieldErrors({});
    const parsed = zCompleteOnboardingRequest.safeParse({
      acceptTerms: termsAccepted,
      acceptMarketingEmails: marketingAccepted,
    });

    if (!parsed.success) {
      setFieldErrors({ acceptTerms: t("terms.errorAcceptTerms") });
      setStep("terms");
      return;
    }

    try {
      await completeOnboarding(parsed.data);
    } catch (error) {
      setFieldErrors(mapProblemToFieldErrors(error as ProblemDetails));
    }
  }

  function continueFromTerms() {
    if (!termsAccepted) {
      setFieldErrors({ acceptTerms: t("terms.errorAcceptTerms") });
      return;
    }

    setFieldErrors({});
    setStep(needsPasswordStep ? "password" : "avatar");
  }

  function initializeGoogleButton() {
    if (!googleClientId || !window.google?.accounts?.id) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          return;
        }
        passwordForm.setFieldValue("googleIdToken", credential);
        setFieldErrors((current) => {
          if (!current.googleIdToken) {
            return current;
          }
          const { googleIdToken: _omit, ...rest } = current;
          return rest;
        });
      },
    });

    const target = document.getElementById(googleButtonId);
    if (target) {
      target.innerHTML = "";
      window.google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
      });
      setGoogleButtonReady(true);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper activeStep={step} steps={steps} />

          {step === "terms" && (
            <section className="space-y-5">
              <div className="grid gap-3 border border-border p-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-border px-2 py-0.5 text-foreground">
                    {t("terms.versionTerms")}
                  </span>
                  <span className="border border-border px-2 py-0.5 text-foreground">
                    {t("terms.versionPrivacy")}
                  </span>
                </div>
                <p>{t("terms.summary")}</p>
              </div>

              <FieldGroup>
                <Field orientation="horizontal">
                  <Checkbox
                    id="acceptTerms"
                    checked={termsAccepted}
                    aria-invalid={Boolean(fieldErrors.acceptTerms)}
                    onCheckedChange={(checked) => {
                      setTermsAccepted(checked === true);
                      setFieldErrors({});
                    }}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="acceptTerms">
                      {t("terms.acceptTerms")}
                    </FieldLabel>
                    <FieldError>{fieldErrors.acceptTerms}</FieldError>
                  </FieldContent>
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id="acceptMarketingEmails"
                    checked={marketingAccepted}
                    onCheckedChange={(checked) =>
                      setMarketingAccepted(checked === true)
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="acceptMarketingEmails">
                      {t("terms.acceptMarketing")}
                    </FieldLabel>
                    <FieldDescription>
                      {t("terms.marketingHint")}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <Button
                className="w-full"
                type="button"
                disabled={!termsAccepted}
                onClick={continueFromTerms}
              >
                {t("terms.submit")}
              </Button>
            </section>
          )}

          {step === "password" && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void passwordForm.handleSubmit();
              }}
            >
              <div className="flex items-start gap-2 border border-border p-3">
                <KeyRoundIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1 text-xs">
                  <FieldTitle>{t("password.title")}</FieldTitle>
                  <FieldDescription>
                    {t("password.description")}
                  </FieldDescription>
                </div>
              </div>

              <FieldGroup>
                <passwordForm.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("password.newLabel")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="password"
                        autoComplete="new-password"
                        value={field.state.value}
                        aria-invalid={Boolean(fieldErrors.password)}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <FieldDescription>
                        {t("password.newHint")}
                      </FieldDescription>
                      <FieldError>{fieldErrors.password}</FieldError>
                    </Field>
                  )}
                </passwordForm.Field>
                <passwordForm.Field name="confirmPassword">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("password.confirmLabel")}
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
                </passwordForm.Field>
                <passwordForm.Field name="googleIdToken">
                  {(field) => (
                    <Field>
                      <FieldLabel>{t("password.verifyLabel")}</FieldLabel>
                      <FieldDescription>
                        {t("password.verifyDescription")}
                      </FieldDescription>
                      {googleClientId ? (
                        <>
                          <Script
                            src="https://accounts.google.com/gsi/client"
                            strategy="afterInteractive"
                            onLoad={initializeGoogleButton}
                          />
                          {field.state.value ? (
                            <div className="flex items-center gap-2 border border-border p-3 text-sm">
                              <CheckCircle2Icon className="size-4 text-foreground" />
                              <span>{t("password.verifyConfirmed")}</span>
                            </div>
                          ) : (
                            <>
                              <div
                                id={googleButtonId}
                                className={googleButtonReady ? "" : "hidden"}
                              />
                              {!googleButtonReady && (
                                <Button
                                  className="w-full"
                                  type="button"
                                  variant="outline"
                                  disabled
                                >
                                  {t("password.verifyLoading")}
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="border border-border p-3 text-sm text-muted-foreground">
                          {t("password.googleUnavailable")}
                        </div>
                      )}
                      <FieldError>{fieldErrors.googleIdToken}</FieldError>
                    </Field>
                  )}
                </passwordForm.Field>
              </FieldGroup>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("avatar")}
                >
                  {t("password.skip")}
                </Button>
                <passwordForm.Subscribe
                  selector={(state) => state.values.googleIdToken}
                >
                  {(googleIdToken) => (
                    <Button type="submit" disabled={!googleIdToken}>
                      {t("password.submit")}
                    </Button>
                  )}
                </passwordForm.Subscribe>
              </div>
            </form>
          )}

          {step === "avatar" && currentUser && (
            <section className="space-y-5">
              <div className="flex items-start gap-2 border border-border p-3">
                <ImageIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1 text-xs">
                  <FieldTitle>{t("avatar.title")}</FieldTitle>
                  <FieldDescription>{t("avatar.description")}</FieldDescription>
                </div>
              </div>
              <AvatarUploader
                user={currentUser}
                onUploadingChange={setAvatarUploading}
              />
              {currentUser.avatar ? (
                <p className="text-xs text-muted-foreground">
                  {t("avatar.replaceHint")}
                </p>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("complete")}
                  disabled={avatarUploading}
                >
                  {t("avatar.skip")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("complete")}
                  disabled={avatarUploading}
                >
                  {t("avatar.continue")}
                </Button>
              </div>
            </section>
          )}

          {step === "complete" && (
            <section className="space-y-5">
              <div className="flex items-start gap-2 border border-border p-3">
                <ShieldCheckIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1 text-xs">
                  <FieldTitle>{t("complete.title")}</FieldTitle>
                  <FieldDescription>
                    {t("complete.description")}
                  </FieldDescription>
                </div>
              </div>
              <Button
                className="w-full"
                type="button"
                onClick={() => void finishOnboarding()}
              >
                {t("complete.submit")}
              </Button>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Stepper({ activeStep, steps }: { activeStep: Step; steps: Step[] }) {
  const t = useTranslations("onboarding.page.steps");
  const activeIndex = steps.indexOf(activeStep);

  return (
    <ol className="flex flex-wrap gap-2 sm:flex-nowrap">
      {steps.map((step, index) => (
        <li
          key={step}
          className={cn(
            "flex flex-1 items-center gap-2 border border-border px-2.5 py-2 text-xs text-muted-foreground",
            index <= activeIndex && "border-foreground text-foreground",
          )}
        >
          <span className="flex size-4 items-center justify-center border border-current">
            {index < activeIndex ? <CheckIcon className="size-3" /> : index + 1}
          </span>
          <span>{t(step)}</span>
        </li>
      ))}
    </ol>
  );
}
