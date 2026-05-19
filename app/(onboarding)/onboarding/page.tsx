"use client";

import { CheckIcon, ImageIcon, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { zCompleteOnboardingRequest } from "@/api/generated/zod.gen";
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
import { cn } from "@/lib/utils";

type Step = "terms" | "avatar" | "complete";

const STEPS: Step[] = ["terms", "avatar", "complete"];

export default function OnboardingPage() {
  const t = useTranslations("onboarding.page");
  const { currentUser, completeOnboarding } = useAuth();
  const [step, setStep] = useState<Step>("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarUploading, setAvatarUploading] = useState(false);

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
    setStep("avatar");
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper activeStep={step} />

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

function Stepper({ activeStep }: { activeStep: Step }) {
  const t = useTranslations("onboarding.page.steps");
  const activeIndex = STEPS.indexOf(activeStep);

  return (
    <ol className="flex flex-wrap gap-2 sm:flex-nowrap">
      {STEPS.map((step, index) => (
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
