"use client";

import { useMemo, useState } from "react";
import { Eye, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IssueStatusBadge } from "@/components/status-badge";
import { toIssueStatus } from "@/lib/status";
import { formatRelativeTime } from "@/lib/format";
import type { PemerintahReportItem } from "@/lib/data/pemerintah";

interface Props {
  initialReports: PemerintahReportItem[];
  opdList: Array<{ id: string; name: string }>;
}

export function PemerintahReportsTable({ initialReports, opdList }: Props) {
  const [tab, setTab] = useState<string>("semua");
  const [selectedOpd, setSelectedOpd] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [activeReport, setActiveReport] = useState<PemerintahReportItem | null>(null);

  const filteredReports = useMemo(() => {
    return initialReports.filter((report) => {
      const st = (report.status || "").toUpperCase();
      if (tab === "menunggu" && st !== "DIAJUKAN" && st !== "MENUNGGU_VERIFIKASI") {
        return false;
      }
      if (tab === "proses" && st !== "DIPROSES" && st !== "DITERUSKAN") {
        return false;
      }
      if (tab === "selesai" && st !== "SELESAI") {
        return false;
      }

      if (selectedOpd !== "all" && report.opdId !== selectedOpd) {
        return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = (report.title || "").toLowerCase().includes(query);
        const matchCode = (report.code || "").toLowerCase().includes(query);
        const matchOpd = (report.opdName || "").toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchOpd) {
          return false;
        }
      }

      return true;
    });
  }, [initialReports, tab, selectedOpd, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-2 sm:border-0 sm:pb-0">
          {[
            { key: "semua", label: "Semua" },
            { key: "menunggu", label: "Menunggu" },
            { key: "proses", label: "Diproses" },
            { key: "selesai", label: "Selesai" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                tab === t.key
                  ? "bg-secondary text-secondary-fg"
                  : "bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              placeholder="Cari laporan / kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border bg-surface pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={selectedOpd}
            onChange={(e) => setSelectedOpd(e.target.value)}
            className="h-9 rounded-md border bg-surface px-2.5 text-xs font-medium text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Semua OPD</option>
            {opdList.map((opd) => (
              <option key={opd.id} value={opd.id}>
                {opd.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted text-xs font-semibold text-fg-muted">
              <tr className="h-12">
                <th className="px-4 py-2 whitespace-nowrap">Laporan & Lokasi</th>
                <th className="px-4 py-2 whitespace-nowrap">Instansi (OPD)</th>
                <th className="px-4 py-2 whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-center whitespace-nowrap">Dukungan</th>
                <th className="px-4 py-2 whitespace-nowrap">Waktu</th>
                <th className="px-4 py-2 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-fg-muted">
                    Tidak ada laporan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="h-14 transition-colors duration-150 hover:bg-surface-muted/50"
                  >
                    <td className="px-4 py-2 max-w-[280px] sm:max-w-md whitespace-nowrap">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-fg truncate">{report.title}</span>
                        {report.addressDetail && (
                          <span className="text-xs text-fg-muted truncate">
                            · {report.addressDetail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="text-xs font-medium text-fg-muted max-w-[180px] truncate block">
                        {report.opdName}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <IssueStatusBadge status={toIssueStatus(report.status)} />
                    </td>
                    <td className="px-4 py-2 text-center font-medium tabular-nums whitespace-nowrap">
                      {report.supportCount}
                    </td>
                    <td className="px-4 py-2 text-xs text-fg-muted whitespace-nowrap">
                      {formatRelativeTime(report.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveReport(report)}
                        className="h-8 gap-1 text-xs"
                      >
                        <Eye className="size-3.5" />
                        <span>Lihat Detail</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!activeReport} onOpenChange={(open) => !open && setActiveReport(null)}>
        {activeReport && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="font-mono">{activeReport.code}</span>
                <span>•</span>
                <span>{activeReport.opdName}</span>
              </div>
              <DialogTitle className="text-lg font-bold">{activeReport.title}</DialogTitle>
              <DialogDescription className="sr-only">Detail laporan warga</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-fg-muted">Status:</span>
                <IssueStatusBadge status={toIssueStatus(activeReport.status)} />
              </div>

              {activeReport.addressDetail && (
                <div className="flex items-start gap-2 text-xs text-fg-muted">
                  <MapPin className="size-4 shrink-0 text-primary mt-0.5" />
                  <span>{activeReport.addressDetail}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 rounded-md border bg-surface-muted/50 p-4">
                <span className="text-xs font-semibold text-fg-muted">Isi Laporan:</span>
                <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">
                  {activeReport.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-fg-muted pt-2 border-t">
                <span>Dukungan: {activeReport.supportCount} warga</span>
                <span>Dilaporkan: {new Date(activeReport.createdAt).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <DialogClose render={<Button variant="outline">Tutup</Button>} />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
