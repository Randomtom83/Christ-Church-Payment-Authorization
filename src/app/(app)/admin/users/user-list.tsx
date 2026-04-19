"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRoleEditor } from "./user-role-editor";
import type { Role } from "@/lib/constants";

type UserProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: Role[];
  is_active: boolean;
};

type UserListProps = {
  profiles: UserProfile[];
  currentUserId: string;
};

const ROLE_LABELS: Record<Role, string> = {
  submitter: "Submitter",
  treasurer: "Treasurer",
  signer: "Signer",
  counter: "Counter",
  admin: "Admin",
};

export function UserList({ profiles, currentUserId }: UserListProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  if (editingUserId) {
    const user = profiles.find((p) => p.id === editingUserId);
    if (user) {
      return (
        <UserRoleEditor
          userId={user.id}
          userName={user.full_name}
          currentRoles={user.role}
          isActive={user.is_active}
          isSelf={user.id === currentUserId}
          onClose={() => setEditingUserId(null)}
        />
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          All Users ({profiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <button
                type="button"
                className="flex w-full min-h-16 items-center justify-between gap-4 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 -mx-2"
                onClick={() => setEditingUserId(profile.id)}
                aria-label={`Edit ${profile.full_name}`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-foreground truncate">
                      {profile.full_name}
                    </p>
                    {!profile.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                    {profile.id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.phone ?? profile.email ?? "No contact"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  {profile.role.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {ROLE_LABELS[role]}
                    </Badge>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
