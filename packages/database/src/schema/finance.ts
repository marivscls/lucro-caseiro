import {
  boolean,
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { sales } from "./sales";
import { users } from "./users";

export const financeEntryTypeEnum = pgEnum("finance_entry_type", ["income", "expense"]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "sale",
  "material",
  "packaging",
  "transport",
  "fee",
  "utility",
  "other",
]);

export const financeEntries = pgTable(
  "finance_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: financeEntryTypeEnum("type").notNull(),
    category: expenseCategoryEnum("category").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description").notNull(),
    // Apenas para despesas (type = "expense"): fixo (recorrente) x variavel.
    isFixed: boolean("is_fixed").notNull().default(false),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    // Quando o lançamento foi gerado por um gasto recorrente (idempotência mensal).
    recurringExpenseId: uuid("recurring_expense_id"),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_finance_user_date").on(table.userId, table.date),
    index("idx_finance_user_type_date").on(table.userId, table.type, table.date),
  ],
);
