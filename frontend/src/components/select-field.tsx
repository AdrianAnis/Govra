"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FIELD_CLASS } from "@/lib/field-style";
import { cn } from "@/lib/utils";

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T | null;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string | undefined;
  disabled?: boolean;
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Pilih",
  error,
  disabled = false,
}: SelectFieldProps<T>) {
  const labelId = `${id}-label`;
  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-semibold">
        {label}
      </p>
      <Select
        value={value}
        items={options}
        disabled={disabled}
        onValueChange={(next) => {
          const match = options.find((option) => option.value === next);
          if (match) {
            onChange(match.value);
          }
        }}
      >
        <SelectTrigger aria-labelledby={labelId} aria-invalid={Boolean(error)} className={cn("h-12", FIELD_CLASS)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs font-medium">{error}</p>}
    </div>
  );
}

export { SelectField };
