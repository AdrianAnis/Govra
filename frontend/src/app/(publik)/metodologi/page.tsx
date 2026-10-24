import type { Metadata } from "next";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { Container } from "@/components/layout/container";
import { PageIntro } from "@/components/page-intro";
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

const INDICATOR_HEADERS = ["Indikator", "Penjelasan", "Rumus"] as const;
const STATUS_HEADERS = ["Status", "Kapan berlaku"] as const;
const THRESHOLD_HEADERS = ["Ambang", "Nilai"] as const;

export default async function MethodologyPage() {
  const methodology = await getMethodology();

  return (
    <Container className="flex flex-col gap-14 py-6 lg:gap-16 lg:py-8">
      <PageIntro
        eyebrow="Transparansi"
        title="Metodologi"
        description="Cara Govra menghitung status proker dan indikator rapor. Semua angka dihitung otomatis dari data, tidak diisi manual."
      />
      <PageSection title="Indikator rapor">
        <DataTable caption="Indikator rapor dan rumusnya" headers={INDICATOR_HEADERS}>
          {methodology.indicators.map((indicator) => (
            <DataRow key={indicator.code}>
              <RowHead>{indicator.label}</RowHead>
              <DataCell className="text-sm text-fg-muted">{indicator.description}</DataCell>
              <DataCell className="text-sm">{indicator.formula}.</DataCell>
            </DataRow>
          ))}
        </DataTable>
      </PageSection>
      <PageSection title="Status proker">
        <DataTable caption="Aturan status proker" headers={STATUS_HEADERS} className="min-w-lg">
          {STATUS_RULES.map(([status, rule]) => (
            <DataRow key={status}>
              <RowHead>
                <ProgramStatusBadge status={status} />
              </RowHead>
              <DataCell className="text-sm">{rule}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      </PageSection>
      <PageSection title="Ambang yang berlaku">
        <DataTable caption="Ambang yang berlaku" headers={THRESHOLD_HEADERS} className="min-w-lg">
          {methodology.thresholds.map((threshold) => (
            <DataRow key={threshold.key}>
              <RowHead>{threshold.label}</RowHead>
              <DataCell className="text-lg font-semibold tabular-nums">
                {formatThreshold(threshold.value, threshold.unit)}
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      </PageSection>
    </Container>
  );
}
