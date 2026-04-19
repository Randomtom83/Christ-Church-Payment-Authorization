import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Admin route gate. Server component that checks the current user has
 * the "admin" role before rendering any /admin/* page. Non-admins are
 * redirected to /dashboard.
 *
 * This is the primary role-based route protection layer. RLS on the
 * database is the secondary layer.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCurrentUser();

  if (!auth || !auth.profile.role.includes("admin")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
