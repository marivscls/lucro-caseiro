import { describe, it, expect, vi } from "vitest";
import { fetchAllSales, fetchSales } from "../sales/api";
import { fetchPendingSales, fetchSalesHistory } from "./hooks";
vi.mock("../sales/api", () => ({ fetchSales: vi.fn(), fetchAllSales: vi.fn() }));
vi.mock("../products/api", () => ({ fetchAllProducts: vi.fn() }));
vi.mock("../../shared/hooks/use-auth", () => ({ useAuth: vi.fn() }));

describe("pending sales for home", () => {
  it("loads every page before returning a total", async () => {
    vi.mocked(fetchSales)
      .mockResolvedValueOnce({ items: [{ id: "first" }], totalPages: 2 } as Awaited<
        ReturnType<typeof fetchSales>
      >)
      .mockResolvedValueOnce({ items: [{ id: "second" }], totalPages: 2 } as Awaited<
        ReturnType<typeof fetchSales>
      >);
    const result = await fetchPendingSales("test-token");
    expect(result.items.map((item) => item.id)).toEqual(["first", "second"]);
    expect(fetchSales).toHaveBeenLastCalledWith("test-token", {
      status: "pending",
      page: 2,
    });
  });
  it("rejects a failed later page instead of displaying a partial total", async () => {
    vi.mocked(fetchSales)
      .mockResolvedValueOnce({ items: [], totalPages: 2 } as unknown as Awaited<
        ReturnType<typeof fetchSales>
      >)
      .mockRejectedValueOnce(new Error("offline"));
    await expect(fetchPendingSales("test-token")).rejects.toThrow("offline");
  });
  it("loads the history from the given date through every page", async () => {
    vi.mocked(fetchAllSales).mockResolvedValueOnce({
      items: [{ id: "a" }, { id: "b" }],
      totalPages: 2,
    } as Awaited<ReturnType<typeof fetchAllSales>>);
    const result = await fetchSalesHistory("test-token", "2026-08-01T03:00:00.000Z");
    expect(result.items).toHaveLength(2);
    expect(fetchAllSales).toHaveBeenCalledWith("test-token", {
      dateFrom: "2026-08-01T03:00:00.000Z",
    });
  });
  it("rejects the history when a page fails", async () => {
    vi.mocked(fetchAllSales).mockRejectedValueOnce(new Error("offline"));
    await expect(fetchSalesHistory("test-token", "2026-08-01")).rejects.toThrow(
      "offline",
    );
  });
});
