import { TextLink } from "@/components/text-link";
import { formatIndicator } from "@/lib/format";
import { indicatorSlug } from "@/lib/indicators";
import type { Schema } from "@/lib/schema";

type Row = Schema<"OpdScorecard">;
type Indicator = Schema<"IndicatorValue">;

interface OpdComparisonProps {
  columns: readonly Indicator[];
  rows: readonly Row[];
}

function ValueLink({ indicator, opd }: { indicator: Indicator; opd: string }) {
  return (
    <TextLink
      href={`/rapor/${indicatorSlug(indicator.code)}?opd=${opd}`}
      className="font-medium tabular-nums"
    >
      {formatIndicator(indicator.value, indicator.unit)}
    </TextLink>
  );
}

function OpdComparison({ columns, rows }: OpdComparisonProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Perbandingan indikator antar OPD</caption>
          <thead className="bg-surface-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                OPD
              </th>
              {columns.map((column) => (
                <th key={column.code} scope="col" className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.opd.code} className="border-t">
                <th scope="row" className="px-4 py-2 font-medium">
                  <TextLink href={`/opd/${row.opd.slug}`}>{row.opd.name}</TextLink>
                </th>
                {row.indicators.map((indicator) => (
                  <td key={indicator.code} className="px-4 py-2">
                    <ValueLink indicator={indicator} opd={row.opd.slug} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-4 md:hidden">
        {rows.map((row) => (
          <li key={row.opd.code} className="flex flex-col gap-3 rounded-md border bg-surface p-4">
            <TextLink href={`/opd/${row.opd.slug}`}>{row.opd.name}</TextLink>
            <dl className="flex flex-col gap-1">
              {row.indicators.map((indicator) => (
                <div key={indicator.code} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-fg-muted">{indicator.label}</dt>
                  <dd>
                    <ValueLink indicator={indicator} opd={row.opd.slug} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export { OpdComparison };
