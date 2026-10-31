import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PemerintahProkerManager } from "@/components/pemerintah/pemerintah-proker-manager";
import { StatCard, StatGrid } from "@/components/stat-card";
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

      <StatGrid>
        <StatCard label="Total Program Kerja" value={programs.length} hint="Program strategis terdata" />
        <StatCard label="Sesuai Jadwal" value={overview.programsSummary.onSchedule} hint="Progres on track" />
        <StatCard label="Perlu Percepatan" value={overview.programsSummary.delayed} hint="Memerlukan intervensi" />
        <StatCard label="Selesai 100%" value={overview.programsSummary.completed} hint="Target tuntas" />
      </StatGrid>

      <PemerintahProkerManager initialPrograms={programs} opdList={opdList} />
    </div>
  );
}
