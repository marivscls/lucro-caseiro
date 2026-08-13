import { z } from "zod";

export const VideoPromptFormatSchema = z.enum([
  "short-vertical",
  "feed-vertical",
  "square",
  "horizontal",
  "custom",
]);

export const VideoPromptObjectiveSchema = z.enum([
  "introduce-brand",
  "demonstrate-feature",
  "explain-problem",
  "teach-process",
  "show-in-action",
  "ugc",
  "advertisement",
  "authority",
  "call-to-action",
  "custom",
]);

export const VideoPromptVisualModeSchema = z.enum([
  "consistent-character",
  "new-presenter",
  "one-off-character",
  "no-character",
  "product-environment",
  "real-interface",
  "hybrid-character-interface",
]);

export const VideoPromptStatusSchema = z.enum([
  "draft",
  "ready",
  "tested",
  "approved",
  "archived",
]);

export const CharacterConsentModeSchema = z.enum([
  "authorized-identity",
  "aesthetic-reference-only",
]);

export const CharacterSourceTypeSchema = z.enum([
  "original-description",
  "authorized-references",
]);

export const CharacterImmutableTraitsSchema = z.object({
  apparentAge: z.string().trim().max(100).default(""),
  faceShape: z.string().trim().max(300).default(""),
  skinTone: z.string().trim().max(300).default(""),
  eyes: z.string().trim().max(300).default(""),
  eyebrows: z.string().trim().max(300).default(""),
  nose: z.string().trim().max(300).default(""),
  lips: z.string().trim().max(300).default(""),
  jaw: z.string().trim().max(300).default(""),
  hair: z.string().trim().max(500).default(""),
  skinTexture: z.string().trim().max(300).default(""),
  approximateHeight: z.string().trim().max(100).default(""),
  bodyProportions: z.string().trim().max(300).default(""),
  visualPersonality: z.string().trim().max(500).default(""),
  distinctiveFeatures: z.string().trim().max(500).default(""),
});

export const CharacterVariableTraitsSchema = z.object({
  clothing: z.string().trim().max(500).default(""),
  accessories: z.string().trim().max(300).default(""),
  allowedHairstyle: z.string().trim().max(300).default(""),
  expression: z.string().trim().max(300).default(""),
  bodyPosition: z.string().trim().max(300).default(""),
  action: z.string().trim().max(500).default(""),
  environment: z.string().trim().max(500).default(""),
  lighting: z.string().trim().max(300).default(""),
  framing: z.string().trim().max(300).default(""),
});

export const CharacterVariableTraitKeySchema = z.enum([
  "clothing",
  "accessories",
  "allowedHairstyle",
  "expression",
  "bodyPosition",
  "action",
  "environment",
  "lighting",
  "framing",
]);

export const CharacterReferenceAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  storagePath: z.string().trim().min(1).max(500),
  purpose: CharacterConsentModeSchema,
});

export const CharacterProfileInputSchema = z.object({
  brandId: z.string().trim().min(1).max(80),
  internalName: z.string().trim().min(2).max(120),
  sourceType: CharacterSourceTypeSchema,
  consentMode: CharacterConsentModeSchema,
  immutableTraits: CharacterImmutableTraitsSchema,
  variableTraits: CharacterVariableTraitsSchema,
  lockedTraits: z.array(CharacterVariableTraitKeySchema).default([]),
  referenceAssets: z.array(CharacterReferenceAssetSchema).max(12).default([]),
  identityPrompt: z.string().trim().max(8000).default(""),
  negativePrompt: z.string().trim().max(4000).default(""),
});

export const CharacterProfilePatchSchema = CharacterProfileInputSchema.partial();

export const SceneMovementCategorySchema = z.enum([
  "character",
  "expression-gaze",
  "gesture-hands",
  "camera",
  "object",
  "environment",
  "frame-entry-exit",
  "transition",
]);

export const SceneMovementIntensitySchema = z.enum([
  "almost-static",
  "subtle-natural",
  "conversational",
  "dynamic",
  "energetic",
  "custom",
]);

export const SceneMovementSpeedSchema = z.enum([
  "very-slow",
  "slow",
  "natural",
  "fast",
  "custom",
]);

export const SceneMovementPresetSchema = z.enum([
  "presenter-talking",
  "phone-demo",
  "business-routine",
  "character-interface",
  "no-character",
  "spontaneous-ugc",
]);

