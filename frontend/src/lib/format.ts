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
  const parts = dateTimeFormat.formatToParts(new Date(iso));
  const date = `${partValue(parts, "day")} ${partValue(parts, "month")} ${partValue(parts, "year")}`;
  const time = `${partValue(parts, "hour")}.${partValue(parts, "minute")}`;
  return `${date}, ${time} ${TIME_ZONE_LABEL}`;
}

export function formatRelativeTime(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const match = RELATIVE_UNITS.find(({ ms }) => Math.abs(diff) >= ms);
  if (!match) {
    return relativeFormat.format(Math.trunc(diff / MS_PER_SECOND), "second");
  }
  return relativeFormat.format(Math.trunc(diff / match.ms), match.unit);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatPercent(value: number): string {
  return `${numberFormat.format(Math.round(value))}%`;
}
