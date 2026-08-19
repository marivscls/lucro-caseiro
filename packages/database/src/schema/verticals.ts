import { sql } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { products } from "./products";
import { users } from "./users";

export const appMemberships = pgTable(
  "app_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull(),
    domain: text("domain").notNull(),
    status: text("status").notNull().default("active"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_app_memberships_user_brand").on(table.userId, table.brandId),
    index("idx_app_memberships_user_status").on(table.userId, table.status),
  ],
);

export const verticalDocuments = pgTable(
  "vertical_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    parentId: uuid("parent_id"),
    amount: decimal("amount", { precision: 14, scale: 2 }).notNull().default("0"),
    cost: decimal("cost", { precision: 14, scale: 2 }).notNull().default("0"),
    progress: decimal("progress", { precision: 7, scale: 3 }).notNull().default("0"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_vertical_documents_user_domain_kind").on(
      table.userId,
      table.domain,
      table.kind,
    ),
    index("idx_vertical_documents_user_domain_status").on(
      table.userId,
      table.domain,
      table.status,
    ),
    index("idx_vertical_documents_due_at").on(table.userId, table.domain, table.dueAt),
  ],
);

export const verticalDocumentItems = pgTable(
  "vertical_document_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => verticalDocuments.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category"),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull().default("1"),
    unit: text("unit").notNull().default("un"),
    unitCost: decimal("unit_cost", { precision: 14, scale: 4 }).notNull().default("0"),
    unitPrice: decimal("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    index("idx_vertical_document_items_document").on(table.documentId),
    index("idx_vertical_document_items_product").on(table.productId),
  ],
);

export const verticalEvents = pgTable(
  "vertical_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => verticalDocuments.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    idempotencyKey: text("idempotency_key"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_vertical_events_document").on(table.documentId, table.createdAt),
    uniqueIndex("uq_vertical_events_user_idempotency")
      .on(table.userId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`),
  ],
);

export const verticalAssets = pgTable(
  "vertical_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    identifier: text("identifier"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_vertical_assets_user_domain").on(table.userId, table.domain),
    uniqueIndex("uq_vertical_assets_identifier")
      .on(table.userId, table.domain, table.identifier)
      .where(sql`${table.identifier} IS NOT NULL`),
  ],
);

export const resaleSerials = pgTable(
  "resale_serials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variationId: uuid("variation_id"),
    serial: text("serial").notNull(),
    status: text("status").notNull().default("available"),
    lotDocumentId: uuid("lot_document_id").references(() => verticalDocuments.id, {
      onDelete: "set null",
    }),
    saleId: uuid("sale_id"),
    cost: decimal("cost", { precision: 14, scale: 2 }).notNull().default("0"),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_resale_serials_user_serial").on(table.userId, table.serial),
    index("idx_resale_serials_product_status").on(
      table.userId,
      table.productId,
      table.status,
    ),
  ],
);
