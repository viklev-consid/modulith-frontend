"use client";

import "@/api/client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { handleProblem, type ProblemDetails } from "@/api/problems";
import {
  changeUserRoleMutation,
  getUserByIdQueryKey,
  listUsersQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "User", label: "User" },
] as const;

export function RoleChangeDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentRole,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRole: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <RoleChangeForm
            key={`${userId}:${currentRole}`}
            userId={userId}
            userName={userName}
            currentRole={currentRole}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RoleChangeForm({
  userId,
  userName,
  currentRole,
  onClose,
}: {
  userId: string;
  userName: string;
  currentRole: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(currentRole);

  const mutation = useMutation({
    ...changeUserRoleMutation(),
    onSuccess: async () => {
      toast.success("Role updated", {
        description: `${userName} is now a ${role}.`,
      });
      await queryClient.invalidateQueries({
        queryKey: getUserByIdQueryKey({ path: { userId } }),
      });
      await queryClient.invalidateQueries({ queryKey: listUsersQueryKey() });
      onClose();
    },
    onError: (error) => {
      handleProblem(error as unknown as ProblemDetails);
    },
  });

  const isDirty = role !== currentRole;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change user role</DialogTitle>
        <DialogDescription>
          Changing the role for <strong>{userName}</strong>.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <Select
          value={role}
          onValueChange={(value) => {
            if (value) {
              setRole(value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Admins can manage users, invitations, and audit logs. Regular users
          only see their own account.
        </p>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={() =>
            mutation.mutate({
              path: { userId },
              body: { role },
            })
          }
          disabled={!isDirty || mutation.isPending}
        >
          {mutation.isPending ? "Updating…" : "Confirm"}
        </Button>
      </DialogFooter>
    </>
  );
}
