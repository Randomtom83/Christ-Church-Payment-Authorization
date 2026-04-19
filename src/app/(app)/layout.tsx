/**
 * Authenticated app shell.
 *
 * Wraps every route inside the (app) route group with a sticky top header
 * and a bottom tab bar. Auth gating is handled by `src/proxy.ts` —
 * unauthenticated visitors get redirected to /login before reaching this
 * layout.
 *
 * Sprint 1: Now fetches the current user's profile to:
 * - Pass roles to BottomNav for role-based tab filtering
 * - Pass user name to AppHeader
 * - Redirect to /verify if profile needs a name
 */
import { redirect } from "next/navigation";
import { getCurrentUser, profileNeedsName } from "@/lib/auth";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCurrentUser();

  // If somehow unauthenticated (proxy should catch this), redirect.
  if (!auth) {
    redirect("/login");
  }

  // First-time user without a real name → profile completion
  if (profileNeedsName(auth.profile)) {
    redirect("/verify");
  }

  const { profile } = auth;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppHeader userName={profile.full_name} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-6"
      >
        {children}
      </main>
      <BottomNav roles={profile.role} />
    </div>
  );
}
