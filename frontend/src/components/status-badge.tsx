import { Badge } from "@/components/ui/badge";
import {
  ISSUE_STATUS,
  PROGRAM_STATUS,
  type IssueStatus,
  type ProgramStatus,
  type StatusMeta,
} from "@/lib/status";

function StatusBadge({ label, weight, icon: Icon }: StatusMeta) {
  return (
    <Badge weight={weight}>
      {Icon && <Icon aria-hidden />}
      {label}
    </Badge>
  );
}

function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  const meta = PROGRAM_STATUS[status] ?? PROGRAM_STATUS.SESUAI_JADWAL;
  return <StatusBadge {...meta} />;
}

function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const meta = ISSUE_STATUS[status] ?? ISSUE_STATUS.DIAJUKAN;
  return <StatusBadge {...meta} />;
}

export { IssueStatusBadge, ProgramStatusBadge };
