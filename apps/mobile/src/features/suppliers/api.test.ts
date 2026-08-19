import type { Purchase } from "@lucro-caseiro/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "../../shared/utils/api-client";
import { fetchPurchases } from "../purchases/api";
import { fetchSuppliersOverview } from "./api";

vi.mock("../../shared/utils/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../shared/utils/api-client")>();
  return { ...actual, apiClient: vi.fn() };
});

vi.mock("../purchases/api", () => ({ fetchPurchases: vi.fn() }));

const purchase: Purchase = {
  id: "33333333-3333-4333-8333-333333333333",
  userId: "22222222-2222-4222-8222-222222222222",
  supplierId: "11111111-1111-4111-8111-111111111111",
  description: "Farinha",
  amount: 125.4,
  items: [],
  category: "material",
  paymentStatus: "pending",
  purchasedAt: new Date().toISOString().slice(0, 10),
  dueDate: null,
  paidAt: null,
  financeEntryId: null,
  createdAt: new Date().toISOString(),
};

describe("supplier API compatibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("falls back to legacy supplier and purchase endpoints when overview is unavailable", async () => {
    vi.mocked(apiClient)
      .mockRejectedValueOnce(new ApiError("Rota indisponÃ­vel", 404))
      .mockResolvedValueOnce({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            userId: "22222222-2222-4222-8222-222222222222",
            name: "Fornecedor legado",
            phone: null,
            email: null,
            address: null,
            notes: null,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
    vi.mocked(fetchPurchases).mockResolvedValue({
      items: [purchase],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });

    const overview = await fetchSuppliersOverview("token");

    expect(overview.items[0]).toMatchObject({
      name: "Fornecedor legado",
      category: "other",
      avatarType: "initials",
      hasOpenOrder: true,
    });
    expect(overview.month).toMatchObject({ purchaseCount: 1, totalAmount: 125.4 });
  });
});
