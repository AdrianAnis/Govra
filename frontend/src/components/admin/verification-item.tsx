"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, ImageIcon } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { SelectField } from "@/components/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminCall } from "@/lib/admin-client";
import { REJECTION_OPTIONS, TRANSFER_LABEL, type RejectionReason } from "@/lib/agency";
import { FIELD_CLASS } from "@/lib/field-style";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface VerificationItemProps {
  item: Schema<"VerificationItem"> & {
    photo_urls?: string[];
    summary?: string;
  };
  opds: readonly Schema<"OpdDetail">[];
  now: string;
}

function VerificationItem({ item, opds, now }: VerificationItemProps) {
  const router = useRouter();
  const suggestion = item.ai_suggestion as (Schema<"AiSuggestion"> & {
    is_unregistered_opd?: boolean;
    recommended_action?: string;
  }) | null;

  const isUnregistered =
    suggestion?.is_unregistered_opd || suggestion?.opd.code === "TIDAK_TERDAFTAR";

  const defaultOpdCode = isUnregistered ? null : (suggestion?.opd.code ?? null);
  const defaultCatCode = isUnregistered ? null : (suggestion?.category.code ?? null);

  const [opdCode, setOpdCode] = useState<string | null>(defaultOpdCode);
  const [categoryCode, setCategoryCode] = useState<string | null>(defaultCatCode);
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [explanation, setExplanation] = useState("");
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ title: string; message: string; opdName?: string } | null>(null);
  const [isHandled, setIsHandled] = useState(false);

  const activeOpds = opds.filter((opd) => opd.active);
  const categories =
    activeOpds.find((opd) => opd.code === opdCode)?.categories.filter((category) => category.active) ?? [];

  const reset = () => {
    setOpdCode(defaultOpdCode);
    setCategoryCode(defaultCatCode);
    setReason(null);
    setExplanation("");
  };

  const route = async () => {
    if (!opdCode) {
      throw new Error("Pilih OPD tujuan terlebih dahulu.");
    }
    const catCode = categoryCode || categories[0]?.code || "UMUM";
    const targetOpd = activeOpds.find((o) => o.code === opdCode);
    const targetOpdName = targetOpd?.name || opdCode;

    await adminCall("POST", `/issues/${item.issue_id}/route`, {
      opd_code: opdCode,
      category_code: catCode,
    });

    setSuccessInfo({
      title: "Laporan Berhasil Diteruskan!",
      message: `Laporan warga "${item.title}" telah berhasil disetujui dan diteruskan ke ${targetOpdName}. Status di database telah diperbarui menjadi DITERUSKAN.`,
      opdName: targetOpdName,
    });
    setIsHandled(true);
  };

  const reject = async () => {
    if (!reason) {
      throw new Error("Pilih alasan penolakan terlebih dahulu.");
    }
    const reasonLabel = REJECTION_OPTIONS.find((o) => o.value === reason)?.label || reason;
    await adminCall("POST", `/issues/${item.issue_id}/reject`, { reason, explanation });

    setSuccessInfo({
      title: "Laporan Berhasil Ditolak",
      message: `Laporan warga "${item.title}" telah ditolak dengan alasan: ${reasonLabel}. Status di database telah diperbarui menjadi DITOLAK.`,
    });
    setIsHandled(true);
  };

  if (isHandled && !successInfo) {
    return (
      <article className="flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
              Laporan telah diproses: {item.title}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400">
              Perubahan status telah tersimpan ke database.
            </span>
          </div>
        </div>
      </article>
    );
  }

  const photos = item.photo_urls && item.photo_urls.length > 0 ? item.photo_urls : [];

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge weight={item.kind === "VERIFIKASI" ? "netral" : "perhatian"}>
              {item.kind === "VERIFIKASI" ? "Verifikasi Baru" : "Pengalihan"}
            </Badge>
            <p className="text-xs sm:text-sm text-fg-muted font-medium">
              {formatNumber(item.reporter_count)} pelapor · {formatRelativeTime(item.created_at, new Date(now))}
            </p>
          </div>
          {isUnregistered && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/60 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
              <AlertTriangle className="size-3.5" />
              Tidak Masuk Dinas Terdaftar
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-xl leading-snug font-semibold text-fg">{item.title}</h2>

        {item.summary && (
          <p className="text-xs sm:text-sm text-fg leading-relaxed bg-surface-muted/60 rounded-md p-3 border border-border/60">
            {item.summary}
          </p>
        )}

        {isUnregistered ? (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Laporan ini tidak masuk ke dinas manapun yang terdaftar.</span>
              <span className="text-xs text-amber-800 dark:text-amber-300">
                AI tidak menemukan kecocokan dengan 5 dinas utama. Mohon lakukan pengecekan manual dan tentukan dinas tujuan atau lakukan penolakan jika tidak relevan.
              </span>
            </div>
          </div>
        ) : suggestion ? (
          <div className="flex flex-col gap-1.5 rounded-md border border-primary/20 bg-primary-soft/50 p-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
              <span className="text-primary font-semibold">Rekomendasi AI:</span>
              <span className="text-fg font-semibold">{suggestion.opd.name}</span>
              <span className="text-fg-muted">· Kategori: {suggestion.category.name}</span>
              <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                {Math.round(suggestion.confidence * 100)}% keyakinan
              </span>
            </div>
            {suggestion.recommended_action && (
              <p className="text-xs text-fg-muted">{suggestion.recommended_action}</p>
            )}
          </div>
        ) : null}

        {item.current_opd && (
          <p className="text-xs sm:text-sm text-fg-muted">
            Dialihkan oleh <span className="font-semibold text-fg">{item.current_opd.name}</span>
            {item.transfer_reason ? `: ${TRANSFER_LABEL[item.transfer_reason]}.` : "."}
            {item.transfer_note ? ` ${item.transfer_note}` : ""}
          </p>
        )}

        {photos.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
              <ImageIcon className="size-3.5" />
              <span>Foto Bukti Laporan ({photos.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {photos.map((src, idx) => (
                <button
                  key={src + idx}
                  type="button"
                  onClick={() => setActivePhoto(src)}
                  className="group relative size-16 sm:size-20 overflow-hidden rounded-md border border-border bg-surface-muted transition-all hover:ring-2 hover:ring-primary focus:outline-none"
                >
                  <Image
                    src={src}
                    alt={`Foto ${idx + 1}`}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="80px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <ExternalLink className="size-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60 lg:border-t-0 lg:pt-0">
        <FormDialog
          triggerLabel="Tolak Laporan"
          triggerVariant="outline"
          triggerSize="default"
          title="Tolak Laporan Warga"
          description="Berikan alasan yang jelas mengapa laporan ini ditolak agar pelapor dapat memahami keputusannya."
          submitLabel="Konfirmasi Penolakan"
          onSubmit={reject}
          onReset={reset}
        >
          <SelectField
            id={`reason-${item.issue_id}`}
            label="Alasan Penolakan"
            value={reason}
            options={REJECTION_OPTIONS}
            placeholder="Pilih alasan penolakan"
            onChange={setReason}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor={`explanation-${item.issue_id}`} className="text-sm font-semibold">
                Penjelasan Tambahan
              </label>
              <span className="text-xs text-fg-muted tabular-nums">{explanation.length}/1000</span>
            </div>
            <Textarea
              id={`explanation-${item.issue_id}`}
              value={explanation}
              maxLength={1000}
              placeholder="Jelaskan secara rinci alasan penolakan laporan ini..."
              onChange={(event) => setExplanation(event.target.value)}
              className={cn(FIELD_CLASS, "min-h-28 py-3")}
            />
          </div>
        </FormDialog>

        <FormDialog
          triggerLabel="Teruskan ke Dinas"
          triggerVariant="primary"
          triggerSize="default"
          title="Teruskan Laporan ke Dinas"
          description="Verifikasi rekomendasi AI dan tentukan dinas serta kategori yang berwenang menindaklanjuti laporan ini."
          submitLabel="Teruskan Laporan"
          onSubmit={route}
          onReset={reset}
        >
          <SelectField
            id={`opd-${item.issue_id}`}
            label="Dinas Tujuan"
            value={opdCode}
            options={activeOpds.map((opd) => ({ value: opd.code, label: opd.name }))}
            placeholder="Pilih Dinas Tujuan"
            onChange={(value) => {
              setOpdCode(value);
              setCategoryCode(null);
            }}
          />
          <SelectField
            id={`category-${item.issue_id}`}
            label="Kategori Masalah"
            value={categoryCode}
            options={categories.map((category) => ({ value: category.code, label: category.name }))}
            placeholder={opdCode ? "Pilih kategori masalah" : "Pilih dinas tujuan terlebih dahulu"}
            disabled={!opdCode}
            onChange={setCategoryCode}
          />
        </FormDialog>
      </div>

      <Dialog open={Boolean(activePhoto)} onOpenChange={(open) => !open && setActivePhoto(null)}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Dokumentasi Laporan</DialogTitle>
          </DialogHeader>
          {activePhoto && (
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-black/90">
              <Image
                src={activePhoto}
                alt="Foto Dokumentasi Penuh"
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(successInfo)}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessInfo(null);
            router.refresh();
          }
        }}
      >
        <DialogContent className="max-w-md p-6 text-center flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="size-8" />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg font-bold text-fg">{successInfo?.title}</DialogTitle>
            <p className="text-sm text-fg-muted leading-relaxed">{successInfo?.message}</p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-full mt-2"
            onClick={() => {
              setSuccessInfo(null);
              router.refresh();
            }}
          >
            Selesai & Tutup
          </Button>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export { VerificationItem };
