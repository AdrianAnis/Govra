const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export interface PageParams {
  page?: number | undefined;
  limit?: number | undefined;
}

export function paginate<T>(items: readonly T[], params: PageParams) {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const start = (page - 1) * limit;
  return { page, limit, total: items.length, items: items.slice(start, start + limit) };
}

export function matchesQuery(text: string, query: string | undefined): boolean {
  if (!query) {
    return true;
  }
  return text.toLowerCase().includes(query.trim().toLowerCase());
}
