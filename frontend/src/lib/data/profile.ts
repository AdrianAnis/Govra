import { currentTime } from "@/lib/clock";
import { DEMO_PROFILE } from "@/lib/mock/profile";
import { allReports } from "@/lib/mock/reports";
import type { Schema } from "@/lib/schema";

export async function exportMyData(): Promise<Schema<"MyDataExport">> {
  return { profile: DEMO_PROFILE, reports: allReports(currentTime()) };
}
