import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function AuthBrand() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-md bg-surface text-xl font-bold text-secondary"
      >
        G
      </span>
      <span className="text-2xl font-bold tracking-tight">Govra</span>
    </div>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-secondary bg-cityscape text-secondary-fg">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-secondary/90 via-secondary/60 to-secondary/50"
      />
      <div className="mx-auto grid w-full max-w-auth flex-1 gap-6 px-4 py-6 sm:gap-8 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-16 lg:py-8 xl:px-24">
        <div className="flex flex-col gap-6 lg:justify-between lg:gap-10">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "-ml-4 w-fit text-secondary-fg hover:bg-secondary-fg/10",
            )}
          >
            <ArrowLeft aria-hidden />
            Kembali
          </Link>
          <div className="flex max-w-2xl flex-col gap-5 lg:pb-8">
            <AuthBrand />
            <p className="hidden text-4xl leading-tight font-bold tracking-tight lg:block xl:text-5xl">
              Pantau program daerah. Laporkan masalah di sekitar Anda.
            </p>
            <p className="hidden max-w-xl leading-relaxed text-secondary-fg/90 lg:block">
              Govra membuka progres program kerja pemerintah daerah dan
              memastikan setiap laporan warga sampai ke dinas yang tepat.
            </p>
          </div>
        </div>
        <main id="konten" className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 text-fg shadow-lg sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AuthShell };
