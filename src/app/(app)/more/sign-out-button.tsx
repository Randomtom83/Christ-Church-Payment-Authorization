"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full h-14 text-lg font-semibold text-destructive hover:text-destructive"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? (
        <LoadingSpinner className="mr-2" label="Signing out" />
      ) : (
        <LogOutIcon className="mr-2 h-5 w-5" aria-hidden="true" />
      )}
      {isPending ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
