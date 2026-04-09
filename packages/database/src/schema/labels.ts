import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";
import { users } from "./users";

export const labels = pgTable(
  "labels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    templateId: text("template_id").notNull(),
    name: text("name").notNull(),
    data: jsonb("data").notNull(),
    logoUrl: text("logo_url"),
    qrCodeUrl: text("qr_code_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_labels_user").on(table.userId)],
);
