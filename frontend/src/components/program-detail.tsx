import { Circle, CircleCheck, FileText } from "lucide-react";
import { DetailSection, Stat } from "@/components/detail-section";
import { TextLink } from "@/components/text-link";
import { formatDate, formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Program = Schema<"ProgramDetail">;

function ProgressSection({ program }: { program: Program }) {
  return (
    <DetailSection title="Progres">
      <p className="text-5xl font-bold tracking-tight tabular-nums">
        {formatPercent(program.progress_percent)}
      </p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Stat label="Mulai" value={formatDate(program.start_date)} />
        <Stat label="Tenggat" value={formatDate(program.end_date)} />
      </dl>
    </DetailSection>
  );
}

function MilestoneSection({ milestones }: { milestones: Program["milestones"] }) {
  return (
    <DetailSection title="Tahapan">
      <ol className="flex flex-col gap-3">
        {milestones.map((milestone) => {
          const Icon = milestone.done ? CircleCheck : Circle;
          return (
            <li key={milestone.name} className="flex items-start gap-3">
              <Icon
                aria-hidden
                className={cn("mt-0.5 size-5 shrink-0", milestone.done ? "text-primary" : "text-fg-subtle")}
              />
              <div className="flex flex-col">
                <span className="font-medium">{milestone.name}</span>
                <span className="text-sm text-fg-muted">
                  {milestone.done ? "Selesai" : "Target"} · {formatDate(milestone.due_date)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </DetailSection>
  );
}

function UpdateSection({ updates }: { updates: Program["updates"] }) {
  return (
    <DetailSection title="Riwayat pembaruan">
      {updates.length === 0 ? (
        <p className="text-fg-muted">Belum ada pembaruan.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {updates.map((update) => (
            <li key={update.date} className="flex flex-col gap-0.5">
              <span className="text-sm text-fg-muted tabular-nums">
                {formatDate(update.date)} · progres {formatPercent(update.progress_percent)}
              </span>
              <span>{update.note}</span>
            </li>
          ))}
        </ol>
      )}
    </DetailSection>
  );
}

function SummaryAside({ program }: { program: Program }) {
  const achievement = program.target === 0 ? 0 : (program.realization / program.target) * 100;
  const absorption = program.budget.ceiling === 0 ? 0 : (program.budget.realized / program.budget.ceiling) * 100;
  return (
    <aside className="flex flex-col gap-6">
      <DetailSection title="Capaian">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Stat label="Indikator" value={program.indicator} />
          <Stat label="Target" value={`${formatNumber(program.target)} ${program.unit}`} />
          <Stat
            label="Realisasi"
            value={`${formatNumber(program.realization)} ${program.unit} (${formatPercent(achievement)})`}
          />
        </dl>
      </DetailSection>
      <DetailSection title="Anggaran">
        <dl className="grid gap-4">
          <Stat label="Pagu" value={formatRupiah(program.budget.ceiling)} />
          <Stat label="Realisasi" value={`${formatRupiah(program.budget.realized)} (${formatPercent(absorption)})`} />
        </dl>
      </DetailSection>
      <DetailSection title="Isu warga terkait">
        <TextLink href={`/isu?opd=${program.opd.slug}&district_id=${program.district.id}`}>
          {formatNumber(program.related_issue_count)} isu di {program.district.name}
        </TextLink>
      </DetailSection>
      <DetailSection title="Dokumentasi">
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
      </DetailSection>
    </aside>
  );
}

export { MilestoneSection, ProgressSection, SummaryAside, UpdateSection };
