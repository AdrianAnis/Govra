"use client";

import { Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReportCluster } from "@/lib/data/triage-cluster";

interface AgencyThemeFilterProps {
  clusters?: ReportCluster[];
}

export function AgencyThemeFilter({ clusters = [] }: AgencyThemeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTema = searchParams.get("tema") || "ALL";

  const applyTema = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      next.set("tema", value);
    } else {
      next.delete("tema");
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const clusterOptions = [
    { value: "ALL", label: "Semua Tema Laporan (AI)" },
    ...clusters.map((c) => ({
      value: c.themeId,
      label: `${c.themeTitle} (${c.totalCount} lap.${c.themeId !== "ABSTRAK" ? " · ≥90%" : ""})`,
    })),
  ];

  return (
    <div className="flex items-center gap-2">
      <Select value={currentTema} items={clusterOptions} onValueChange={(val) => val && applyTema(val)}>
        <SelectTrigger
          aria-label="Filter tema laporan klaster AI dinas"
          className="h-10 w-72 sm:w-80 rounded-lg border-border-strong bg-surface px-3 text-sm font-medium text-fg shadow-2xs hover:border-fg-muted focus-visible:border-fg"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <SelectValue placeholder="Semua Tema Laporan" className="truncate text-sm" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {clusterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
