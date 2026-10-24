import { MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RingDecor } from "@/components/bits/ring-decor";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { ISSUE_STATUS } from "@/lib/status";

export const URGENCY_LABEL: Partial<Record<Schema<"Urgency">, string>> = {
  URGENT: "Urgent",
  TINGGI: "Prioritas Tinggi",
};

interface IssuePhotoCardProps {
  issue: Schema<"IssueSummary">;
  now: Date;
  eager?: boolean;
}

function IssuePhotoCard({ issue, now, eager = false }: IssuePhotoCardProps) {
  const { label, icon: StatusIcon } = ISSUE_STATUS[issue.status];
  const urgency = URGENCY_LABEL[issue.urgency];
  return (
    <article className="group relative isolate flex aspect-4/5 flex-col justify-between overflow-hidden rounded-lg bg-secondary p-6 text-secondary-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
      {issue.cover_photo ? (
        <Image
          src={issue.cover_photo.url}
          alt=""
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 80vw"
          className="-z-20 object-cover transition-transform duration-500 ease-ui group-hover:scale-105"
        />
      ) : (
        <RingDecor />
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-secondary via-secondary/40 to-transparent" />
      <div className="flex items-start justify-between gap-3 text-sm">
        <span className="rounded-sm bg-surface px-2 py-1 font-semibold text-fg">
          {formatRelativeTime(issue.updated_at, now)}
        </span>
        {urgency && <span className="rounded-sm border border-secondary-fg/60 bg-secondary/60 px-2 py-1 font-semibold">{urgency}</span>}
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl leading-snug font-semibold">
          <Link href={`/isu/${issue.id}`} className="outline-none after:absolute after:inset-0">
            {issue.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-secondary-fg/80">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {issue.location.village.name}, {issue.location.district.name}
        </p>
        <p className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <StatusIcon aria-hidden className="size-4" />
            {label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-secondary-fg/80">
            <Users aria-hidden className="size-4" />
            {formatNumber(issue.reporter_count)} pelapor
          </span>
        </p>
      </div>
    </article>
  );
}

export { IssuePhotoCard };
