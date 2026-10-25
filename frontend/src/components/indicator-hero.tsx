import { BackdropImage } from "@/components/backdrop-image";
import type { ReactNode } from "react";

interface IndicatorHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  formula: string;
  value: ReactNode;
  caption: string;
}

function IndicatorHero({ eyebrow, title, description, formula, value, caption }: IndicatorHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-sheet bg-secondary text-secondary-fg">
      <BackdropImage src="/cityscape.jpg" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-secondary via-secondary/80 to-secondary/50" />
      <div className="grid gap-10 p-8 pt-12 sm:p-10 sm:pt-14 lg:grid-cols-3 lg:items-end lg:p-12 lg:pt-14">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <p className="text-sm font-semibold text-secondary-fg/80">{eyebrow}</p>
          <h1 className="text-5xl leading-none font-bold tracking-tighter text-balance lg:text-7xl">{title}</h1>
          <p className="max-w-prose text-lg text-secondary-fg/80">{description}</p>
          <p className="max-w-prose text-sm text-secondary-fg/70">Rumus: {formula}.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-secondary-fg/20 bg-secondary-fg/10 p-6 backdrop-blur-md">
          <p className="text-6xl leading-none font-bold tracking-tighter tabular-nums lg:text-7xl">{value}</p>
          <p className="text-sm text-secondary-fg/70">{caption}</p>
        </div>
      </div>
    </section>
  );
}

export { IndicatorHero };
