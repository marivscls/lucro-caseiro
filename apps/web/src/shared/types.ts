export type ResourceKind =
  | "content"
  | "audience"
  | "interview"
  | "feature"
  | "topic"
  | "outreach"
  | "campaign"
  | "performance";

export interface MarketingResource {
  id: string;
  kind: ResourceKind;
  slug: string;
  title: string;
  summary: string | null;
  status: string;
  scheduledFor: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingAiResourceDraft {
  title: string;
  summary: string;
  status: string;
  scheduledFor: string | null;
  data: Record<string, unknown>;
}

export interface MarketingCampaignPlan {
  name: string;
  segment?: "pme" | "ecommerce" | "agency";
  goal?: "sales" | "leads" | "repurchase" | "awareness" | "reactivation";
  audienceSummary?: string;
  offer?: string;
  channels: string[];
  messages: Record<string, string>;
  creativeNeeds: string[];
  automation?: string;
  kpis: Array<{ label: string; target: string }>;
  nextBestAction?: string;
}

export interface MarketingCreativeBundle {
  variants: Array<{
    id?: string;
    channel: string;
    format: string;
    headline: string;
    body: string;
    cta: string;
  }>;
  reuseMap: string[];
}

export interface MarketingPromptTelemetry {
  promptId: string;
  promptVersion: string;
  model: string;
  parseSucceeded: boolean;
}

export interface MarketingCampaignPlanGeneration {
  plan: MarketingCampaignPlan | null;
  raw: string;
  messageId: string;
  telemetry: MarketingPromptTelemetry;
}

export interface MarketingCampaignCopiesGeneration {
  bundle: MarketingCreativeBundle | null;
  raw: string;
  messageId: string;
  telemetry: MarketingPromptTelemetry;
}

export interface MarketingContentIdea {
  title: string;
  example: string;
  category: string;
  objective: string;
  persona: string;
  primaryEmotion: string;
  mainPain: string;
  mainDesire: string;
  bestFormat: string;
  hook: string;
  cta: string;
  strategicPotential: number;
  justification: string;
  scores: {
    conversion: number;
    sharing: number;
    saving: number;
    identification: number;
    viral: number;
  };
  brief: {
    theme: string;
    category: string;
    persona: string;
    contentObjective: string;
    personaStage: string;
    mainPain: string;
    mainDesire: string;
    transformation: string;
    primaryEmotion: string;
    hook: string;
    mainMessage: string;
    cta: string;
  };
}

export interface MarketingContentIdeas {
  ideas: MarketingContentIdea[];
}

export interface MarketingDocument {
  id: string;
  slug: string;
  title: string;
  body: string;
  tags: string[];
  source: string;
  updatedAt: string;
  versions?: Array<{
    id: string;
    version: number;
    title: string;
    body: string;
    note: string | null;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    mimeType: string;
    storagePath: string;
    sizeBytes: number;
  }>;
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
}
export interface AiSession {
  id: string;
  title: string;
  updatedAt: string;
  messages?: AiMessage[];
}

export interface DashboardData {
  resources: MarketingResource[];
  documents: MarketingDocument[];
  sessions: AiSession[];
  learning: Array<{
    id: string;
    learningClass: string;
    action: string;
    status: string;
    reason: string;
    createdAt: string;
  }>;
  settings: {
    classAEnabled: boolean;
    classBEnabled: boolean;
    classCEnabled: boolean;
    minimumSamples: number;
    minimumScore: number;
  };
}

export interface TrainingData {
  instructions: Array<{
    id: string;
    version: number;
    body: string;
    note: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
  knowledge: Array<{
    id: string;
    title: string;
    body: string;
    sourceType: string;
    tags: string[];
    canonical: boolean;
  }>;
  examples: Array<{ id: string; input: string; output: string; tags: string[] }>;
  evaluations: Array<{
    id: string;
    title: string;
    prompt: string;
    expected: string;
    lastScore: number | null;
    lastOutput: string | null;
  }>;
  learning: DashboardData["learning"];
  settings: DashboardData["settings"];
}
