import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, profileNeedsName } from "@/lib/auth";
import { ProfileNameForm } from "./profile-name-form";

export const metadata: Metadata = { title: "Complete your profile" };

/**
 * Profile completion page — shown once after first login when the user's
 * name is auto-generated from their phone number by the handle_new_user
 * trigger. Once they enter a real name, they won't see this again.
 */
export default async function VerifyPage() {
  const auth = await getCurrentUser();

  // Not logged in → send to login
  if (!auth) {
    redirect("/login");
  }

  // Profile already has a real name → skip to dashboard
  if (!profileNeedsName(auth.profile)) {
    redirect("/dashboard");
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Welcome to ChurchOps</CardTitle>
        <p className="text-base text-muted-foreground leading-relaxed">
          What should we call you?
        </p>
      </CardHeader>
      <CardContent>
        <ProfileNameForm />
      </CardContent>
    </Card>
  );
}
