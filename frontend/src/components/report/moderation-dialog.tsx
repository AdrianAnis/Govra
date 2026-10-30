"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModerationDialogProps {
  open: boolean;
  violationType: "SARA" | "PORNOGRAPHY" | "GIBBERISH" | string;
  reason?: string | undefined;
  onClose: () => void;
}

export function ModerationDialog({
  open,
  violationType,
  reason,
  onClose,
}: ModerationDialogProps) {
  let titleLabel = "Konten Tidak Memenuhi Pedoman";
  let explanation =
    "Deskripsi laporan yang Anda masukkan tidak dapat diproses karena terindikasi melanggar etika dan pedoman pengaduan publik.";

  if (violationType === "SARA") {
    titleLabel = "Terdeteksi Unsur SARA";
    explanation =
      "Konten laporan Anda terindikasi memuat ujaran kebencian, diskriminasi, atau penghinaan berbasis Suku, Agama, Ras, atau Antargolongan (SARA).";
  } else if (violationType === "PORNOGRAPHY") {
    titleLabel = "Terdeteksi Konten Pornografi";
    explanation =
      "Konten laporan Anda terindikasi memuat materi pornografi, konten seksual vulgar, atau asusila.";
  } else if (violationType === "GIBBERISH") {
    titleLabel = "Teks Tidak Jelas atau Acak";
    explanation =
      "Deskripsi laporan Anda terdeteksi berupa ketikan acak atau teks tanpa arti yang tidak menggambarkan permasalahan fasilitas/layanan publik nyata.";
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              {violationType === "SARA" || violationType === "PORNOGRAPHY" ? (
                <ShieldAlert className="size-6" />
              ) : (
                <AlertTriangle className="size-6" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Pemeriksaan Etika AI
              </span>
              <DialogTitle className="text-base sm:text-lg font-bold text-fg">
                Laporan Tidak Dapat Dilanjutkan
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm font-semibold text-fg">{titleLabel}</p>
          <p className="text-xs sm:text-sm text-fg-muted leading-relaxed">
            {explanation}
          </p>

          {reason && (
            <div className="rounded-md border border-red-200 bg-red-50/70 p-3 text-xs sm:text-sm text-red-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Catatan Sistem:</span>
              {reason}
            </div>
          )}

          <p className="text-xs text-fg-muted italic">
            Silakan perbaiki kolom &quot;Ceritakan apa yang terjadi&quot; agar sesuai dengan fakta pengaduan fasilitas atau ketertiban publik di Kota Bandung.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto px-5"
          >
            Perbaiki Laporan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
