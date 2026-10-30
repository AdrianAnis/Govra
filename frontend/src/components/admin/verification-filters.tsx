"use client";

import { Building2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TOPIC_OPTIONS = [
  { value: "ALL", label: "Semua Topik" },
  { value: "DBM-SDA", label: "Dinas Bina Marga & SDA" },
  { value: "DLHK", label: "Dinas Lingkungan Hidup" },
  { value: "DISHUB", label: "Dinas Perhubungan" },
  { value: "DINKES", label: "Dinas Kesehatan" },
  { value: "PUPR", label: "Dinas PUPR" },
  { value: "TIDAK_TERDAFTAR", label: "Tidak Masuk Dinas" },
] as const;

const QUEUE_TABS = [
  { kind: null, label: "Semua Status" },
  { kind: "VERIFIKASI", label: "Perlu Verifikasi" },
  { kind: "PENGALIHAN", label: "Pengalihan Dinas" },
] as const;

export function VerificationFilters({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTopic = searchParams.get("topik") || "ALL";
  const currentKind = searchParams.get("jenis") || "ALL";

  const applyFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={currentTopic}
          items={TOPIC_OPTIONS}
          onValueChange={(val) => {
            if (val) applyFilter("topik", val);
          }}
        >
          <SelectTrigger
            aria-label="Filter topik dinas"
            className="h-10 w-64 sm:w-72 rounded-lg border-border-strong bg-surface px-3 text-sm font-medium text-fg shadow-2xs hover:border-fg-muted focus-visible:border-fg"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
              <Building2 className="size-4 shrink-0 text-fg-muted" />
              <SelectValue placeholder="Semua Topik" className="truncate text-sm" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {TOPIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs font-medium text-fg-muted tabular-nums">
          Total {totalCount} isu terkumpul
        </span>
      </div>

      <nav aria-label="Jenis antrean" className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
        {QUEUE_TABS.map((tab) => {
          const isActive = (tab.kind ?? "ALL") === currentKind;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => applyFilter("jenis", tab.kind ?? "ALL")}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors border",
                isActive
                  ? "bg-secondary text-secondary-fg border-secondary font-semibold"
                  : "border-border bg-surface text-fg-muted hover:text-fg hover:bg-surface-muted",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
