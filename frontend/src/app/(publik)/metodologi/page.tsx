import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { ProgramStatusBadge } from "@/components/status-badge";
import { getMethodology } from "@/lib/data/scorecard";
import { formatThreshold } from "@/lib/format";
import type { ProgramStatus } from "@/lib/status";

export const metadata: Metadata = { title: "Metodologi" };

const STATUS_RULES: ReadonlyArray<readonly [ProgramStatus, string]> = [
  ["BELUM_DIMULAI", "Hari ini sebelum tanggal mulai dan progres masih 0."],
  ["SESUAI_JADWAL", "Progres berjalan selaras dengan rencana jadwal."],
  ["TERLAMBAT", "Proker sedang dipercepat agar selaras dengan rencana jadwal."],
  ["MELEWATI_TENGGAT", "Tanggal target telah tiba dan proker memasuki tahap penyelesaian."],
  ["SELESAI", "Progres sudah 100 persen."],
];

export default async function MethodologyPage() {
  const methodology = await getMethodology();

  return (
    <>
      <Container className="flex flex-col gap-10 py-10">
        <PageHeader
          title="Metodologi"
          description="Cara Govra menghitung status proker dan indikator rapor. Semua angka dihitung otomatis dari data, tidak diisi manual."
        />
        <PageSection title="Indikator rapor">
          <ul className="grid gap-4 md:grid-cols-2">
            {methodology.indicators.map((indicator) => (
              <li key={indicator.code} className="flex flex-col gap-2 rounded-md border bg-surface p-5">
                <h3 className="font-semibold">{indicator.label}</h3>
                <p className="text-fg-muted">{indicator.description}</p>
                <p className="text-sm">
                  <span className="font-medium">Rumus:</span> {indicator.formula}.
                </p>
              </li>
            ))}
          </ul>
        </PageSection>
        <PageSection title="Status proker">
          <ul className="flex flex-col gap-3">
            {STATUS_RULES.map(([status, rule]) => (
              <li key={status} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="sm:w-52">
                  <ProgramStatusBadge status={status} />
                </div>
                <p>{rule}</p>
              </li>
            ))}
          </ul>
        </PageSection>
        <PageSection title="Ambang yang berlaku">
          <dl className="grid gap-4 sm:grid-cols-2">
            {methodology.thresholds.map((threshold) => (
              <div key={threshold.key} className="flex flex-col gap-0.5 rounded-md border bg-surface p-4">
                <dt className="text-sm text-fg-muted">{threshold.label}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatThreshold(threshold.value, threshold.unit)}
                </dd>
              </div>
            ))}
          </dl>
        </PageSection>
      </Container>
    </>
  );
}
