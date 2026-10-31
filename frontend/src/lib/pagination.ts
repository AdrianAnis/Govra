type PageItem = number | "gap";

const WINDOW = 1;

export function pageWindow(page: number, pages: number): PageItem[] {
  const wanted = new Set([1, pages, page - WINDOW, page, page + WINDOW]);
  const visible = [...wanted].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b);
  return visible.flatMap((value, index): PageItem[] => {
    const previous = visible[index - 1];
    return previous !== undefined && value - previous > 1 ? ["gap", value] : [value];
  });
}
