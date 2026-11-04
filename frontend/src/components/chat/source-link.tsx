import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ChatSource } from "@/lib/chat";

const KIND_LABEL = { PROGRAM: "Proker", ISSUE: "Isu warga" } as const;

function SourceLink({ source, onNavigate }: { source: ChatSource; onNavigate: () => void }) {
  return (
    <Link
      href={source.path}
      onClick={onNavigate}
      className="group flex w-full min-w-0 max-w-full items-center justify-between gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs transition-colors duration-150 hover:border-border-strong overflow-hidden"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-semibold text-primary">{KIND_LABEL[source.kind]}</span>
        <span className="truncate text-xs font-medium text-foreground">{source.title}</span>
      </span>
      <ArrowRight
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export { SourceLink };
