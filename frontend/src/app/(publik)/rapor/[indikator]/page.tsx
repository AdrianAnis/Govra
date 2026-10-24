import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DrillItemList } from "@/components/drill-item-list";
import { FilterBar } from "@/components/filter-bar";
import { Container } from "@/components/layout/container";
import { IndicatorHero } from "@/components/indicator-hero";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/state-message";
import { getOpds } from "@/lib/data/reference";
import { getIndicatorItems, getMethodology, getScorecard } from "@/lib/data/scorecard";
import { formatIndicator, formatNumber } from "@/lib/format";
import { indicatorSlug, parseIndicatorSlug } from "@/lib/indicators";
import { parseDrillFilters } from "@/lib/search-params";
import { activeParams } from "@/lib/url";

const PAGE_SIZE = 10;

export async function generateMetadata({ params }: PageProps<"/rapor/[indikator]">): Promise<Metadata> {
  const code = parseIndicatorSlug((await params).indikator);
  const methodology = await getMethodology();
  const entry = methodology.indicators.find((indicator) => indicator.code === code);
  return { title: entry ? entry.label : "Indikator tidak ditemukan" };
}

export default async function IndicatorPage({
  params,
  searchParams,
}: PageProps<"/rapor/[indikator]">) {
  const code = parseIndicatorSlug((await params).indikator);
  if (!code) {
    notFound();
  }
  const filters = parseDrillFilters(await searchParams);
  const [scorecard, methodology, opds, drill] = await Promise.all([
    getScorecard(),
    getMethodology(),
    getOpds(),
    getIndicatorItems(code, { ...filters, limit: PAGE_SIZE }),
  ]);
  const scope = filters.opd
    ? scorecard.by_opd.find((row) => row.opd.slug === filters.opd)?.indicators
    : scorecard.indicators;
  const value = scope?.find((indicator) => indicator.code === code);
  const entry = methodology.indicators.find((indicator) => indicator.code === code);
  if (!entry) {
    notFound();
  }
  const opdName = opds.items.find((opd) => opd.slug === filters.opd)?.name;

  return (
    <Container className="flex flex-col gap-8 py-6 lg:py-8">
      <Link
        href="/rapor"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Rapor periode
      </Link>
      <IndicatorHero
        eyebrow="Indikator rapor"
        title={entry.label}
        description={entry.description}
        formula={entry.formula}
        value={value && value.value !== null ? formatIndicator(value.value, value.unit) : "–"}
        caption={
          value
            ? `Dari ${formatNumber(value.sample_size)} data · ${opdName ?? "semua OPD"}`
            : (opdName ?? "semua OPD")
        }
      />
      <div className="flex flex-col gap-6 py-4 lg:py-8">
        <h2 className="text-3xl font-bold tracking-tight">Data penyusun</h2>
        <FilterBar
          selects={[
            {
              name: "opd",
              label: "Filter OPD",
              allLabel: "Semua OPD",
              options: opds.items.map((opd) => ({ value: opd.slug, label: opd.name })),
            },
          ]}
        />
        {drill.items.length > 0 ? (
          <DrillItemList items={drill.items} />
        ) : (
          <EmptyState title="Belum ada data penyusun" description="Indikator ini belum punya data untuk filter yang dipilih." />
        )}
        <Pagination
          page={drill.page}
          limit={drill.limit}
          total={drill.total}
          basePath={`/rapor/${indicatorSlug(code)}`}
          params={activeParams(filters)}
        />
      </div>
    </Container>
  );
}
