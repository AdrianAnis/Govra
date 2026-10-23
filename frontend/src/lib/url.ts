export function buildHref(path: string, params: Record<string, string>, page: number): string {
  const search = new URLSearchParams(params);
  if (page > 1) {
    search.set("page", String(page));
  } else {
    search.delete("page");
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function activeParams(
  filters: Record<string, string | number | undefined>,
): Record<string, string> {
  const entries = Object.entries(filters).flatMap(([key, value]) =>
    value === undefined || key === "page" ? [] : [[key, String(value)] as const],
  );
  return Object.fromEntries(entries);
}
