import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/bits/reveal";
import { formatIndicator } from "@/lib/format";
import { indicatorSlug } from "@/lib/indicators";
import type { Schema } from "@/lib/schema";

type Row = Schema<"OpdScorecard">;
type Indicator = Schema<"IndicatorValue">;

function ValueLink({ indicator, opd }: { indicator: Indicator; opd: string }) {
  if (indicator.value === null) {
    return <span className="text-sm text-fg-subtle">Belum tersedia</span>;
  }
  return (
    <Link
      href={`/rapor/${indicatorSlug(indicator.code)}?opd=${opd}`}
      className="text-lg font-semibold tabular-nums underline-offset-4 hover:text-primary hover:underline"
    >
      {formatIndicator(indicator.value, indicator.unit)}
    </Link>
  );
}

function OpdComparison({ columns, rows }: { columns: readonly Indicator[]; rows: readonly Row[] }) {
  const sorted = [...rows].sort((a, b) => a.opd.name.localeCompare(b.opd.name, "id"));
  return (
    <Reveal variant="blur">
      <div className="overflow-x-auto rounded-lg border bg-surface">
        <table className="w-full min-w-4xl border-collapse text-left">
          <caption className="sr-only">Indikator rapor per OPD, diurutkan abjad</caption>
          <thead className="bg-secondary text-secondary-fg">
            <tr>
              <th scope="col" className="sticky left-0 bg-secondary px-6 py-5 text-sm font-semibold">
                OPD
              </th>
              {columns.map((column) => (
                <th key={column.code} scope="col" className="px-4 py-5 text-sm font-semibold">
                  <Link
                    href={`/rapor/${indicatorSlug(column.code)}`}
                    className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                  >
                    {column.label}
                    <ArrowUpRight aria-hidden className="size-3.5 text-secondary-fg/60" />
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map((row) => (
              <tr key={row.opd.code} className="group transition-colors duration-200 ease-ui hover:bg-surface-muted">
                <th
                  scope="row"
                  className="sticky left-0 bg-surface px-6 py-5 text-base font-semibold transition-colors duration-200 ease-ui group-hover:bg-surface-muted"
                >
                  <Link href={`/opd/${row.opd.slug}`} className="underline-offset-4 hover:text-primary hover:underline">
                    {row.opd.name}
                  </Link>
                </th>
                {row.indicators.map((indicator) => (
                  <td key={indicator.code} className="px-4 py-5">
                    <ValueLink indicator={indicator} opd={row.opd.slug} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}

export { OpdComparison };
