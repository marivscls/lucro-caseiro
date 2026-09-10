import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "../../shared/db";
import { RetailRepoPg } from "./retail.repo.pg";
import type { RetailDocumentCreateData } from "./retail.types";

const userId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const order: RetailDocumentCreateData = {
  kind: "catalog_order",
  title: "Pedido",
  payload: {},
  reservedUntil: new Date(Date.now() + 3600_000).toISOString(),
  items: [{ productId, name: "Caderno", quantity: 4, unitPrice: 10 }],
};

describe("Retail reservation persistence in PostgreSQL", () => {
  let pg: PGlite;
  let repo: RetailRepoPg;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE TABLE users(id uuid PRIMARY KEY);
      CREATE TABLE clients(id uuid PRIMARY KEY);
      CREATE TABLE products(id uuid PRIMARY KEY, user_id uuid, is_active boolean DEFAULT true,
        public_enabled boolean DEFAULT true, stock_quantity numeric, variations jsonb DEFAULT '[]');
      INSERT INTO users VALUES ('${userId}');`);
    await pg.exec(
      readFileSync(
        "../../packages/database/src/migrations/041_retail_operations.sql",
        "utf8",
      ),
    );
    repo = new RetailRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);
  beforeEach(async () => {
    await pg.exec(`TRUNCATE retail_document_items,retail_documents,products CASCADE;
      INSERT INTO products(id,user_id,stock_quantity) VALUES ('${productId}','${userId}',5);`);
  });
  afterAll(async () => {
    await pg?.close();
  });

  it("rechecks stock during writes so concurrent prequoted reservations cannot both succeed", async () => {
    const results = await Promise.allSettled([
      repo.createDocument(userId, order, "new"),
      repo.createDocument(userId, order, "new"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(
      (await pg.query("SELECT sum(quantity)::int AS quantity FROM retail_document_items"))
        .rows,
    ).toEqual([{ quantity: 4 }]);
  });

  it("rejects duplicate quantities at the transaction boundary without partial rows", async () => {
    await expect(
      repo.createDocument(
        userId,
        { ...order, items: [...order.items, ...order.items] },
        "new",
      ),
    ).rejects.toThrow("Estoque disponível insuficiente");
    expect(
      (await pg.query("SELECT count(*)::int AS count FROM retail_documents")).rows,
    ).toEqual([{ count: 0 }]);
  });

  it("rechecks public visibility before persisting a previously quoted order", async () => {
    await pg.exec("UPDATE products SET public_enabled=false");
    await expect(repo.createDocument(userId, order, "new", true)).rejects.toThrow(
      "Produto indisponível",
    );
    expect(
      (await pg.query("SELECT count(*)::int AS count FROM retail_documents")).rows,
    ).toEqual([{ count: 0 }]);
  });

  it("does not count expired reservations against the current stock", async () => {
    await repo.createDocument(
      userId,
      {
        ...order,
        reservedUntil: new Date(Date.now() - 3600_000).toISOString(),
      },
      "new",
    );
    await expect(repo.createDocument(userId, order, "new")).resolves.toMatchObject({
      amount: 40,
    });
  });

  it("rejects a forged variation before a reservation is persisted", async () => {
    await expect(
      repo.createDocument(
        userId,
        {
          ...order,
          items: [{ ...order.items[0]!, variationId: userId }],
        },
        "new",
      ),
    ).rejects.toThrow("Variação indisponível");
  });
});
