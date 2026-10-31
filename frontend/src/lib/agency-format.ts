import { formatRelativeTime } from "@/lib/format";

interface SlaInfo {
  text: string;
  overdue: boolean;
}

export function slaInfo(due: string | null, now: Date): SlaInfo {
  if (!due) {
    return { text: "Sudah ditanggapi", overdue: false };
  }
  const overdue = Date.parse(due) < now.getTime();
  const when = formatRelativeTime(due, now);
  return { text: overdue ? `Lewat SLA, ${when}` : `Batas ${when}`, overdue };
}
