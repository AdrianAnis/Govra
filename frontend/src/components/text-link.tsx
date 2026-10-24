import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline",
        className,
      )}
      {...props}
    />
  );
}

export { TextLink };
