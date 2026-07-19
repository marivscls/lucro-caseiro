import { sql } from "drizzle-orm";
import {
  boolean,
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

export const retailDocuments = pgTable(
  "retail_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    partyId: uuid("party_id"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
    deposit: decimal("deposit", { precision: 12, scale: 2 }).notNull().default("0"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    reservedUntil: timestamp("reserved_until", { withTimezone: true }),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_retail_documents_user_kind").on(table.userId, table.kind),
    index("idx_retail_documents_user_status").on(table.userId, table.status),
    index("idx_retail_documents_reservation").on(table.reservedUntil),
    uniqueIndex("uq_retail_open_cash_session")
      .on(table.userId)
      .where(sql`${table.kind} = 'cash_session' AND ${table.status} = 'open'`),
  ],
);

export const retailDocumentItems = pgTable(
  "retail_document_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => retailDocuments.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variationId: uuid("variation_id"),
    name: text("name").notNull(),
    variationName: text("variation_name"),
    quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (table) => [
    index("idx_retail_document_items_document").on(table.documentId),
    index("idx_retail_document_items_product").on(table.productId),
  ],
);

export const retailCashMovements = pgTable(
  "retail_cash_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => retailDocuments.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    paymentMethod: text("payment_method").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    referenceId: uuid("reference_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_retail_cash_movements_session").on(table.sessionId)],
);

export const retailPromotions = pgTable(
  "retail_promotions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    buyQuantity: integer("buy_quantity"),
    payQuantity: integer("pay_quantity"),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    category: text("category"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_retail_promotions_user_period").on(table.userId, table.startsAt),
  ],
);

export const retailBusinessAccounts = pgTable(
  "retail_business_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    legalName: text("legal_name").notNull(),
    document: text("document"),
    contactName: text("contact_name"),
    creditLimit: decimal("credit_limit", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    usedCredit: decimal("used_credit", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    dueDays: integer("due_days").notNull().default(0),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_retail_business_accounts_user_client").on(
      table.userId,
      table.clientId,
    ),
  ],
);

export const retailPriceChanges = pgTable(
  "retail_price_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    previousPrice: decimal("previous_price", { precision: 12, scale: 2 }).notNull(),
    newPrice: decimal("new_price", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_retail_price_changes_product").on(table.productId, table.createdAt),
  ],
);
