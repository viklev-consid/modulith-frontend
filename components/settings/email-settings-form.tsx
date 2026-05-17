"use client";

import Link from "next/link";
import { KeyRoundIcon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmailSettingsForm() {
  const { currentUser } = useAuth();

  if (currentUser && !currentUser.hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
          <CardDescription>
            Change the address used for sign-in and account alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-5">
          <Alert>
            <KeyRoundIcon />
            <AlertTitle>Set a password first</AlertTitle>
            <AlertDescription>
              Changing your email requires confirming your password. Set a
              password before changing your email.
            </AlertDescription>
          </Alert>
          <Button
            className="w-fit"
            render={<Link href="/app/settings/password">Set a password</Link>}
          />
        </CardContent>
      </Card>
    );
  }

  return <ChangeEmailForm />;
}
