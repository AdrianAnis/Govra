import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";
import { indicatorParts, indicatorSlug } from "@/lib/indicators";
import type { Schema } from "@/lib/schema";

interface RaporHeroProps {
  eyebrow: string;
  period: string;
  indicators: readonly Schema<"IndicatorValue">[];
}

const STAGGER_MS = 100;

function RaporHero({ eyebrow, period, indicators }: RaporHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-sheet bg-secondary bg-cityscape text-secondary-fg">
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-secondary via-secondary/75 to-secondary/40" />
      <div className="flex flex-col gap-16 p-8 pt-12 sm:p-10 sm:pt-14 lg:gap-14 lg:p-12 lg:pt-14">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold text-secondary-fg/80">{eyebrow}</p>
          <h1 className="flex flex-col font-bold tracking-tighter">
            <span className="text-3xl leading-tight lg:text-5xl">Rapor Periode</span>
            <span className="text-5xl leading-none tabular-nums sm:text-7xl lg:text-8xl">{period}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <p className="max-w-prose text-lg text-secondary-fg/80">Setiap angka bisa dibuka untuk melihat data penyusunnya.</p>
            <Link
              href="/metodologi"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
            >
              Cara menghitung
            </Link>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
          {indicators.map((indicator, index) => {
            const { number, suffix } = indicatorParts(indicator);
            return (
              <li
                key={indicator.code}
                className="animate-blur-in last:odd:col-span-2 lg:last:odd:col-span-1"
                style={{ animationDelay: `${index * STAGGER_MS}ms` }}
              >
                <div className="group relative flex h-full flex-col justify-between gap-8 rounded-lg border border-secondary-fg/20 bg-secondary-fg/10 p-5 backdrop-blur-md transition-colors duration-300 ease-ui hover:bg-secondary-fg/20">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm leading-snug font-semibold">
                      <Link
                        href={`/rapor/${indicatorSlug(indicator.code)}`}
                        className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-lg focus-visible:after:outline-2 focus-visible:after:outline-secondary-fg"
                      >
                        {indicator.label}
                      </Link>
                    </h2>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 text-secondary-fg/70 transition-transform duration-300 ease-ui group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="flex items-baseline gap-1 whitespace-nowrap">
                      <span className="text-4xl leading-none font-bold tracking-tighter tabular-nums lg:text-5xl">{number}</span>
                      <span className="text-lg font-semibold text-secondary-fg/70">{suffix}</span>
                    </p>
                    <p className="text-xs text-secondary-fg/70">
                      {indicator.value === null ? "Belum tersedia" : `Dari ${formatNumber(indicator.sample_size)} data`}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export { RaporHero };
