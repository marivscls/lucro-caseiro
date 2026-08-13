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

export const characterProfiles = pgTable(
  "character_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull(),
    internalName: text("internal_name").notNull(),
    sourceType: text("source_type").notNull(),
    consentMode: text("consent_mode").notNull(),
    immutableTraits: jsonb("immutable_traits")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    variableTraits: jsonb("variable_traits")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    lockedTraits: jsonb("locked_traits").$type<string[]>().notNull().default([]),
    referenceAssets: jsonb("reference_assets")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    identityPrompt: text("identity_prompt").notNull().default(""),
    negativePrompt: text("negative_prompt").notNull().default(""),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("uq_character_profiles_user_brand_name").on(
      table.userId,
      table.brandId,
      table.internalName,
    ),
    index("idx_character_profiles_user_brand").on(table.userId, table.brandId),
  ],
);

export const videoPromptProjects = pgTable(
  "video_prompt_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull(),
    title: text("title").notNull(),
    format: text("format").notNull(),
    aspectRatio: text("aspect_ratio").notNull(),
    duration: integer("duration").notNull(),
    objective: text("objective").notNull(),
    visualMode: text("visual_mode").notNull(),
    topicId: text("topic_id"),
    offerId: text("offer_id"),
    featureId: text("feature_id"),
    audienceId: text("audience_id"),
    funnelStage: text("funnel_stage").notNull(),
    angle: text("angle").notNull().default(""),
    cta: text("cta").notNull(),
    destinationChannels: jsonb("destination_channels")
      .$type<string[]>()
      .notNull()
      .default([]),
    targetTool: text("target_tool"),
    characterProfileId: uuid("character_profile_id").references(
      () => characterProfiles.id,
      { onDelete: "set null" },
    ),
    voiceProfileId: text("voice_profile_id"),
    contextVersion: text("context_version").notNull(),
    status: text("status").notNull().default("draft"),
    configuration: jsonb("configuration")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ...timestamps,
  },
  (table) => [
    index("idx_video_prompt_projects_user_updated").on(table.userId, table.updatedAt),
    index("idx_video_prompt_projects_user_status").on(table.userId, table.status),
    index("idx_video_prompt_projects_character").on(table.characterProfileId),
  ],
);

export const videoScenes = pgTable(
  "video_scenes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => videoPromptProjects.id, { onDelete: "cascade" }),
    order: integer("scene_order").notNull(),
    startTime: integer("start_time").notNull(),
    endTime: integer("end_time").notNull(),
    narrativeRole: text("narrative_role").notNull(),
    characterPresent: boolean("character_present").notNull().default(false),
    environment: text("environment").notNull().default(""),
    action: text("action").notNull().default(""),
    characterDirection: text("character_direction").notNull().default(""),
    cameraDirection: text("camera_direction").notNull().default(""),
    lightingDirection: text("lighting_direction").notNull().default(""),
    dialogue: text("dialogue").notNull().default(""),
    narration: text("narration").notNull().default(""),
    onScreenText: text("on_screen_text").notNull().default(""),
    transition: text("transition").notNull().default(""),
    productEvidenceIds: jsonb("product_evidence_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    continuityNotes: text("continuity_notes").notNull().default(""),
    movementPlan: jsonb("movement_plan")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
  },
  (table) => [
    uniqueIndex("uq_video_scenes_project_order").on(table.projectId, table.order),
    index("idx_video_scenes_project").on(table.projectId),
  ],
);

export const videoPromptVersions = pgTable(
  "video_prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => videoPromptProjects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    canonicalPrompt: jsonb("canonical_prompt").$type<Record<string, unknown>>().notNull(),
    adaptedPrompt: text("adapted_prompt"),
    targetTool: text("target_tool"),
    qualityWarnings: jsonb("quality_warnings")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    similarityWarnings: jsonb("similarity_warnings")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    generationContext: jsonb("generation_context")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_video_prompt_versions_project_version").on(
      table.projectId,
      table.version,
    ),
    index("idx_video_prompt_versions_project").on(table.projectId, table.createdAt),
  ],
);

export const videoEditJobs = pgTable(
  "video_edit_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brand_id").notNull(),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    status: text("status").notNull().default("draft"),
    aspectRatio: text("aspect_ratio").notNull().default("9:16"),
    targetDurationSeconds: integer("target_duration_seconds"),
    destinationChannel: text("destination_channel").notNull(),
    sourceCampaignId: uuid("source_campaign_id"),
    sourceContentId: uuid("source_content_id"),
    iterationCount: integer("iteration_count").notNull().default(0),
    maxIterations: integer("max_iterations").notNull().default(3),
    plan: jsonb("plan").$type<Record<string, unknown>>(),
    review: jsonb("review").$type<Record<string, unknown>>(),
    refinementInstruction: text("refinement_instruction"),
    error: text("error"),
    ...timestamps,
  },
  (table) => [
    index("idx_video_edit_jobs_user_updated").on(table.userId, table.updatedAt),
    index("idx_video_edit_jobs_status").on(table.status, table.updatedAt),
  ],
);

export const videoEditAssets = pgTable(
  "video_edit_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => videoEditJobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("footage"),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    storagePath: text("storage_path").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: text("status").notNull().default("uploaded"),
    durationMs: integer("duration_ms"),
    width: integer("width"),
    height: integer("height"),
    transcript: jsonb("transcript").$type<Array<Record<string, unknown>>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_video_edit_assets_job_path").on(table.jobId, table.storagePath),
    index("idx_video_edit_assets_job").on(table.jobId, table.createdAt),
  ],
);

export const videoEditVersions = pgTable(
  "video_edit_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => videoEditJobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    kind: text("kind").notNull(),
    storagePath: text("storage_path").notNull(),
    durationMs: integer("duration_ms").notNull(),
    plan: jsonb("plan").$type<Record<string, unknown>>().notNull(),
    review: jsonb("review").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_video_edit_versions_job_version").on(table.jobId, table.version),
    index("idx_video_edit_versions_job").on(table.jobId, table.createdAt),
  ],
);
