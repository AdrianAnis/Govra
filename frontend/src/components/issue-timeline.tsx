import { IssueStatusBadge } from "@/components/status-badge";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import type { components } from "@/types/api";

type IssueEvent = components["schemas"]["IssueEvent"];

interface IssueTimelineProps {
  events: IssueEvent[];
  now: Date;
}

function IssueTimeline({ events, now }: IssueTimelineProps) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              aria-hidden
              className="mt-2 size-3 shrink-0 rounded-full bg-primary"
            />
            {index < events.length - 1 && (
              <span aria-hidden className="w-px flex-1 bg-border-strong" />
            )}
          </div>
          <div className="flex flex-col gap-1.5 pb-6">
            <IssueStatusBadge status={event.to_status} />
            <p className="text-sm text-fg-muted">
              {event.actor_label} ·{" "}
              <time dateTime={event.at}>
                {formatRelativeTime(event.at, now)} · {formatDateTime(event.at)}
              </time>
            </p>
            {event.note && <p>{event.note}</p>}
            {event.evidence.length > 0 && (
              <ul className="flex flex-wrap gap-x-4">
                {event.evidence.map((item, evidenceIndex) => (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Lihat bukti {evidenceIndex + 1}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export { IssueTimeline };
