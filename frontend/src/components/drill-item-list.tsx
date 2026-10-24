import Link from "next/link";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import type { Schema } from "@/lib/schema";

type Item = Schema<"DrillItem">;

const HEADERS = ["Data", "OPD", "Catatan", "Status"] as const;

function hrefOf(item: Item): string {
  return item.kind === "PROGRAM" ? `/proker/${item.ref}` : `/isu/${item.ref}`;
}

function DrillItemList({ items }: { items: readonly Item[] }) {
  return (
    <DataTable caption="Data penyusun indikator" headers={HEADERS}>
      {items.map((item) => (
        <DataRow key={`${item.kind}-${item.ref}`}>
          <RowHead>
            <Link href={hrefOf(item)} className="underline-offset-4 hover:text-primary hover:underline">
              {item.title}
            </Link>
          </RowHead>
          <DataCell className="text-sm text-fg-muted">{item.opd.name}</DataCell>
          <DataCell className="text-sm">{item.note}</DataCell>
          <DataCell className="px-6">
            <Badge weight={item.counted ? "berjalan" : "netral"}>
              {item.counted ? "Ikut dihitung" : "Belum dihitung"}
            </Badge>
          </DataCell>
        </DataRow>
      ))}
    </DataTable>
  );
}

export { DrillItemList };
