"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { useAuth } from "@/components/auth-provider";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  readTwoFactorChallenge,
  type TwoFactorChallenge,
} from "@/lib/two-factor-challenge";

const TOTP_LENGTH = 6;

type Mode = "totp" | "recovery";

function useChallengeOrRedirect(): TwoFactorChallenge | null {
  const { replace } = useRouter();
  const [challenge] = useState<TwoFactorChallenge | null>(() =>
    typeof window === "undefined" ? null : readTwoFactorChallenge(),
  );

  useEffect(() => {
    if (!challenge) {
      replace("/login");
    }
  }, [challenge, replace]);

  return challenge;
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const target = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(target - Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (remaining <= 0) {
    return (
      <p className="text-xs text-destructive">
        This challenge has expired.{" "}
        <Link href="/login" className="underline-offset-4 hover:underline">
          Start over
        </Link>
        .
      </p>
    );
  }

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return (
    <p className="text-xs text-muted-foreground">
      Challenge expires in {minutes}:{seconds}
    </p>
  );
}

export function TwoFactorForm() {
  const { completeTwoFactorLogin } = useAuth();
  const challenge = useChallengeOrRedirect();

  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function reset() {
    setCode("");
    setFieldErrors({});
  }

  async function submit(value: string) {
    setSubmitting(true);
    setFieldErrors({});

    try {
      await completeTwoFactorLogin(value);
    } catch (error) {
      const mapped = mapProblemToFieldErrors(error as ProblemDetails);
      setFieldErrors({
        code: mapped.code ?? (error as ProblemDetails)?.detail ?? "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {mode === "totp"
              ? "Enter verification code"
              : "Use a recovery code"}
          </CardTitle>
          <CardDescription>
            {mode === "totp"
              ? "Open your authenticator app and enter the 6-digit code."
              : "Enter one of the codes you saved when you set up two-factor authentication."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!code || submitting) return;
              void submit(code);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code">
                  {mode === "totp" ? "Code" : "Recovery code"}
                </FieldLabel>
                {mode === "totp" ? (
                  <InputOTP
                    id="code"
                    maxLength={TOTP_LENGTH}
                    autoFocus
                    value={code}
                    onChange={(next) => setCode(next)}
                    onComplete={(complete) => {
                      if (!submitting) void submit(complete);
                    }}
                    aria-invalid={Boolean(fieldErrors.code)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: TOTP_LENGTH }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                ) : (
                  <Input
                    id="code"
                    autoFocus
                    autoComplete="one-time-code"
                    value={code}
                    aria-invalid={Boolean(fieldErrors.code)}
                    onChange={(event) => setCode(event.target.value.trim())}
                    placeholder="abcd-efgh-ij"
                  />
                )}
                <FieldError>{fieldErrors.code}</FieldError>
              </Field>

              {challenge ? (
                <ExpiryCountdown expiresAt={challenge.expiresAt} />
              ) : (
                <p className="text-xs text-muted-foreground">Loading…</p>
              )}
            </FieldGroup>

            <Button
              type="submit"
              className="w-full"
              disabled={!code || submitting}
            >
              {submitting ? "Verifying…" : "Verify and sign in"}
            </Button>

            <div className="space-y-2 text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setMode(mode === "totp" ? "recovery" : "totp");
                  reset();
                }}
              >
                {mode === "totp"
                  ? "Use a recovery code instead"
                  : "Use an authenticator code instead"}
              </button>
              <div>
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
