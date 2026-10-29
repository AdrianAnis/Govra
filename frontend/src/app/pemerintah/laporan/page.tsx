import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PemerintahReportsTable } from "@/components/pemerintah/pemerintah-reports-table";
import { getPemerintahReports, getPemerintahOpdPerformance } from "@/lib/data/pemerintah";

export const metadata: Metadata = { title: "Semua Laporan Daerah" };

export default async function PemerintahLaporanPage() {
  const [reports, opdPerformance] = await Promise.all([
    getPemerintahReports(),
    getPemerintahOpdPerformance(),
  ]);

  const opdList = opdPerformance.map((o) => ({ id: o.id, name: o.name }));

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Semua Laporan Warga"
        description="Pantau seluruh aduan masyarakat di berbagai dinas dan wilayah kota secara transparan dan terintegrasi."
      />

      <PemerintahReportsTable initialReports={reports} opdList={opdList} />
    </div>
  );
}
