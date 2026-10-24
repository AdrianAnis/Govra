import { KpiTile } from "@/components/kpi-tile";
import { formatIndicator, formatNumber } from "@/lib/format";
import { indicatorSlug } from "@/lib/indicators";
import type { Schema } from "@/lib/schema";

interface IndicatorTilesProps {
  indicators: readonly Schema<"IndicatorValue">[];
  opd?: string;
}

function IndicatorTiles({ indicators, opd }: IndicatorTilesProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indicators.map((indicator) => (
        <li key={indicator.code}>
          <KpiTile
            label={indicator.label}
            value={formatIndicator(indicator.value, indicator.unit)}
            delta={`Dihitung dari ${formatNumber(indicator.sample_size)} data`}
            href={`/rapor/${indicatorSlug(indicator.code)}${opd ? `?opd=${opd}` : ""}`}
          />
        </li>
      ))}
    </ul>
  );
}

export { IndicatorTiles };
