import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const catalogSettings = pgTable(
  "catalog_settings",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    brandId: text("brand_id").notNull().default("lucro-caseiro"),
    enabled: boolean("enabled").notNull().default(false),
    // WhatsApp para receber pedidos; se null, usa users.phone.
    whatsapp: text("whatsapp"),
    // Personalizacao (Premium): capa, preset de cor e frase de apresentacao.
    coverUrl: text("cover_url"),
    logoUrl: text("logo_url"),
    accentColor: text("accent_color"),
    titleColor: text("title_color"),
    descriptionColor: text("description_color"),
    pattern: text("pattern"),
    tagline: text("tagline"),
    promoBanner: text("promo_banner"),
    promoBannerEnabled: boolean("promo_banner_enabled").notNull().default(true),
    serviceCoverUrl: text("service_cover_url"),
    serviceTitleColor: text("service_title_color"),
    serviceDescriptionColor: text("service_description_color"),
    serviceTagline: text("service_tagline"),
    servicePromoBanner: text("service_promo_banner"),
    servicePromoBannerEnabled: boolean("service_promo_banner_enabled")
      .notNull()
      .default(true),
    customization: jsonb("customization"),
    publishedCustomization: jsonb("published_customization"),
    publishedProducts: jsonb("published_products"),
    publishedServices: jsonb("published_services"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_catalog_settings_slug").on(table.slug)],
);
