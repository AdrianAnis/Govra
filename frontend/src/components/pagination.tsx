import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { pageWindow } from "@/lib/pagination";
import { buildHref } from "@/lib/url";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  basePath: string;
  params: Record<string, string>;
}

const NAV_BUTTON = "min-w-11 px-3";

function Pagination({ page, limit, total, basePath, params }: PaginationProps) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) {
    return null;
  }
  const hrefOf = (target: number) => buildHref(basePath, params, target);

  return (
    <nav aria-label="Halaman" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={hrefOf(page - 1)}
          className={cn(buttonVariants({ variant: "outline" }), NAV_BUTTON)}
        >
          <ChevronLeft aria-hidden />
          <span className="sr-only sm:not-sr-only">Sebelumnya</span>
        </Link>
      )}
      {pageWindow(page, pages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-fg-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefOf(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: item === page ? "primary" : "ghost" }),
              NAV_BUTTON,
            )}
          >
            {item}
          </Link>
        ),
      )}
      {page < pages && (
        <Link
          href={hrefOf(page + 1)}
          className={cn(buttonVariants({ variant: "outline" }), NAV_BUTTON)}
        >
          <span className="sr-only sm:not-sr-only">Berikutnya</span>
          <ChevronRight aria-hidden />
        </Link>
      )}
    </nav>
  );
}

export { Pagination };