export const SceneMovementActionSchema = z
  .object({
    id: z.string().uuid().optional(),
    category: SceneMovementCategorySchema,
    type: z.string().trim().min(1).max(180),
    startTime: z.number().min(0).max(180),
    endTime: z.number().min(0).max(180),
    instruction: z.string().trim().min(3).max(1200),
    initialPosition: z.string().trim().max(500).default(""),
    action: z.string().trim().max(600).default(""),
    direction: z.string().trim().max(300).default(""),
    speed: SceneMovementSpeedSchema.default("natural"),
    customSpeed: z.string().trim().max(180).default(""),
    amplitude: z.string().trim().max(240).default("pequena e controlada"),
    finalPosition: z.string().trim().max(500).default(""),
    involvedSubject: z.string().trim().max(300).default(""),
    intensity: SceneMovementIntensitySchema.default("subtle-natural"),
    customIntensity: z.string().trim().max(180).default(""),
    continuity: z.string().trim().max(600).default(""),
    hand: z.enum(["none", "left", "right", "both"]).default("none"),
    handsInitialPosition: z.string().trim().max(300).default(""),
    touchedObject: z.string().trim().max(300).default(""),
    gesture: z.string().trim().max(500).default(""),
    distance: z.string().trim().max(180).default(""),
    stability: z.string().trim().max(240).default(""),
    startPoint: z.string().trim().max(300).default(""),
    endPoint: z.string().trim().max(300).default(""),
    trackedObject: z.string().trim().max(300).default(""),
    primary: z.boolean().default(false),
  })
  .superRefine((movement, context) => {
    if (movement.endTime <= movement.startTime)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "O movimento deve terminar depois de começar.",
      });
  });

const HeldObjectSchema = z.object({
  object: z.string().trim().min(1).max(180),
  hand: z.enum(["left", "right", "both"]),
  orientation: z.string().trim().max(240).default(""),
});

export const SceneMovementContinuitySchema = z.object({
  initialBodyPosition: z.string().trim().max(400).default(""),
  finalBodyPosition: z.string().trim().max(400).default(""),
  initialGazeDirection: z.string().trim().max(300).default(""),
  finalGazeDirection: z.string().trim().max(300).default(""),
  entrySide: z.enum(["none", "left", "right", "top", "bottom"]).default("none"),
  exitSide: z.enum(["none", "left", "right", "top", "bottom"]).default("none"),
  heldObjectsStart: z.array(HeldObjectSchema).max(10).default([]),
  heldObjectsEnd: z.array(HeldObjectSchema).max(10).default([]),
  objectLocationsStart: z.string().trim().max(600).default(""),
  objectLocationsEnd: z.string().trim().max(600).default(""),
  clothingAndAccessories: z.string().trim().max(600).default(""),
  lightingDirection: z.string().trim().max(300).default(""),
  cameraAxis: z.string().trim().max(300).default(""),
  movementSpeed: SceneMovementSpeedSchema.default("natural"),
});

export const SceneMovementPlanSchema = z.object({
  preset: SceneMovementPresetSchema.nullable().default(null),
  intensity: SceneMovementIntensitySchema.default("subtle-natural"),
  customIntensity: z.string().trim().max(180).default(""),
  speed: SceneMovementSpeedSchema.default("natural"),
  customSpeed: z.string().trim().max(180).default(""),
  actions: z.array(SceneMovementActionSchema).max(40).default([]),
  continuity: SceneMovementContinuitySchema.default({}),
  movementPrompt: z.string().trim().max(8000).default(""),
  negativePrompt: z.string().trim().max(4000).default(""),
});

export const VideoSceneInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    order: z.number().int().min(0).max(50),
    startTime: z.number().min(0).max(180),
    endTime: z.number().min(0).max(180),
    narrativeRole: z.string().trim().min(1).max(300),
    characterPresent: z.boolean().default(false),
    environment: z.string().trim().max(600).default(""),
    action: z.string().trim().max(800).default(""),
    characterDirection: z.string().trim().max(800).default(""),
    cameraDirection: z.string().trim().max(800).default(""),
    lightingDirection: z.string().trim().max(800).default(""),
    dialogue: z.string().trim().max(1200).default(""),
    narration: z.string().trim().max(1200).default(""),
    onScreenText: z.string().trim().max(300).default(""),
    transition: z.string().trim().max(300).default(""),
    productEvidenceIds: z.array(z.string().trim().min(1).max(500)).max(12).default([]),
    continuityNotes: z.string().trim().max(800).default(""),
    movementPlan: SceneMovementPlanSchema.default({}),
  })
  .superRefine((scene, context) => {
    if (scene.endTime <= scene.startTime)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "O fim da cena deve ocorrer depois do início.",
      });
  });

