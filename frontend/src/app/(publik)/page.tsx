import { redirect } from "next/navigation";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LatestIssues } from "@/components/landing/latest-issues";
import { ProgramsSection } from "@/components/landing/programs-section";
import { ReportCta } from "@/components/landing/report-cta";
import { currentTime } from "@/lib/clock";
import { listIssues } from "@/lib/data/issues";
import { listPrograms } from "@/lib/data/programs";

const FEATURED_PROGRAMS = 3;
const LATEST_ISSUES = 6;

interface HomePageProps {
  searchParams?: Promise<{ code?: string; error?: string; error_description?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : {};
  if (params.code || params.error) {
    const query = new URLSearchParams();
    if (params.code) {
      query.set("code", params.code);
    }
    if (params.error) {
      query.set("error", params.error);
    }
    if (params.error_description) {
      query.set("error_description", params.error_description);
    }
    redirect(`/api/auth/callback/google?${query.toString()}`);
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
