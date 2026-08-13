import { z } from "zod";

export const VideoEditStatusSchema = z.enum([
  "draft",
  "uploaded",
  "analyzing",
  "strategy_ready",
  "rendering",
  "self_review",
  "ready_for_review",
  "approved",
  "completed",
  "needs_input",
  "failed",
  "cancelled",
]);

export const VideoEditAspectRatioSchema = z.enum(["9:16", "1:1", "4:5", "16:9"]);

export const VideoEditAssetInputSchema = z.object({
  name: z.string().trim().min(1).max(240),
  mimeType: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
  storagePath: z.string().trim().min(1).max(600),
  sizeBytes: z.number().int().positive().max(2_000_000_000),
  kind: z.enum(["footage", "b-roll", "audio", "brand"]).default("footage"),
});

export const VideoEditJobInputSchema = z.object({
  brandId: z.string().trim().min(1).max(80).default("lucro-caseiro"),
  title: z.string().trim().min(2).max(180),
  brief: z.string().trim().min(10).max(5_000),
  aspectRatio: VideoEditAspectRatioSchema.default("9:16"),
  targetDurationSeconds: z.number().int().min(5).max(600).nullable().default(null),
  destinationChannel: z.string().trim().min(1).max(80).default("Instagram Reels"),
  sourceCampaignId: z.string().uuid().nullable().default(null),
  sourceContentId: z.string().uuid().nullable().default(null),
});

export const VideoEditSegmentSchema = z
  .object({
    assetId: z.string().uuid(),
    sourceStartMs: z.number().int().min(0),
    sourceEndMs: z.number().int().positive(),
    narrativeRole: z.string().trim().min(2).max(160),
    reason: z.string().trim().min(2).max(500),
    transition: z.enum(["cut", "fade"]).default("cut"),
  })
  .refine((segment) => segment.sourceEndMs > segment.sourceStartMs, {
    message: "O fim do segmento deve ocorrer depois do início.",
  });

export const VideoCaptionSchema = z.object({
  text: z.string().min(1),
  startMs: z.number().min(0),
  endMs: z.number().positive(),
  timestampMs: z.number().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const VideoEditPlanSchema = z.object({
  editorialSummary: z.string().trim().min(20),
  hook: z.string().trim().min(2),
  estimatedDurationMs: z.number().int().positive(),
  aspectRatio: VideoEditAspectRatioSchema,
  pacing: z.string().trim().min(2),
  segments: z.array(VideoEditSegmentSchema).min(1).max(80),
  captions: z.array(VideoCaptionSchema).default([]),
  grade: z.enum(["natural", "warm", "neutral-punch", "custom"]).default("natural"),
  audioTreatment: z.string().trim().min(2),
  overlayInstructions: z.array(z.string().trim().min(2)).max(20).default([]),
  warnings: z.array(z.string().trim().min(2)).max(20).default([]),
});

export const VideoEditReviewSchema = z.object({
  passed: z.boolean(),
  score: z.number().int().min(0).max(100),
  issues: z.array(
    z.object({
      code: z.string().trim().min(1).max(80),
      severity: z.enum(["warning", "blocking"]),
      message: z.string().trim().min(2).max(500),
      atMs: z.number().int().min(0).nullable().default(null),
    }),
  ),
  revisionInstructions: z.array(z.string().trim().min(2)).max(20).default([]),
});

export const VideoEditRefinementSchema = z.object({
  instruction: z.string().trim().min(3).max(2_000),
});

export type VideoEditStatus = z.infer<typeof VideoEditStatusSchema>;
export type VideoEditJobInput = z.infer<typeof VideoEditJobInputSchema>;
export type VideoEditAssetInput = z.infer<typeof VideoEditAssetInputSchema>;
export type VideoEditPlan = z.infer<typeof VideoEditPlanSchema>;
export type VideoEditReview = z.infer<typeof VideoEditReviewSchema>;