export const VideoDirectionSchema = z.object({
  character: z.object({
    expression: z.string().trim().max(300).default("natural e responsiva"),
    energy: z.string().trim().max(200).default("próxima"),
    eyeContact: z.string().trim().max(200).default("alternado entre ação e câmera"),
    gestures: z.string().trim().max(500).default("gestos naturais ligados à ação"),
    posture: z.string().trim().max(300).default("relaxada e ativa"),
    movementSpeed: z.string().trim().max(200).default("moderada"),
  }),
  voice: z.object({
    language: z.string().trim().max(120).default("português brasileiro"),
    vocalGender: z.string().trim().max(120).default(""),
    apparentAge: z.string().trim().max(120).default("adulta"),
    warmth: z.string().trim().max(120).default("calorosa"),
    energy: z.string().trim().max(120).default("próxima"),
    speed: z.string().trim().max(120).default("moderada"),
    pauses: z.string().trim().max(300).default("pausas e respiração naturais"),
    intonation: z
      .string()
      .trim()
      .max(300)
      .default("conversacional, sem locução publicitária"),
    savedVoice: z.string().trim().max(180).default(""),
  }),
  environment: z.string().trim().max(500).default("escritório acolhedor"),
  camera: z.object({
    focalLength: z.string().trim().max(120).default("35 mm equivalente"),
    shot: z.string().trim().max(180).default("plano médio"),
    height: z.string().trim().max(120).default("altura dos olhos"),
    angle: z.string().trim().max(120).default("frontal levemente lateral"),
    movement: z.string().trim().max(300).default("movimento suave e motivado pela ação"),
    depthOfField: z.string().trim().max(180).default("fundo levemente desfocado"),
    stability: z.string().trim().max(180).default("estável com respiração natural"),
    speed: z.string().trim().max(120).default("moderada"),
    perspective: z.string().trim().max(180).default("smartphone editorial plausível"),
  }),
  lighting: z.string().trim().max(500).default("luz natural lateral, suave e difusa"),
  realism: z.enum([
    "documentary",
    "spontaneous-ugc",
    "editorial",
    "naturalistic-advertising",
    "cinematic",
    "product-demo",
  ]),
});

export const VideoPromptProjectInputSchema = z.object({
  brandId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(180),
  format: VideoPromptFormatSchema,
  aspectRatio: z.string().trim().min(3).max(20),
  duration: z.number().int().min(6).max(180),
  objective: VideoPromptObjectiveSchema,
  customObjective: z.string().trim().max(500).default(""),
  visualMode: VideoPromptVisualModeSchema,
  topicId: z.string().trim().max(180).nullable().default(null),
  offerId: z.string().trim().max(180).nullable().default(null),
  featureId: z.string().trim().max(180).nullable().default(null),
  audienceId: z.string().trim().max(180).nullable().default(null),
  funnelStage: z.string().trim().max(120).default("consideração"),
  angle: z.string().trim().max(500).default(""),
  cta: z.string().trim().max(300).default("Conheça o Lucro Caseiro"),
  destinationChannels: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  targetTool: z.string().trim().max(120).nullable().default(null),
  characterProfileId: z.string().uuid().nullable().default(null),
  voiceProfileId: z.string().trim().max(180).nullable().default(null),
  contextVersion: z.string().trim().min(1).max(120),
  status: VideoPromptStatusSchema.default("draft"),
  scriptMode: z
    .enum(["automatic", "manual", "imported", "visual-only", "full"])
    .default("automatic"),
  creativeBrief: z.object({
    topic: z.string().trim().min(2).max(500),
    audience: z.string().trim().max(500).default(""),
    painOrDesire: z.string().trim().max(800).default(""),
    supportingFacts: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    restrictions: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    productEvidenceIds: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  }),
  direction: VideoDirectionSchema,
  scenes: z.array(VideoSceneInputSchema).min(1).max(20),
});

export const VideoPromptProjectPatchSchema = VideoPromptProjectInputSchema.partial();

