import type { Metadata } from "next";
import { SettingRow } from "@/components/admin/setting-row";
import { PageHeader } from "@/components/page-header";
import { listSettings } from "@/lib/data/admin";
import type { Schema } from "@/lib/schema";

export const metadata: Metadata = { title: "Pengaturan" };

const GROUPS: ReadonlyArray<{ title: string; keys: readonly Schema<"SettingKey">[] }> = [
  {
    title: "Triage dan penggabungan isu",
    keys: ["TRIAGE_CONFIDENCE_MIN", "MERGE_SIMILARITY_MIN", "MERGE_RADIUS_METERS", "MERGE_WINDOW_DAYS"],
  },
  {
    title: "Tingkat urgensi",
    keys: ["URGENT_REPORTERS_72H", "URGENT_REPORTERS_7D", "HIGH_REPORTERS_7D", "SUBNET_REPORTER_CAP"],
  },
  { title: "Batas waktu tanggapan", keys: ["SLA_URGENT_HOURS", "SLA_HIGH_DAYS", "SLA_NORMAL_BUSINESS_DAYS"] },
  { title: "Penyelesaian dan sanggahan", keys: ["REOPEN_DISPUTE_RATIO", "REOPEN_WINDOW_DAYS"] },
  { title: "Program", keys: ["PROGRAM_LATE_THRESHOLD"] },
];

export default async function AdminSettingsPage() {
  const { items } = await listSettings();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Pengaturan" description="Ambang yang dipakai sistem. Setiap perubahan tercatat di audit." />
      {GROUPS.map((group) => {
        const rows = group.keys.flatMap((key) => items.find((item) => item.key === key) ?? []);
        return (
          <section key={group.title} aria-labelledby={group.title} className="flex flex-col gap-2">
            <h2 id={group.title} className="text-2xl font-bold tracking-tight">
              {group.title}
            </h2>
            <div className="divide-y rounded-lg border bg-surface px-6">
              {rows.map((setting) => (
                <SettingRow key={setting.key} setting={setting} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
