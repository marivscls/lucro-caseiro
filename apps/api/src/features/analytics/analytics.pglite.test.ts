import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { AnalyticsRepoPg } from "./analytics.repo.pg";
import { ANALYTICS_DASHBOARD_QUERY } from "./analytics.report-query";

const MIGRATIONS = [
  "034_product_analytics.sql",
  "035_analytics_behavior_events.sql",
  "037_activation_funnel_events.sql",
  "20260923100000_analytics_event_name_format.sql",
  "20260923100100_analytics_installation_acquisition.sql",
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

  describe("cadastro registrado pelo servidor", () => {
    const OTHER_INSTALLATION = "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac4";
    const open = {
      ...ENVELOPE,
      openedAt: new Date("2026-09-20T12:00:00.000Z"),
      activityDate: "2026-09-20",
    };

    it("só marca o primeiro vínculo da conta em qualquer instalação", async () => {
      // Arrange
      await pg.query("UPDATE users SET created_at = '2026-09-20T11:59:00Z'");

      // Act
      const first = await repo.recordOpen(USER, open);
      const again = await repo.recordOpen(USER, open);
      const otherDevice = await repo.recordOpen(USER, {
        ...open,
        installationId: OTHER_INSTALLATION,
      });

      // Assert
      expect(first).toEqual({
        firstUserLink: true,
        userCreatedAt: new Date("2026-09-20T11:59:00.000Z"),
      });
      expect(again.firstUserLink).toBe(false);
      expect(otherDevice.firstUserLink).toBe(false);
    });

    it("não duplica signup_completed da mesma conta", async () => {
      // Arrange
      await repo.recordOpen(USER, open);

      // Act
      await repo.recordSignupOnce(USER, open);
      await repo.recordSignupOnce(USER, { ...open, installationId: INSTALLATION });

      // Assert
      const { rows } = await pg.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM analytics_events
         WHERE user_id = $1 AND event_name = 'signup_completed'`,
        [USER],
      );
      expect(rows).toEqual([{ count: 1 }]);
    });
  });

  describe("origem da instalação", () => {
    it("grava a origem só na primeira abertura e agrega por fonte no painel", async () => {
      // Arrange
      const openedAt = new Date();
      const open = { ...ENVELOPE, openedAt, activityDate: "2026-09-20" };

      // Act
      await repo.recordOpen(null, {
        ...open,
        acquisition: { utmSource: "site_publico", utmContent: "pwa_header" },
      });
      await repo.recordOpen(USER, {
        ...open,
        acquisition: { utmSource: "outra_campanha", referrer: "exemplo.com" },
      });
      await repo.recordOpen(null, {
        ...open,
        installationId: "0cbd1c3e-1755-4f3f-a1bf-40c12b267ac5",
      });

      // Assert
      const stored = await pg.query(
        `SELECT utm_source, utm_medium, utm_content, referrer
         FROM analytics_installations WHERE id = $1`,
        [INSTALLATION],
      );
      expect(stored.rows).toEqual([
        {
          utm_source: "site_publico",
          utm_medium: null,
          utm_content: "pwa_header",
          referrer: null,
        },
      ]);
      const { rows } = await pg.query<{ acquisition_sources: unknown }>(
        ANALYTICS_DASHBOARD_QUERY,
      );
      expect(rows[0]?.acquisition_sources).toEqual([
        {
          source: "site_publico",
          content: "pwa_header",
          installations: 1,
          linked_to_user: 1,
        },
        { source: null, content: null, installations: 1, linked_to_user: 0 },
      ]);
    });
  });

  describe("funil do painel", () => {
    const GOOGLE = "a0000000-0000-4000-8000-000000000001";
    const EMAIL = "a0000000-0000-4000-8000-000000000002";
    const PRODUCT_FIRST = "a0000000-0000-4000-8000-000000000003";
    const IDLE = "a0000000-0000-4000-8000-000000000004";

    async function seedInstallation(id: string): Promise<void> {
      await pg.query(
        `INSERT INTO analytics_installations(id, platform, app_version, first_opened_at, last_opened_at)
         VALUES ($1, 'android', '1.2.0', '2026-09-01T10:00:00Z', '2026-09-01T10:00:00Z')`,
        [id],
      );
    }

    async function seedAction(id: string, name: string, at: string): Promise<void> {
      await pg.query(
        `INSERT INTO analytics_events(installation_id, event_type, event_name, app_version, occurred_at)
         VALUES ($1, 'action', $2, '1.2.0', $3)`,
        [id, name, at],
      );
    }

    async function funnel(): Promise<Record<string, number>> {
      const { rows } = await pg.query<{
        funnel: { stage: string; installations: number }[];
      }>(ANALYTICS_DASHBOARD_QUERY);
      return Object.fromEntries(
        (rows[0]?.funnel ?? []).map((row) => [row.stage, row.installations]),
      );
    }

    it("conta conta Google sem evento de cadastro e produto criado fora da precificação", async () => {
      // Arrange
      for (const id of [GOOGLE, EMAIL, PRODUCT_FIRST, IDLE]) await seedInstallation(id);
      await pg.query(
        `INSERT INTO analytics_installation_users VALUES
          ($1, $3, '2026-09-01T10:05:00Z', '2026-09-01T10:05:00Z'),
          ($2, $3, '2026-09-01T10:05:00Z', '2026-09-01T10:05:00Z')`,
        [GOOGLE, PRODUCT_FIRST, USER],
      );
      await seedAction(GOOGLE, "pricing_completed", "2026-09-01T10:10:00Z");
      await seedAction(GOOGLE, "product_created", "2026-09-01T10:20:00Z");
      await seedAction(GOOGLE, "sale_completed", "2026-09-01T10:30:00Z");
      await seedAction(EMAIL, "signup_completed", "2026-09-01T10:05:00Z");
      await seedAction(PRODUCT_FIRST, "product_created", "2026-09-01T10:06:00Z");
      await seedAction(PRODUCT_FIRST, "pricing_completed", "2026-09-01T10:10:00Z");
      await seedAction(
        PRODUCT_FIRST,
        "product_created_from_pricing",
        "2026-09-01T10:11:00Z",
      );

      // Act
      const result = await funnel();

      // Assert
      expect(result).toEqual({
        installation: 4,
        signup: 3,
        pricing: 2,
        product: 2,
        catalog_or_sale: 1,
      });
    });

    it("ignora marcos fora de ordem mesmo com a conta identificada", async () => {
      // Arrange
      await seedInstallation(GOOGLE);
      await pg.query(
        `INSERT INTO analytics_installation_users
         VALUES ($1, $2, '2026-09-01T10:05:00Z', '2026-09-01T10:05:00Z')`,
        [GOOGLE, USER],
      );
      await seedAction(GOOGLE, "sale_completed", "2026-09-01T10:06:00Z");
      await seedAction(GOOGLE, "product_created", "2026-09-01T10:07:00Z");

      // Act
      const result = await funnel();

      // Assert
      expect(result).toMatchObject({
        signup: 1,
        pricing: 0,
        product: 0,
        catalog_or_sale: 0,
      });
    });
  });
});
