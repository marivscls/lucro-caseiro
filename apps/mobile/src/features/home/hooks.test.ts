import { describe, it, expect, vi } from "vitest";
import { fetchSales } from "../sales/api";
import { fetchPendingSales } from "./hooks";
vi.mock("../sales/api", () => ({ fetchSales: vi.fn() }));
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
});
