"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, FileText, History, Image as ImageIcon, Loader2, Plus, Search, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgramStatusBadge } from "@/components/status-badge";
import { formatDate, formatNumber, formatPercent, formatRupiah } from "@/lib/format";
import type { PemerintahProgramItem, ProgramUpdateItem } from "@/lib/data/pemerintah";

interface Props {
  initialPrograms: PemerintahProgramItem[];
  currentOpdId: string;
  opdName: string;
}

export function DinasTugasProkerManager({
  initialPrograms,
  currentOpdId,
  opdName,
}: Props) {
  const router = useRouter();
  const [programs, setPrograms] = useState<PemerintahProgramItem[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [activeProgram, setActiveProgram] = useState<PemerintahProgramItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [progressNote, setProgressNote] = useState("");
  const [realizationOutput, setRealizationOutput] = useState<number>(0);
  const [budgetRealization, setBudgetRealization] = useState<number>(0);
  const [statusVal, setStatusVal] = useState<string>("SESUAI_JADWAL");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProgram, setHistoryProgram] = useState<PemerintahProgramItem | null>(null);
  const [historyList, setHistoryList] = useState<ProgramUpdateItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCode = p.code.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [programs, selectedStatus, search]);

  function openUpdateDialog(program: PemerintahProgramItem) {
    setActiveProgram(program);
    setProgressNote("");
    setRealizationOutput(program.realizationOutput);
    setBudgetRealization(program.budgetRealization);
    setStatusVal(program.status);
    setPhotos([]);
    setErrorMessage(null);
    setDialogOpen(true);
  }

  async function openHistoryDialog(program: PemerintahProgramItem) {
    setHistoryProgram(program);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryList([]);

    try {
      const res = await fetch(`/api/dinas/programs/${program.id}/progress`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.updates || []);
      }
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal mengunggah foto");
        }

        const data = await res.json();
        if (data.url) {
          setPhotos((prev) => [...prev, data.url]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengunggah dokumentasi");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  function removePhoto(idxToRemove: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  }

  async function handleSubmitProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProgram) return;
    if (!progressNote.trim()) {
      setErrorMessage("Catatan perkembangan pengerjaan wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/dinas/programs/${activeProgram.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Laporan Pengerjaan oleh ${opdName}`,
          content: progressNote,
          realizationOutput: Number(realizationOutput),
          budgetRealization: Number(budgetRealization),
          status: statusVal,
          documentationPhotos: photos,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mencatat perkembangan");
      }

      setDialogOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              placeholder="Cari tugas program kerja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border bg-surface pl-8 pr-3 text-xs text-fg placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border bg-surface px-2.5 text-xs font-medium text-fg focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Semua Status</option>
            <option value="BELUM_DIMULAI">Belum Dimulai</option>
            <option value="SESUAI_JADWAL">Sesuai Jadwal</option>
            <option value="TERLAMBAT">Dalam Percepatan</option>
            <option value="MELEWATI_TENGGAT">Tahap Penyelesaian</option>
            <option value="SELESAI">Selesai 100%</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-fg-muted">
          Menampilkan <span className="text-fg tabular-nums">{filteredPrograms.length}</span> program kerja amanah
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted text-xs font-semibold text-fg-muted">
              <tr className="h-12">
                <th className="py-2 px-4 w-12 text-center whitespace-nowrap">No</th>
                <th className="py-2 px-4 whitespace-nowrap">Program Kerja Amanah</th>
                <th className="py-2 px-4 whitespace-nowrap">Peran & Kolaborasi</th>
                <th className="py-2 px-4 text-center w-36 whitespace-nowrap">Capaian Fisik</th>
                <th className="py-2 px-4 text-right whitespace-nowrap">Realisasi Anggaran</th>
                <th className="py-2 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-2 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg-muted">
                    Tidak ada program kerja yang diamanahkan kepada instansi ini saat ini.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program, index) => {
                  const isLead = program.opdId === currentOpdId;
                  const partnerOpds = program.assignedOpds.filter((o) => o.id !== currentOpdId);

                  return (
                    <tr
                      key={program.id}
                      className="h-14 transition-colors duration-150 hover:bg-surface-muted/50"
                    >
                      <td className="py-2 px-4 text-center font-semibold text-fg-muted tabular-nums whitespace-nowrap">
                        {index + 1}
                      </td>
                      <td className="py-2 px-4 max-w-[280px] whitespace-nowrap">
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-fg truncate" title={program.name}>
                            {program.name}
                          </span>
                          <span className="text-xs text-fg-muted font-mono">{program.code}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 max-w-[220px] whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block w-fit rounded px-2 py-0.5 text-[11px] font-bold ${
                              isLead
                                ? "bg-primary text-white"
                                : "bg-secondary/15 text-secondary-fg"
                            }`}
                          >
                            {isLead ? "Instansi Utama" : "Mitra Pelaksana"}
                          </span>
                          {partnerOpds.length > 0 && (
                            <span className="text-[11px] text-fg-muted truncate">
                              Mitra: {partnerOpds.map((o) => o.code).join(", ")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
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
                        <span className="block text-[11px] text-fg-muted text-right tabular-nums">
                          {program.realizationOutput} / {program.targetOutput} {program.targetUnit}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium tabular-nums text-fg">
                            {formatRupiah(program.budgetRealization)}
                          </span>
                          <span className="text-[11px] text-fg-muted tabular-nums">
                            Pagu: {formatRupiah(program.budgetPagu)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-center whitespace-nowrap">
                        <ProgramStatusBadge status={program.status as any} />
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openHistoryDialog(program)}
                            className="h-8 gap-1 text-xs"
                            title="Lihat riwayat perkembangan & bukti"
                          >
                            <History className="size-3.5" />
                            <span>Riwayat</span>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openUpdateDialog(program)}
                            className="h-8 gap-1 text-xs font-semibold"
                          >
                            <FileText className="size-3.5" />
                            <span>Lapor</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {activeProgram && (
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="font-mono font-semibold">{activeProgram.code}</span>
                <span>•</span>
                <span>Target: {activeProgram.targetOutput} {activeProgram.targetUnit}</span>
              </div>
              <DialogTitle className="text-lg font-bold">
                Lapor Perkembangan Program Kerja
              </DialogTitle>
              <DialogDescription className="text-xs text-fg-muted">
                {activeProgram.name}
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitProgress} className="flex flex-col gap-4 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-fg">
                    Realisasi Fisik ({activeProgram.targetUnit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={realizationOutput}
                    onChange={(e) => setRealizationOutput(Number(e.target.value))}
                    className="h-9 rounded-md border bg-surface px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-fg">
                    Realisasi Anggaran Terpakai (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={budgetRealization}
                    onChange={(e) => setBudgetRealization(Number(e.target.value))}
                    className="h-9 rounded-md border bg-surface px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Status Saat Ini</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-2.5 text-xs font-medium text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="BELUM_DIMULAI">Belum Dimulai</option>
                  <option value="SESUAI_JADWAL">Sesuai Jadwal</option>
                  <option value="TERLAMBAT">Dalam Percepatan</option>
                  <option value="MELEWATI_TENGGAT">Tahap Penyelesaian</option>
                  <option value="SELESAI">Selesai 100%</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">
                  Catatan & Laporan Pengerjaan Lapangan *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Deskripsikan tahapan yang telah dikerjakan, kendala di lapangan, atau koordinasi antar dinas terkait..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  className="rounded-md border bg-surface p-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg border bg-surface-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg">
                    Dokumentasi Foto Lapangan (Transparansi Publik & Pimpinan)
                  </span>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto || loading}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-surface-muted">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="size-3.5" />
                          <span>Tambah Foto</span>
                        </>
                      )}
                    </span>
                  </label>
                </div>

                {photos.length === 0 ? (
                  <p className="text-[11px] text-fg-muted">
                    Unggah foto dokumentasi pekerjaan fisik di lapangan agar warga dan Walikota dapat memantau secara transparan.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {photos.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative size-20 overflow-hidden rounded-md border bg-surface"
                      >
                        <img
                          src={url}
                          alt={`Bukti ${idx + 1}`}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white hover:bg-red-600 transition"
                          title="Hapus foto ini"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading || uploadingPhoto}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading || uploadingPhoto} className="gap-1.5">
                  <Send className="size-3.5" />
                  <span>{loading ? "Menyimpan..." : "Kirim Laporan Progres"}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        {historyProgram && (
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="font-mono font-semibold">{historyProgram.code}</span>
                <span>•</span>
                <span>{historyProgram.assignedOpds.length} Instansi Terkait</span>
              </div>
              <DialogTitle className="text-lg font-bold">
                Riwayat Perkembangan & Dokumentasi
              </DialogTitle>
              <DialogDescription className="text-xs text-fg-muted">
                {historyProgram.name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 text-xs text-fg-muted gap-2">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Memuat riwayat dokumentasi...</span>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-xs text-fg-muted">
                  Belum ada laporan perkembangan atau dokumentasi yang tercatat untuk program kerja ini.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border rounded-lg border bg-surface">
                  {historyList.map((item) => {
                    const isAssignment = item.title === "PENUGASAN_OPD";
                    return (
                      <div key={item.id} className="p-4 flex flex-col gap-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              {item.opdName}
                            </span>
                            <span className="text-xs font-semibold text-fg">
                              {isAssignment ? "Amanah Penugasan Awal" : item.title}
                            </span>
                          </div>
                          <span className="text-xs text-fg-muted tabular-nums">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-fg leading-relaxed whitespace-pre-wrap">
                          {item.content}
                        </p>

                        {item.documentationPhotos && item.documentationPhotos.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-fg-muted">
                              Foto Dokumentasi ({item.documentationPhotos.length}):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {item.documentationPhotos.map((photoUrl, pIdx) => (
                                <a
                                  key={pIdx}
                                  href={photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative size-20 overflow-hidden rounded-md border bg-surface-muted transition hover:border-primary"
                                >
                                  <img
                                    src={photoUrl}
                                    alt="Dokumentasi pengerjaan"
                                    className="size-full object-cover transition duration-150 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setHistoryOpen(false)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
