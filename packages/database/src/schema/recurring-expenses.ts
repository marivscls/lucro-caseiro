import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { expenseCategoryEnum } from "./finance";
import { users } from "./users";

/**
 * Gasto recorrente (despesa fixa que se repete todo mês): aluguel, internet,
 * assinatura, etc. Um template; os lançamentos reais são gerados em
 * `finance_entries` (com `recurring_expense_id`) ao abrir o mês.
 */
export const recurringExpenses = pgTable(
  "recurring_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: expenseCategoryEnum("category").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description").notNull(),
    // Dia do mês em que o gasto cai (1–28).
    dayOfMonth: integer("day_of_month").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_recurring_expenses_user").on(table.userId)],
);
