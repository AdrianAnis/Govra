import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { Container } from "@/components/layout/container";
import { OpdTrendTable } from "@/components/opd/opd-trend-table";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { ProgramCard } from "@/components/program-card";
import { EmptyState } from "@/components/state-message";
import { StatCard, StatGrid } from "@/components/stat-card";
import { TextLink } from "@/components/text-link";
import { getOpdAnalytics, type OpdIndicator } from "@/lib/data/opd-analytics";
import { listPrograms } from "@/lib/data/programs";
import { formatIndicator, formatNumber } from "@/lib/format";

const PROGRAM_PREVIEW = 6;
const INDICATOR_HEADERS = ["Indikator", "Nilai", "Jumlah data"] as const;

function indicatorValue(indicators: readonly OpdIndicator[], code: string): OpdIndicator | undefined {
  return indicators.find((indicator) => indicator.code === code);
}

function statValue(indicator: OpdIndicator | undefined): string {
  return indicator && indicator.value !== null ? formatIndicator(indicator.value, indicator.unit) : "–";
}

function statHint(indicator: OpdIndicator | undefined, unit: string): string {
  return indicator && indicator.sample_size > 0
    ? `Dari ${formatNumber(indicator.sample_size)} ${unit}`
    : "Belum ada data";
}

export async function generateMetadata({ params }: PageProps<"/opd/[slug]">): Promise<Metadata> {
  const analytics = await getOpdAnalytics((await params).slug);
  return { title: analytics ? analytics.opd.name : "OPD tidak ditemukan" };
}

export default async function OpdPage({ params }: PageProps<"/opd/[slug]">) {
  const { slug } = await params;
  const analytics = await getOpdAnalytics(slug);
  if (!analytics) {
    notFound();
  }
  const programs = await listPrograms({ opd: slug, limit: PROGRAM_PREVIEW });
  const { opd, indicators } = analytics;
  const response = indicatorValue(indicators, "RESPONSIVITAS");
  const resolution = indicatorValue(indicators, "PENYELESAIAN_ISU");
  const completion = indicatorValue(indicators, "KETUNTASAN_PROKER");
  const schedule = indicatorValue(indicators, "KETEPATAN_JADWAL");
  const description =
    analytics.categories.length > 0
      ? `Kategori laporan: ${analytics.categories.join(", ")}.`
      : "Kinerja dinas dihitung dari laporan warga dan progres program kerja.";

  return (
    <Container className="flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-6">
        <Link
          href="/rapor"
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Rapor periode
        </Link>
        <PageHeader title={opd.name} description={description} />
      </div>
      <StatGrid>
        <StatCard label="Rata-rata waktu respons" value={statValue(response)} hint={statHint(response, "laporan")} />
        <StatCard label="Penyelesaian laporan" value={statValue(resolution)} hint={statHint(resolution, "laporan")} />
        <StatCard label="Ketuntasan proker" value={statValue(completion)} hint={statHint(completion, "proker")} />
        <StatCard label="Ketepatan jadwal" value={statValue(schedule)} hint={statHint(schedule, "proker")} />
      </StatGrid>
      <PageSection title="Tren Bulanan">
        <OpdTrendTable opdName={opd.name} months={analytics.monthly} />
      </PageSection>
      <PageSection title="Indikator Rapor">
        <DataTable caption={`Indikator rapor ${opd.name}`} headers={INDICATOR_HEADERS}>
          {indicators.map((indicator) => (
            <DataRow key={indicator.code}>
              <RowHead>{indicator.label}</RowHead>
              <DataCell className="text-lg font-semibold tabular-nums">
                {indicator.value === null ? (
                  <span className="text-sm font-normal text-fg-subtle">Belum tersedia</span>
                ) : (
                  formatIndicator(indicator.value, indicator.unit)
                )}
              </DataCell>
              <DataCell className="text-sm text-fg-muted tabular-nums">{formatNumber(indicator.sample_size)} data</DataCell>
            </DataRow>
          ))}
        </DataTable>
      </PageSection>
      <PageSection title="Program kerja" action={<TextLink href={`/proker?opd=${slug}`}>Lihat semua proker</TextLink>}>
        {programs.items.length === 0 ? (
          <EmptyState title="Belum ada proker" description="OPD ini belum memiliki program kerja tercatat." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.items.map((program) => (
              <li key={program.code}>
                <ProgramCard program={program} />
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </Container>
  );
}
