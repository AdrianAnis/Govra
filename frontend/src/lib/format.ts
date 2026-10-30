import type { Schema } from "@/lib/schema";

const LOCALE = "id-ID";
const TIME_ZONE = "Asia/Jakarta";
const TIME_ZONE_LABEL = "WIB";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

const RELATIVE_UNITS: ReadonlyArray<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: MS_PER_YEAR },
  { unit: "month", ms: MS_PER_MONTH },
  { unit: "day", ms: MS_PER_DAY },
  { unit: "hour", ms: MS_PER_HOUR },
  { unit: "minute", ms: MS_PER_MINUTE },
];

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const numberFormat = new Intl.NumberFormat(LOCALE);

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  try {
    const raw = String(iso).trim();
    let d = new Date(raw);
    if (isNaN(d.getTime()) && !raw.includes("T")) {
      d = new Date(`${raw}T00:00:00+07:00`);
    }
    if (isNaN(d.getTime())) return iso;
    const parts = dateTimeFormat.formatToParts(d);
    const date = `${partValue(parts, "day")} ${partValue(parts, "month")} ${partValue(parts, "year")}`;
    const time = `${partValue(parts, "hour")}.${partValue(parts, "minute")}`;
    return `${date}, ${time} ${TIME_ZONE_LABEL}`;
  } catch {
    return iso || "-";
  }
}

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const rupiahFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatDate(isoDate: string): string {
  if (!isoDate) return "-";
  try {
    const raw = String(isoDate).trim();
    if (raw.includes("T") || raw.includes(" ") || raw.includes("Z")) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return dateFormat.format(parsed);
      }
    }
    const parsedDateOnly = new Date(`${raw}T00:00:00+07:00`);
    if (!isNaN(parsedDateOnly.getTime())) {
      return dateFormat.format(parsedDateOnly);
    }
    const fallback = new Date(raw);
    if (!isNaN(fallback.getTime())) {
      return dateFormat.format(fallback);
    }
    return raw;
  } catch {
    return isoDate || "-";
  }
}

export function formatRupiah(value: number): string {
  return rupiahFormat.format(value);
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  if (!iso) return "-";
  try {
    let d = new Date(iso);
    if (isNaN(d.getTime()) && !String(iso).includes("T")) {
      d = new Date(`${iso}T00:00:00+07:00`);
    }
    if (isNaN(d.getTime())) return iso;
    const diff = d.getTime() - now.getTime();
    const match = RELATIVE_UNITS.find(({ ms }) => Math.abs(diff) >= ms);
    if (!match) {
      return relativeFormat.format(Math.trunc(diff / MS_PER_SECOND), "second");
    }
    return relativeFormat.format(Math.trunc(diff / match.ms), match.unit);
  } catch {
    return iso || "-";
  }
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

export function formatIndicator(value: number | null, unit: "PERCENT" | "HOURS"): string {
  if (value === null) {
    return "Belum ada data";
  }
  return `${decimalFormat.format(value)}${unit === "PERCENT" ? "%" : " jam"}`;
}

const THRESHOLD_UNITS: Record<Schema<"SettingUnit">, string> = {
  POINTS: "poin",
  RATIO: "",
  METERS: "meter",
  DAYS: "hari",
  HOURS: "jam",
  COUNT: "",
};

export function formatThreshold(value: number, unit: Schema<"SettingUnit">): string {
  return `${decimalFormat.format(value)} ${THRESHOLD_UNITS[unit]}`.trim();
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function formatPercent(value: number): string {
  return `${numberFormat.format(Math.round(value))}%`;
}
