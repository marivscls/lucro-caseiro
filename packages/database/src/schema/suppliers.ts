import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("other"),
    phone: text("phone"),
    hasWhatsApp: boolean("has_whatsapp").notNull().default(false),
    email: text("email"),
    address: text("address"),
    purchaseDescription: text("purchase_description"),
    notes: text("notes"),
    isPreferred: boolean("is_preferred").notNull().default(false),
    avatarType: text("avatar_type").notNull().default("initials"),
    avatarPresetId: text("avatar_preset_id"),
    avatarUrl: text("avatar_url"),
    needsFollowUp: boolean("needs_follow_up").notNull().default(false),
    restockSoon: boolean("restock_soon").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_suppliers_user").on(table.userId),
    index("idx_suppliers_user_name").on(table.userId, table.name),
    index("idx_suppliers_user_active").on(table.userId, table.isActive),
  ],
);
