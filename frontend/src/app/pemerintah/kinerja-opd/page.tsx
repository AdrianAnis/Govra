import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getPemerintahOpdPerformance } from "@/lib/data/pemerintah";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Kinerja OPD" };

export default async function PemerintahKinerjaOpdPage() {
  const opdList = await getPemerintahOpdPerformance();

  const sortedList = [...opdList].sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    return b.totalReports - a.totalReports;
  });

  const highPerformers = sortedList.filter((o) => o.statusGrade === "Sangat Baik").length;
  const needAttention = sortedList.filter((o) => o.statusGrade === "Perlu Perhatian").length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Kinerja & Rapor OPD"
        description="Evaluasi efektivitas dan responsivitas Organisasi Perangkat Daerah dalam menindaklanjuti pengaduan warga."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Total Instansi (OPD)</span>
          <span className="text-3xl font-bold tabular-nums">{opdList.length}</span>
          <span className="text-xs text-fg-muted">Unit kerja pemerintah daerah</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Kinerja Sangat Baik</span>
          <span className="text-3xl font-bold tabular-nums text-emerald-600">
            {highPerformers}
          </span>
          <span className="text-xs text-fg-muted">Tingkat penyelesaian ≥ 80%</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border bg-surface p-5">
          <span className="text-xs font-semibold text-fg-muted">Perlu Perhatian</span>
          <span className="text-3xl font-bold tabular-nums text-amber-600">
            {needAttention}
          </span>
          <span className="text-xs text-fg-muted">Tingkat penyelesaian &lt; 60%</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-surface p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-base font-bold tracking-tight">Peringkat Kinerja OPD</h2>
            <p className="text-xs text-fg-muted">
              Diurutkan berdasarkan persentase ketuntasan penyelesaian laporan warga.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted text-xs font-semibold text-fg-muted">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Instansi / OPD</th>
                <th className="py-3 px-4 text-center">Total Laporan</th>
                <th className="py-3 px-4 text-center">Selesai</th>
                <th className="py-3 px-4 text-center">Diproses</th>
                <th className="py-3 px-4 text-center">Menunggu</th>
                <th className="py-3 px-4 text-center w-36">Ketuntasan</th>
                <th className="py-3 px-4 text-right">Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-fg-muted">
                    Tidak ada data OPD yang ditemukan.
                  </td>
                </tr>
              ) : (
                sortedList.map((item, index) => {
                  let badgeClass = "bg-blue-100 text-blue-700";
                  if (item.statusGrade === "Sangat Baik") {
                    badgeClass = "bg-emerald-100 text-emerald-800";
                  } else if (item.statusGrade === "Perlu Perhatian") {
                    badgeClass = "bg-amber-100 text-amber-800";
                  }

                  return (
                    <tr
                      key={item.id}
                      className="h-14 transition-colors duration-150 hover:bg-surface-muted/50"
                    >
                      <td className="py-2 px-4 text-center font-semibold text-fg-muted tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-fg truncate">{item.name}</span>
                          <span className="text-xs text-fg-muted">{item.code}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center font-medium tabular-nums">
                        {formatNumber(item.totalReports)}
                      </td>
                      <td className="py-2 px-4 text-center font-medium tabular-nums text-emerald-600">
                        {formatNumber(item.resolvedReports)}
                      </td>
                      <td className="py-2 px-4 text-center font-medium tabular-nums text-blue-600">
                        {formatNumber(item.inProgressReports)}
                      </td>
                      <td className="py-2 px-4 text-center font-medium tabular-nums text-amber-600">
                        {formatNumber(item.pendingReports)}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                            <div
                              className={`h-full rounded-full ${
                                item.completionRate >= 80
                                  ? "bg-emerald-500"
                                  : item.completionRate >= 60
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${item.completionRate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs font-semibold tabular-nums">
                            {item.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}
                        >
                          {item.statusGrade}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
