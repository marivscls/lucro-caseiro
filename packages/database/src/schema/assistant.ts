import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/** Usos do assistente (anotar falando) por mês, para o limite do plano. */
export const assistantUsage = pgTable(
  "assistant_usage",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.month] })],
).enableRLS();
