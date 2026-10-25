import { DISTRICTS, OPDS } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

export interface Decision {
  status: Schema<"IssueStatus">;
}

export interface SettingState {
  key: Schema<"SettingKey">;
  label: string;
  value: number;
  unit: Schema<"SettingUnit">;
}

interface AdminStore {
  decisions: Map<string, Decision>;
  users: Schema<"AdminUser">[];
  opds: Schema<"OpdDetail">[];
  districts: Schema<"District">[];
  settings: SettingState[];
  moderation: Schema<"ModerationReport">[];
  audit: Schema<"AuditLog">[];
}

const STORE_KEY = Symbol.for("govra.admin-store");

const USER_SEEDS: ReadonlyArray<{ email: string; name: string; opd: string; status: Schema<"UserStatus">; signedIn: string | null }> = [
  { email: "bmsda@example.org", name: "Admin Bina Marga", opd: "BMSDA", status: "ACTIVE", signedIn: "2026-10-24T08:15:00Z" },
  { email: "lhk@example.org", name: "Admin Lingkungan Hidup", opd: "LHK", status: "ACTIVE", signedIn: "2026-10-23T03:40:00Z" },
  { email: "kes@example.org", name: "Admin Kesehatan", opd: "KES", status: "ACTIVE", signedIn: "2026-10-20T06:05:00Z" },
  { email: "perhub@example.org", name: "Admin Perhubungan", opd: "PERHUB", status: "DISABLED", signedIn: null },
];

const SETTING_SEEDS: readonly SettingState[] = [
  { key: "PROGRAM_LATE_THRESHOLD", label: "Ambang keterlambatan program", value: 10, unit: "POINTS" },
  { key: "TRIAGE_CONFIDENCE_MIN", label: "Keyakinan minimum triage AI", value: 0.7, unit: "RATIO" },
  { key: "MERGE_SIMILARITY_MIN", label: "Kemiripan minimum penggabungan isu", value: 0.85, unit: "RATIO" },
  { key: "MERGE_RADIUS_METERS", label: "Radius penggabungan isu", value: 150, unit: "METERS" },
  { key: "MERGE_WINDOW_DAYS", label: "Rentang waktu penggabungan isu", value: 14, unit: "DAYS" },
  { key: "URGENT_REPORTERS_7D", label: "Pelapor untuk Urgent dalam 7 hari", value: 10, unit: "COUNT" },
  { key: "URGENT_REPORTERS_72H", label: "Pelapor untuk Urgent dalam 72 jam", value: 5, unit: "COUNT" },
  { key: "HIGH_REPORTERS_7D", label: "Pelapor untuk Tinggi dalam 7 hari", value: 5, unit: "COUNT" },
  { key: "SUBNET_REPORTER_CAP", label: "Batas pelapor dari satu jaringan", value: 3, unit: "COUNT" },
  { key: "SLA_URGENT_HOURS", label: "SLA tanggapan Urgent", value: 24, unit: "HOURS" },
  { key: "SLA_HIGH_DAYS", label: "SLA tanggapan Tinggi", value: 3, unit: "DAYS" },
  { key: "SLA_NORMAL_BUSINESS_DAYS", label: "SLA tanggapan Normal (hari kerja)", value: 5, unit: "DAYS" },
  { key: "REOPEN_DISPUTE_RATIO", label: "Rasio sanggahan untuk membuka ulang", value: 0.3, unit: "RATIO" },
  { key: "REOPEN_WINDOW_DAYS", label: "Jendela sanggahan penyelesaian", value: 5, unit: "DAYS" },
];

