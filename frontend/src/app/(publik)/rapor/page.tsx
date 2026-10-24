import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { OpdComparison } from "@/components/opd-comparison";
import { PageSection } from "@/components/page-section";
import { RaporHero } from "@/components/rapor-hero";
import { getScorecard } from "@/lib/data/scorecard";

export const metadata: Metadata = { title: "Rapor Periode" };

export default async function ScorecardPage() {
  const scorecard = await getScorecard();
  const { start_year, end_year } = scorecard.period;

  return (
    <Container className="flex flex-col gap-14 py-6 lg:gap-20 lg:py-8">
      <RaporHero
        eyebrow={scorecard.head_label}
        period={`${start_year}–${end_year}`}
        indicators={scorecard.indicators}
      />
      <PageSection title="Per OPD" action={<p className="text-sm text-fg-muted">Diurutkan abjad</p>}>
        <OpdComparison columns={scorecard.indicators} rows={scorecard.by_opd} />
      </PageSection>
    </Container>
  );
}
