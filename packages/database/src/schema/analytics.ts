import {
  bigserial,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const analyticsInstallations = pgTable(
  "analytics_installations",
  {
    id: uuid("id").primaryKey(),
    platform: text("platform").notNull(),
    appVersion: text("app_version").notNull(),
    appBuild: text("app_build"),
    firstOpenedAt: timestamp("first_opened_at", { withTimezone: true }).notNull(),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_analytics_installations_first_open").on(table.firstOpenedAt),
    index("idx_analytics_installations_last_open").on(table.lastOpenedAt),
  ],
);

export const analyticsInstallationUsers = pgTable(
  "analytics_installation_users",
  {
    installationId: uuid("installation_id")
      .notNull()
      .references(() => analyticsInstallations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firstIdentifiedAt: timestamp("first_identified_at", { withTimezone: true }).notNull(),
    lastIdentifiedAt: timestamp("last_identified_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.installationId, table.userId] }),
    index("idx_analytics_installation_users_user").on(table.userId),
  ],
);

export const analyticsActivityDays = pgTable(
  "analytics_activity_days",
  {
    installationId: uuid("installation_id")
      .notNull()
      .references(() => analyticsInstallations.id, { onDelete: "cascade" }),
    activityDate: date("activity_date").notNull(),
    appVersion: text("app_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.installationId, table.activityDate] }),
    index("idx_analytics_activity_date").on(table.activityDate),
  ],
);

export const analyticsUserActivityDays = pgTable(
  "analytics_user_activity_days",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: date("activity_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.activityDate] }),
    index("idx_analytics_user_activity_date").on(table.activityDate),
  ],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => analyticsInstallations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: text("event_type").notNull(),
    eventName: text("event_name").notNull(),
    durationMs: integer("duration_ms"),
    appVersion: text("app_version").notNull(),
    appBuild: text("app_build"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_analytics_events_occurred").on(table.occurredAt),
    index("idx_analytics_events_type_name_occurred").on(
      table.eventType,
      table.eventName,
      table.occurredAt,
    ),
    index("idx_analytics_events_installation").on(table.installationId),
    index("idx_analytics_events_user").on(table.userId),
  ],
);
