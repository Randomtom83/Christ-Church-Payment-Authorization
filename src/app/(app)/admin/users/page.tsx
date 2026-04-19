import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAllProfiles } from "@/lib/db/profiles";
import { UserList } from "./user-list";

export const metadata: Metadata = { title: "User Management" };

export default async function AdminUsersPage() {
  const auth = await getCurrentUser();
  const profiles = await getAllProfiles();

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold leading-snug text-foreground">
          User Management
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Manage roles and access for all ChurchOps users.
        </p>
      </header>
      <UserList profiles={profiles} currentUserId={auth!.user.id} />
    </section>
  );
}
