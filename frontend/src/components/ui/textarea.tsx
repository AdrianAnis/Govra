import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-sm border border-input bg-surface px-3 py-2 text-base text-foreground transition-colors duration-150 placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-2 aria-invalid:border-secondary md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
