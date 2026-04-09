import { boolean, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", [
  "food",
  "beauty",
  "crafts",
  "services",
  "other",
]);

export const planTypeEnum = pgEnum("plan_type", ["free", "premium"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  businessName: text("business_name"),
  businessType: businessTypeEnum("business_type"),
  plan: planTypeEnum("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
