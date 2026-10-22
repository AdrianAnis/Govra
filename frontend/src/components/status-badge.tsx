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
      <Icon aria-hidden />
      {label}
    </Badge>
  );
}

function ProgramStatusBadge({ status }: { status: ProgramStatus }) {
  return <StatusBadge {...PROGRAM_STATUS[status]} />;
}

function IssueStatusBadge({ status }: { status: IssueStatus }) {
  return <StatusBadge {...ISSUE_STATUS[status]} />;
}

export { IssueStatusBadge, ProgramStatusBadge, StatusBadge };
