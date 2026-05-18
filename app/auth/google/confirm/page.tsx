"use client";

import Link from "next/link";
import { CheckCircle2Icon, ShieldAlertIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { zGoogleLoginConfirmRequest } from "@/api/generated/zod.gen";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GoogleConfirmPage() {
  return (
    <Suspense fallback={<ConfirmShell />}>
      <GoogleConfirmContent />
    </Suspense>
  );
}

function GoogleConfirmContent() {
  const t = useTranslations("auth.googleConfirm");
  const searchParams = useSearchParams();
  const { googleConfirm } = useAuth();
  const [error, setError] = useState("");
  const token = searchParams.get("token") ?? "";
  const invitationToken = searchParams.get("invitationToken");
  const email = searchParams.get("email");
  const displayName = searchParams.get("displayName");

  async function confirm() {
    setError("");
    const parsed = zGoogleLoginConfirmRequest.safeParse({
      token,
      invitationToken,
    });

    if (!parsed.success) {
      setError(t("missingDetails"));
      return;
    }

    try {
      await googleConfirm(parsed.data);
    } catch (problem) {
      const fieldErrors = mapProblemToFieldErrors(problem as ProblemDetails);
      setError(
        fieldErrors.token ??
          (problem as ProblemDetails).detail ??
          (problem as ProblemDetails).title ??
          t("invalidLink"),
      );
    }
  }

  if (!token) {
    return (
      <ConfirmMessage
        title={t("missing.title")}
        description={t("missing.description")}
      />
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CheckCircle2Icon className="mb-2 size-5 text-muted-foreground" />
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(email || displayName) && (
            <div className="space-y-1 border border-border p-3 text-xs">
              {displayName && <p className="font-medium">{displayName}</p>}
              {email && <p className="text-muted-foreground">{email}</p>}
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            className="w-full"
            type="button"
            onClick={() => void confirm()}
          >
            {t("submit")}
          </Button>
          <Link
            href="/login"
            className="block text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("back")}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

function ConfirmShell() {
  const t = useTranslations("auth.googleConfirm");
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("shellTitle")}</CardTitle>
          <CardDescription>{t("shellDescription")}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function ConfirmMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = useTranslations("auth.googleConfirm");
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <ShieldAlertIcon className="mb-2 size-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex h-8 w-full items-center justify-center border border-border px-2.5 text-xs font-medium hover:bg-muted"
          >
            {t("back")}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
