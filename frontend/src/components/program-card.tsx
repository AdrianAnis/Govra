import Link from "next/link";
import { ProgressTrack } from "@/components/progress-track";
import { ProgramStatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { components } from "@/types/api";

type ProgramSummary = components["schemas"]["ProgramSummary"];

function ProgramCard({ program }: { program: ProgramSummary }) {
  return (
    <article className="relative flex flex-col gap-3 rounded-md border bg-surface p-4 transition-colors duration-150 ease-ui hover:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm text-fg-subtle">
            {program.code} · {program.opd.name}
          </p>
          <h3 className="font-semibold">
            <Link
              href={`/proker/${program.code}`}
              className="outline-none after:absolute after:inset-0"
            >
              {program.name}
            </Link>
          </h3>
        </div>
        <ProgramStatusBadge status={program.status} />
      </div>
      <ProgressTrack
        progress={program.progress_percent}
        expected={program.expected_percent}
      />
      <p className="text-sm text-fg-muted">
        {program.district.name} · {formatNumber(program.related_issue_count)} isu
        terkait
      </p>
    </article>
  );
}

function ProgramCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-7 w-28" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export { ProgramCard, ProgramCardSkeleton };
