import {
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { products } from "./products";
import { users } from "./users";

export const packagingTypeEnum = pgEnum("packaging_type", [
  "box",
  "bag",
  "pot",
  "film",
  "label",
  "other",
]);

export const packaging = pgTable(
  "packaging",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: packagingTypeEnum("type").notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    supplier: text("supplier"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_packaging_user").on(table.userId)],
);

export const productPackaging = pgTable("product_packaging", {
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  packagingId: uuid("packaging_id")
    .notNull()
    .references(() => packaging.id, { onDelete: "cascade" }),
});
