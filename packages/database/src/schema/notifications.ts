import { date, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const pushNotificationTokens = pgTable(
  "push_notification_tokens",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull().default("lucro-caseiro"),
    platform: text("platform").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_push_notification_tokens_user_brand").on(table.userId, table.brandId),
  ],
);

export const webPushSubscriptions = pgTable(
  "web_push_subscriptions",
  {
    endpoint: text("endpoint").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull(),
    keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
    timezone: text("timezone").notNull(),
    prefs: jsonb("prefs").$type<Record<string, boolean>>().notNull().default({}),
    morningDate: date("morning_date"),
    eveningDate: date("evening_date"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    retryAfter: timestamp("retry_after", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_web_push_user_brand").on(table.userId, table.brandId)],
);