export const VideoPromptQualityWarningSchema = z.object({
  code: z.string().trim().min(1).max(80),
  severity: z.enum(["warning", "blocking"]),
  message: z.string().trim().min(2).max(500),
  sceneId: z.string().uuid().optional(),
});

export const VideoPromptSimilarityWarningSchema = z.object({
  projectId: z.string().uuid(),
  score: z.number().min(0).max(1),
  message: z.string().trim().min(2).max(500),
  matchingDimensions: z.array(z.string().trim().min(1).max(80)).min(1),
});

export const VideoPromptOutputSchema = z.object({
  creativeSummary: z.string().trim().min(20),
  masterPrompt: z.string().trim().min(100),
  fixedCharacterIdentity: z.string().trim().default("Não se aplica."),
  sceneDirections: z.array(
    z.object({
      sceneId: z.string().uuid().optional(),
      order: z.number().int().min(0),
      time: z.string().trim().min(1),
      direction: z.string().trim().min(20),
    }),
  ),
  movementDirections: z.array(
    z.object({
      sceneId: z.string().uuid().optional(),
      order: z.number().int().min(0),
      time: z.string().trim().min(1),
      prompt: z.string().trim().min(20),
      negativePrompt: z.string().trim().min(10),
    }),
  ),
  speechAndNarration: z.string().trim().min(1),
  cameraDirection: z.string().trim().min(10),
  lightingDirection: z.string().trim().min(10),
  voiceDirection: z.string().trim().min(10),
  continuity: z.string().trim().min(10),
  restrictionsAndNegativePrompt: z.string().trim().min(20),
  requiredMaterials: z.array(z.string().trim().min(1)).min(1),
  preGenerationChecklist: z.array(z.string().trim().min(1)).min(1),
});

export const VideoPromptGenerationInputSchema = z.object({
  targetTool: z.string().trim().max(120).nullable().optional(),
  adjustment: z
    .enum([
      "none",
      "more-realistic",
      "reduce-complexity",
      "new-hook",
      "new-setting",
      "alternative-direction",
      "generate-choreography",
      "simplify-movements",
      "naturalize-movements",
      "increase-movement-energy",
      "reduce-gestures",
      "fix-movement-continuity",
      "sync-movement-dialogue",
      "fixed-camera",
      "movement-variation",
    ])
    .default("none"),
  similarityResolution: z
    .enum(["keep", "new-hook", "new-setting", "alternative-direction"])
    .optional(),
  sceneOrder: z.number().int().min(0).max(50).optional(),
});

export const SceneMovementGenerationInputSchema = z.object({
  command: z
    .enum([
      "generate-choreography",
      "simplify-movements",
      "naturalize-movements",
      "increase-movement-energy",
      "reduce-gestures",
      "fix-movement-continuity",
      "sync-movement-dialogue",
      "fixed-camera",
      "movement-variation",
    ])
    .default("generate-choreography"),
});

export const VideoPromptToolSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  promptHint: z.string().trim().min(1),
});

export const VideoPromptProjectQuerySchema = z.object({
  characterProfileId: z.string().uuid().optional(),
  visualMode: VideoPromptVisualModeSchema.optional(),
  objective: VideoPromptObjectiveSchema.optional(),
  featureId: z.string().trim().optional(),
  duration: z.coerce.number().int().optional(),
  format: VideoPromptFormatSchema.optional(),
  targetTool: z.string().trim().optional(),
  status: VideoPromptStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CharacterProfileInput = z.infer<typeof CharacterProfileInputSchema>;
export type VideoPromptProjectInput = z.infer<typeof VideoPromptProjectInputSchema>;
export type VideoSceneInput = z.infer<typeof VideoSceneInputSchema>;
export type SceneMovementAction = z.infer<typeof SceneMovementActionSchema>;
export type SceneMovementPlan = z.infer<typeof SceneMovementPlanSchema>;
export type SceneMovementGenerationInput = z.infer<
  typeof SceneMovementGenerationInputSchema
>;
export type VideoPromptOutput = z.infer<typeof VideoPromptOutputSchema>;
export type VideoPromptGenerationInput = z.infer<typeof VideoPromptGenerationInputSchema>;
export type VideoPromptQualityWarning = z.infer<typeof VideoPromptQualityWarningSchema>;
export type VideoPromptSimilarityWarning = z.infer<
  typeof VideoPromptSimilarityWarningSchema
>;
export type VideoPromptTool = z.infer<typeof VideoPromptToolSchema>;
