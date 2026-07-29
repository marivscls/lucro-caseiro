import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { OrdersRepoPg } from "./orders.repo.pg";

describe("OrdersRepoPg.create", () => {
  it("devolve a encomenda existente quando o mesmo requestId chega novamente", async () => {
    const requestId = "10000000-0000-4000-8000-000000000001";
    const returning = vi.fn().mockResolvedValue([]);
    const onConflictDoNothing = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const insert = vi.fn(() => ({ values }));
    const repo = new OrdersRepoPg({ insert } as unknown as AppDatabase);
    const existing = { id: requestId } as Order;
    const findById = vi.spyOn(repo, "findById").mockResolvedValue(existing);

    const result = await repo.create("user-1", {
      requestId,
      title: "Consulta",
      deliveryDate: "2026-07-30",
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: requestId,
        title: "Consulta",
      }),
    );
    expect(onConflictDoNothing).toHaveBeenCalledOnce();
    expect(findById).toHaveBeenCalledWith("user-1", requestId);
    expect(result).toBe(existing);
  });
});
