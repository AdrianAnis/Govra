import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { ISSUE_STATUS } from "@/lib/status";
import type { components } from "@/types/api";
import { cn } from "@/lib/utils";

type IssueEvent = components["schemas"]["IssueEvent"];

interface IssueTimelineProps {
  events: IssueEvent[];
  now: Date;
}

function IssueTimeline({ events, now }: IssueTimelineProps) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => {
        const { label, icon: StatusIcon } = ISSUE_STATUS[event.to_status];
        const current = index === events.length - 1;
        return (
          <li
            key={event.id}
            className="relative pb-10 pl-16 before:absolute before:top-12 before:left-6 before:h-full before:w-px before:bg-border-strong last:pb-0 last:before:hidden"
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 left-0 grid size-12 place-items-center rounded-full border",
                current ? "border-2 border-primary bg-surface text-primary" : "border-secondary bg-secondary text-secondary-fg",
              )}
            >
              <StatusIcon className="size-5" />
            </span>
            <div className="flex flex-col gap-4 rounded-lg border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl leading-snug font-semibold">{label}</h3>
                {event.note && <p className="max-w-prose">{event.note}</p>}
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
              <div className="flex shrink-0 flex-col gap-0.5 text-sm text-fg-muted sm:items-end sm:text-right">
                <time dateTime={event.at} className="flex flex-col sm:items-end">
                  <span className="font-semibold text-fg">{formatRelativeTime(event.at, now)}</span>
                  <span>{formatDateTime(event.at)}</span>
                </time>
                <span>{event.actor_label}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { IssueTimeline };
