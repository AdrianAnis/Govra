"use client";

import { Globe, ImageIcon, Lock, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReportDraft } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: ReportDraft;
  districts: readonly Schema<"District">[];
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}

const VISIBILITY = {
  PUBLIK: { label: "Publik", icon: Globe },
  RAHASIA: { label: "Rahasia", icon: Lock },
} as const;

const CHIP_CLASS = "inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5 font-medium";

function PreviewDialog({ open, onOpenChange, draft, districts, pending, error, onConfirm }: PreviewDialogProps) {
  const district = districts.find((item) => item.id === draft.districtId);
  const village = (district?.villages ?? []).find((item) => item.id === draft.villageId);
  const place = [draft.addressDetail, village?.name, district?.name].filter(Boolean).join(", ");
  const visibility = VISIBILITY[draft.visibility];
  const title = draft.title.trim();

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent className="max-h-11/12 max-w-xl gap-6 overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="gap-1">
          <p className="text-sm font-semibold text-primary">Pratinjau laporan</p>
          <DialogTitle className="text-2xl">Periksa sebelum dikirim</DialogTitle>
          <DialogDescription className="text-base">Seperti inilah laporan Anda akan diterima.</DialogDescription>
        </DialogHeader>
        <article className="flex flex-col gap-5 rounded-lg bg-surface-muted p-5">
          {draft.files.length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {draft.files.map((item, index) => (
                <li key={item.id} className="relative aspect-4/3 overflow-hidden rounded-md bg-surface">
                  <Image
                    src={item.url}
                    alt={`Foto ${index + 1}`}
                    fill
                    unoptimized
                    sizes="160px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-2">
            <h3 className={title ? "text-xl leading-snug font-bold tracking-tight" : "text-xl font-semibold text-fg-muted"}>
              {title || "Laporan tanpa judul"}
            </h3>
            <p className="line-clamp-6 text-base break-words whitespace-pre-line">{draft.body.trim()}</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm">
            <li className={CHIP_CLASS}>
              <MapPin aria-hidden className="size-4 text-primary" />
              {place}
            </li>
            <li className={CHIP_CLASS}>
              <visibility.icon aria-hidden className="size-4 text-primary" />
              {visibility.label}
            </li>
            {draft.files.length > 0 && (
              <li className={CHIP_CLASS}>
                <ImageIcon aria-hidden className="size-4 text-primary" />
                {draft.files.length} foto
              </li>
            )}
          </ul>
        </article>
        {error && (
          <p role="alert" className="text-sm font-medium text-fg">
            {error}
          </p>
        )}
        <DialogFooter className="gap-3">
          <Button type="button" variant="ghost" size="lg" disabled={pending} onClick={() => onOpenChange(false)}>
            Periksa lagi
          </Button>
          <Button type="button" size="lg" disabled={pending} onClick={onConfirm}>
            {pending ? "Mengirim..." : "Kirim sekarang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PreviewDialog };
