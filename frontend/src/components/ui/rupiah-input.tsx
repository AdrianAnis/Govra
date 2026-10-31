"use client";

import { useState, useRef, type ChangeEvent, type FocusEvent, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface RupiahInputProps
  extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  value: number;
  onChange: (val: number) => void;
  showPrefix?: boolean;
}

function formatDigitsWithDots(digits: string): string {
  if (!digits) return "";
  const clean = digits.replace(/^0+/, "");
  if (!clean) return "0";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function RupiahInput({
  value,
  onChange,
  showPrefix = true,
  className,
  disabled,
  placeholder = "0",
  ...props
}: RupiahInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formatted = value === 0 || Number.isNaN(value) ? "0" : formatDigitsWithDots(String(Math.round(value)));
  const displayValue = draft ?? formatted;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 15);

    if (!digitsOnly) {
      setDraft("");
      onChange(0);
      return;
    }

    const clean = digitsOnly.replace(/^0+/, "");
    if (!clean) {
      setDraft("0");
      onChange(0);
      return;
    }

    const numericValue = Number(clean);
    const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setDraft(formatted);
    onChange(numericValue);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (displayValue === "0" || e.currentTarget.value === "0") {
      e.currentTarget.select();
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (draft !== null) {
      const clean = draft.replace(/\D/g, "").replace(/^0+/, "");
      onChange(clean ? Number(clean) : 0);
    }
    setDraft(null);
    props.onBlur?.(e);
  };

  return (
    <div className="relative flex w-full items-center">
      {showPrefix && (
        <span className="pointer-events-none absolute left-3 select-none text-xs font-semibold text-fg-muted">
          Rp
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-md border bg-surface px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-primary",
          showPrefix && "pl-9",
          className,
        )}
        {...props}
      />
    </div>
  );
}
