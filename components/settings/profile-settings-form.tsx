"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { mapProblemToFieldErrors, type ProblemDetails } from "@/api/problems";
import { useAuth } from "@/components/auth-provider";
import { fetchJson } from "@/components/settings/client-fetch";
import { Badge } from "@/components/ui/badge";
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

export function ProfileSettingsForm() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const form = useForm({
    defaultValues: {
      displayName: currentUser?.displayName ?? "",
    },
    onSubmit: async ({ value }) => {
      setFieldErrors({});
      try {
        await fetchJson<unknown>("/api/proxy/v1/users/me", {
          method: "PUT",
          body: JSON.stringify({ displayName: value.displayName }),
        });
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        toast.success("Profile updated");
      } catch (error) {
        setFieldErrors(mapProblemToFieldErrors(error as ProblemDetails));
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update the name shown across your workspace.
        </CardDescription>
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
            <form.Field name="displayName">
              {(field) => (
                <Field data-invalid={Boolean(fieldErrors.displayName)}>
                  <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={Boolean(fieldErrors.displayName)}
                    />
                    <FieldError>{fieldErrors.displayName}</FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input id="email" value={currentUser?.email ?? ""} readOnly />
                <FieldDescription>
                  Change it in Email settings.
                </FieldDescription>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <Badge variant="secondary" className="w-fit">
                  {currentUser?.role ?? "User"}
                </Badge>
              </FieldContent>
            </Field>
          </FieldGroup>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button className="w-fit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
