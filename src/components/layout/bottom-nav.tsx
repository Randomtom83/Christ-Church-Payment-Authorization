"use client";

/**
 * Mobile-first bottom tab bar for the authenticated app shell.
 *
 * Per CLAUDE.md "Accessibility → Touch Targets" each tab is at least 48px tall
 * and labels render at 14px (caption) above 24px icons — total tap area is
 * comfortably > 56px.
 *
 * Sprint 1: Role-aware — tabs are filtered based on the user's roles.
 * Dashboard and More are always visible. Requisitions hidden from counter-only
 * users. Deposits hidden from submitter-only users.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  FileTextIcon,
  BanknoteIcon,
  MoreHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match either an exact path or a path prefix (`/foo` matches `/foo/bar`). */
  matchPrefix?: string;
  /** If set, user must have at least one of these roles to see this tab. */
  visibleTo?: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  {
    href: "/requisitions",
    label: "Requisitions",
    icon: FileTextIcon,
    matchPrefix: "/requisitions",
    visibleTo: ["submitter", "treasurer", "signer", "admin"],
  },
  {
    href: "/deposits",
    label: "Deposits",
    icon: BanknoteIcon,
    matchPrefix: "/deposits",
    visibleTo: ["counter", "treasurer", "admin"],
  },
  { href: "/more", label: "More", icon: MoreHorizontalIcon },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return (
      pathname === item.matchPrefix ||
      pathname.startsWith(`${item.matchPrefix}/`)
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type BottomNavProps = {
  roles: Role[];
};

export function BottomNav({ roles }: BottomNavProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.visibleTo) return true;
    return item.visibleTo.some((role) => roles.includes(role));
  });

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul
        role="list"
        // Bottom safe-area padding on iOS so the home indicator does not
        // overlap the tap targets.
        className="mx-auto flex w-full max-w-3xl items-stretch justify-around pb-[env(safe-area-inset-bottom)]"
      >
        {visibleItems.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Touch target: full-width tab, 64px tall total.
                  "flex h-16 w-full flex-col items-center justify-center gap-1 px-2 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-6 w-6 shrink-0",
                    active ? "stroke-[2.25]" : "stroke-2",
                  )}
                />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
