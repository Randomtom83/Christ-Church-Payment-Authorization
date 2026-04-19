"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { updateUserRoles, toggleUserActive } from "@/lib/actions/admin";
import { ROLES, type Role } from "@/lib/constants";

type UserRoleEditorProps = {
  userId: string;
  userName: string;
  currentRoles: Role[];
  isActive: boolean;
  isSelf: boolean;
  onClose: () => void;
};

const ROLE_LABELS: Record<Role, string> = {
  submitter: "Submitter",
  treasurer: "Treasurer",
  signer: "Signer",
  counter: "Counter",
  admin: "Admin",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  submitter: "Can submit payment requisitions",
  treasurer: "Can prepare and process requisitions",
  signer: "Can approve or reject requisitions",
  counter: "Can enter Sunday deposit counts",
  admin: "Can manage users and system settings",
};

export function UserRoleEditor({
  userId,
  userName,
  currentRoles,
  isActive,
  isSelf,
  onClose,
}: UserRoleEditorProps) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(currentRoles);
  const [active, setActive] = useState(isActive);
  const [error, setError] = useState("");
  const [isSavingRoles, startSavingRoles] = useTransition();
  const [isTogglingActive, startTogglingActive] = useTransition();

  function handleRoleToggle(role: Role) {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role],
    );
  }

  function handleSaveRoles() {
    setError("");

    if (selectedRoles.length === 0) {
      setError("At least one role is required");
      return;
    }

    startSavingRoles(async () => {
      const result = await updateUserRoles(userId, selectedRoles);
      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  function handleToggleActive() {
    setError("");

    startTogglingActive(async () => {
      const result = await toggleUserActive(userId, !active);
      if (result.success) {
        setActive(!active);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update");
      }
    });
  }

  const rolesChanged =
    JSON.stringify([...selectedRoles].sort()) !==
    JSON.stringify([...currentRoles].sort());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Edit — {userName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-md bg-danger-100 px-4 py-3 text-base text-danger-700"
          >
            {error}
          </div>
        )}

        {/* Role checkboxes */}
        <fieldset className="space-y-3">
          <legend className="text-base font-medium text-foreground">
            Roles
          </legend>
          {ROLES.map((role) => (
            <label
              key={role}
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => handleRoleToggle(role)}
                disabled={isSavingRoles}
                className="mt-0.5 h-5 w-5 rounded border-input accent-primary"
              />
              <div className="space-y-0.5">
                <span className="text-base font-medium text-foreground">
                  {ROLE_LABELS[role]}
                </span>
                <p className="text-sm text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </label>
          ))}
        </fieldset>

        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleSaveRoles}
          disabled={isSavingRoles || !rolesChanged || selectedRoles.length === 0}
        >
          {isSavingRoles ? (
            <>
              <LoadingSpinner className="mr-2" label="Saving roles" />
              Saving...
            </>
          ) : (
            "Save Roles"
          )}
        </Button>

        {/* Active/Inactive toggle */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                Account Status
              </p>
              <Badge variant={active ? "default" : "destructive"}>
                {active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Button
              variant={active ? "destructive" : "default"}
              size="lg"
              className="h-12 text-base font-semibold"
              onClick={handleToggleActive}
              disabled={isTogglingActive || isSelf}
              title={isSelf ? "You cannot deactivate your own account" : undefined}
            >
              {isTogglingActive ? (
                <LoadingSpinner className="mr-2" label="Updating" />
              ) : null}
              {active ? "Deactivate" : "Activate"}
            </Button>
          </div>
          {isSelf && (
            <p className="mt-2 text-sm text-muted-foreground">
              You cannot deactivate your own account.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 text-base"
          onClick={onClose}
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}
