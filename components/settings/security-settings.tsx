"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, DownloadIcon, ShieldIcon } from "lucide-react";
import { toast } from "sonner";

import type {
  ConfirmTotpResponse,
  GetCurrentUserResponse,
  RegenerateRecoveryCodesResponse,
  SetupTotpResponse,
} from "@/api/generated";
import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { useCurrentUser } from "@/components/auth-provider";
import { fetchJson, fieldMessage } from "@/components/settings/client-fetch";
import { currentUserQueryKey } from "@/lib/auth-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
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
import { QRCode, QRCodeCanvas } from "@/components/ui/qr-code";
import { Skeleton } from "@/components/ui/skeleton";

const TOTP_LENGTH = 6;

type SetupStep = "scan" | "confirm" | "codes";

function copyToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }
  void navigator.clipboard.writeText(text);
}

function downloadCodes(codes: string[]) {
  const blob = new Blob([codes.join("\n") + "\n"], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modulith-recovery-codes.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function RecoveryCodeList({ codes }: { codes: string[] }) {
  const joined = codes.join("\n");
  return (
    <div className="space-y-3">
      <ul
        aria-live="polite"
        className="rounded-md border bg-muted/40 p-3 font-mono text-sm leading-6 tracking-wider"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            copyToClipboard(joined);
            toast.success("Recovery codes copied");
          }}
        >
          <CopyIcon className="size-4" /> Copy all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadCodes(codes)}
        >
          <DownloadIcon className="size-4" /> Download .txt
        </Button>
      </div>
    </div>
  );
}

function SecuritySettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Loading your security settings…</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-9 w-40" />
      </CardContent>
    </Card>
  );
}

export function SecuritySettings() {
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <SecuritySettingsSkeleton />;
  }

  return currentUser.twoFactorEnabled ? (
    <EnabledPanel />
  ) : (
    <DisabledPanel currentUser={currentUser} />
  );
}

