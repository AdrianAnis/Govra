import { List, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { buildHref } from "@/lib/url";
import { cn } from "@/lib/utils";

type IssueView = "daftar" | "peta";

interface IssueViewToggleProps {
  view: IssueView;
  params: Record<string, string>;
}

const OPTIONS = [
  { view: "daftar", label: "Daftar", icon: List },
  { view: "peta", label: "Peta", icon: MapIcon },
] as const;

function IssueViewToggle({ view, params }: IssueViewToggleProps) {
  return (
    <nav aria-label="Tampilan isu" className="inline-flex w-fit rounded-lg border bg-surface p-1">
      {OPTIONS.map((option) => {
        const active = option.view === view;
        const next = option.view === "peta" ? { ...params, tampil: "peta" } : params;
        return (
          <Link
            key={option.view}
            href={buildHref("/isu", next, 1)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-200 ease-ui",
              active ? "bg-secondary text-secondary-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            <option.icon aria-hidden className="size-4" />
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

export { IssueViewToggle };
