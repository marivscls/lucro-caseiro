import { sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import { hasActiveFeature, normalizePlan } from "@lucro-caseiro/contracts";
import { resolveBrand } from "@lucro-caseiro/brands";
import {
  reminderMessage,
  reminderSlot,
  type BrowserMessage,
  type ReminderCounts,
  type WebSubscriptionInput,
} from "./web-push.domain";

export type WebPushSender = (
  subscription: Pick<WebSubscriptionInput, "endpoint" | "keys">,
  message: BrowserMessage,
) => Promise<"sent" | "expired">;
type SubscriptionRow = WebSubscriptionInput & {
  userId: string;
  brandId: string;
  plan: string;
  planExpiresAt: string | null;
};

// Scan only subscriptions in their local delivery hour. Dates persist across API restarts.
const due = sql`u.is_active = true AND s.retry_after <= now() AND (
  (extract(hour from now() at time zone s.timezone) = 9 AND s.morning_date IS DISTINCT FROM (now() at time zone s.timezone)::date)
  OR (extract(hour from now() at time zone s.timezone) = 19 AND s.evening_date IS DISTINCT FROM (now() at time zone s.timezone)::date)
)`;

export class WebPushRepoPg {
  constructor(private db: AppDatabase) {}

  async register(
    userId: string,
    brandId: string,
    input: WebSubscriptionInput,
  ): Promise<void> {
    await this.db
      .execute(sql`INSERT INTO web_push_subscriptions(endpoint,user_id,brand_id,keys,timezone,prefs)
      VALUES (${input.endpoint},${userId},${brandId},${JSON.stringify(input.keys)}::jsonb,${input.timezone},${JSON.stringify(input.prefs)}::jsonb)
      ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,brand_id=excluded.brand_id,keys=excluded.keys,
        timezone=excluded.timezone,prefs=excluded.prefs,updated_at=now()`);
  }

  async remove(userId: string, brandId: string, endpoint: string): Promise<void> {
    await this.db.execute(
      sql`DELETE FROM web_push_subscriptions WHERE user_id=${userId} AND brand_id=${brandId} AND endpoint=${endpoint}`,
    );
  }

  async get(
    userId: string,
    brandId: string,
    endpoint: string,
  ): Promise<WebSubscriptionInput | null> {
    const rows = await this.db.execute(
      sql`SELECT endpoint,keys,timezone,prefs FROM web_push_subscriptions WHERE user_id=${userId} AND brand_id=${brandId} AND endpoint=${endpoint}`,
    );
    return (rows[0] as WebSubscriptionInput | undefined) ?? null;
  }

  async runOnce(send: WebPushSender): Promise<void> {
    const candidates = await this.db.execute(
      sql`SELECT s.endpoint FROM web_push_subscriptions s JOIN users u ON u.id=s.user_id WHERE ${due} ORDER BY s.retry_after,s.endpoint LIMIT 50`,
    );
    for (const candidate of candidates) {
      const endpoint = String(candidate.endpoint);
      try {
        await this.db.transaction(async (tx) => {
          // Recheck after taking the lock: concurrent workers, unsubscribe and settings edits serialize here.
          const rows =
            await tx.execute(sql`SELECT s.endpoint,s.keys,s.timezone,s.prefs,s.user_id AS "userId",s.brand_id AS "brandId",u.plan,u.plan_expires_at AS "planExpiresAt"
            FROM web_push_subscriptions s JOIN users u ON u.id=s.user_id WHERE s.endpoint=${endpoint} AND ${due} FOR UPDATE OF s SKIP LOCKED`);
          const row = rows[0] as SubscriptionRow | undefined;
          if (!row) return;
          const slot = reminderSlot(new Date(), row.timezone);
          if (!slot) return;
          const counts: ReminderCounts = {
            pending: 0,
            stock: 0,
            deliveries: 0,
            birthdays: 0,
          };
          if (slot.period === "morning") {
            const result = await tx.execute(sql`SELECT
              (SELECT count(*)::int FROM sales WHERE user_id=${row.userId} AND status='pending') AS pending,
              (SELECT count(*)::int FROM products WHERE user_id=${row.userId} AND is_active=true AND stock_alert_threshold IS NOT NULL AND
                CASE WHEN jsonb_array_length(variations)>0 THEN EXISTS (
                  SELECT 1 FROM jsonb_array_elements(variations) variation WHERE (variation->>'stockQuantity')::numeric <= stock_alert_threshold
                ) ELSE stock_quantity <= stock_alert_threshold END) AS stock,
              (SELECT count(*)::int FROM orders WHERE user_id=${row.userId} AND status NOT IN ('done','cancelled') AND delivery_date <= ${slot.date}::date + 1) AS deliveries,
              (SELECT count(*)::int FROM clients WHERE user_id=${row.userId} AND to_char(birthday,'MM-DD')=right(${slot.date},5)) AS birthdays`);
            Object.assign(counts, result[0]);
          }
          const premium = hasActiveFeature(
            normalizePlan(row.plan),
            row.planExpiresAt,
            "premiumNotifications",
          );
          const message = reminderMessage(
            slot,
            row.prefs,
            premium,
            resolveBrand(row.brandId).features,
            counts,
          );
          if (message) {
            const result = await send(row, {
              ...message,
              tag: `${row.brandId}-${slot.period}-${slot.date}`,
            });
            if (result === "expired") {
              await tx.execute(
                sql`DELETE FROM web_push_subscriptions WHERE endpoint=${endpoint}`,
              );
              return;
            }
          }
          const column =
            slot.period === "morning" ? sql`morning_date` : sql`evening_date`;
          await tx.execute(
            sql`UPDATE web_push_subscriptions SET ${column}=${slot.date}::date WHERE endpoint=${endpoint}`,
          );
        });
      } catch {
        // Keep a failed endpoint from occupying every batch; retry within the delivery window.
        await this.db.execute(
          sql`UPDATE web_push_subscriptions SET retry_after=now()+interval '5 minutes' WHERE endpoint=${endpoint}`,
        );
        console.error("[web-push] reminder failed; retry scheduled");
      }
    }
  }
}
