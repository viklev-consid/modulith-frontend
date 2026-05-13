"use client";

import { CheckIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useMemo, useState } from "react";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import {
  zCompleteOnboardingRequest,
  zSetInitialPasswordRequest,
} from "@/api/generated/zod.gen";
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

type Step = "terms" | "password" | "complete";

export default function OnboardingPage() {
  const { currentUser, completeOnboarding, setInitialPassword } = useAuth();
  const [step, setStep] = useState<Step>("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const needsPasswordStep = currentUser ? !currentUser.hasPassword : false;
  const steps = useMemo(
    () =>
      needsPasswordStep
        ? (["terms", "password", "complete"] as Step[])
        : (["terms", "complete"] as Step[]),
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
        setFieldErrors({ confirmPassword: "Passwords must match." });
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
        setStep("complete");
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
      setFieldErrors({ acceptTerms: "Accept the terms to continue." });
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
      setFieldErrors({ acceptTerms: "Accept the terms to continue." });
      return;
    }

    setFieldErrors({});
    setStep(needsPasswordStep ? "password" : "complete");
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Finish account setup</CardTitle>
          <CardDescription>
            Complete these steps before entering your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper activeStep={step} steps={steps} />

          {step === "terms" && (
            <section className="space-y-5">
              <div className="grid gap-3 border border-border p-3 text-xs leading-relaxed text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-border px-2 py-0.5 text-foreground">
                    Terms v1.0
                  </span>
                  <span className="border border-border px-2 py-0.5 text-foreground">
                    Privacy v1.0
                  </span>
                </div>
                <p>
                  By continuing, you agree to use Modulith according to the
                  workspace terms and acknowledge how account data is processed
                  for authentication, notifications, audit history, and account
                  administration.
                </p>
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
                      I accept the terms and privacy policy
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
                      Send me product updates by email
                    </FieldLabel>
                    <FieldDescription>Optional.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <Button
                className="w-full"
                type="button"
                disabled={!termsAccepted}
                onClick={continueFromTerms}
              >
                Continue
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
                  <FieldTitle>Set an initial password</FieldTitle>
                  <FieldDescription>
                    Add a password if you want to sign in without Google later.
                  </FieldDescription>
                </div>
              </div>

              <FieldGroup>
                <passwordForm.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>New password</FieldLabel>
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
                        Minimum 10 characters.
                      </FieldDescription>
                      <FieldError>{fieldErrors.password}</FieldError>
                    </Field>
                  )}
                </passwordForm.Field>
                <passwordForm.Field name="confirmPassword">
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
                </passwordForm.Field>
                <passwordForm.Field name="googleIdToken">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Google verification token
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        aria-invalid={Boolean(fieldErrors.googleIdToken)}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <FieldDescription>
                        Required by the backend before setting a password on a
                        Google-only account.
                      </FieldDescription>
                      <FieldError>{fieldErrors.googleIdToken}</FieldError>
                    </Field>
                  )}
                </passwordForm.Field>
              </FieldGroup>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("complete")}
                >
                  Skip for now
                </Button>
                <Button type="submit">Set password</Button>
              </div>
            </form>
          )}

          {step === "complete" && (
            <section className="space-y-5">
              <div className="flex items-start gap-2 border border-border p-3">
                <ShieldCheckIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1 text-xs">
                  <FieldTitle>Ready to enter Modulith</FieldTitle>
                  <FieldDescription>
                    We&apos;ll save your onboarding choices and open the app.
                  </FieldDescription>
                </div>
              </div>
              <Button
                className="w-full"
                type="button"
                onClick={() => void finishOnboarding()}
              >
                Complete setup
              </Button>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Stepper({ activeStep, steps }: { activeStep: Step; steps: Step[] }) {
  const activeIndex = steps.indexOf(activeStep);

  return (
    <ol className="grid gap-2 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step}
          className={cn(
            "flex items-center gap-2 border border-border px-2.5 py-2 text-xs text-muted-foreground",
            index <= activeIndex && "border-foreground text-foreground",
          )}
        >
          <span className="flex size-4 items-center justify-center border border-current">
            {index < activeIndex ? <CheckIcon className="size-3" /> : index + 1}
          </span>
          <span className="capitalize">{step}</span>
        </li>
      ))}
    </ol>
  );
}
