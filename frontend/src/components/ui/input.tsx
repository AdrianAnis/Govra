import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border border-input bg-surface px-3 text-base text-foreground transition-colors duration-150 placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-secondary md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
