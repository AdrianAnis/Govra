"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Edit, History, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProgramStatusBadge } from "@/components/status-badge";
import { RupiahInput } from "@/components/ui/rupiah-input";
import { formatDate, formatRupiah } from "@/lib/format";
import type { PemerintahProgramItem, ProgramUpdateItem } from "@/lib/data/pemerintah";
import { toProgramStatus } from "@/lib/status";
import { getErrorMessage } from "@/lib/error-message";

interface OpdOption {
  id: string;
  code: string;
  name: string;
}

interface Props {
  initialPrograms: PemerintahProgramItem[];
  opdList: OpdOption[];
}

export function PemerintahProkerManager({ initialPrograms, opdList }: Props) {
  const router = useRouter();
  const [programs] = useState<PemerintahProgramItem[]>(initialPrograms);
  const [search, setSearch] = useState("");
  const [selectedOpd, setSelectedOpd] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<PemerintahProgramItem | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyProgram, setHistoryProgram] = useState<PemerintahProgramItem | null>(null);
  const [historyList, setHistoryList] = useState<ProgramUpdateItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignedOpds, setFormAssignedOpds] = useState<string[]>([]);
  const [formBudgetPagu, setFormBudgetPagu] = useState<number>(0);
  const [formBudgetRealization, setFormBudgetRealization] = useState<number>(0);
  const [formTargetOutput, setFormTargetOutput] = useState<number>(100);
  const [formRealizationOutput, setFormRealizationOutput] = useState<number>(0);
  const [formTargetUnit, setFormTargetUnit] = useState<string>("%");
  const [formStartDate, setFormStartDate] = useState<string>("2026-01-01");
  const [formEndDate, setFormEndDate] = useState<string>("2026-12-31");
  const [formStatus, setFormStatus] = useState<string>("SESUAI_JADWAL");

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      if (selectedStatus !== "all" && p.status !== selectedStatus) {
        return false;
      }
      if (selectedOpd !== "all") {
        const matchesPrimary = p.opdId === selectedOpd;
        const matchesAssigned = p.assignedOpds.some((o) => o.id === selectedOpd);
        if (!matchesPrimary && !matchesAssigned) return false;
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
  }, [programs, selectedStatus, selectedOpd, search]);

  function openCreateModal() {
    setIsEditing(false);
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormAssignedOpds(opdList.length > 0 && opdList[0] ? [opdList[0].id] : []);
    setFormBudgetPagu(0);
    setFormBudgetRealization(0);
    setFormTargetOutput(100);
    setFormRealizationOutput(0);
    setFormTargetUnit("%");
    setFormStartDate("2026-01-01");
    setFormEndDate("2026-12-31");
    setFormStatus("SESUAI_JADWAL");
    setErrorMessage(null);
    setFormOpen(true);
  }

  function openEditModal(program: PemerintahProgramItem) {
    setIsEditing(true);
    setEditingId(program.id);
    setFormName(program.name);
    setFormCode(program.code);
    setFormDescription(program.description);
    setFormAssignedOpds(
      program.assignedOpds.length > 0
        ? program.assignedOpds.map((o) => o.id)
        : program.opdId
        ? [program.opdId]
        : []
    );
    setFormBudgetPagu(program.budgetPagu);
    setFormBudgetRealization(program.budgetRealization);
    setFormTargetOutput(program.targetOutput);
    setFormRealizationOutput(program.realizationOutput);
    setFormTargetUnit(program.targetUnit);
    setFormStartDate(program.startDate);
    setFormEndDate(program.endDate);
    setFormStatus(program.status);
    setErrorMessage(null);
    setFormOpen(true);
  }

  function toggleOpdSelection(id: string) {
    setFormAssignedOpds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }

  async function openHistoryDialog(program: PemerintahProgramItem) {
    setHistoryProgram(program);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryList([]);

    try {
      const res = await fetch(`/api/pemerintah/programs/${program.id}/updates`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.updates || []);
      }
    } catch {
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSaveProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage("Nama program kerja wajib diisi.");
      return;
    }
    if (formAssignedOpds.length === 0) {
      setErrorMessage("Pilih minimal satu dinas (OPD) pelaksana program kerja.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const payload = {
      name: formName,
      code: formCode || undefined,
      description: formDescription,
      assignedOpdIds: formAssignedOpds,
      budgetPagu: Number(formBudgetPagu) || 0,
      budgetRealization: Number(formBudgetRealization) || 0,
      targetOutput: Number(formTargetOutput) || 100,
      realizationOutput: Number(formRealizationOutput) || 0,
      targetUnit: formTargetUnit,
      startDate: formStartDate,
      endDate: formEndDate,
      status: formStatus,
    };

    try {
      if (isEditing && editingId) {
        const res = await fetch(`/api/pemerintah/programs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal memperbarui program kerja");
        }
      } else {
        const res = await fetch("/api/pemerintah/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal membuat program kerja");
        }
      }

      setFormOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Terjadi kesalahan saat menyimpan"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProgram() {
    if (!deletingProgram) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pemerintah/programs/${deletingProgram.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus program kerja");
      }
      setDeleteOpen(false);
      setDeletingProgram(null);
      router.refresh();
      window.location.reload();
    } catch (err) {
      alert(getErrorMessage(err, "Gagal menghapus program"));
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
              placeholder="Cari program kerja / kode..."
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
            <option value="all">Semua Instansi (OPD)</option>
            {opdList.map((opd) => (
              <option key={opd.id} value={opd.id}>
                {opd.name}
              </option>
            ))}
          </select>

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
            <option value="SELESAI">Selesai</option>
          </select>
        </div>

        <Button
          onClick={openCreateModal}
          className="gap-1.5 self-start sm:self-auto h-9 text-xs font-semibold"
        >
          <Plus className="size-4" />
          <span>Tambah Program Kerja</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-muted text-xs font-semibold text-fg-muted">
              <tr className="h-12">
                <th className="py-2 px-4 w-12 text-center whitespace-nowrap">No</th>
                <th className="py-2 px-4 whitespace-nowrap">Nama Program & Kode</th>
                <th className="py-2 px-4 whitespace-nowrap">Instansi Pelaksana (OPD)</th>
                <th className="py-2 px-4 text-center w-36 whitespace-nowrap">Capaian Fisik</th>
                <th className="py-2 px-4 text-right whitespace-nowrap">Realisasi Keuangan</th>
                <th className="py-2 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-2 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-fg-muted">
                    Tidak ada program kerja yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program, index) => (
                  <tr
                    key={program.id}
                    className="h-14 transition-colors duration-150 hover:bg-surface-muted/50"
                  >
                    <td className="py-2 px-4 text-center font-semibold text-fg-muted tabular-nums whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="py-2 px-4 max-w-[260px] whitespace-nowrap">
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-fg truncate" title={program.name}>
                          {program.name}
                        </span>
                        <span className="text-xs text-fg-muted font-mono">{program.code}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 max-w-[220px] whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-1">
                        {program.assignedOpds.length > 0 ? (
                          program.assignedOpds.map((opd) => (
                            <span
                              key={opd.id}
                              className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary truncate max-w-[140px]"
                              title={opd.name}
                            >
                              {opd.code}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-fg-muted">{program.opdName}</span>
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
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <ProgramStatusBadge status={toProgramStatus(program.status)} />
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openHistoryDialog(program)}
                          className="h-8 gap-1 text-xs"
                          title="Lihat riwayat perkembangan & bukti foto dinas"
                        >
                          <History className="size-3.5" />
                          <span>Bukti</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(program)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Edit className="size-3.5" />
                          <span>Ubah</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingProgram(program);
                            setDeleteOpen(true);
                          }}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEditing ? "Ubah Program Kerja" : "Tambah Program Kerja Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-muted">
              Isi data detail program kerja strategis daerah dan tentukan dinas penanggung jawab pelaksana.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSaveProgram} className="flex flex-col gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-fg">Nama Program Kerja *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Peningkatan Jalan & Drainase Protokol"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Kode Program (Unik)</label>
                <input
                  type="text"
                  placeholder="Contoh: PRK-007 (kosongkan untuk otomatis)"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-3 text-sm font-mono text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Status Pelaksanaan</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-2.5 text-xs font-medium text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="BELUM_DIMULAI">Belum Dimulai</option>
                  <option value="SESUAI_JADWAL">Sesuai Jadwal</option>
                  <option value="TERLAMBAT">Dalam Percepatan</option>
                  <option value="MELEWATI_TENGGAT">Tahap Penyelesaian</option>
                  <option value="SELESAI">Selesai 100%</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-fg">Deskripsi Program Kerja</label>
                <textarea
                  rows={2}
                  placeholder="Uraian sasaran, ruang lingkup pengerjaan, dan manfaat bagi masyarakat..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="rounded-md border bg-surface p-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2 rounded-md border bg-surface-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-fg">
                    Instansi Pelaksana (OPD) *
                  </label>
                  <span className="text-[11px] text-fg-muted">
                    Bisa memilih lebih dari 1 dinas
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {opdList.map((opd) => {
                    const isSelected = formAssignedOpds.includes(opd.id);
                    return (
                      <button
                        key={opd.id}
                        type="button"
                        onClick={() => toggleOpdSelection(opd.id)}
                        className={`flex items-center justify-between rounded-md border p-2 text-left text-xs transition-colors duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border bg-surface text-fg hover:bg-surface-muted"
                        }`}
                      >
                        <span className="truncate pr-2">{opd.name}</span>
                        {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Pagu Anggaran (Rp)</label>
                <RupiahInput
                  value={formBudgetPagu}
                  onChange={(val) => setFormBudgetPagu(val)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Realisasi Anggaran (Rp)</label>
                <RupiahInput
                  value={formBudgetRealization}
                  onChange={(val) => setFormBudgetRealization(val)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Target Fisik (Angka)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formTargetOutput}
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => setFormTargetOutput(Number(e.target.value.replace(/^0+(?=\d)/, "")))}
                  className="h-9 rounded-md border bg-surface px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-fg">Realisasi Fisik</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formRealizationOutput}
                      onFocus={(e) => {
                        if (e.currentTarget.value === "0") e.currentTarget.select();
                      }}
                      onChange={(e) => setFormRealizationOutput(Number(e.target.value.replace(/^0+(?=\d)/, "")))}
                      className="h-9 rounded-md border bg-surface px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="w-24 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-fg">Satuan</label>
                    <input
                      type="text"
                      placeholder="km / unit"
                      value={formTargetUnit}
                      onChange={(e) => setFormTargetUnit(e.target.value)}
                      className="h-9 rounded-md border bg-surface px-2.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Tanggal Mulai</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-3 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-fg">Tanggal Selesai</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="h-9 rounded-md border bg-surface px-3 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : isEditing ? "Perbarui Program" : "Simpan Program"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600">
              Hapus Program Kerja?
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-muted">
              Apakah Anda yakin ingin menghapus program{" "}
              <strong className="text-fg">{deletingProgram?.name}</strong> ({deletingProgram?.code})? Tindakan ini akan menghapus data terkait dari sistem database secara permanen.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteProgram}
              disabled={loading}
              className="border-red-200 bg-red-600 text-white hover:bg-red-700"
            >
              {loading ? "Menghapus..." : "Ya, Hapus Program"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        {historyProgram && (
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="font-mono font-semibold">{historyProgram.code}</span>
                <span>•</span>
                <span>{historyProgram.assignedOpds.length} Dinas Pelaksana</span>
              </div>
              <DialogTitle className="text-lg font-bold">
                Riwayat Perkembangan & Dokumentasi Lapangan
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
                  Belum ada laporan perkembangan atau dokumentasi yang diserahkan oleh dinas terkait.
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
