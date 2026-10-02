import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "../../shared/db";
import { SalesRepoPg } from "./sales.repo.pg";
const USER = "11111111-1111-4111-8111-111111111111";
const ITEM = { itemName: "Produto fictício", quantity: 2, unitPrice: 5 };
describe("SalesRepoPg SQL atomicity", () => {
  let pg: PGlite;
  let repo: SalesRepoPg;
  beforeEach(async () => {
    pg = new PGlite();
    await pg.exec(
      `CREATE TYPE sale_status AS ENUM('pending','paid','cancelled');
      CREATE TYPE payment_method AS ENUM('pix','cash','card','credit','transfer');
      CREATE TABLE users(id uuid PRIMARY KEY);
      CREATE TABLE clients(id uuid PRIMARY KEY,user_id uuid,name text);
      CREATE TABLE products(id uuid PRIMARY KEY,user_id uuid,name text,photo_url text);
      CREATE TABLE services(id uuid PRIMARY KEY,user_id uuid,name text);
      CREATE TABLE sales(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES users(id),client_id uuid REFERENCES clients(id),
        status sale_status DEFAULT 'paid',payment_method payment_method,subtotal numeric(10,2),discount numeric(10,2) DEFAULT0,
        discount_type text,discount_value numeric(10,2) DEFAULT0,total numeric(10,2),paid_amount numeric(10,2) DEFAULT0,
        source_order_id uuid,notes text,sold_at timestamptz DEFAULT now(),created_at timestamptz DEFAULT now());
      CREATE TABLE sale_items(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
        product_id uuid REFERENCES products(id),service_id uuid REFERENCES services(id),item_name text,quantity numeric(10,3),
        unit_price numeric(10,2),variation_id uuid,variation_name text,subtotal numeric(10,2));
      INSERT INTO users VALUES ('${USER}');`.replaceAll("DEFAULT0", "DEFAULT 0"),
    );
    repo = new SalesRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);
  afterEach(async () => {
    await pg?.close();
  });
  async function rejectItemWrites() {
    await pg.exec(
      "ALTER TABLE sale_items ADD CONSTRAINT qa_fail CHECK(quantity<0) NOT VALID",
    );
  }
  it("rolls back the sale header when inserting its items fails; retry creates only one sale", async () => {
    await rejectItemWrites();
    await expect(
      repo.create(USER, { paymentMethod: "pix", items: [ITEM] }, 10, "paid"),
    ).rejects.toThrow();
    expect((await pg.query("SELECT count(*)::int AS count FROM sales")).rows).toEqual([
      { count: 0 },
    ]);
    await pg.exec("ALTER TABLE sale_items DROP CONSTRAINT qa_fail");
    const sale = await repo.create(
      USER,
      { paymentMethod: "pix", items: [ITEM] },
      10,
      "paid",
    );
    expect(sale.items).toHaveLength(1);
    expect((await pg.query("SELECT count(*)::int AS count FROM sales")).rows).toEqual([
      { count: 1 },
    ]);
  });
  it("keeps the original items,total and paidAmount when replacement fails", async () => {
    const sale = await repo.create(
      USER,
      { paymentMethod: "pix", items: [ITEM] },
      10,
      "paid",
    );
    await rejectItemWrites();
    await expect(
      repo.update(USER, sale.id, { items: [{ ...ITEM, quantity: 1, unitPrice: 7 }] }, 7),
    ).rejects.toThrow();
    const after = await repo.findById(USER, sale.id);
    expect(after).toMatchObject({
      total: 10,
      paidAmount: 10,
      items: [{ quantity: 2, unitPrice: 5 }],
    });
  });
  it("commits successful replacement and keeps ownership filters", async () => {
    const sale = await repo.create(
      USER,
      { paymentMethod: "pix", items: [ITEM] },
      10,
      "paid",
    );
    expect(
      await repo.update(
        "22222222-2222-4222-8222-222222222222",
        sale.id,
        { items: [ITEM] },
        10,
      ),
    ).toBeNull();
    expect(
      await repo.update(
        USER,
        sale.id,
        { items: [{ ...ITEM, quantity: 1, unitPrice: 7 }] },
        7,
      ),
    ).toMatchObject({ total: 7, paidAmount: 7, items: [{ quantity: 1, unitPrice: 7 }] });
  });
});
