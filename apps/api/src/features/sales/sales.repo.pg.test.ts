import { describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { SalesRepoPg } from "./sales.repo.pg";

describe("SalesRepoPg ownership", () => {
  it("recusa associar à venda um cliente de outra conta", async () => {
    const insert = vi.fn();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      })),
      insert,
    } as unknown as AppDatabase;
    const repo = new SalesRepoPg(db);

    await expect(
      repo.create(
        "user-a",
        {
          clientId: "client-de-user-b",
          paymentMethod: "pix",
          items: [{ itemName: "Bolo", quantity: 1, unitPrice: 10 }],
        },
        10,
        "paid",
      ),
    ).rejects.toThrow("Cliente não encontrado");
    expect(insert).not.toHaveBeenCalled();
  });
});
