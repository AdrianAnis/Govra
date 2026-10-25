import Link from "next/link";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { IssueStatusBadge } from "@/components/status-badge";
import { UrgencyMarker } from "@/components/urgency-marker";
import { slaInfo } from "@/lib/agency-format";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { agencyIssueHref } from "@/lib/routes";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface InboxListProps {
  issues: readonly Schema<"AgencyIssueSummary">[];
  now: Date;
}

const HEADERS = ["Isu", "Urgensi", "Status", "Pelapor", "Batas SLA", "Diperbarui"] as const;

function Urgency({ urgency }: { urgency: Schema<"Urgency"> }) {
  return urgency === "NORMAL" ? <span className="text-sm text-fg-muted">Normal</span> : <UrgencyMarker urgency={urgency} />;
}

function InboxList({ issues, now }: InboxListProps) {
  return (
    <>
      <div className="hidden md:block">
        <DataTable caption="Isu untuk OPD Anda" headers={HEADERS}>
          {issues.map((issue) => {
            const sla = slaInfo(issue.sla_due_at, now);
            return (
              <DataRow key={issue.id}>
                <RowHead>
                  <Link href={agencyIssueHref(issue.id)} className="flex flex-col gap-0.5 hover:text-primary">
                    <span>{issue.title}</span>
                    <span className="text-xs font-normal text-fg-muted">
                      {issue.location.village.name}, {issue.location.district.name}
                    </span>
                  </Link>
                </RowHead>
                <DataCell>
                  <Urgency urgency={issue.urgency} />
                </DataCell>
                <DataCell>
                  <IssueStatusBadge status={issue.status} />
                </DataCell>
                <DataCell className="tabular-nums">{formatNumber(issue.reporter_count)}</DataCell>
                <DataCell className={cn("text-sm", sla.overdue ? "font-semibold text-fg" : "text-fg-muted")}>{sla.text}</DataCell>
                <DataCell className="text-sm text-fg-muted">{formatRelativeTime(issue.updated_at, now)}</DataCell>
              </DataRow>
            );
          })}
        </DataTable>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border md:hidden">
        {issues.map((issue) => {
          const sla = slaInfo(issue.sla_due_at, now);
          return (
            <li key={issue.id}>
              <Link href={agencyIssueHref(issue.id)} className="flex flex-col gap-3 p-4 hover:bg-surface-muted">
                <span className="flex flex-wrap items-center gap-2">
                  <IssueStatusBadge status={issue.status} />
                  <Urgency urgency={issue.urgency} />
                </span>
                <span className="font-semibold">{issue.title}</span>
                <span className="text-sm text-fg-muted">
                  {issue.location.village.name} · {formatNumber(issue.reporter_count)} pelapor
                </span>
                <span className={cn("text-sm", sla.overdue ? "font-semibold text-fg" : "text-fg-muted")}>{sla.text}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export { InboxList };
