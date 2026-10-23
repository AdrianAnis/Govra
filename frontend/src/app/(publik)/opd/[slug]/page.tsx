import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndicatorTiles } from "@/components/indicator-tiles";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { ProgramCard } from "@/components/program-card";
import { EmptyState } from "@/components/state-message";
import { IssueStatusBadge } from "@/components/status-badge";
import { TextLink } from "@/components/text-link";
import { listPrograms } from "@/lib/data/programs";
import { getOpd } from "@/lib/data/reference";
import { formatNumber } from "@/lib/format";

const PROGRAM_PREVIEW = 6;

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
    <>
      <Container className="flex flex-col gap-10 py-10">
        <PageHeader
          title={opd.name}
          description={`Kategori laporan: ${opd.categories.map((category) => category.name).join(", ")}.`}
        />
        <PageSection title="Kinerja">
          <IndicatorTiles indicators={opd.indicators} opd={slug} />
        </PageSection>
        <PageSection
          title="Isu warga"
          action={<TextLink href={`/isu?opd=${slug}`}>Lihat semua isu</TextLink>}
        >
          {opd.issue_stats.length === 0 ? (
            <EmptyState title="Belum ada isu" description="Belum ada laporan warga untuk OPD ini." />
          ) : (
            <ul className="flex flex-wrap gap-3">
              {opd.issue_stats.map((stat) => (
                <li key={stat.status} className="flex items-center gap-2">
                  <IssueStatusBadge status={stat.status} />
                  <span className="font-semibold tabular-nums">{formatNumber(stat.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </PageSection>
        <PageSection
          title="Program kerja"
          action={<TextLink href={`/proker?opd=${slug}`}>Lihat semua proker</TextLink>}
        >
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
    </>
  );
}
