import { MapPin } from "lucide-react";
import Image from "next/image";
import { RingDecor } from "@/components/bits/ring-decor";
import { URGENCY_LABEL } from "@/components/issue-photo-card";
import { formatDateTime } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { ISSUE_STATUS } from "@/lib/status";

function IssueHero({ issue }: { issue: Schema<"IssueDetail"> }) {
  const { label, icon: StatusIcon } = ISSUE_STATUS[issue.status];
  const urgency = URGENCY_LABEL[issue.urgency];
  return (
    <section className="relative isolate flex flex-col justify-end overflow-hidden rounded-sheet bg-secondary p-8 pt-56 text-secondary-fg sm:p-10 sm:pt-64 lg:p-14 lg:pt-80">
      {issue.cover_photo ? (
        <Image
          src={issue.cover_photo.url}
          alt=""
          fill
          priority
          sizes="(min-width: 1440px) 1440px, 100vw"
          className="-z-20 object-cover"
        />
      ) : (
        <RingDecor />
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-secondary via-secondary/60 to-secondary/10" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-surface px-2.5 py-1 text-fg">
            <StatusIcon aria-hidden className="size-4" />
            {label}
          </span>
          {urgency && (
            <span className="rounded-sm border border-secondary-fg/60 bg-secondary/60 px-2.5 py-1">{urgency}</span>
          )}
        </div>
        <h1 className="max-w-4xl text-4xl leading-tight font-bold tracking-tight text-balance lg:text-6xl">
          {issue.title}
        </h1>
        <p className="flex flex-wrap items-center gap-x-6 gap-y-1 text-secondary-fg/80">
          <span className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            {issue.location.village.name}, {issue.location.district.name}
          </span>
          <span>Dilaporkan {formatDateTime(issue.created_at)}</span>
        </p>
      </div>
    </section>
  );
}

export { IssueHero };
