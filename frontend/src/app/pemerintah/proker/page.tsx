import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PemerintahProkerManager } from "@/components/pemerintah/pemerintah-proker-manager";
import {
  getPemerintahOverview,
  getPemerintahPrograms,
  getPemerintahOpdPerformance,
} from "@/lib/data/pemerintah";

export const metadata: Metadata = { title: "Program Kerja Strategis" };

export default async function PemerintahProkerPage() {
  const [overview, programs, opdPerformance] = await Promise.all([
    getPemerintahOverview(),
    getPemerintahPrograms(),
    getPemerintahOpdPerformance(),
  ]);

  const opdList = opdPerformance.map((o) => ({
    id: o.id,
    code: o.code,
    name: o.name,
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Pengawasan & Kelola Program Kerja"
        description="Kelola program kerja strategis pemerintah daerah, delegasikan ke instansi pelaksana terkait, dan pantau progres realisasi."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Total Program Kerja</span>
          <span className="text-3xl font-bold tabular-nums">{programs.length}</span>
          <span className="text-xs text-fg-muted">Program strategis terdata</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Sesuai Jadwal</span>
          <span className="text-3xl font-bold tabular-nums text-emerald-600">
            {overview.programsSummary.onSchedule}
          </span>
          <span className="text-xs text-fg-muted">Progres on track</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Terlambat / Perlu Percepatan</span>
          <span className="text-3xl font-bold tabular-nums text-red-600">
            {overview.programsSummary.delayed}
          </span>
          <span className="text-xs text-fg-muted">Memerlukan intervensi</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Selesai 100%</span>
          <span className="text-3xl font-bold tabular-nums text-primary">
            {overview.programsSummary.completed}
          </span>
          <span className="text-xs text-fg-muted">Target tuntas</span>
        </div>
      </div>

      <PemerintahProkerManager initialPrograms={programs} opdList={opdList} />
    </div>
  );
}
