import Link from "next/link";
import { Reveal } from "@/components/bits/reveal";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REPORT_NEW } from "@/lib/routes";

function ReportCta() {
  return (
    <section className="py-10 lg:py-14">
      <Container>
        <Reveal variant="blur">
          <div className="flex flex-col gap-8 rounded-lg bg-secondary p-8 text-secondary-fg lg:flex-row lg:items-center lg:justify-between lg:p-12">
            <div className="flex max-w-xl flex-col gap-3">
              <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
                Ada masalah di sekitar Anda?
              </h2>
              <p className="text-secondary-fg/85">
                Laporkan sekarang. Laporan dicek, diteruskan ke dinas yang tepat, dan bisa Anda
                lacak sampai selesai.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={REPORT_NEW} className={cn(buttonVariants({ variant: "accent", size: "lg" }))}>
                Lapor Sekarang
              </Link>
              <Link
                href="/isu"
                className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline"
              >
                Lihat isu warga
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export { ReportCta };
