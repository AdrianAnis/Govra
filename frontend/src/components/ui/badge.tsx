import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      weight: {
        netral: "border border-border-strong text-fg-muted",
        berjalan: "bg-primary-soft text-primary-hover",
        perhatian: "border-2 border-secondary text-secondary",
        serius: "bg-secondary text-secondary-fg",
        selesai: "bg-accent text-accent-fg",
      },
    },
    defaultVariants: { weight: "netral" },
  },
);

type BadgeWeight = NonNullable<VariantProps<typeof badgeVariants>["weight"]>;

function Badge({
  className,
  weight,
  ...props
}: ComponentProps<"span"> & { weight: BadgeWeight }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ weight }), className)}
      {...props}
    />
  );
}

export { Badge };
