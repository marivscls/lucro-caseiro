import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { getTableName, is, Table } from "drizzle-orm";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import * as schema from "@lucro-caseiro/database/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const schemaValues: unknown[] = Object.values(schema);
const tables = schemaValues.filter((value): value is PgTable => is(value, Table));
const migration = readFileSync(
  "../../packages/database/src/migrations/20260910123323_restrict_api_table_access.sql",
  "utf8",
);

describe("API-only database access", () => {
  let pg: PGlite;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA storage;");
    // Reproduce legacy Supabase grants and a pre-existing permissive policy.
    for (const table of tables) {
      const name = getTableName(table);
      await pg.exec(`CREATE TABLE public."${name}" (id integer PRIMARY KEY, value text);
        INSERT INTO public."${name}" VALUES (1, 'private');
        GRANT ALL ON public."${name}" TO PUBLIC, anon, authenticated;
        CREATE POLICY legacy_access ON public."${name}" USING (true) WITH CHECK (true);`);
    }
    await pg.exec(`CREATE TABLE storage.objects (id integer);
      GRANT SELECT ON storage.objects TO authenticated;
      CREATE TABLE public.unrelated_extension_table(id integer);
      GRANT SELECT ON public.unrelated_extension_table TO authenticated;`);
    await pg.exec(migration);
    await pg.exec(migration);
  }, 30_000);
  afterAll(async () => pg?.close());

  it("declares RLS in every Drizzle table so schema pushes preserve it", () => {
    expect(tables.length).toBeGreaterThan(30);
    expect(
      tables.filter((table) => !getTableConfig(table).enableRLS).map(getTableName),
    ).toEqual([]);
  });

  it("removes public read/write and enables RLS on every application table", async () => {
    for (const table of tables) {
      const name = getTableName(table);
      const { rows } = await pg.query<{ secured: boolean; exposed: boolean }>(
        `
        SELECT relrowsecurity AS secured,
          (has_table_privilege('anon', oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
          OR has_table_privilege('authenticated', oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) AS exposed
        FROM pg_class WHERE oid = $1::regclass`,
        [`public.${name}`],
      );
      expect(rows, name).toEqual([{ secured: true, exposed: false }]);
    }
  });

  it.each(["anon", "authenticated"])(
    "denies actual reads and writes as %s",
    async (role) => {
      await pg.exec(`SET ROLE ${role}`);
      try {
        for (const statement of [
          "SELECT * FROM users",
          "UPDATE users SET value = 'professional'",
          "INSERT INTO subscription_purchase_claims VALUES (2, 'forged')",
          "DELETE FROM api_rate_limit_buckets",
        ]) {
          await expect(pg.exec(statement)).rejects.toThrow(/permission denied/);
        }
      } finally {
        await pg.exec("RESET ROLE");
      }
    },
  );

  it("preserves server-owner access, Storage grants, and unrelated tables", async () => {
    await pg.exec(
      "INSERT INTO users VALUES (2, 'owner'); UPDATE users SET value='updated' WHERE id=2;",
    );
    expect((await pg.query("SELECT value FROM users WHERE id=2")).rows).toEqual([
      { value: "updated" },
    ]);
    await pg.exec("DELETE FROM users WHERE id=2");
    expect(
      (
        await pg.query(`SELECT has_table_privilege('authenticated', 'storage.objects', 'SELECT') AS storage,
      has_table_privilege('authenticated', 'public.unrelated_extension_table', 'SELECT') AS unrelated`)
      ).rows,
    ).toEqual([{ storage: true, unrelated: true }]);
  });
});
