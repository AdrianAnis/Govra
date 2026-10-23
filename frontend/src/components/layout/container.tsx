import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-content px-4 sm:px-6 lg:px-10", className)}
      {...props}
    />
  );
}

export { Container };
