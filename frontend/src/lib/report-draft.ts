import "@/lib/zod-config";
import { z } from "zod";
import type { Schema } from "@/lib/schema";

export const TITLE_MAX = 120;
export const BODY_MIN = 20;
export const BODY_MAX = 2000;
export const MAX_FILES = 3;
export const MAX_FILE_MB = 5;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
export const ALLOWED_MIME: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

export interface DraftPoint {
  lat: number;
  lng: number;
}

export interface DraftFile {
  id: string;
  file: File;
  url: string;
}

export interface ReportDraft {
  title: string;
  body: string;
  districtId: string;
  villageId: string;
  addressDetail: string;
  point: DraftPoint | null;
  files: readonly DraftFile[];
  visibility: Schema<"Visibility">;
}

export type FieldErrors = Partial<Record<string, string>>;

export const EMPTY_DRAFT: ReportDraft = {
  title: "",
  body: "",
  districtId: "",
  villageId: "",
  addressDetail: "",
  point: null,
  files: [],
  visibility: "PUBLIK",
};

export function checkFile(file: Pick<File, "type" | "size" | "name">): string | null {
  if (!ALLOWED_MIME.includes(file.type)) {
    return `${file.name}: hanya foto JPEG, PNG, atau WebP.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name}: ukuran melebihi ${MAX_FILE_MB} MB.`;
  }
  return null;
}

const descriptionSchema = z.object({
  title: z.string().trim().max(TITLE_MAX, `Judul maksimal ${TITLE_MAX} karakter.`),
  body: z
    .string()
    .trim()
    .min(BODY_MIN, `Ceritakan minimal ${BODY_MIN} karakter agar masalahnya jelas.`)
    .max(BODY_MAX, `Isi laporan maksimal ${BODY_MAX} karakter.`),
});

export function validateDescription(draft: ReportDraft): FieldErrors {
  const result = descriptionSchema.safeParse({ title: draft.title, body: draft.body });
  if (result.success) {
    return {};
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

export function isInsideBounds(point: DraftPoint, bounds: readonly number[]): boolean {
  const [west = 0, south = 0, east = 0, north = 0] = bounds;
  return point.lng >= west && point.lng <= east && point.lat >= south && point.lat <= north;
}

export function validateLocation(draft: ReportDraft, bounds: readonly number[]): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.districtId) {
    errors.districtId = "Pilih kecamatan.";
  }
  if (!draft.villageId) {
    errors.villageId = "Pilih kelurahan atau desa.";
  }
  if (!draft.point) {
    errors.point = "Taruh pin di peta pada lokasi kejadian.";
  } else if (!isInsideBounds(draft.point, bounds)) {
    errors.point = "Titik berada di luar wilayah layanan. Pilih titik di dalam peta.";
  }
  return errors;
}

export const createReportSchema = z.object({
  title: z.string().trim().max(TITLE_MAX),
  body: z.string().trim().min(BODY_MIN).max(BODY_MAX),
  district_id: z.string().optional(),
  village_id: z.string().min(1),
  address_detail: z.string().trim().max(300).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  visibility: z.enum(["PUBLIK", "RAHASIA"]),
  turnstile_token: z.string().min(1),
});

export const duplicateQuerySchema = z.object({
  body: z.string().trim().min(BODY_MIN).max(BODY_MAX),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const feedbackSchema = z.object({
  outcome: z.enum(["CONFIRM", "DISPUTE"]),
  note: z.string().trim().max(500).optional(),
});
