"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  createOrganizationMutation,
  listMyOrganizationsQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import { zCreateOrganizationRequest } from "@/api/generated/zod.gen";
import {
  handleProblem,
  mapProblemToFieldErrors,
  type ProblemDetails,
} from "@/api/problems";
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
import { isValidSlug, suggestSlug } from "@/lib/slug";

export function CreateOrgForm() {
  const t = useTranslations("organizations.create");
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Track whether the user has manually touched the slug. While they
  // haven't, we keep suggesting one from the name. Once they edit the slug,
  // we stop overwriting it so we don't undo their work mid-typing.
  const [slugTouched, setSlugTouched] = useState(false);

  const mutation = useMutation({
    ...createOrganizationMutation(),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: listMyOrganizationsQueryKey(),
      });
      toast.success(data.name);
      push(`/app/organizations/o/${data.slug}`);
    },
    onError: (error) => {
      const problem = error as unknown as ProblemDetails;
      const errors = mapProblemToFieldErrors(problem);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      handleProblem(problem);
    },
  });

  const form = useForm({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value }) => {
      setFieldErrors({});

      const slug = value.slug.trim() || suggestSlug(value.name);
      const name = value.name.trim();

      if (!name) {
        setFieldErrors({ name: t("name.hint") });
        return;
      }

      // Client-side slug shape guard. Empty slug is allowed by the API
      // (backend derives one from the name), so skip the check then.
      if (slug && !isValidSlug(slug)) {
        setFieldErrors({ slug: t("slug.invalid") });
        return;
      }

      const parsed = zCreateOrganizationRequest.safeParse({
        name,
        slug: slug || null,
      });

      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(parsed.error.flatten().fieldErrors).map(
              ([field, messages]) => [
                field,
                messages?.[0] ?? t("slug.invalid"),
              ],
            ),
          ),
        );
        return;
      }

      await mutation.mutateAsync({ body: parsed.data });
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
            <form.Field name="name">
              {(field) => (
                <Field data-invalid={Boolean(fieldErrors.name)}>
                  <FieldLabel htmlFor={field.name}>
                    {t("name.label")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="text"
                      value={field.state.value}
                      placeholder={t("name.placeholder")}
                      onChange={(event) => {
                        const next = event.target.value;
                        field.handleChange(next);
                        if (!slugTouched) {
                          form.setFieldValue("slug", suggestSlug(next));
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.name)}
                      autoFocus
                    />
                    <FieldDescription>{t("name.hint")}</FieldDescription>
                    <FieldError>{fieldErrors.name}</FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
            <form.Field name="slug">
              {(field) => (
                <Field data-invalid={Boolean(fieldErrors.slug)}>
                  <FieldLabel htmlFor={field.name}>
                    {t("slug.label")}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="text"
                      value={field.state.value}
                      placeholder={t("slug.placeholder")}
                      onChange={(event) => {
                        setSlugTouched(true);
                        field.handleChange(event.target.value);
                      }}
                      aria-invalid={Boolean(fieldErrors.slug)}
                    />
                    <FieldDescription>{t("slug.hint")}</FieldDescription>
                    <FieldError>{fieldErrors.slug}</FieldError>
                  </FieldContent>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          <div className="flex gap-2">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || mutation.isPending}
                >
                  {isSubmitting || mutation.isPending
                    ? t("submitting")
                    : t("submit")}
                </Button>
              )}
            </form.Subscribe>
            <Button
              type="button"
              variant="ghost"
              onClick={() => push("/app/organizations")}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
