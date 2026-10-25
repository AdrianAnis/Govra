import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { currentTime } from "@/lib/clock";
import { FOOTER_GROUPS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { REPORT_NEW } from "@/lib/routes";

const LINK_CLASS =
  "inline-flex min-h-11 items-center text-secondary-fg/80 underline-offset-4 transition-colors duration-150 ease-ui hover:text-secondary-fg hover:underline";

function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-secondary text-secondary-fg">
      <Container className="flex flex-col gap-16 pt-16 pb-6 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="flex flex-col items-start gap-6 lg:col-span-5">
            <Logo tone="light" className="h-9" />
            <p className="max-w-md text-secondary-fg/80">
              Platform transparansi program kerja pemerintah daerah dan pelaporan warga berbasis AI.
              Pantau proker, laporkan masalah, dan lacak penanganannya sampai selesai.
            </p>
            <Link href={REPORT_NEW} className={cn(buttonVariants({ variant: "accent" }))}>
              Lapor Sekarang
            </Link>
          </div>
          <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <p className="text-sm font-semibold tracking-wide text-secondary-fg/60 uppercase">{group.title}</p>
                <ul className="flex flex-col">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_CLASS}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-secondary-fg/15 pt-6 text-sm text-secondary-fg/60 sm:flex-row sm:justify-between">
          <p>© {currentTime().getFullYear()} Govra. Seluruh hak dilindungi.</p>
          <p>Transparansi program daerah untuk warga.</p>
        </div>
      </Container>
    </footer>
  );
}

export { SiteFooter };
