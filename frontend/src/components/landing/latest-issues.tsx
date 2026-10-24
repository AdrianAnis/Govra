import { Reveal } from "@/components/bits/reveal";
import { IssuePhotoCard } from "@/components/issue-photo-card";
import { IssueSlider } from "@/components/landing/issue-slider";
import { LandingSection } from "@/components/landing/landing-section";
import type { Schema } from "@/lib/schema";

const STAGGER_MS = 150;
const VISIBLE_CARDS = 3;

interface LatestIssuesProps {
  issues: readonly Schema<"IssueSummary">[];
  now: Date;
}

function LatestIssues({ issues, now }: LatestIssuesProps) {
  return (
    <LandingSection eyebrow="Suara warga" title="Baru saja dilaporkan">
      <IssueSlider>
        {issues.map((issue, index) => (
          <li key={issue.id} className="w-4/5 shrink-0 snap-start pr-4 md:w-1/2 lg:w-1/3">
            <Reveal variant="blur" delay={(index % VISIBLE_CARDS) * STAGGER_MS} className="h-full">
              <IssuePhotoCard issue={issue} now={now} />
            </Reveal>
          </li>
        ))}
      </IssueSlider>
    </LandingSection>
  );
}

export { LatestIssues };
