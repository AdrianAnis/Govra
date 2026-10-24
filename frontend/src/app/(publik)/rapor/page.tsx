import type { Metadata } from "next";
import { IndicatorTiles } from "@/components/indicator-tiles";
import { Container } from "@/components/layout/container";
import { OpdComparison } from "@/components/opd-comparison";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { TextLink } from "@/components/text-link";
import { getScorecard } from "@/lib/data/scorecard";

export const metadata: Metadata = { title: "Rapor Periode" };

export default async function ScorecardPage() {
  const scorecard = await getScorecard();
  const { start_year, end_year } = scorecard.period;

  return (
    <>
      <Container className="flex flex-col gap-10 py-10">
        <PageHeader
          title={`Rapor Periode ${start_year}–${end_year}`}
          description={`${scorecard.head_label}. Setiap angka bisa dibuka untuk melihat data penyusunnya.`}
        />
        <PageSection
          title="Ringkasan"
          action={<TextLink href="/metodologi">Cara menghitung</TextLink>}
        >
          <IndicatorTiles indicators={scorecard.indicators} />
        </PageSection>
        <PageSection title="Perbandingan antar OPD">
          <OpdComparison columns={scorecard.indicators} rows={scorecard.by_opd} />
        </PageSection>
      </Container>
    </>
  );
}
