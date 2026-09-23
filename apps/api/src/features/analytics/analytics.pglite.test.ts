import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { AnalyticsRepoPg } from "./analytics.repo.pg";

const MIGRATIONS = [
  "034_product_analytics.sql",
  "035_analytics_behavior_events.sql",
  "037_activation_funnel_events.sql",
  "20260923100000_analytics_event_name_format.sql",
];

const INSTALLATION = "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac3";
const USER = "11111111-1111-4111-8111-111111111111";
const ENVELOPE = {
  installationId: INSTALLATION,
  platform: "android" as const,
  appVersion: "1.2.0",
};

async function createDatabase(): Promise<PGlite> {
  const pg = new PGlite();
  await pg.exec(`CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE TABLE users(id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());`);
  for (const file of MIGRATIONS) {
    // Lista fixa de migrations do repositório, não entrada externa.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await pg.exec(readFileSync(`../../packages/database/src/migrations/${file}`, "utf8"));
  }
  return pg;
}

describe("Analytics persistence in PostgreSQL", () => {
  let pg: PGlite;
  let repo: AnalyticsRepoPg;

  beforeAll(async () => {
    pg = await createDatabase();
    repo = new AnalyticsRepoPg(drizzle(pg) as unknown as AppDatabase);
  }, 30_000);

  beforeEach(async () => {
    await pg.exec(`TRUNCATE analytics_installations, users CASCADE;
      INSERT INTO users(id) VALUES ('${USER}');`);
  });

  afterAll(async () => {
    await pg?.close();
  });

  it("aceita ações e telas do contrato que a lista fechada antiga rejeitava", async () => {
    // Arrange
    const occurredAt = new Date("2026-09-20T12:00:00.000Z");

    // Act
    await repo.recordEvents(USER, {
      ...ENVELOPE,
      occurredAt,
      activityDate: "2026-09-20",
      events: [
        { type: "action", name: "guidance_products_task_completed" },
        { type: "action", name: "service_created" },
        { type: "screen_view", name: "services", durationMs: 1_000 },
      ],
    });

    // Assert
    const { rows } = await pg.query<{ event_name: string }>(
      "SELECT event_name FROM analytics_events ORDER BY id",
    );
    expect(rows.map((row) => row.event_name)).toEqual([
      "guidance_products_task_completed",
      "service_created",
      "services",
    ]);
  });

  it("continua recusando nomes fora do formato canônico no banco", async () => {
    // Arrange
    await repo.recordOpen(null, {
      ...ENVELOPE,
      openedAt: new Date("2026-09-20T12:00:00.000Z"),
      activityDate: "2026-09-20",
    });

    // Act
    const insert = pg.query(
      `INSERT INTO analytics_events(installation_id, event_type, event_name, app_version)
       VALUES ($1, 'action', 'Texto Livre; DROP', '1.2.0')`,
      [INSTALLATION],
    );

    // Assert
    await expect(insert).rejects.toThrow();
  });
});
