import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ChatSource } from "@/lib/chat";

const KIND_LABEL = { PROGRAM: "Proker", ISSUE: "Isu warga" } as const;

function SourceLink({ source, onNavigate }: { source: ChatSource; onNavigate: () => void }) {
  return (
    <Link
      href={source.path}
      onClick={onNavigate}
      className="group flex items-center justify-between gap-3 rounded-md border bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-fg-muted"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold text-primary">{KIND_LABEL[source.kind]}</span>
        <span className="line-clamp-2 text-sm font-medium">{source.title}</span>
      </span>
      <ArrowRight
        aria-hidden
        className="size-4 shrink-0 text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export { SourceLink };
