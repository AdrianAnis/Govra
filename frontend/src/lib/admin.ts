import { z } from "zod";
import type { Schema } from "@/lib/schema";

export type ModerationReason = Schema<"ModerationReason">;

export const MODERATION_LABEL: Record<ModerationReason, string> = {
  SPAM: "Spam",
  SARA: "Mengandung SARA",
  LAINNYA: "Lainnya",
};

export const MODERATION_OPTIONS = (["SPAM", "SARA", "LAINNYA"] as const).map((value) => ({
  value,
  label: MODERATION_LABEL[value],
}));

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  ISSUE_ROUTE: "Teruskan isu",
  ISSUE_REJECT: "Tolak isu",
  USER_CREATE: "Buat akun",
  USER_DISABLE: "Nonaktifkan akun",
  USER_ENABLE: "Aktifkan akun",
  USER_MOVE: "Pindahkan akun",
  OPD_CREATE: "Tambah OPD",
  OPD_UPDATE: "Ubah OPD",
  OPD_DISABLE: "Nonaktifkan OPD",
  CATEGORY_CREATE: "Tambah kategori",
  CATEGORY_UPDATE: "Ubah kategori",
  CATEGORY_DISABLE: "Nonaktifkan kategori",
  DISTRICT_CREATE: "Tambah kecamatan",
  DISTRICT_RENAME: "Ubah kecamatan",
  VILLAGE_CREATE: "Tambah kelurahan",
  VILLAGE_RENAME: "Ubah kelurahan",
  SETTING_UPDATE: "Ubah pengaturan",
  REPORT_HIDE: "Sembunyikan laporan",
};

const code = z
  .string()
  .trim()
  .regex(/^[A-Z0-9_]+$/, "Hanya huruf besar, angka, dan garis bawah.")
  .max(40);

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, "Hanya huruf kecil, angka, dan tanda hubung.")
  .max(80);

const name = z.string().trim().min(1, "Isi nama terlebih dahulu.").max(120);

export const routeSchema = z.object({
  opd_code: code.min(1, "Pilih OPD."),
  category_code: code.min(1, "Pilih kategori."),
});

export const rejectSchema = z.object({
  reason: z.enum(["DUPLIKAT", "DATA_TIDAK_LENGKAP", "BUKAN_MASALAH_PUBLIK", "SUDAH_DITANGANI", "LAPORAN_TIDAK_BENAR"]),
  explanation: z.string().trim().min(1, "Tulis penjelasan terlebih dahulu.").max(1000),
});

export const createUserSchema = z.object({
  email: z.email("Alamat email tidak valid."),
  display_name: z.string().trim().min(1, "Isi nama terlebih dahulu.").max(80),
  opd_code: code.min(1, "Pilih OPD."),
  password: z.string().min(12, "Kata sandi minimal 12 karakter.").max(128),
});

export const updateUserSchema = z
  .object({ status: z.enum(["ACTIVE", "DISABLED"]).optional(), opd_code: code.optional() })
  .refine((value) => value.status !== undefined || value.opd_code !== undefined, "Tidak ada perubahan.");

export const createOpdSchema = z.object({ code: code.min(1, "Isi kode."), slug: slug.min(1, "Isi slug."), name });

export const updateOpdSchema = z
  .object({ slug: slug.optional(), name: name.optional(), active: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.");

export const createCategorySchema = z.object({ code: code.min(1, "Isi kode."), name });

export const updateCategorySchema = z
  .object({ name: name.optional(), active: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, "Tidak ada perubahan.");

export const areaSchema = z.object({ name });

export const hideSchema = z.object({
  reason: z.enum(["SPAM", "SARA", "LAINNYA"]),
  note: z.string().trim().max(500).optional(),
});

export const settingSchema = z.object({ value: z.number().finite().min(0, "Nilai tidak boleh negatif.") });

export type RouteInput = z.infer<typeof routeSchema>;
export type RejectInput = z.infer<typeof rejectSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateOpdInput = z.infer<typeof createOpdSchema>;
export type UpdateOpdInput = z.infer<typeof updateOpdSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type HideInput = z.infer<typeof hideSchema>;
