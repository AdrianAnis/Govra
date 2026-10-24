import Link from "next/link";
import { BlurText } from "@/components/bits/blur-text";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Hero() {
  return (
    <Container className="pt-4 lg:pt-6">
      <section className="relative isolate overflow-hidden rounded-sheet bg-secondary text-secondary-fg">
      <div aria-hidden className="hero-drift absolute -inset-y-24 inset-x-0 -z-20 bg-hero" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-secondary/90 via-secondary/55 to-secondary/10"
      />
      <div className="flex flex-col items-start gap-8 px-6 py-20 sm:px-10 lg:px-16 lg:py-32">
          <h1 className="max-w-6xl text-5xl leading-none font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <BlurText text="Pantau program daerah." />
            <br />
            <BlurText text="Laporkan masalah" highlight={["Laporkan", "masalah"]} startAt={3} />
            <br className="hidden sm:block" />
            <BlurText text="di sekitar Anda." startAt={5} />
          </h1>
          <p className="max-w-xl text-lg text-secondary-fg/90 md:text-xl">
            Lihat progres proker dibandingkan jadwalnya, dan pastikan setiap laporan warga sampai
            ke dinas yang tepat.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/lapor" className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
              Lapor Sekarang
            </Link>
            <Link
              href="/proker"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "border-secondary-fg/50 text-secondary-fg hover:bg-secondary-fg/15",
              )}
            >
              Lihat Proker
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}

export { Hero };
