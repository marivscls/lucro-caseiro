import { z } from "zod";

export const MarketingResourceKindSchema = z.enum([
  "content",
  "audience",
  "feature",
  "topic",
  "outreach",
  "campaign",
  "performance",
]);

export const MarketingContentStatusSchema = z.enum([
  "idea",
  "planned",
  "producing",
  "ready",
  "published",
  "archived",
]);

export const MarketingChannelSchema = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "email",
  "local",
  "other",
]);

export const MarketingResourceInputSchema = z.object({
  kind: MarketingResourceKindSchema,
  slug: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(600).optional().nullable(),
  status: z.string().trim().min(1).max(40).default("active"),
  scheduledFor: z.string().datetime().optional().nullable(),
  data: z.record(z.unknown()).default({}),
});

export const MarketingResourcePatchSchema = MarketingResourceInputSchema.partial().omit({
  kind: true,
});

export const MarketingResourceQuerySchema = z.object({
  kind: MarketingResourceKindSchema.optional(),
  status: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const MarketingDocumentInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z.string().trim().min(2).max(120),
  body: z.string().default(""),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  source: z.enum(["manual", "imported", "ai"]).default("manual"),
});

export const MarketingDocumentPatchSchema = MarketingDocumentInputSchema.partial().extend(
  {
    versionNote: z.string().trim().max(200).optional(),
  },
);

export const MarketingAttachmentInputSchema = z.object({
  name: z.string().trim().min(1).max(220),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  storagePath: z.string().trim().min(1).max(500),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(20 * 1024 * 1024),
});

export const MarketingAiMessageInputSchema = z.object({
  message: z.string().trim().min(2).max(12_000),
  sessionId: z.string().uuid().optional(),
  context: z.record(z.unknown()).default({}),
  mode: z.enum(["consult", "generate", "plan", "review"]).default("consult"),
});

export const MarketingAiResourceDraftInputSchema = z.object({
  kind: MarketingResourceKindSchema,
  prompt: z.string().trim().min(2).max(4_000),
  current: z
    .object({
      title: z.string().trim().max(180).default(""),
      summary: z.string().trim().max(600).default(""),
      status: z.string().trim().max(40).default(""),
      scheduledFor: z.string().datetime().nullable().default(null),
      data: z.record(z.unknown()).default({}),
    })
    .optional(),
});

export const MarketingAiResourceDraftSchema = z.object({
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(600).default(""),
  status: z.string().trim().min(1).max(40),
  scheduledFor: z.string().datetime().nullable().default(null),
  data: z.record(z.unknown()).default({}),
});

export const MarketingInstructionInputSchema = z.object({
  body: z.string().trim().min(100),
  note: z.string().trim().max(300).optional(),
});

export const MarketingKnowledgeInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  body: z.string().trim().min(10),
  sourceType: z.enum(["document", "manual", "feedback", "result"]),
  sourceId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
  canonical: z.boolean().default(false),
});

export const MarketingFeedbackInputSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(["positive", "negative"]),
  note: z.string().trim().max(1000).optional(),
});

export const MarketingEvaluationInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  prompt: z.string().trim().min(2),
  expected: z.string().trim().min(2),
  tags: z.array(z.string().trim().min(1).max(40)).default([]),
});

export const MarketingLearningPolicySchema = z.object({
  classAEnabled: z.boolean().default(true),
  classBEnabled: z.boolean().default(true),
  classCEnabled: z.boolean().default(false),
  minimumSamples: z.number().int().min(3).max(100).default(5),
  minimumScore: z.number().min(0).max(1).default(0.8),
});

export type MarketingResourceKind = z.infer<typeof MarketingResourceKindSchema>;
export type MarketingResourceInput = z.infer<typeof MarketingResourceInputSchema>;
export type MarketingAiResourceDraft = z.infer<typeof MarketingAiResourceDraftSchema>;
export type MarketingDocumentInput = z.infer<typeof MarketingDocumentInputSchema>;
export type MarketingLearningPolicy = z.infer<typeof MarketingLearningPolicySchema>;
