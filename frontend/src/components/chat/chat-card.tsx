import Link from "next/link";
import React from "react";
import {
  FileText,
  Target,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  MapPin,
} from "lucide-react";
import type { ChatCard } from "@/lib/chat";
import { cn } from "@/lib/utils";

interface ChatCardListProps {
  cards: readonly ChatCard[];
  onNavigate?: () => void;
}

export function ChatCardList({ cards, onNavigate }: ChatCardListProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="mt-2.5 flex w-full min-w-0 max-w-full flex-col gap-2 overflow-hidden">
      {cards.map((card) => {
        let Icon = FileText;
        let toneBg = "bg-surface-muted text-foreground border-border";

        if (card.type === "PROGRAM") {
          Icon = Target;
          toneBg = "bg-surface-muted text-primary border-border";
        } else if (card.type === "ISSUE") {
          Icon = AlertTriangle;
          toneBg = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        } else if (card.type === "ACTION") {
          Icon = PlusCircle;
          toneBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        }

        const isGood = card.statusTone === "good";
        const isWarn = card.statusTone === "warn";
        const isBad = card.statusTone === "bad";

        return (
          <Link
            key={card.id}
            href={card.href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className="group relative flex w-full min-w-0 max-w-full flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-2xs transition-all duration-150 hover:border-border-strong hover:bg-muted/40 overflow-hidden"
          >
            <div className="flex w-full min-w-0 items-start justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className={cn("flex size-7.5 shrink-0 items-center justify-center rounded-lg border", toneBg)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </p>
                  {card.subtitle && (
                    <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{card.subtitle}</span>
                    </p>
                  )}
                </div>
              </div>

              {card.badge && (
                <span
                  className={cn(
                    "inline-flex shrink-0 max-w-[40%] truncate items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                    isGood
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : isWarn
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : isBad
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {card.badge}
                </span>
              )}
            </div>

            {typeof card.progress === "number" && (
              <div className="flex w-full min-w-0 flex-col gap-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progres Fisik</span>
                  <span className="font-semibold text-foreground">{card.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                  />
                </div>
              </div>
            )}

            {card.meta && (
              <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 break-words">
                {card.meta}
              </p>
            )}

            <div className="mt-0.5 flex w-full min-w-0 items-center justify-between border-t border-border pt-2 text-[11px] font-medium text-primary">
              <span className="truncate flex-1">
                {card.actionLabel || "Buka & Lihat Selengkapnya"}
              </span>
              <ChevronRight className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ml-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
