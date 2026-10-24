import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AsideCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function AsideCard({ title, children, className }: AsideCardProps) {
  return (
    <section className={cn("flex flex-col gap-5 rounded-lg border bg-surface p-6", className)}>
      <h2 className="text-sm font-semibold text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

export { AsideCard };
