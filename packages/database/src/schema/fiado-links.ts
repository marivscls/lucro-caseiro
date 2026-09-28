import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { users } from "./users";

/** Link público do extrato do fiado de um cliente (/f/:token). */
export const fiadoLinks = pgTable(
  "fiado_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    // Marca do app que criou o link (rodapé "Feito com ..." da página pública).
    brandId: text("brand_id").notNull().default("lucro-caseiro"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_fiado_links_user_client").on(table.userId, table.clientId)],
).enableRLS();
