import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { ProgramCard } from "@/components/program-card";
import { EmptyState } from "@/components/state-message";
import { TextLink } from "@/components/text-link";
import { listPrograms } from "@/lib/data/programs";
import { getOpd } from "@/lib/data/reference";
import { formatIndicator, formatNumber } from "@/lib/format";
import { indicatorSlug } from "@/lib/indicators";

const PROGRAM_PREVIEW = 6;
const INDICATOR_HEADERS = ["Indikator", "Nilai", "Jumlah data", "Rincian"] as const;

export async function generateMetadata({ params }: PageProps<"/opd/[slug]">): Promise<Metadata> {
  const opd = await getOpd((await params).slug);
  return { title: opd ? opd.name : "OPD tidak ditemukan" };
}

export default async function OpdPage({ params }: PageProps<"/opd/[slug]">) {
  const { slug } = await params;
  const opd = await getOpd(slug);
  if (!opd) {
    notFound();
  }
  const programs = await listPrograms({ opd: slug, limit: PROGRAM_PREVIEW });

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
        <PageHeader
          title={opd.name}
          description={`Kategori laporan: ${opd.categories.map((category) => category.name).join(", ")}.`}
        />
      </div>
      <PageSection title="Kinerja">
        <DataTable caption={`Indikator rapor ${opd.name}`} headers={INDICATOR_HEADERS}>
          {opd.indicators.map((indicator) => (
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
              <DataCell>
                <TextLink href={`/rapor/${indicatorSlug(indicator.code)}?opd=${slug}`}>Lihat data</TextLink>
              </DataCell>
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
