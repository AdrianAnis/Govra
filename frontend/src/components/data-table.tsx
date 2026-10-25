import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  caption: string;
  headers: readonly string[];
  children: ReactNode;
  className?: string;
}

function DataTable({ caption, headers, children, className }: DataTableProps) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-lg border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <table className={cn("w-full min-w-2xl border-collapse text-left", className)}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-secondary text-secondary-fg">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={cn("px-4 py-5 text-sm font-semibold", index === 0 && "sticky left-0 bg-secondary px-6")}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

function DataRow({ children }: { children: ReactNode }) {
  return <tr className="group transition-colors duration-200 ease-ui hover:bg-surface-muted">{children}</tr>;
}

function RowHead({ children }: { children: ReactNode }) {
  return (
    <th
      scope="row"
      className="sticky left-0 bg-surface px-6 py-5 text-base font-semibold transition-colors duration-200 ease-ui group-hover:bg-surface-muted"
    >
      {children}
    </th>
  );
}

function DataCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-5", className)}>{children}</td>;
}

export { DataCell, DataRow, DataTable, RowHead };
