import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "More" };

type MenuLink = {
  href: string;
  label: string;
  description?: string;
  adminOnly?: boolean;
};

const links: MenuLink[] = [
  { href: "/admin/users", label: "User Management", description: "Manage roles and access", adminOnly: true },
  { href: "/admin/accounts", label: "Chart of Accounts", description: "View account codes and categories", adminOnly: true },
  { href: "/requisitions/templates", label: "My Templates", description: "Saved requisition templates" },
  { href: "/reports", label: "Reports & Exports", description: "CSV exports and summaries" },
];

export default async function MorePage() {
  const auth = await getCurrentUser();
  const isAdmin = auth?.profile.role.includes("admin") ?? false;

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || isAdmin,
  );

  return (
    <section className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold leading-snug text-foreground">
          More
        </h1>
      </header>
      <Card>
        <CardContent className="py-2">
          <ul className="divide-y divide-border">
            {visibleLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex h-16 items-center justify-between text-lg font-medium text-foreground hover:text-primary focus-visible:text-primary"
                >
                  <div>
                    <span>{link.label}</span>
                    {link.description && (
                      <p className="text-sm text-muted-foreground font-normal">{link.description}</p>
                    )}
                  </div>
                  <span className="text-muted-foreground">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <SignOutButton />
        </CardContent>
      </Card>
    </section>
  );
}
