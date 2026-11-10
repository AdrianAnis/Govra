import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
}

function StatCard({ label, value, hint, href }: StatCardProps) {
  const body = (
    <>
      <span className="text-sm font-semibold text-fg-muted">{label}</span>
      <span
        className={cn(
          "leading-none font-bold tracking-tight tabular-nums break-words",
          typeof value === "string" && value.length > 8 ? "text-2xl" : "text-4xl",
        )}
      >
        {value}
      </span>
      {hint && <span className="text-sm text-fg-muted break-words">{hint}</span>}
    </>
  );
  const shape = "flex h-full min-h-36 min-w-0 flex-col gap-3 overflow-hidden rounded-lg border bg-surface p-6";

  return href ? (
    <Link href={href} className={cn(shape, "transition-colors duration-200 ease-ui hover:bg-surface-muted")}>
      {body}
    </Link>
  ) : (
    <div className={shape}>{body}</div>
  );
}

const COLUMNS = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

function StatGrid({ columns = 4, children }: { columns?: keyof typeof COLUMNS; children: ReactNode }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", COLUMNS[columns])}>{children}</div>;
}

export { StatCard, StatGrid };
