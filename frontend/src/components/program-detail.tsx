import { ArrowRight, Check, FileText } from "lucide-react";
import Link from "next/link";
import { AsideCard } from "@/components/aside-card";
import { RingDecor } from "@/components/bits/ring-decor";
import { Reveal } from "@/components/bits/reveal";
import { TextLink } from "@/components/text-link";
import { formatDate, formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { PROGRAM_STATUS } from "@/lib/status";
import { cn } from "@/lib/utils";

type Program = Schema<"ProgramDetail">;

function PanelTitle({ children }: { children: string }) {
  return <h2 className="text-2xl font-bold tracking-tight">{children}</h2>;
}

function ProgramHero({ program }: { program: Program }) {
  const status = PROGRAM_STATUS[program.status];
  const StatusIcon = status.icon;
  return (
    <section className="relative isolate overflow-hidden rounded-sheet bg-secondary p-8 text-secondary-fg sm:p-10 lg:p-14">
      <RingDecor size="lg" />
      <div className="relative grid gap-10 lg:grid-cols-3 lg:items-end">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-sm border border-secondary-fg/30 px-2 py-0.5">{program.code}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <StatusIcon aria-hidden className="size-4" />
              {status.label}
            </span>
          </div>
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance lg:text-6xl">
            {program.name}
          </h1>
          <p className="text-secondary-fg/80">
            <Link href={`/opd/${program.opd.slug}`} className="font-semibold text-secondary-fg underline-offset-4 hover:underline">
              {program.opd.name}
            </Link>{" "}
            · {program.district.name} · {program.goal.name}
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <p className="flex items-end gap-3">
            <span className="text-8xl leading-none font-bold tracking-tight tabular-nums">
              {formatPercent(program.progress_percent)}
            </span>
            <span className="pb-2 text-secondary-fg/70">progres</span>
          </p>
          <dl className="grid grid-cols-2 gap-4 border-t border-secondary-fg/20 pt-6 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-secondary-fg/70">Mulai</dt>
              <dd className="font-semibold">{formatDate(program.start_date)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-secondary-fg/70">Tenggat</dt>
              <dd className="font-semibold">{formatDate(program.end_date)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function MilestoneSection({ milestones }: { milestones: Program["milestones"] }) {
  const current = milestones.findIndex((milestone) => !milestone.done);
  return (
    <section className="flex flex-col gap-8">
      <PanelTitle>Tahapan</PanelTitle>
      <ol className="flex flex-col rounded-lg border bg-surface p-6 sm:p-8">
        {milestones.map((milestone, index) => (
          <li
            key={milestone.name}
            className="relative pb-8 pl-14 before:absolute before:top-10 before:left-5 before:h-full before:w-px before:bg-border-strong last:pb-0 last:before:hidden"
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-0 left-0 grid size-10 place-items-center rounded-full border text-sm font-semibold tabular-nums",
                milestone.done && "border-secondary bg-secondary text-secondary-fg",
                index === current && "border-2 border-primary text-primary",
                !milestone.done && index !== current && "bg-surface text-fg-subtle",
              )}
            >
              {milestone.done ? <Check className="size-5" /> : index + 1}
            </span>
            <div className="flex flex-col gap-1 pt-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <span className="text-lg leading-snug font-semibold">{milestone.name}</span>
              <span className="text-sm text-fg-muted tabular-nums sm:shrink-0">
                {milestone.done ? "Selesai" : "Target"} · {formatDate(milestone.due_date)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function UpdateSection({ updates }: { updates: Program["updates"] }) {
  return (
    <section className="flex flex-1 flex-col gap-8">
      <PanelTitle>Riwayat pembaruan</PanelTitle>
      {updates.length === 0 ? (
        <p className="flex-1 rounded-lg border bg-surface p-6 text-fg-muted">Belum ada pembaruan.</p>
      ) : (
        <ol className="flex flex-1 flex-col divide-y rounded-lg border bg-surface">
          {updates.map((update) => (
            <li key={update.date} className="grid gap-2 p-6 sm:grid-cols-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatPercent(update.progress_percent)}
                </span>
                <span className="text-sm text-fg-muted tabular-nums">{formatDate(update.date)}</span>
              </div>
              <p className="sm:col-span-3">{update.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function SummaryAside({ program }: { program: Program }) {
  const achievement = program.target === 0 ? 0 : (program.realization / program.target) * 100;
  const absorption = program.budget.ceiling === 0 ? 0 : (program.budget.realized / program.budget.ceiling) * 100;
  return (
    <aside className="flex flex-col gap-8">
      <PanelTitle>Ringkasan</PanelTitle>
      <div className="flex flex-1 flex-col gap-4">
        <Reveal variant="blur">
          <AsideCard title="Capaian">
            <p className="flex flex-col gap-1">
              <span className="text-4xl leading-none font-bold tracking-tight tabular-nums">
                {formatNumber(program.realization)}
                <span className="ml-2 text-base font-medium text-fg-muted">{program.unit}</span>
              </span>
              <span className="text-sm text-fg-muted tabular-nums">
                dari target {formatNumber(program.target)} · {formatPercent(achievement)}
              </span>
            </p>
            <p className="border-t pt-4 text-sm text-fg-muted">{program.indicator}</p>
          </AsideCard>
        </Reveal>
        <Reveal variant="blur" delay={100}>
          <AsideCard title="Anggaran">
            <p className="flex flex-col gap-1">
              <span className="text-3xl leading-none font-bold tracking-tight tabular-nums">
                {formatRupiah(program.budget.realized)}
              </span>
              <span className="text-sm text-fg-muted tabular-nums">
                dari pagu {formatRupiah(program.budget.ceiling)} · {formatPercent(absorption)}
              </span>
            </p>
          </AsideCard>
        </Reveal>
        <Reveal variant="blur" delay={200}>
          <Link
            href={`/isu?opd=${program.opd.slug}&district_id=${program.district.id}`}
            className="group flex items-center justify-between gap-4 rounded-lg bg-surface-muted p-6 transition-colors duration-200 ease-ui hover:bg-primary-soft"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-fg-muted">Isu warga terkait</span>
              <span className="text-lg font-semibold">
                {formatNumber(program.related_issue_count)} isu di {program.district.name}
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-5 shrink-0 text-primary transition-transform duration-200 ease-ui group-hover:translate-x-1"
            />
          </Link>
        </Reveal>
        <Reveal variant="blur" delay={300} className="flex flex-1 flex-col">
          <AsideCard title="Dokumentasi" className="flex-1">
            {program.documentation.length === 0 ? (
              <p className="text-fg-muted">Belum ada dokumentasi.</p>
            ) : (
              <ul className="flex flex-col">
                {program.documentation.map((item) => (
                  <li key={item.url}>
                    <TextLink href={item.url} target="_blank" rel="noopener noreferrer">
                      <FileText aria-hidden className="size-4" />
                      {item.caption}
                    </TextLink>
                  </li>
                ))}
              </ul>
            )}
          </AsideCard>
        </Reveal>
      </div>
    </aside>
  );
}

export { MilestoneSection, ProgramHero, SummaryAside, UpdateSection };
