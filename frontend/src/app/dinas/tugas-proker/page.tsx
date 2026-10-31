import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Total Tugas Amanah</span>
          <span className="text-3xl font-bold tabular-nums">{programs.length}</span>
          <span className="text-xs text-fg-muted">Program kerja instansi</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Sesuai Jadwal</span>
          <span className="text-3xl font-bold tabular-nums text-emerald-600">
            {onSchedule}
          </span>
          <span className="text-xs text-fg-muted">Progres on track</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Dalam Percepatan</span>
          <span className="text-3xl font-bold tabular-nums text-red-600">
            {delayed}
          </span>
          <span className="text-xs text-fg-muted">Perlu atensi pelaksanaan</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Realisasi Anggaran</span>
          <span className="text-2xl font-bold tabular-nums text-fg truncate">
            {formatRupiah(totalRealization)}
          </span>
          <span className="text-xs text-fg-muted truncate">
            Pagu: {formatRupiah(totalPagu)}
          </span>
        </div>
      </div>

      <DinasTugasProkerManager
        initialPrograms={programs}
        currentOpdId={opdId}
        opdName={opdName}
      />
    </div>
  );
}
