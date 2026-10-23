import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormFieldProps = Omit<ComponentProps<"input">, "placeholder"> & {
  id: string;
  label: string;
  hint?: string;
  trailing?: ReactNode;
};

function FormField({ id, label, hint, trailing, ...props }: FormFieldProps) {
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          {...props}
          id={id}
          placeholder=" "
          aria-describedby={hint ? hintId : undefined}
          className={cn("peer h-14 text-base", trailing && "pr-14")}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-0 left-2 -translate-y-1/2 bg-surface px-1 text-xs text-fg-muted transition-all duration-150 ease-ui peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-fg-subtle peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary"
        >
          {label}
        </label>
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export { FormField };
