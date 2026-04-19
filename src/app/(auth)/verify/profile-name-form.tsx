"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { completeProfile } from "@/lib/actions/auth";

export function ProfileNameForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await completeProfile(name.trim());
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save name");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger-100 px-4 py-3 text-base text-danger-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="full-name" className="text-base font-medium">
          Your name (required)
        </Label>
        <Input
          id="full-name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Tom Reynolds"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          className="h-12 text-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        onClick={handleSubmit}
        disabled={isPending || !name.trim()}
      >
        {isPending ? (
          <>
            <LoadingSpinner className="mr-2" label="Saving" />
            Saving...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}
