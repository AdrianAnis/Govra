import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function AuthLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn("font-semibold text-primary underline underline-offset-4", className)}
      {...props}
    />
  );
}

export { AuthLink };
