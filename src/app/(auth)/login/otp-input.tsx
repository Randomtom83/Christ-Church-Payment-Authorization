"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

const DIGIT_COUNT = 6;

/**
 * Six individual digit boxes for OTP entry.
 * Auto-advances focus. Supports paste of full code.
 * Each box is 48px+ (CLAUDE.md touch target minimum).
 */
export function OtpInput({ value, onChange, disabled, error }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: DIGIT_COUNT }, (_, i) => value[i] ?? "");

  function focusInput(index: number) {
    const clamped = Math.max(0, Math.min(index, DIGIT_COUNT - 1));
    inputRefs.current[clamped]?.focus();
  }

  function handleChange(index: number, inputValue: string) {
    const digit = inputValue.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(""));

    if (digit && index < DIGIT_COUNT - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        focusInput(index - 1);
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < DIGIT_COUNT - 1) {
      focusInput(index + 1);
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, DIGIT_COUNT - 1));
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${DIGIT_COUNT}`}
          className={cn(
            "h-14 w-12 rounded-md border text-center text-xl font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:opacity-50",
            error
              ? "border-destructive text-destructive"
              : "border-input text-foreground",
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
