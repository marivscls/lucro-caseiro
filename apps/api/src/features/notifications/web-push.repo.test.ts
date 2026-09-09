import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppDatabase } from "../../shared/db";
import { WebPushRepoPg } from "./web-push.repo.pg";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUser = "22222222-2222-4222-8222-222222222222";
const input = {
  endpoint: "https://fcm.googleapis.com/x",
  keys: { p256dh: "key", auth: "auth" },
  timezone: "America/Sao_Paulo",
  prefs: {},
};
const dialect = new PgDialect();

describe("Web Push persistence and worker with PostgreSQL", () => {
  let pg: PGlite;
  let repo: WebPushRepoPg;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE FUNCTION public.now() RETURNS timestamptz LANGUAGE sql AS $$ SELECT '2026-09-09 12:05:00+00'::timestamptz $$;
      SET search_path TO public,pg_catalog;
      CREATE TABLE users(id uuid PRIMARY KEY, plan text DEFAULT 'free', plan_expires_at timestamptz, is_active boolean DEFAULT true);
      CREATE TABLE sales(user_id uuid, status text);
      CREATE TABLE products(user_id uuid, is_active boolean DEFAULT true, stock_quantity int, stock_alert_threshold int, variations jsonb DEFAULT '[]');
      CREATE TABLE orders(user_id uuid, status text, delivery_date date);
      CREATE TABLE clients(user_id uuid, birthday date);
      INSERT INTO users(id) VALUES ('${userId}'),('${otherUser}');`);
    const migration = readFileSync(
      "../../packages/database/src/migrations/20260909183022_browser_push_notifications.sql",
      "utf8",
    );
    await pg.exec(migration);
    await pg.exec(migration); // The startup migration must be idempotent.
    const adapt = (connection: Pick<PGlite, "query">) => ({
      execute: async (query: SQL) => {
        const compiled = dialect.sqlToQuery(query);
        return (await connection.query(compiled.sql, compiled.params)).rows;
      },
    });
    repo = new WebPushRepoPg({
      ...adapt(pg),
      transaction: (fn: (tx: unknown) => Promise<void>) =>
        pg.transaction((tx) => fn(adapt(tx))),
    } as unknown as AppDatabase);
  }, 30_000);
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-09T12:05:00Z"));
    await pg.exec(
      "TRUNCATE web_push_subscriptions,sales,products,orders,clients; UPDATE users SET plan='free',plan_expires_at=NULL,is_active=true;",
    );
  });
  afterAll(async () => {
    vi.useRealTimers();
    await pg?.close();
  });

  it("restricts subscription reads and deletion to owner and brand", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    expect(await repo.get(otherUser, "lucro-caseiro", input.endpoint)).toBeNull();
    await repo.remove(otherUser, "lucro-caseiro", input.endpoint);
    await repo.remove(userId, "lucro-manicure", input.endpoint);
    expect(await repo.get(userId, "lucro-caseiro", input.endpoint)).not.toBeNull();
    await repo.remove(userId, "lucro-caseiro", input.endpoint);
    expect(await repo.get(userId, "lucro-caseiro", input.endpoint)).toBeNull();
  });
  it("sends one morning digest and persists deduplication across worker instances", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    await pg.exec(
      `INSERT INTO orders VALUES ('${userId}','pending','2026-09-10'),('${userId}','cancelled','2026-09-10'),('${otherUser}','pending','2026-09-10');`,
    );
    const send = vi.fn().mockResolvedValue("sent");
    await repo.runOnce(send);
    await repo.runOnce(send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[1]).toMatchObject({
      body: "1 entrega(s) até amanhã para conferir.",
      url: "/tabs/agenda",
    });
    expect(
      (await pg.query("SELECT morning_date::text AS date FROM web_push_subscriptions"))
        .rows,
    ).toEqual([{ date: "2026-09-09" }]);
  });
  it("honors opt-outs and current plan expiry without an open browser", async () => {
    await repo.register(userId, "lucro-caseiro", {
      ...input,
      prefs: { DELIVERY: false },
    });
    await pg.exec(
      `INSERT INTO orders VALUES ('${userId}','pending','2026-09-10'); INSERT INTO clients VALUES ('${userId}','1990-09-09'); UPDATE users SET plan='professional',plan_expires_at='2026-09-08';`,
    );
    const send = vi.fn().mockResolvedValue("sent");
    await repo.runOnce(send);
    expect(send).not.toHaveBeenCalled();
  });
  it("does not alert stock without a configured threshold", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    await pg.exec(`INSERT INTO products(user_id,stock_quantity,stock_alert_threshold,variations) VALUES
      ('${userId}',0,NULL,'[]');`);
    const send = vi.fn().mockResolvedValue("sent");
    await repo.runOnce(send);
    expect(send).not.toHaveBeenCalled();
  });
  it("checks stock per variation", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    await pg.exec(`INSERT INTO products(user_id,stock_quantity,stock_alert_threshold,variations) VALUES
      ('${userId}',100,2,'[{"stockQuantity":1}]');`);
    const send = vi.fn().mockResolvedValue("sent");
    await repo.runOnce(send);
    expect(send.mock.calls[0]?.[1].body).toContain("1 produto");
  });
  it("deletes expired browser endpoints", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    await pg.exec(`INSERT INTO sales VALUES ('${userId}','pending');`);
    await repo.runOnce(() => Promise.resolve("expired"));
    expect(await repo.get(userId, "lucro-caseiro", input.endpoint)).toBeNull();
  });
  it("retains a failed send for retry without marking it delivered", async () => {
    await repo.register(userId, "lucro-caseiro", input);
    await pg.exec(`INSERT INTO sales VALUES ('${userId}','pending');`);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    await repo.runOnce(() => Promise.reject(new Error("provider unavailable")));
    expect(
      (
        await pg.query(
          "SELECT morning_date, retry_after > now() AS delayed FROM web_push_subscriptions",
        )
      ).rows,
    ).toEqual([{ morning_date: null, delayed: true }]);
    errorLog.mockRestore();
  });
  it("denies direct table access to the public client roles", async () => {
    const result = await pg.query(
      "SELECT has_table_privilege('anon','web_push_subscriptions','SELECT') AS anon, has_table_privilege('authenticated','web_push_subscriptions','INSERT') AS authenticated, relrowsecurity AS rls FROM pg_class WHERE relname='web_push_subscriptions'",
    );
    expect(result.rows).toEqual([{ anon: false, authenticated: false, rls: true }]);
  });
});
