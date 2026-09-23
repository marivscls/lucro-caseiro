import { describe, expect, it, vi } from "vitest";

import { fetchAllPages, mergePages, nextPageParam, type Paginated } from "./pagination";

function page(n: number, items: number[], totalPages: number): Paginated<number> {
  return { items, total: 5, page: n, limit: 2, totalPages };
}

describe("fetchAllPages", () => {
  it("busca todas as páginas e junta os itens", async () => {
    // Arrange
    const fetchPage = vi.fn((n: number) =>
      Promise.resolve(page(n, n === 3 ? [5] : [n * 2 - 1, n * 2], 3)),
    );

    // Act
    const result = await fetchAllPages(fetchPage);

    // Assert
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(result.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.total).toBe(5);
  });

  it("faz uma chamada só quando há uma página", async () => {
    const fetchPage = vi.fn(() => Promise.resolve(page(1, [1], 1)));
    await fetchAllPages(fetchPage);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});

describe("mergePages", () => {
  it("retorna lista vazia sem páginas", () => {
    expect(mergePages([]).items).toEqual([]);
  });
});

describe("nextPageParam", () => {
  it("indica a próxima página enquanto houver", () => {
    expect(nextPageParam(page(1, [], 3))).toBe(2);
    expect(nextPageParam(page(3, [], 3))).toBeUndefined();
  });
});
