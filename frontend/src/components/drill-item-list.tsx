import { TextLink } from "@/components/text-link";
import { Badge } from "@/components/ui/badge";
import type { Schema } from "@/lib/schema";

type Item = Schema<"DrillItem">;

function hrefOf(item: Item): string {
  return item.kind === "PROGRAM" ? `/proker/${item.ref}` : `/isu/${item.ref}`;
}

function DrillItemList({ items }: { items: readonly Item[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={`${item.kind}-${item.ref}`}
          className="flex flex-col gap-2 rounded-md border bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <TextLink href={hrefOf(item)} className="min-h-0">
              {item.title}
            </TextLink>
            <p className="text-sm text-fg-muted">{item.opd.name}</p>
            <p className="text-sm">{item.note}</p>
          </div>
          <Badge weight={item.counted ? "berjalan" : "netral"}>
            {item.counted ? "Ikut dihitung" : "Belum dihitung"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export { DrillItemList };
