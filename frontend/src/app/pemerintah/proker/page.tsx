import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProgramStatusBadge } from "@/components/status-badge";
import { getPemerintahOverview, getPemerintahPrograms } from "@/lib/data/pemerintah";
import { formatNumber, formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Program Kerja Strategis" };

export default async function PemerintahProkerPage() {
  const [overview, programs] = await Promise.all([
    getPemerintahOverview(),
    getPemerintahPrograms(),
  ]);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Pengawasan Program Kerja Daerah"
        description="Pantau pencapaian output fisik dan penyerapan anggaran program strategis kepala daerah per OPD."
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

      <div className="flex flex-col gap-4 rounded-lg border bg-surface p-6">
        <div className="flex flex-col gap-1 border-b pb-4">
          <h2 className="text-base font-bold tracking-tight">Daftar Program Kerja Strategis</h2>
          <p className="text-xs text-fg-muted">
            Transparansi target output fisik dan realisasi keuangan per instansi penanggung jawab.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted text-xs font-semibold text-fg-muted">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Program & Kode</th>
                <th className="py-3 px-4">Instansi (OPD)</th>
                <th className="py-3 px-4 text-center w-36">Capaian Fisik</th>
                <th className="py-3 px-4 text-right">Realisasi Keuangan</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fg-muted">
                    Tidak ada data program kerja yang ditemukan.
                  </td>
                </tr>
              ) : (
                programs.map((program, index) => (
                  <tr
                    key={program.id}
                    className="h-14 transition-colors duration-150 hover:bg-surface-muted/50"
                  >
                    <td className="py-2 px-4 text-center font-semibold text-fg-muted tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-2 px-4 max-w-[280px]">
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-fg truncate">{program.name}</span>
                        <span className="text-xs text-fg-muted font-mono">{program.code}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-fg-muted">{program.opdName}</span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className={`h-full rounded-full ${
                              program.physicalPercent >= 100
                                ? "bg-emerald-500"
                                : program.physicalPercent >= 60
                                ? "bg-primary"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${program.physicalPercent}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold tabular-nums">
                          {program.physicalPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium tabular-nums text-fg">
                          {formatRupiah(program.budgetRealization)}
                        </span>
                        <span className="text-[11px] text-fg-muted tabular-nums">
                          dari {formatRupiah(program.budgetPagu)} ({program.budgetPercent}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <ProgramStatusBadge status={program.status as any} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
