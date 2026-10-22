import { ClockAlert, Users } from "lucide-react";
import Link from "next/link";
import { IssueStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UrgencyEdge, UrgencyMarker } from "@/components/urgency-marker";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";
import type { components } from "@/types/api";

type IssueSummary = components["schemas"]["IssueSummary"];

interface IssueCardProps {
  issue: IssueSummary;
  now: Date;
}

function IssueCard({ issue, now }: IssueCardProps) {
  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-md border bg-surface p-4 pl-5 transition-colors duration-150 ease-ui hover:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
      <UrgencyEdge urgency={issue.urgency} />
      <div className="flex flex-wrap items-center gap-2">
        <IssueStatusBadge status={issue.status} />
        <UrgencyMarker urgency={issue.urgency} />
        {issue.response_overdue && (
          <Badge weight="perhatian">
            <ClockAlert aria-hidden />
            Terlambat Ditanggapi
          </Badge>
        )}
      </div>
      <h3 className="font-semibold">
        <Link
          href={`/isu/${issue.id}`}
          className="outline-none after:absolute after:inset-0"
        >
          {issue.title}
        </Link>
      </h3>
      <p className="text-sm text-fg-muted">
        {issue.opd.name} · {issue.category.name} · {issue.location.village.name},{" "}
        {issue.location.district.name}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle">
        <span className="inline-flex items-center gap-1.5">
          <Users aria-hidden className="size-4" />
          {formatNumber(issue.reporter_count)} pelapor
        </span>
        <span>
          Diperbarui {formatRelativeTime(issue.updated_at, now)} ·{" "}
          {formatDateTime(issue.updated_at)}
        </span>
      </p>
    </article>
  );
}

function IssueCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-surface p-4 pl-5">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export { IssueCard, IssueCardSkeleton };
