"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called once when every box is filled (typing, paste or autofill). */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  // Injected by `FormControl` (Radix Slot) so labels and errors stay wired up.
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

// One digit per box. Typing advances the focus, Backspace steps back, arrows
// move between boxes, and pasting (or an SMS/OS autofill, which lands in a
// single box) spreads the digits across the remaining boxes.
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  autoFocus,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  function focusAt(index: number) {
    const target = refs.current[Math.max(0, Math.min(index, length - 1))];
    target?.focus();
    target?.select();
  }

  function commit(next: string[], focusIndex: number) {
    const joined = next.join("");
    onChange(joined);
    focusAt(focusIndex);
    if (joined.length === length && next.every(Boolean)) onComplete?.(joined);
  }

  function handleChange(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    const next = [...digits];

    if (!typed) {
      next[index] = "";
      onChange(next.join("").slice(0, length));
      return;
    }

    const chars = typed.slice(0, length - index).split("");
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    commit(next, index + chars.length);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent) {
    switch (event.key) {
      case "Backspace":
        if (!digits[index] && index > 0) {
          event.preventDefault();
          const next = [...digits];
          next[index - 1] = "";
          onChange(next.join(""));
          focusAt(index - 1);
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusAt(index + 1);
        break;
    }
  }

  function handlePaste(index: number, event: React.ClipboardEvent) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = [...digits];
    const chars = pasted.slice(0, length - index).split("");
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    commit(next, index + chars.length);
  }

  return (
    <div role="group" className="flex justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-11 rounded-lg border border-input bg-transparent text-center text-lg font-semibold transition-colors outline-none sm:size-12 sm:text-xl",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            "dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
            digit && "border-primary/60"
          )}
        />
      ))}
    </div>
  );
}
