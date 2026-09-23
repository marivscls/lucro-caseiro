export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Maior página aceita pela API. */
export const MAX_PAGE_SIZE = 100;
/** Trava de segurança: nunca busca mais que isso de uma vez. */
const MAX_PAGES = 50;

/**
 * Busca todas as páginas de uma listagem. Usado onde a tela soma ou agrupa
 * a lista inteira (ex.: fiado), para não calcular só com a primeira página.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Paginated<T>>,
): Promise<Paginated<T>> {
  const first = await fetchPage(1);
  const pages = [first];
  const lastPage = Math.min(first.totalPages, MAX_PAGES);
  for (let page = 2; page <= lastPage; page++) {
    pages.push(await fetchPage(page));
  }
  return mergePages(pages);
}

/** Junta páginas carregadas aos poucos em uma única lista. */
export function mergePages<T>(pages: Paginated<T>[]): Paginated<T> {
  const last = pages.at(-1);
  if (!last) return { items: [], total: 0, page: 1, limit: MAX_PAGE_SIZE, totalPages: 1 };
  return {
    items: pages.flatMap((page) => page.items),
    total: last.total,
    page: last.page,
    limit: last.limit,
    totalPages: last.totalPages,
  };
}

export function nextPageParam<T>(last: Paginated<T>): number | undefined {
  return last.page < last.totalPages ? last.page + 1 : undefined;
}
