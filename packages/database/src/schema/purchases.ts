import {
  date,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { expenseCategoryEnum, financeEntries } from "./finance";
import { suppliers } from "./suppliers";
import { users } from "./users";
import { products } from "./products";

// Compras de fornecedores → contas a pagar e saídas do caixa.
// `payment_status`: "pending" (a pagar, ainda NÃO é saída no caixa) | "paid"
// (já saiu — gera um lançamento de despesa em finance, referenciado por finance_entry_id).
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    category: expenseCategoryEnum("category").notNull().default("material"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    purchasedAt: date("purchased_at").notNull(),
    dueDate: date("due_date"),
    paidAt: date("paid_at"),
    // Lançamento de despesa criado quando a compra é paga (idempotência + rastreio).
    financeEntryId: uuid("finance_entry_id").references(() => financeEntries.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_purchases_user").on(table.userId),
    index("idx_purchases_user_status").on(table.userId, table.paymentStatus),
    index("idx_purchases_supplier").on(table.supplierId),
  ],
);

export const purchaseItems = pgTable(
  "purchase_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseId: uuid("purchase_id")
      .notNull()
      .references(() => purchases.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    variationId: uuid("variation_id"),
    variationName: text("variation_name"),
    quantity: decimal("quantity", { precision: 12, scale: 0 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index("idx_purchase_items_purchase").on(table.purchaseId),
    index("idx_purchase_items_product").on(table.productId),
  ],
);
