"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { CODE_LENGTH } from "@/lib/auth-flow";
import { FIELD_CLASS } from "@/lib/field-style";
import { cn } from "@/lib/utils";

interface OtpFieldProps {
  digits: readonly string[];
  invalid: boolean;
  disabled: boolean;
  onChange: (digits: string[]) => void;
}

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

function OtpField({ digits, invalid, disabled, onChange }: OtpFieldProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = (index: number) => {
    const target = refs.current[Math.min(Math.max(index, 0), CODE_LENGTH - 1)];
    target?.focus();
    target?.select();
  };

  const fill = (start: number, text: string) => {
    const next = [...digits];
    for (const [offset, char] of [...text].entries()) {
      if (start + offset < CODE_LENGTH) {
        next[start + offset] = char;
      }
    }
    onChange(next);
    focusAt(start + text.length);
  };

  const type = (index: number, raw: string) => {
    const text = raw.replace(/\D/g, "");
    if (!text) {
      const next = [...digits];
      next[index] = "";
      onChange(next);
      return;
    }
    fill(index, text);
  };

  const press = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index]) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next);
      focusAt(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fill(0, event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH));
  };

  return (
    <div role="group" aria-label={`Kode verifikasi ${CODE_LENGTH} digit`} className="flex justify-center gap-2 sm:gap-3">
      {SLOTS.map((index) => (
        <Input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={digits[index] ?? ""}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={index === 0}
          disabled={disabled}
          aria-label={`Digit ${index + 1} dari ${CODE_LENGTH}`}
          aria-invalid={invalid ? true : undefined}
          onChange={(event) => type(index, event.target.value)}
          onKeyDown={(event) => press(index, event)}
          onPaste={paste}
          onFocus={(event) => event.target.select()}
          className={cn(FIELD_CLASS, "h-14 w-11 px-0 text-center text-xl font-semibold sm:w-12 md:text-xl")}
        />
      ))}
    </div>
  );
}

export { OtpField };