const MODERATION_SEEDS: ReadonlyArray<{ code: string; body: string; visibility: Schema<"Visibility">; at: string; reason: Schema<"ModerationReason"> | null }> = [
  { code: "TLK-2610-A1B2", body: "Setiap hujan deras jalan di depan Pasar Dahlia tergenang setinggi lutut.", visibility: "PUBLIK", at: "2026-10-22T02:10:00Z", reason: null },
  { code: "TLK-2610-C3D4", body: "Pagar SDN Kenanga roboh sepanjang kurang lebih sepuluh meter.", visibility: "PUBLIK", at: "2026-10-20T01:30:00Z", reason: null },
  { code: "TLK-2610-G7H8", body: "Dugaan pungutan liar di loket pelayanan. Mohon identitas saya dirahasiakan.", visibility: "RAHASIA", at: "2026-10-23T08:00:00Z", reason: null },
  { code: "TLK-2610-J9K1", body: "Beli followers murah, klik tautan ini untuk promo terbesar bulan ini.", visibility: "PUBLIK", at: "2026-10-24T05:20:00Z", reason: "SPAM" },
  { code: "TLK-2610-L2M3", body: "Promo judi daring, hubungi nomor yang tertera untuk bonus pendaftaran.", visibility: "PUBLIK", at: "2026-10-24T06:45:00Z", reason: "SPAM" },
  { code: "TLK-2610-N4P5", body: "Lampu jalan di Gang Kenari mati sejak dua minggu lalu dan rawan kejahatan.", visibility: "PUBLIK", at: "2026-10-21T11:00:00Z", reason: null },
  { code: "TLK-2609-E5F6", body: "Tempat sampah di taman Kelurahan Cempaka pecah dan sampahnya berserakan.", visibility: "PUBLIK", at: "2026-09-24T02:30:00Z", reason: null },
  { code: "TLK-2610-Q6R7", body: "Saluran air di belakang pasar tersumbat dan baunya menyengat.", visibility: "PUBLIK", at: "2026-10-19T09:10:00Z", reason: null },
];

const AUDIT_ACTOR = "0197c000-0000-7000-8000-000000000001";

function pad(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(12, "0")}`;
}

function seed(): AdminStore {
  return {
    decisions: new Map(),
    users: USER_SEEDS.map((user, index) => ({
      id: pad("0197c000-0000-7000-8000", index + 2),
      email: user.email,
      display_name: user.name,
      role: "DINAS",
      opd: OPDS.find((opd) => opd.ref.code === user.opd)?.ref ?? null,
      status: user.status,
      last_sign_in_at: user.signedIn,
    })),
    opds: OPDS.map((opd) => ({
      ...opd.ref,
      active: true,
      categories: opd.categories.map((category) => ({ ...category, active: true })),
    })),
    districts: DISTRICTS.map((district) => ({ ...district, villages: [...district.villages] })),
    settings: SETTING_SEEDS.map((item) => ({ ...item })),
    moderation: MODERATION_SEEDS.map((item, index) => ({
      id: pad("0197c100-0000-7000-8000", index + 1),
      code: item.code,
      body: item.body,
      visibility: item.visibility,
      created_at: item.at,
      hidden: item.reason !== null,
      hide_reason: item.reason,
    })),
    audit: [
      {
        id: pad("0197c200-0000-7000-8000", 1),
        at: "2026-10-22T07:00:00Z",
        actor_id: AUDIT_ACTOR,
        actor_role: "ADMIN",
        action: "USER_CREATE",
        target_type: "user",
        target_id: pad("0197c000-0000-7000-8000", 5),
        detail: "Akun Dinas dibuat untuk OPD PERHUB.",
      },
      {
        id: pad("0197c200-0000-7000-8000", 2),
        at: "2026-10-23T03:20:00Z",
        actor_id: AUDIT_ACTOR,
        actor_role: "ADMIN",
        action: "REPORT_HIDE",
        target_type: "report",
        target_id: pad("0197c100-0000-7000-8000", 4),
        detail: "Laporan disembunyikan: Spam.",
      },
    ],
  };
}

function isStore(value: unknown): value is AdminStore {
  return typeof value === "object" && value !== null && "decisions" in value && "audit" in value && "settings" in value;
}

export function adminStore(): AdminStore {
  const existing: unknown = Reflect.get(globalThis, STORE_KEY);
  if (isStore(existing)) {
    return existing;
  }
  const fresh = seed();
  Reflect.set(globalThis, STORE_KEY, fresh);
  return fresh;
}

export { AUDIT_ACTOR };
