import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./users";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const marketingResources = pgTable(
  "marketing_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    status: text("status").notNull().default("active"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_marketing_resources_user_kind_slug").on(
      table.userId,
      table.kind,
      table.slug,
    ),
    index("idx_marketing_resources_user_kind").on(table.userId, table.kind),
    index("idx_marketing_resources_schedule").on(table.userId, table.scheduledFor),
  ],
);

export const marketingDocuments = pgTable(
  "marketing_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    source: text("source").notNull().default("manual"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_marketing_documents_user_slug").on(table.userId, table.slug),
    index("idx_marketing_documents_user_updated").on(table.userId, table.updatedAt),
  ],
);

export const marketingDocumentVersions = pgTable(
  "marketing_document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => marketingDocuments.id, {
        onDelete: "cascade",
      }),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_marketing_document_versions").on(table.documentId, table.version),
  ],
);

export const marketingDocumentAttachments = pgTable(
  "marketing_document_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => marketingDocuments.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    storagePath: text("storage_path").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_marketing_document_attachments_document").on(table.documentId)],
);

export const marketingAiSessions = pgTable(
  "marketing_ai_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Nova conversa"),
    ...timestamps,
  },
  (table) => [index("idx_marketing_ai_sessions_user").on(table.userId, table.updatedAt)],
);

export const marketingAiMessages = pgTable(
  "marketing_ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => marketingAiSessions.id, {
        onDelete: "cascade",
      }),
    role: text("role").notNull(),
    body: text("body").notNull(),
    context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_marketing_ai_messages_session").on(table.sessionId, table.createdAt),
  ],
);

export const marketingAiInstructions = pgTable(
  "marketing_ai_instructions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    note: text("note"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_marketing_ai_instructions_version").on(table.userId, table.version),
  ],
);

export const marketingAiKnowledge = pgTable(
  "marketing_ai_knowledge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: uuid("source_id"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    canonical: boolean("canonical").notNull().default(false),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("idx_marketing_ai_knowledge_user").on(table.userId, table.active)],
);

export const marketingAiExamples = pgTable(
  "marketing_ai_examples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    input: text("input").notNull(),
    output: text("output").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    approved: boolean("approved").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_marketing_ai_examples_user").on(table.userId, table.approved)],
);

export const marketingAiEvaluations = pgTable(
  "marketing_ai_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    expected: text("expected").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    lastScore: integer("last_score"),
    lastOutput: text("last_output"),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("idx_marketing_ai_evaluations_user").on(table.userId)],
);

export const marketingAiFeedback = pgTable(
  "marketing_ai_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => marketingAiMessages.id, {
        onDelete: "cascade",
      }),
    rating: text("rating").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_marketing_ai_feedback_user").on(table.userId, table.createdAt)],
);

export const marketingAiLearning = pgTable(
  "marketing_ai_learning",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    learningClass: text("learning_class").notNull(),
    action: text("action").notNull(),
    status: text("status").notNull(),
    reason: text("reason").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    score: integer("score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_marketing_ai_learning_user").on(table.userId, table.createdAt)],
);

export const marketingAiSettings = pgTable("marketing_ai_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  classAEnabled: boolean("class_a_enabled").notNull().default(true),
  classBEnabled: boolean("class_b_enabled").notNull().default(true),
  classCEnabled: boolean("class_c_enabled").notNull().default(false),
  minimumSamples: integer("minimum_samples").notNull().default(5),
  minimumScore: integer("minimum_score").notNull().default(80),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
