import type { Metadata } from "next";
import { ReportWizard } from "@/components/report/report-wizard";
import { getDistricts, getRegion } from "@/lib/data/reference";

export const metadata: Metadata = { title: "Lapor Masalah" };

export default async function ReportPage() {
  const [districts, region] = await Promise.all([getDistricts(), getRegion()]);

  return <ReportWizard districts={districts.items} bounds={region.bounds} />;
}
