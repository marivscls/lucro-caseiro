import {
  date,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "./users";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    address: text("address"),
    birthday: date("birthday"),
    notes: text("notes"),
    tags: text("tags").array().notNull().default([]),
    totalSpent: decimal("total_spent", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_clients_user").on(table.userId),
    index("idx_clients_user_phone").on(table.userId, table.phone),
    uniqueIndex("idx_clients_user_phone_digits_unique").on(
      table.userId,
      sql`(
          case
            when length(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g')) in (12, 13)
              and left(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g'), 2) = '55'
            then substring(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g') from 3)
            else regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g')
          end
        )`,
    ).where(sql`(
        case
          when length(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g')) in (12, 13)
            and left(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g'), 2) = '55'
          then substring(regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g') from 3)
          else regexp_replace(coalesce(${table.phone}, ''), '\\D', '', 'g')
        end
      ) <> ''`),
  ],
);
