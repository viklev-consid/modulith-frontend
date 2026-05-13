"use client";

import "@/api/client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";

import {
  createInvitationMutation,
  listInvitationsOptions,
  listInvitationsQueryKey,
  revokeInvitationMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { ListInvitationsInvitationDto } from "@/api/generated";
import {
  handleProblem,
  mapProblemToFieldErrors,
  type ProblemDetails,
} from "@/api/problems";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PENDING_STATUSES = new Set(["pending", "Pending"]);

function statusVariant(status: string) {
  if (PENDING_STATUSES.has(status)) return "secondary" as const;
  if (status.toLowerCase() === "accepted") return "default" as const;
  return "outline" as const;
}

function describeStatus(invitation: ListInvitationsInvitationDto) {
  if (PENDING_STATUSES.has(invitation.status)) {
    try {
      const expiresAt = parseISO(invitation.expiresAt);
      if (expiresAt.getTime() < Date.now()) {
        return { label: "Expired", variant: "destructive" as const };
      }
    } catch {
      // fall through to default
    }
  }
  return {
    label: invitation.status,
    variant: statusVariant(invitation.status),
  };
}

function relativeExpiry(invitation: ListInvitationsInvitationDto) {
  try {
    const expiresAt = parseISO(invitation.expiresAt);
    const isPast = expiresAt.getTime() < Date.now();
    return isPast
      ? `expired ${formatDistanceToNow(expiresAt, { addSuffix: true })}`
      : `expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
  } catch {
    return invitation.expiresAt;
  }
}

export function InvitationsPage() {
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const invitationsQuery = useQuery(listInvitationsOptions());

  const createMutation = useMutation({
    ...createInvitationMutation(),
    onSuccess: async (response) => {
      toast.success("Invitation sent", {
        description: `An email has been sent to ${response.email}. It expires ${formatDistanceToNow(
          parseISO(response.expiresAt),
          { addSuffix: true },
        )}.`,
      });
      setFieldErrors({});
      form.reset();
      await queryClient.invalidateQueries({
        queryKey: listInvitationsQueryKey(),
      });
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

  const revokeMutation = useMutation({
    ...revokeInvitationMutation(),
    onSuccess: async (response) => {
      toast.success("Invitation revoked", {
        description: `The invitation for ${response.email} has been revoked.`,
      });
      await queryClient.invalidateQueries({
        queryKey: listInvitationsQueryKey(),
      });
    },
    onError: (error) => {
      handleProblem(error as unknown as ProblemDetails);
    },
  });

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: ({ value }) => {
      setFieldErrors({});
      createMutation.mutate({ body: { email: value.email } });
    },
  });

  const invitations = invitationsQuery.data?.invitations ?? [];

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold">Invitations</h2>
        <p className="text-xs text-muted-foreground">
          Invite users to your workspace and manage pending invites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send invitation</CardTitle>
          <CardDescription>
            Invited users receive an email link valid for 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field name="email">
                {(field) => (
                  <Field data-invalid={Boolean(fieldErrors.email)}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        autoComplete="off"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        aria-invalid={Boolean(fieldErrors.email)}
                      />
                      <FieldError>{fieldErrors.email}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
            <div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>
            All invitations that have not yet been accepted or revoked.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invitationsQuery.isLoading ? (
            <div className="grid gap-2 p-4">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No invitations yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = describeStatus(invitation);
                  const isExpired = status.label === "Expired";
                  const isRevocable =
                    PENDING_STATUSES.has(invitation.status) && !isExpired;
                  return (
                    <TableRow
                      key={invitation.invitationId}
                      className={isExpired ? "opacity-60" : undefined}
                    >
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell
                        title={(() => {
                          try {
                            return format(
                              parseISO(invitation.expiresAt),
                              "PPpp",
                            );
                          } catch {
                            return invitation.expiresAt;
                          }
                        })()}
                      >
                        {relativeExpiry(invitation)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isRevocable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              revokeMutation.mutate({
                                path: { invitationId: invitation.invitationId },
                              })
                            }
                            disabled={revokeMutation.isPending}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
