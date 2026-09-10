import type { Order } from "@lucro-caseiro/contracts";
import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import type { AppDatabase } from "../../shared/db";
import { OrdersRepoPg } from "./orders.repo.pg";

describe("OrdersRepoPg.create", () => {
  it.each(["create", "update", "package"] as const)(
    "rejects a foreign client before %s writes",
    async (operation) => {
      const returning = vi.fn().mockResolvedValue([{ id: "own-order" }]);
      const insert = vi.fn(() => ({
        values: vi.fn(() => ({
          returning,
          onConflictDoNothing: vi.fn(() => ({ returning })),
        })),
      }));
      const update = vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(() => ({ returning })) })),
      }));
      const where = vi.fn().mockResolvedValue([]);
      const db = {
        select: vi.fn(() => ({
          from: vi.fn(() => ({ where })),
        })),
        insert,
        update,
      } as unknown as AppDatabase;
      const repo = new OrdersRepoPg(db);
      vi.spyOn(repo, "findById").mockResolvedValue({ id: "own-order" } as Order);
      vi.spyOn(repo, "listPackagePurchases").mockResolvedValue([]);
      const data = {
        title: "Encomenda",
        deliveryDate: "2026-09-20",
        clientId: "foreign-client",
      };
      let operationPromise;
      if (operation === "create") operationPromise = repo.create("user-a", data);
      else if (operation === "update")
        operationPromise = repo.update("user-a", "own-order", data);
      else
        operationPromise = repo.createPackagePurchase(
          "user-a",
          "own-package",
          "own-service",
          { clientId: data.clientId, paymentMethod: "pix" },
          {
            name: "Pacote",
            sessions: 2,
            price: 100,
            validityDays: 30,
            active: true,
          },
          "2026-10-10",
        );
      await expect(operationPromise).rejects.toThrow("Cliente não encontrado");
      const lookup = new PgDialect().sqlToQuery(where.mock.calls[0]![0]);
      expect(lookup.params).toEqual(["foreign-client", "user-a"]);
      expect(lookup.sql).toContain('"clients"."user_id"');
      expect(insert).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );

  it("accepts an owned client after checking both its ID and owner", async () => {
    const where = vi.fn().mockResolvedValue([{ id: "owned-client" }]);
    const returning = vi.fn().mockResolvedValue([{ id: "own-order" }]);
    const insert = vi.fn(() => ({
      values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => ({ returning })) })),
    }));
    const repo = new OrdersRepoPg({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      insert,
    } as unknown as AppDatabase);
    const expected = { id: "own-order" } as Order;
    vi.spyOn(repo, "findById").mockResolvedValue(expected);
    await expect(
      repo.create("user-a", {
        title: "Encomenda",
        deliveryDate: "2026-09-20",
        clientId: "owned-client",
      }),
    ).resolves.toBe(expected);
    expect(insert).toHaveBeenCalledOnce();
    expect(new PgDialect().sqlToQuery(where.mock.calls[0]![0]).params).toEqual([
      "owned-client",
      "user-a",
    ]);
  });

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
