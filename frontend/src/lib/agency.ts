import "@/lib/zod-config";
import { z } from "zod";
import type { Schema } from "@/lib/schema";

export type AgencyTransition = Schema<"AgencyTransition">;
export type RejectionReason = Schema<"RejectionReason">;
export type TransferReason = Schema<"TransferReason">;

export const MAX_EVIDENCE = 3;
export const MAX_RESPONSE_LENGTH = 2000;

export const TRANSITION_LABEL: Record<AgencyTransition, string> = {
  DIPROSES: "Proses",
  SELESAI: "Tandai selesai",
  DITOLAK: "Tolak",
  DIALIHKAN: "Ajukan pengalihan",
};

export const TRANSITION_TITLE: Record<AgencyTransition, string> = {
  DIPROSES: "Mulai proses isu",
  SELESAI: "Tandai isu selesai",
  DITOLAK: "Tolak isu",
  DIALIHKAN: "Ajukan pengalihan",
};

export const REJECTION_LABEL: Record<RejectionReason, string> = {
  DUPLIKAT: "Duplikat isu lain",
  DATA_TIDAK_LENGKAP: "Data tidak lengkap",
  BUKAN_MASALAH_PUBLIK: "Bukan masalah publik",
  SUDAH_DITANGANI: "Sudah ditangani",
  LAPORAN_TIDAK_BENAR: "Laporan tidak benar",
};

export const TRANSFER_LABEL: Record<TransferReason, string> = {
  BUKAN_WEWENANG_OPD: "Bukan wewenang OPD ini",
  PERLU_OPD_LAIN: "Perlu ditangani OPD lain",
  KATEGORI_SALAH: "Kategori salah",
};

export const REJECTION_OPTIONS = (
  ["DUPLIKAT", "DATA_TIDAK_LENGKAP", "BUKAN_MASALAH_PUBLIK", "SUDAH_DITANGANI", "LAPORAN_TIDAK_BENAR"] as const
).map((value) => ({ value, label: REJECTION_LABEL[value] }));

export const TRANSFER_OPTIONS = (["BUKAN_WEWENANG_OPD", "PERLU_OPD_LAIN", "KATEGORI_SALAH"] as const).map((value) => ({
  value,
  label: TRANSFER_LABEL[value],
}));

export const transitionSchema = z
  .object({
    to: z.enum(["DIPROSES", "SELESAI", "DITOLAK", "DIALIHKAN"]),
    response: z.string().trim().min(1, "Tulis tanggapan terlebih dahulu.").max(MAX_RESPONSE_LENGTH),
    rejection_reason: z
      .enum(["DUPLIKAT", "DATA_TIDAK_LENGKAP", "BUKAN_MASALAH_PUBLIK", "SUDAH_DITANGANI", "LAPORAN_TIDAK_BENAR"])
      .optional(),
    transfer_reason: z.enum(["BUKAN_WEWENANG_OPD", "PERLU_OPD_LAIN", "KATEGORI_SALAH"]).optional(),
    evidence_ids: z.array(z.string().min(1)).max(MAX_EVIDENCE).optional(),
  })
  .superRefine((value, context) => {
    if (value.to === "SELESAI" && (value.evidence_ids?.length ?? 0) < 1) {
      context.addIssue({ code: "custom", path: ["evidence_ids"], message: "Unggah minimal satu foto bukti." });
    }
    if (value.to === "DITOLAK" && !value.rejection_reason) {
      context.addIssue({ code: "custom", path: ["rejection_reason"], message: "Pilih alasan penolakan." });
    }
    if (value.to === "DIALIHKAN" && !value.transfer_reason) {
      context.addIssue({ code: "custom", path: ["transfer_reason"], message: "Pilih alasan pengalihan." });
    }
  });

export const publicationSchema = z
  .object({ public_ok: z.boolean(), is_cover: z.boolean() })
  .refine((value) => !value.is_cover || value.public_ok, {
    path: ["is_cover"],
    message: "Sampul harus berupa foto yang layak publik.",
  });

export type TransitionInput = z.infer<typeof transitionSchema>;
