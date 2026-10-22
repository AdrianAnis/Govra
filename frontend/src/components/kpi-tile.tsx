import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiTileProps {
  label: string;
  value: string;
  delta?: string;
  href?: string;
}

function KpiTile({ label, value, delta, href }: KpiTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-surface p-5">
      <p className="text-sm font-medium text-fg-muted">{label}</p>
      <p className="text-4xl font-bold tracking-tight tabular-nums">{value}</p>
      {delta && <p className="text-sm text-fg-muted">{delta}</p>}
      {href && (
        <Link
          href={href}
          className="mt-1 inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Lihat data
        </Link>
      )}
    </div>
  );
}

function KpiTileSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-surface p-5">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export { KpiTile, KpiTileSkeleton };
