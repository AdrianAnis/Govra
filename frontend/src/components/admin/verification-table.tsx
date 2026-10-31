"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { SelectField } from "@/components/select-field";
import { IssueStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { adminCall } from "@/lib/admin-client";
import { REJECTION_OPTIONS, type RejectionReason } from "@/lib/agency";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import type { IssueStatus } from "@/lib/status";
import type { VerificationTableItem } from "@/lib/data/admin";
import { getErrorMessage } from "@/lib/error-message";

interface VerificationTableProps {
  items: readonly VerificationTableItem[];
  opds: readonly Schema<"OpdDetail">[];
  now: string;
}

export function VerificationTable({ items: initialItems, opds, now }: VerificationTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<VerificationTableItem[]>([...initialItems]);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  if (syncedItems !== initialItems) {
    setSyncedItems(initialItems);
    setItems([...initialItems]);
  }
  const [activeItem, setActiveItem] = useState<VerificationTableItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [selectedOpdCode, setSelectedOpdCode] = useState<string | null>(null);
  const [selectedCatCode, setSelectedCatCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<RejectionReason | null>(null);
  const [rejectionExplanation, setRejectionExplanation] = useState("");
  const [showReassignForm, setShowReassignForm] = useState(false);

  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; opdName?: string } | null>(null);

  const activeOpds = opds.filter((opd) => opd.active);
  const targetOpd = activeOpds.find((o) => o.code === selectedOpdCode);
  const categories = targetOpd?.categories.filter((cat) => cat.active) ?? [];

  const openDetail = (item: VerificationTableItem) => {
    setActiveItem(item);
    setErrorMsg(null);
    setShowReassignForm(false);
    const suggestion = item.ai_suggestion;
    const isUnreg = suggestion?.is_unregistered_opd || suggestion?.opd?.code === "TIDAK_TERDAFTAR";
    setSelectedOpdCode(isUnreg ? null : (item.current_opd?.code || suggestion?.opd?.code || null));
    setSelectedCatCode(isUnreg ? null : (suggestion?.category?.code || null));
    setIsDrawerOpen(true);
  };

  const handleRoute = async () => {
    if (!activeItem) return;
    if (!selectedOpdCode) {
      setErrorMsg("Pilih OPD tujuan terlebih dahulu.");
      return;
    }
    const catCode = selectedCatCode || categories[0]?.code || "UMUM";
    const opdName = activeOpds.find((o) => o.code === selectedOpdCode)?.name || selectedOpdCode;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await adminCall("POST", `/issues/${activeItem.issue_id}/route`, {
        opd_code: selectedOpdCode,
        category_code: catCode,
      });

      const updatedOpd = {
        code: selectedOpdCode,
        name: opdName,
        slug: selectedOpdCode.toLowerCase(),
      };

      setItems((prev) =>
        prev.map((it) =>
          it.issue_id === activeItem.issue_id
            ? { ...it, status: "DITERUSKAN", current_opd: updatedOpd }
            : it,
        ),
      );
      if (activeItem) {
        setActiveItem({
          ...activeItem,
          status: "DITERUSKAN",
          current_opd: updatedOpd,
        });
      }

      setSuccessInfo({
        title: "Laporan Berhasil Diteruskan",
        message: `Laporan "${activeItem.title}" telah disetujui dan diteruskan ke ${opdName}.`,
        opdName,
      });
      setShowReassignForm(false);
      setIsDrawerOpen(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Gagal meneruskan laporan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!activeItem) return;
    if (!rejectionReason) {
      setErrorMsg("Pilih alasan penolakan terlebih dahulu.");
      return;
    }
    const reasonLabel = REJECTION_OPTIONS.find((o) => o.value === rejectionReason)?.label || rejectionReason;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await adminCall("POST", `/issues/${activeItem.issue_id}/reject`, {
        reason: rejectionReason,
        explanation: rejectionExplanation,
      });

      setItems((prev) =>
        prev.map((it) =>
          it.issue_id === activeItem.issue_id
            ? {
                ...it,
                status: "DITOLAK",
                transfer_reason: rejectionReason,
                transfer_note: rejectionExplanation,
              }
            : it,
        ),
      );
      if (activeItem) {
        setActiveItem({
          ...activeItem,
          status: "DITOLAK",
          transfer_reason: rejectionReason,
          transfer_note: rejectionExplanation,
        });
      }

      setIsRejectDialogOpen(false);
      setSuccessInfo({
        title: "Laporan Berhasil Ditolak",
        message: `Laporan "${activeItem.title}" ditolak dengan alasan: ${reasonLabel}.`,
      });
      setIsDrawerOpen(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Gagal menolak laporan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toIssueStatus = (statusStr?: string): IssueStatus => {
    const valid: IssueStatus[] = [
      "DIAJUKAN",
      "MENUNGGU_VERIFIKASI",
      "DITERUSKAN",
      "DIPROSES",
      "SELESAI",
      "DITOLAK",
      "DIALIHKAN",
    ];
    if (statusStr && valid.includes(statusStr as IssueStatus)) {
      return statusStr as IssueStatus;
    }
    return "DIAJUKAN";
  };

  const getStatusSummaryText = (statusStr?: string) => {
    switch (statusStr) {
      case "DIAJUKAN":
      case "MENUNGGU_VERIFIKASI":
        return "Laporan menunggu verifikasi & persetujuan dari Admin Pusat untuk diteruskan ke dinas terkait.";
      case "DITERUSKAN":
        return "Laporan telah disetujui Admin Pusat dan telah diteruskan ke antrean kerja dinas terkait.";
      case "DIPROSES":
        return "Laporan sedang dalam tindak lanjut aktif oleh tim teknis lapangan dinas terkait.";
      case "SELESAI":
        return "Penanganan masalah pada laporan ini telah selesai dituntaskan oleh dinas terkait.";
      case "DITOLAK":
        return "Laporan tidak dapat diproses lebih lanjut dan telah ditolak oleh Admin Pusat.";
      case "DIALIHKAN":
        return "Laporan sedang dalam proses pengalihan wewenang antar dinas.";
      default:
        return "Informasi status laporan terdaftar di database sistem.";
    }
  };

  return (
    <>
      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs font-semibold text-fg-muted uppercase tracking-wider">
                <th className="px-5 py-3.5">Kode</th>
                <th className="px-5 py-3.5">Waktu</th>
                <th className="px-5 py-3.5 min-w-[280px]">Judul Laporan</th>
                <th className="px-5 py-3.5 min-w-[220px]">Dinas / AI</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const suggestion = item.ai_suggestion;
                const isUnreg =
                  suggestion?.is_unregistered_opd || suggestion?.opd?.code === "TIDAK_TERDAFTAR";
                const isPending =
                  item.status === "DIAJUKAN" || item.status === "MENUNGGU_VERIFIKASI";
                const issueStatus = toIssueStatus(item.status);
                const assignedOpdName = item.current_opd?.name || suggestion?.opd.name;

                return (
                  <tr
                    key={item.issue_id}
                    onClick={() => openDetail(item)}
                    className="hover:bg-primary-soft/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4 font-mono text-sm font-medium text-fg whitespace-nowrap tabular-nums">
                      {item.code || "GVR-2610-0000"}
                    </td>

                    <td className="px-5 py-4 text-sm text-fg-muted whitespace-nowrap tabular-nums">
                      {formatRelativeTime(item.created_at, new Date(now))}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-fg group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </span>
                        {item.summary && (
                          <span className="text-xs text-fg-subtle line-clamp-1">
                            {item.summary}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {isUnreg ? (
                        <span className="text-sm text-fg font-medium">
                          Tidak Masuk Dinas
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-fg">
                            {assignedOpdName || "-"}
                          </span>
                          {suggestion && (
                            <span className="text-xs text-fg-subtle tabular-nums">
                              {suggestion.category.name} · {Math.round(suggestion.confidence * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <IssueStatusBadge status={issueStatus} />
                    </td>

                    <td
                      className="px-5 py-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant={isPending ? "primary" : "outline"}
                        size="sm"
                        onClick={() => openDetail(item)}
                        className="text-xs h-9 px-3"
                      >
                        <span>{isPending ? "Verifikasi" : "Detail"}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {items.map((item) => {
            const suggestion = item.ai_suggestion;
            const isUnreg =
              suggestion?.is_unregistered_opd || suggestion?.opd?.code === "TIDAK_TERDAFTAR";
            const isPending =
              item.status === "DIAJUKAN" || item.status === "MENUNGGU_VERIFIKASI";
            const issueStatus = toIssueStatus(item.status);
            const assignedOpdName = item.current_opd?.name || suggestion?.opd.name;

            return (
              <div
                key={item.issue_id}
                onClick={() => openDetail(item)}
                className="p-4 flex flex-col gap-3 hover:bg-primary-soft/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium text-fg tabular-nums">
                    {item.code || "GVR-2610-0000"}
                  </span>
                  <IssueStatusBadge status={issueStatus} />
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-fg leading-snug">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-sm text-fg-muted line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-fg-subtle pt-1 border-t border-border">
                  <span className="tabular-nums">
                    {formatRelativeTime(item.created_at, new Date(now))}
                  </span>
                  <span>
                    {isUnreg ? "Tidak Masuk Dinas" : (assignedOpdName ?? "-")}
                  </span>
                </div>

                <Button
                  type="button"
                  variant={isPending ? "primary" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(item);
                  }}
                  className="w-full text-sm h-11"
                >
                  <span>{isPending ? "Verifikasi Laporan" : "Lihat Detail"}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-surface"
        >
          {activeItem && (
            <>
              <SheetHeader className="p-6 border-b border-border sticky top-0 bg-surface z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium text-fg-muted tabular-nums">
                      {activeItem.code || "GVR-2610-0000"}
                    </span>
                    <IssueStatusBadge status={toIssueStatus(activeItem.status)} />
                  </div>
                  <SheetTitle className="text-lg font-semibold text-fg leading-snug">
                    {activeItem.title}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="rounded-md border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                      Status & Distribusi
                    </span>
                    <IssueStatusBadge status={toIssueStatus(activeItem.status)} />
                  </div>

                  <p className="text-sm text-fg-muted leading-relaxed">
                    {getStatusSummaryText(activeItem.status)}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border text-sm">
                    <div>
                      <span className="text-xs text-fg-subtle block">Dinas Terkait</span>
                      <span className="font-medium text-fg">
                        {activeItem.current_opd?.name || activeItem.ai_suggestion?.opd.name || "Belum Ditentukan"}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-fg-subtle block">Kategori Masalah</span>
                      <span className="font-medium text-fg">
                        {activeItem.ai_suggestion?.category.name || "Umum"}
                      </span>
                    </div>
                  </div>

                  {activeItem.status === "DITOLAK" && (
                    <div className="rounded-md border border-border-strong bg-surface-muted p-3 space-y-1 text-sm">
                      <span className="text-xs font-semibold text-fg block">
                        Alasan Penolakan:
                      </span>
                      <p className="text-fg-muted text-xs leading-relaxed">
                        {activeItem.transfer_reason ? activeItem.transfer_reason : "Laporan tidak memenuhi kriteria penanganan dinas."}
                      </p>
                      {activeItem.transfer_note && (
                        <p className="text-xs text-fg-muted border-t border-border pt-1 mt-1">
                          Keterangan: {activeItem.transfer_note}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Ceritakan Apa yang Terjadi
                  </span>
                  <div className="rounded-md border border-border bg-surface-muted p-4 text-sm text-fg leading-relaxed">
                    {activeItem.summary || "Tidak ada deskripsi tambahan dari pelapor."}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-fg-subtle pt-1 tabular-nums">
                    <span>{formatNumber(activeItem.reporter_count)} warga mendukung</span>
                    <span>·</span>
                    <span>Dilaporkan {formatRelativeTime(activeItem.created_at, new Date(now))}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Lampiran Foto ({activeItem.photo_urls?.length || 0})
                  </span>
                  {activeItem.photo_urls && activeItem.photo_urls.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {activeItem.photo_urls.map((src, idx) => (
                        <button
                          key={src + idx}
                          type="button"
                          onClick={() => setActivePhoto(src)}
                          className="relative size-24 overflow-hidden rounded-md border border-border bg-surface-muted hover:border-fg-muted transition-colors focus:outline-none"
                        >
                          <Image
                            src={src}
                            alt={`Foto ${idx + 1}`}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-border bg-surface-muted p-4 text-xs text-fg-muted">
                      Tidak ada lampiran foto pada laporan ini.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                  <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Analisis Sistem AI
                  </span>

                  {activeItem.ai_suggestion?.is_unregistered_opd ||
                  activeItem.ai_suggestion?.opd.code === "TIDAK_TERDAFTAR" ? (
                    <div className="rounded-md border border-border-strong bg-surface-muted p-4 text-sm text-fg space-y-1">
                      <p className="font-medium">
                        Laporan ini tidak cocok dengan dinas terdaftar.
                      </p>
                      <p className="text-xs text-fg-muted leading-relaxed">
                        Sistem tidak menemukan kesesuaian dengan 5 dinas utama. Mohon tentukan dinas tujuan secara manual atau tolak laporan jika tidak relevan.
                      </p>
                    </div>
                  ) : activeItem.ai_suggestion ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-fg font-medium">
                          {activeItem.ai_suggestion.opd.name}
                        </span>
                        <span className="text-fg-muted tabular-nums">
                          {Math.round(activeItem.ai_suggestion.confidence * 100)}% keyakinan
                        </span>
                      </div>
                      <div className="text-xs text-fg-subtle">
                        Kategori: {activeItem.ai_suggestion.category.name}
                      </div>
                      {activeItem.ai_suggestion.recommended_action && (
                        <p className="text-xs text-fg-muted border-t border-border pt-2 leading-relaxed">
                          {activeItem.ai_suggestion.recommended_action}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-fg-muted">Data analisis AI tidak tersedia.</p>
                  )}
                </div>

                {activeItem.status === "DIAJUKAN" ||
                activeItem.status === "MENUNGGU_VERIFIKASI" ||
                activeItem.status === "DIALIHKAN" ||
                showReassignForm ? (
                  <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-fg uppercase tracking-wider">
                        {showReassignForm ? "Alihkan / Ubah Dinas Tujuan" : "Teruskan Laporan"}
                      </span>
                      {showReassignForm && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowReassignForm(false)}
                          className="text-xs h-7 px-2"
                        >
                          Batal
                        </Button>
                      )}
                    </div>

                    {errorMsg && (
                      <div className="rounded-md border border-border-strong bg-surface-muted p-3 text-sm text-fg">
                        {errorMsg}
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                      <SelectField
                        id="target-opd"
                        label="Dinas Tujuan"
                        value={selectedOpdCode}
                        options={activeOpds.map((o) => ({ value: o.code, label: o.name }))}
                        onChange={(val) => {
                          setSelectedOpdCode(val);
                          setSelectedCatCode(null);
                        }}
                        placeholder="Pilih Dinas Tujuan"
                      />

                      {categories.length > 0 && (
                        <SelectField
                          id="target-cat"
                          label="Kategori Isu"
                          value={selectedCatCode}
                          options={categories.map((c) => ({ value: c.code, label: c.name }))}
                          onChange={(val) => setSelectedCatCode(val)}
                          placeholder="Pilih Kategori"
                        />
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleRoute}
                        disabled={isSubmitting || !selectedOpdCode}
                        className="flex-1 h-11 text-sm"
                      >
                        <span>{isSubmitting ? "Meneruskan..." : (showReassignForm ? "Perbarui Dinas" : "Teruskan ke Dinas")}</span>
                      </Button>

                      {(!showReassignForm || activeItem.status === "DIAJUKAN" || activeItem.status === "MENUNGGU_VERIFIKASI") && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRejectionReason(null);
                            setRejectionExplanation("");
                            setIsRejectDialogOpen(true);
                          }}
                          disabled={isSubmitting}
                          className="h-11 text-sm"
                        >
                          <span>Tolak Laporan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-fg">Pembaruan Jalur Distribusi</span>
                      <span className="text-xs text-fg-muted">Perlu mengubah dinas pengampu laporan ini?</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReassignForm(true)}
                      className="text-xs h-9 px-3 shrink-0"
                    >
                      <RefreshCw className="size-3.5 mr-1.5" />
                      <span>Alihkan Dinas</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Laporan Warga</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-fg-muted leading-relaxed">
              Pilih alasan penolakan agar warga menerima kejelasan terkait status laporannya.
            </p>

            <SelectField
              id="rejection-reason"
              label="Alasan Penolakan"
              value={rejectionReason}
              options={REJECTION_OPTIONS}
              onChange={(val) => setRejectionReason(val as RejectionReason)}
              placeholder="Pilih Alasan Penolakan"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="rejection-note" className="text-xs font-semibold text-fg">
                Penjelasan Tambahan
              </label>
              <Textarea
                id="rejection-note"
                value={rejectionExplanation}
                onChange={(e) => setRejectionExplanation(e.target.value)}
                placeholder="Tulis alasan tambahan untuk pelapor..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejectDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!rejectionReason || isSubmitting}
                onClick={handleReject}
              >
                {isSubmitting ? "Menolak..." : "Konfirmasi Penolakan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(successInfo)} onOpenChange={() => setSuccessInfo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-fg">
              {successInfo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2 text-sm text-fg">
            <p className="leading-relaxed text-sm text-fg-muted">
              {successInfo?.message}
            </p>
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setSuccessInfo(null)}
              >
                Selesai
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activePhoto)} onOpenChange={() => setActivePhoto(null)}>
        <DialogContent className="max-w-3xl p-2 bg-transparent border-none shadow-none">
          {activePhoto && (
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-secondary">
              <Image
                src={activePhoto}
                alt="Pratinjau Foto"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
