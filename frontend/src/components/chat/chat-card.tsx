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
    <div className="mt-3 grid gap-2 sm:grid-cols-1">
      {cards.map((card) => {
        let Icon = FileText;
        let toneBg = "bg-primary/10 text-primary border-primary/20";

        if (card.type === "PROGRAM") {
          Icon = Target;
          toneBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
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
            className="group relative flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-primary/60 hover:shadow-md hover:bg-card/90"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", toneBg)}>
                  <Icon className="size-4" />
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
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
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
              <div className="flex flex-col gap-1">
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
              <p className="text-[11px] leading-relaxed text-muted-foreground/90 line-clamp-2">
                {card.meta}
              </p>
            )}

            <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] font-medium text-primary">
              <span className="flex items-center gap-1">
                {card.actionLabel || "Buka & Lihat Selengkapnya"}
              </span>
              <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
