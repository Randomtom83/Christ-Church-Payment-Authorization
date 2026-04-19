"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { OtpInput } from "./otp-input";
import { createClient } from "@/lib/supabase/client";
import { phoneSchema, toE164, formatPhone } from "@/lib/validators/auth";
import { otpSchema } from "@/lib/validators/auth";

type Step = "phone" | "otp";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/dashboard";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendCode = useCallback(async () => {
    setError("");

    // Client-side validation first
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setNormalizedPhone(parsed.data);
    setIsSending(true);

    try {
      const supabase = createClient();
      const e164 = toE164(parsed.data);
      const { error: authError } = await supabase.auth.signInWithOtp({ phone: e164 });

      if (authError) {
        console.error("[sendOtp]", authError.message);
        if (authError.message.includes("rate")) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else {
          setError(`Failed to send verification code: ${authError.message}`);
        }
      } else {
        setStep("otp");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [phone]);

  const handleVerifyCode = useCallback(async () => {
    setError("");

    const tokenParsed = otpSchema.safeParse(otp);
    if (!tokenParsed.success) {
      setError("Enter the 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      const supabase = createClient();
      const e164 = toE164(normalizedPhone);
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: e164,
        token: tokenParsed.data,
        type: "sms",
      });

      if (authError) {
        console.error("[verifyOtp]", authError.message);
        if (authError.message.includes("expired")) {
          setError("Code expired. Please request a new code.");
        } else {
          setError("Invalid code. Please check and try again.");
        }
      } else {
        router.push(nextUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [otp, normalizedPhone, nextUrl, router]);

  function handleBackToPhone() {
    setStep("phone");
    setOtp("");
    setError("");
  }

  return (
    <div className="space-y-6">
      {/* Placeholder for future Google SSO button */}
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Google sign-in coming soon
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">
              or sign in with phone
            </span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="rounded-md bg-danger-100 px-4 py-3 text-base text-danger-700"
        >
          {error}
        </div>
      )}

      {step === "phone" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-medium">
              Phone number (required)
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(201) 555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSending}
              className="h-12 text-lg"
              aria-describedby={error ? "phone-error" : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendCode();
                }
              }}
            />
          </div>

          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={handleSendCode}
            disabled={isSending || !phone.trim()}
          >
            {isSending ? (
              <>
                <LoadingSpinner className="mr-2" label="Sending code" />
                Sending...
              </>
            ) : (
              "Send Code"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-base text-foreground">
              Code sent to{" "}
              <span className="font-semibold">
                {formatPhone(normalizedPhone)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your text message
            </p>
          </div>

          <OtpInput
            value={otp}
            onChange={setOtp}
            disabled={isVerifying}
            error={!!error}
          />

          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            onClick={handleVerifyCode}
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? (
              <>
                <LoadingSpinner className="mr-2" label="Verifying code" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToPhone}
              disabled={isVerifying}
              className="text-base text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Use a different number
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || isVerifying}
              className="text-base text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
