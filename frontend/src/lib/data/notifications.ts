import { currentTime } from "@/lib/clock";
import { formatRelativeTime } from "@/lib/format";
import { allReports } from "@/lib/mock/reports";
import { ISSUE_STATUS } from "@/lib/status";

export interface Notification {
  id: string;
  code: string;
  text: string;
  when: string;
  unread: boolean;
}

const MAX_NOTIFICATIONS = 5;
const UNREAD_COUNT = 2;

export async function listNotifications(): Promise<Notification[]> {
  const now = currentTime();
  return allReports(now)
    .flatMap((report) => {
      const last = report.timeline[report.timeline.length - 1];
      return last ? [{ report, last }] : [];
    })
    .sort((a, b) => Date.parse(b.last.at) - Date.parse(a.last.at))
    .slice(0, MAX_NOTIFICATIONS)
    .map(({ report, last }, index) => ({
      id: `${report.code}-${last.id}`,
      code: report.code,
      text: `Laporan ${report.code} kini berstatus ${ISSUE_STATUS[last.to_status].label}.`,
      when: formatRelativeTime(last.at, now),
      unread: index < UNREAD_COUNT,
    }));
}