function DisabledPanel({
  currentUser,
}: {
  currentUser: GetCurrentUserResponse;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<SetupStep | null>(null);
  const [setup, setSetup] = useState<SetupTotpResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  async function startSetup() {
    if (!currentUser.hasPassword) {
      toast.error("Set a password first", {
        description:
          "You need an account password before enabling two-factor authentication.",
      });
      return;
    }

    setStarting(true);
    try {
      const response = await fetchJson<SetupTotpResponse>(
        "/api/proxy/v1/users/me/2fa/totp/setup",
        { method: "POST" },
      );
      setSetup(response);
      setStep("scan");
    } finally {
      setStarting(false);
    }
  }

  function finishConfirm(codes: string[]) {
    setRecoveryCodes(codes);
    setStep("codes");
  }

  if (step === "scan" && setup) {
    return (
      <SetupScanStep
        setup={setup}
        onContinue={() => setStep("confirm")}
        onCancel={() => {
          setSetup(null);
          setStep(null);
        }}
      />
    );
  }

  if (step === "confirm") {
    return (
      <SetupConfirmStep
        onBack={() => setStep("scan")}
        onConfirmed={finishConfirm}
      />
    );
  }

  if (step === "codes") {
    return (
      <SetupCodesStep
        codes={recoveryCodes}
        onDone={async () => {
          // Invalidate AFTER acknowledgement so the parent doesn't swap to
          // EnabledPanel and unmount this screen while codes are still visible.
          setSetup(null);
          setRecoveryCodes([]);
          setStep(null);
          await queryClient.invalidateQueries({
            queryKey: currentUserQueryKey,
          });
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          Add a second step to your sign-in for an extra layer of security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShieldIcon className="size-4 text-muted-foreground" />
          Two-factor authentication is off
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ll ask for a code from your authenticator app the next time
          you sign in.
        </p>
        <Button type="button" onClick={startSetup} disabled={starting}>
          {starting ? "Starting…" : "Set up authenticator app"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SetupScanStep({
  setup,
  onContinue,
  onCancel,
}: {
  setup: SetupTotpResponse;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan with your authenticator</CardTitle>
        <CardDescription>
          Use Google Authenticator, 1Password, Authy, or any TOTP app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <QRCode value={setup.otpAuthUri} size={180}>
            <QRCodeCanvas className="rounded-md border bg-white p-2" />
          </QRCode>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Can&apos;t scan? Enter this code manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                {setup.secret}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  copyToClipboard(setup.secret);
                  toast.success("Secret copied");
                }}
              >
                <CopyIcon className="size-4" />
                <span className="sr-only">Copy secret</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onContinue}>
            I&apos;ve added it, continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SetupConfirmStep({
  onBack,
  onConfirmed,
}: {
  onBack: () => void;
  onConfirmed: (codes: string[]) => void;
}) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(value: string) {
    setSubmitting(true);
    setFieldErrors({});
    try {
      const response = await fetchJson<ConfirmTotpResponse>(
        "/api/proxy/v1/users/me/2fa/totp/confirm",
        {
          method: "POST",
          body: JSON.stringify({ code: value }),
        },
      );
      onConfirmed(response.recoveryCodes);
    } catch (error) {
      const problem = error as ProblemDetails;
      const mapped = mapProblemToFieldErrors(problem);
      setFieldErrors({
        code:
          mapped.code ??
          fieldMessage(problem, "code", "That code did not match."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm with a code</CardTitle>
        <CardDescription>
          Enter the 6-digit code shown in your authenticator app right now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length === TOTP_LENGTH && !submitting) {
              void submit(code);
            }
          }}
        >
          <Field>
            <FieldLabel htmlFor="totp-confirm">Code from app</FieldLabel>
            <InputOTP
              id="totp-confirm"
              maxLength={TOTP_LENGTH}
              autoFocus
              value={code}
              onChange={(next) => setCode(next)}
              onComplete={(value) => {
                if (!submitting) void submit(value);
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
            <FieldError>{fieldErrors.code}</FieldError>
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={code.length !== TOTP_LENGTH || submitting}
            >
              {submitting ? "Confirming…" : "Enable two-factor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SetupCodesStep({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Save your recovery codes</CardTitle>
        <CardDescription>
          Each code works once. Store them somewhere safe, they will not be
          shown again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RecoveryCodeList codes={codes} />
        <label
          htmlFor="recovery-codes-acknowledged"
          className="flex items-center gap-2 text-sm"
        >
          <Checkbox
            id="recovery-codes-acknowledged"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          I have saved my recovery codes
        </label>
        <Button type="button" disabled={!acknowledged} onClick={onDone}>
          <CheckIcon className="size-4" /> Finish setup
        </Button>
      </CardContent>
    </Card>
  );
}

function EnabledPanel() {
  const queryClient = useQueryClient();
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(
    null,
  );

  if (newRecoveryCodes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>New recovery codes</CardTitle>
          <CardDescription>
            Your old recovery codes have been invalidated. Save these new codes,
            they will not be shown again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecoveryCodeList codes={newRecoveryCodes} />
          <SaveAcknowledgeButton onDone={() => setNewRecoveryCodes(null)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            You&apos;ll be asked for a code at every sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldIcon className="size-4 text-emerald-600" />
            Two-factor authentication is on
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recovery codes</CardTitle>
          <CardDescription>
            Lost access to your codes? Generate a new set. Old codes stop
            working.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRegenerateOpen(true)}
          >
            Regenerate recovery codes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Turn off two-factor
          </CardTitle>
          <CardDescription>
            Removes the second step from sign-in. You can turn it back on later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDisableOpen(true)}
          >
            Turn off two-factor
          </Button>
        </CardContent>
      </Card>

      <RegenerateDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        onSuccess={(codes) => {
          setRegenerateOpen(false);
          setNewRecoveryCodes(codes);
        }}
      />

      <DisableDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        onSuccess={async () => {
          setDisableOpen(false);
          toast.success("Two-factor authentication is off");
          await queryClient.invalidateQueries({
            queryKey: currentUserQueryKey,
          });
        }}
      />
    </div>
  );
}

function SaveAcknowledgeButton({ onDone }: { onDone: () => void }) {
  const [ack, setAck] = useState(false);
  return (
    <div className="space-y-3">
      <label
        htmlFor="new-recovery-codes-acknowledged"
        className="flex items-center gap-2 text-sm"
      >
        <Checkbox
          id="new-recovery-codes-acknowledged"
          checked={ack}
          onCheckedChange={(checked) => setAck(checked === true)}
        />
        I have saved my new recovery codes
      </label>
      <Button type="button" disabled={!ack} onClick={onDone}>
        Finish saving codes
      </Button>
    </div>
  );
}

type ConfirmFields = {
  currentPassword: string;
  code: string;
};

function ConfirmFieldsForm({
  submitLabel,
  pendingLabel,
  destructive,
  onSubmit,
}: {
  submitLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  onSubmit: (data: ConfirmFields) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const canSubmit = password.length > 0 && code.length >= TOTP_LENGTH;

  async function handleSubmit() {
    setSubmitting(true);
    setFieldErrors({});
    try {
      await onSubmit({ currentPassword: password, code });
    } catch (error) {
      const problem = error as ProblemDetails;
      const mapped = mapProblemToFieldErrors(problem);
      // When the backend returns a bare `detail` (no field errors), surface it
      // on the code input — the only "free-text" error path here is "wrong
      // verification code".
      const detailFallback =
        !problem.errors && problem.detail ? problem.detail : "";
      setFieldErrors({
        currentPassword: mapped.currentPassword ?? "",
        code: mapped.code ?? detailFallback,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit && !submitting) void handleSubmit();
      }}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.currentPassword)}>
          <FieldLabel htmlFor="security-current-password">
            Current password
          </FieldLabel>
          <FieldContent>
            <Input
              id="security-current-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.currentPassword)}
            />
            <FieldError>{fieldErrors.currentPassword}</FieldError>
          </FieldContent>
        </Field>
        <Field data-invalid={Boolean(fieldErrors.code)}>
          <FieldLabel htmlFor="security-code">
            Code from app (or recovery code)
          </FieldLabel>
          <FieldContent>
            <Input
              id="security-code"
              autoComplete="one-time-code"
              value={code}
              placeholder="123456 or abcd-efgh-ij"
              onChange={(event) => setCode(event.target.value.trim())}
              aria-invalid={Boolean(fieldErrors.code)}
            />
            <FieldError>{fieldErrors.code}</FieldError>
          </FieldContent>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button
          type="submit"
          variant={destructive ? "destructive" : "default"}
          disabled={!canSubmit || submitting}
        >
          {submitting ? pendingLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function RegenerateDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (codes: string[]) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate recovery codes?</DialogTitle>
          <DialogDescription>
            Your existing recovery codes will stop working immediately. Enter
            your password and a current code to confirm.
          </DialogDescription>
        </DialogHeader>
        <ConfirmFieldsForm
          submitLabel="Regenerate codes"
          pendingLabel="Regenerating…"
          onSubmit={async (data) => {
            const response = await fetchJson<RegenerateRecoveryCodesResponse>(
              "/api/proxy/v1/users/me/2fa/recovery-codes/regenerate",
              {
                method: "POST",
                body: JSON.stringify(data),
              },
            );
            onSuccess(response.recoveryCodes);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function DisableDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn off two-factor authentication?</DialogTitle>
          <DialogDescription>
            Sign-in will no longer require a second step. You can re-enable it
            later. Enter your password and a current code to confirm.
          </DialogDescription>
        </DialogHeader>
        <ConfirmFieldsForm
          submitLabel="Turn off"
          pendingLabel="Turning off…"
          destructive
          onSubmit={async (data) => {
            await fetchJson("/api/proxy/v1/users/me/2fa", {
              method: "DELETE",
              body: JSON.stringify(data),
            });
            await onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
