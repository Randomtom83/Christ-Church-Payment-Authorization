/**
 * Sticky top header for the authenticated app shell.
 * Shows the brand mark and the current user's initials.
 */
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

type AppHeaderProps = {
  userName?: string;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function AppHeader({ userName }: AppHeaderProps) {
  const initials = userName ? getInitials(userName) : "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            ✝
          </span>
          <span>{APP_NAME}</span>
        </Link>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700"
          title={userName ?? "User"}
          aria-label={userName ? `Signed in as ${userName}` : "User"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
