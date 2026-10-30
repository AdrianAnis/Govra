"use client";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FocusEvent,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";

export interface RupiahInputProps
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
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === 0 || Number.isNaN(value)) return "0";
    return formatDigitsWithDots(String(Math.round(value)));
  });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      if (value === 0 || Number.isNaN(value)) {
        setDisplayValue("0");
      } else {
        setDisplayValue(formatDigitsWithDots(String(Math.round(value))));
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digitsOnly = rawVal.replace(/\D/g, "").slice(0, 15);

    if (!digitsOnly) {
      setDisplayValue("");
      onChange(0);
      return;
    }

    const clean = digitsOnly.replace(/^0+/, "");
    if (!clean) {
      setDisplayValue("0");
      onChange(0);
      return;
    }

    const numericValue = Number(clean);
    const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setDisplayValue(formatted);
    onChange(numericValue);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (displayValue === "0" || e.currentTarget.value === "0") {
      e.currentTarget.select();
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (!displayValue || displayValue === "") {
      setDisplayValue("0");
      onChange(0);
    } else {
      const clean = displayValue.replace(/\D/g, "").replace(/^0+/, "");
      if (!clean) {
        setDisplayValue("0");
        onChange(0);
      } else {
        setDisplayValue(formatDigitsWithDots(clean));
        onChange(Number(clean));
      }
    }
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
