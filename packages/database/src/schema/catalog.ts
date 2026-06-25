import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const catalogSettings = pgTable(
  "catalog_settings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    enabled: boolean("enabled").notNull().default(false),
    // WhatsApp para receber pedidos; se null, usa users.phone.
    whatsapp: text("whatsapp"),
    // Personalizacao (Premium): capa, preset de cor e frase de apresentacao.
    coverUrl: text("cover_url"),
    logoUrl: text("logo_url"),
    accentColor: text("accent_color"),
    pattern: text("pattern"),
    tagline: text("tagline"),
    promoBanner: text("promo_banner"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_catalog_settings_slug").on(table.slug)],
);
