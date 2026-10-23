import Link from "next/link";
import { Container } from "@/components/layout/container";
import { FOOTER_NAV } from "@/lib/navigation";

function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-fg">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:justify-between">
        <div className="flex max-w-prose flex-col gap-2">
          <p className="text-xl font-bold tracking-tight">Govra</p>
          <p className="text-sm text-secondary-fg/80">
            Platform transparansi program kerja pemerintah daerah dan pelaporan
            warga berbasis AI. Data yang tampil adalah data simulasi untuk
            keperluan demonstrasi.
          </p>
        </div>
        <nav aria-label="Tautan footer" className="shrink-0">
          <ul className="flex flex-col">
            {FOOTER_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center text-sm whitespace-nowrap underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}

export { SiteFooter };
