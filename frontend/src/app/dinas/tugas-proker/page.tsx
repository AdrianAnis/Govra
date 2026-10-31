import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/stat-card";
import { DinasTugasProkerManager } from "@/components/agency/dinas-tugas-proker-manager";
import { getDinasAssignedPrograms } from "@/lib/data/pemerintah";
import { getSessionUser } from "@/lib/data/session";
import { AGENCY_HOME } from "@/lib/routes";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Tugas Program Kerja Dinas" };

export default async function DinasTugasProkerPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "dinas") {
    redirect(AGENCY_HOME);
  }

  const opdId = user.opdId || "e0000000-0000-0000-0000-000000000001";
  const opdName = user.opdName || "Dinas Terkait";
  const programs = await getDinasAssignedPrograms(opdId);

  let onSchedule = 0;
  let delayed = 0;
  let totalPagu = 0;
  let totalRealization = 0;

  for (const p of programs) {
    totalPagu += p.budgetPagu;
    totalRealization += p.budgetRealization;
    if (p.status === "TERLAMBAT" || p.status === "MELEWATI_TENGGAT") {
      delayed++;
    } else if (p.status !== "SELESAI") {
      onSchedule++;
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Tugas Program Kerja Amanah"
        description={`Program strategis daerah yang diamanahkan oleh Wali Kota kepada ${opdName} sebagai jobdesk pelaksanaan dan pengawasan.`}
      />

      <StatGrid>
        <StatCard label="Total Tugas Amanah" value={programs.length} hint="Program kerja instansi" />
        <StatCard label="Sesuai Jadwal" value={onSchedule} hint="Progres on track" />
        <StatCard label="Dalam Percepatan" value={delayed} hint="Perlu atensi pelaksanaan" />
        <StatCard label="Realisasi Anggaran" value={formatRupiah(totalRealization)} hint={`Pagu: ${formatRupiah(totalPagu)}`} />
      </StatGrid>

      <DinasTugasProkerManager
        initialPrograms={programs}
        currentOpdId={opdId}
        opdName={opdName}
      />
    </div>
  );
}
