import { decimal, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

// Uma linha por usuario: configuracao da meta de pro-labore.
export const businessGoals = pgTable(
  "business_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    monthlyProlaboreGoal: decimal("monthly_prolabore_goal", {
      precision: 10,
      scale: 2,
    }).notNull(),
    estimatedMonthlyCosts: decimal("estimated_monthly_costs", {
      precision: 10,
      scale: 2,
    }),
    avgTicketOverride: decimal("avg_ticket_override", { precision: 10, scale: 2 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_business_goals_user").on(table.userId)],
);
