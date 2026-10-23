import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, type SelectFilter } from "@/components/filter-bar";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ProgramCard } from "@/components/program-card";
import { EmptyState } from "@/components/state-message";
import { buttonVariants } from "@/components/ui/button";
import { listPrograms } from "@/lib/data/programs";
import { getDistricts, getGoals, getOpds } from "@/lib/data/reference";
import { parseProgramFilters } from "@/lib/search-params";
import { PROGRAM_STATUS } from "@/lib/status";
import { activeParams } from "@/lib/url";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Proker" };

const PAGE_SIZE = 9;

async function loadSelects(): Promise<SelectFilter[]> {
  const [opds, districts, goals] = await Promise.all([getOpds(), getDistricts(), getGoals()]);
  return [
    {
      name: "opd",
      label: "Filter OPD",
      allLabel: "Semua OPD",
      options: opds.items.map((opd) => ({ value: opd.slug, label: opd.name })),
    },
    {
      name: "district_id",
      label: "Filter kecamatan",
      allLabel: "Semua kecamatan",
      options: districts.items.map((district) => ({ value: district.id, label: district.name })),
    },
    {
      name: "goal",
      label: "Filter sasaran",
      allLabel: "Semua sasaran",
      options: goals.items.map((goal) => ({ value: goal.code, label: goal.name })),
    },
    {
      name: "status",
      label: "Filter status",
      allLabel: "Semua status",
      options: Object.entries(PROGRAM_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
  ];
}

export default async function ProgramsPage({ searchParams }: PageProps<"/proker">) {
  const filters = parseProgramFilters(await searchParams);
  const [programs, selects] = await Promise.all([
    listPrograms({ ...filters, limit: PAGE_SIZE }),
    loadSelects(),
  ]);

  return (
    <>
      <Container className="flex flex-col gap-6 py-10">
        <PageHeader
          title="Program Kerja"
          description="Pantau progres proker pemerintah daerah."
        />
        <FilterBar search={{ name: "q", label: "Cari proker, OPD, atau kecamatan" }} selects={selects} />
        <p aria-live="polite" className="text-sm text-fg-muted">
          Menampilkan {programs.items.length} dari {programs.total} proker
        </p>
        {programs.items.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {programs.items.map((program) => (
              <li key={program.code}>
                <ProgramCard program={program} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Tidak ada proker yang cocok"
            description="Coba ubah kata kunci atau hapus sebagian filter."
            action={
              <Link href="/proker" className={cn(buttonVariants({ variant: "outline" }))}>
                Hapus filter
              </Link>
            }
          />
        )}
        <Pagination
          page={programs.page}
          limit={programs.limit}
          total={programs.total}
          basePath="/proker"
          params={activeParams(filters)}
        />
      </Container>
    </>
  );
}
