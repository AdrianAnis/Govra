import { ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { RingDecor } from "@/components/bits/ring-decor";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { PROGRAM_STATUS, type ProgramStatus } from "@/lib/status";

function ProgramCard({ program }: { program: Schema<"ProgramSummary"> }) {
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-lg border bg-surface p-3 transition-all duration-200 ease-ui hover:-translate-y-1 hover:border-secondary hover:shadow-lg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
      <div className="relative flex flex-col gap-10 overflow-hidden rounded-md bg-secondary p-5 text-secondary-fg">
        <RingDecor />
        <div className="relative flex items-center justify-between gap-3 text-sm">
          <span className="rounded-sm border border-secondary-fg/30 px-2 py-0.5">{program.code}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <StatusIcon status={program.status} />
            {PROGRAM_STATUS[program.status].label}
          </span>
        </div>
        <p className="relative flex items-end gap-2">
          <span className="text-6xl leading-none font-bold tracking-tight tabular-nums">
            {formatPercent(program.progress_percent)}
          </span>
          <span className="pb-1 text-sm text-secondary-fg/70">progres</span>
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl leading-snug font-semibold">
            <Link href={`/proker/${program.code}`} className="outline-none after:absolute after:inset-0">
              {program.name}
            </Link>
          </h3>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            <Building2 aria-hidden className="size-4 shrink-0" />
            {program.opd.name}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin aria-hidden className="size-4 shrink-0" />
            {program.district.name}
          </p>
        </div>
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Lihat detail
          <ArrowRight aria-hidden className="size-4 transition-transform duration-200 ease-ui group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

function StatusIcon({ status }: { status: ProgramStatus }) {
  const Icon = PROGRAM_STATUS[status].icon;
  return <Icon aria-hidden className="size-4" />;
}

function ProgramCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-lg border bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export { ProgramCard, ProgramCardSkeleton };
