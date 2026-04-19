import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "More" };

type MenuLink = {
  href: string;
  label: string;
  note?: string;
  adminOnly?: boolean;
};

const links: MenuLink[] = [
  { href: "/admin/users", label: "User management", adminOnly: true },
  { href: "/admin/accounts", label: "Chart of accounts", note: "Sprint 2", adminOnly: true },
  { href: "/reports", label: "Reports & exports", note: "Sprint 7" },
  { href: "/requisitions/templates", label: "Requisition templates", note: "Sprint 2" },
];

export default async function MorePage() {
  const auth = await getCurrentUser();
  const isAdmin = auth?.profile.role.includes("admin") ?? false;

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || isAdmin,
  );

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold leading-snug text-foreground">
          More
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Settings, admin tools, and reports.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {visibleLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex h-14 items-center justify-between text-base font-medium text-foreground hover:text-primary focus-visible:text-primary"
                >
                  <span>{link.label}</span>
                  {link.note && (
                    <span className="text-sm text-muted-foreground">
                      {link.note}
                    </span>
                  )}
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
