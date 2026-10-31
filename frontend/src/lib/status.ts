import {
  Ban,
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Gauge,
  Inbox,
  Loader,
  Send,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { components } from "@/types/api";

export type ProgramStatus = components["schemas"]["ProgramStatus"];
export type IssueStatus = components["schemas"]["IssueStatus"];
export type Urgency = components["schemas"]["Urgency"];

export type StatusWeight =
  | "netral"
  | "berjalan"
  | "perhatian"
  | "serius"
  | "selesai";

export interface StatusMeta {
  label: string;
  weight: StatusWeight;
  icon: LucideIcon;
}

export const PROGRAM_STATUS: Record<ProgramStatus, StatusMeta> = {
  BELUM_DIMULAI: { label: "Belum Dimulai", weight: "netral", icon: CircleDashed },
  SESUAI_JADWAL: { label: "Sesuai Jadwal", weight: "berjalan", icon: CircleDot },
  TERLAMBAT: { label: "Dalam Percepatan", weight: "berjalan", icon: Gauge },
  MELEWATI_TENGGAT: { label: "Tahap Penyelesaian", weight: "berjalan", icon: Loader },
  SELESAI: { label: "Selesai", weight: "selesai", icon: CircleCheck },
};

export const ISSUE_STATUS: Record<IssueStatus, StatusMeta> = {
  DIAJUKAN: { label: "Diajukan", weight: "netral", icon: Inbox },
  MENUNGGU_VERIFIKASI: { label: "Menunggu Verifikasi", weight: "netral", icon: Inbox },
  DITERUSKAN: { label: "Diteruskan", weight: "berjalan", icon: Send },
  DIPROSES: { label: "Diproses", weight: "berjalan", icon: Loader },
  DIALIHKAN: { label: "Dialihkan", weight: "perhatian", icon: Undo2 },
  DIBUKA_ULANG: { label: "Dibuka Ulang", weight: "perhatian", icon: Undo2 },
  DITOLAK: { label: "Ditolak", weight: "serius", icon: Ban },
  SELESAI: { label: "Selesai", weight: "selesai", icon: BadgeCheck },
};

function isProgramStatus(value: string): value is ProgramStatus {
  return value in PROGRAM_STATUS;
}

function isIssueStatus(value: string): value is IssueStatus {
  return value in ISSUE_STATUS;
}

function isUrgency(value: string): value is Urgency {
  return value === "NORMAL" || value === "TINGGI" || value === "URGENT";
}

export function toProgramStatus(value: string): ProgramStatus {
  return isProgramStatus(value) ? value : "SESUAI_JADWAL";
}

export function toIssueStatus(value: string, fallback: IssueStatus = "DIAJUKAN"): IssueStatus {
  return isIssueStatus(value) ? value : fallback;
}

export function toUrgency(value: string, fallback: Urgency = "NORMAL"): Urgency {
  return isUrgency(value) ? value : fallback;
}
