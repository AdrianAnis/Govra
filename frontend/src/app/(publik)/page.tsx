import { redirect } from "next/navigation";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LatestIssues } from "@/components/landing/latest-issues";
import { ProgramsSection } from "@/components/landing/programs-section";
import { ReportCta } from "@/components/landing/report-cta";
import { currentTime } from "@/lib/clock";
import { listIssues } from "@/lib/data/issues";
import { listPrograms } from "@/lib/data/programs";
import { getSessionUser } from "@/lib/data/session";
import { ROLE_HOME } from "@/lib/session";

const FEATURED_PROGRAMS = 3;
const LATEST_ISSUES = 6;

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    redirect(ROLE_HOME[user.role]);
  }
  const [latest, programs] = await Promise.all([
    listIssues({ limit: LATEST_ISSUES }),
    listPrograms({ limit: FEATURED_PROGRAMS }),
  ]);

  return (
    <>
      <Hero />
      <ProgramsSection programs={programs.items} />
      <LatestIssues issues={latest.items} now={currentTime()} />
      <HowItWorks />
      <ReportCta />
    </>
  );
}
