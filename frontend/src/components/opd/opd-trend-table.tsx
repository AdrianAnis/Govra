import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import type { OpdMonthly } from "@/lib/data/opd-analytics";
import { formatIndicator, formatMonth, formatNumber } from "@/lib/format";

const HEADERS = [
  "Bulan",
  "Laporan masuk",
  "Laporan selesai",
  "Rata-rata waktu respons",
  "Proker berjalan",
  "Proker tuntas",
  "Rata-rata progres proker",
] as const;

function Empty() {
  return <span className="text-sm font-normal text-fg-subtle">Belum ada data</span>;
}

function OpdTrendTable({ opdName, months }: { opdName: string; months: readonly OpdMonthly[] }) {
  const newestFirst = [...months].reverse();
  return (
    <DataTable caption={`Tren bulanan ${opdName}`} headers={HEADERS} className="min-w-4xl">
      {newestFirst.map((month) => (
        <DataRow key={month.month}>
          <RowHead>{formatMonth(month.month)}</RowHead>
          <DataCell className="tabular-nums">{formatNumber(month.issues_received)}</DataCell>
          <DataCell className="tabular-nums">{formatNumber(month.issues_resolved)}</DataCell>
          <DataCell className="tabular-nums">
            {month.avg_response_hours === null ? <Empty /> : formatIndicator(month.avg_response_hours, "HOURS")}
          </DataCell>
          <DataCell className="tabular-nums">{formatNumber(month.proker_active)}</DataCell>
          <DataCell className="tabular-nums">{formatNumber(month.proker_completed)}</DataCell>
          <DataCell className="tabular-nums">
            {month.proker_avg_progress === null ? <Empty /> : formatIndicator(month.proker_avg_progress, "PERCENT")}
          </DataCell>
        </DataRow>
      ))}
    </DataTable>
  );
}

export { OpdTrendTable };
