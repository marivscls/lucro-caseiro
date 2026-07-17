export const contentFormatOptions = [
  "Post para Instagram",
  "Carrossel",
  "Reels",
  "Stories",
  "Threads",
  "Facebook",
  "LinkedIn",
  "E-mail",
  "Artigo",
  "Blog",
  "Push notification",
  "Roteiro de vídeo",
  "Legenda",
  "Título",
  "CTA",
  "Prompt para imagem",
  "Prompt para vídeo",
  "Hashtags",
] as const;

export type ContentBrief = {
  theme: string;
  category: string;
  persona: string;
  contentObjective: string;
  personaStage: string;
  mainPain: string;
  mainDesire: string;
  transformation: string;
  hook: string;
  primaryEmotion: string;
  mentalTriggers: string[];
  objections: string[];
  mainMessage: string;
  cta: string;
  keywords: string[];
  toneOfVoice: string;
  restrictions: string[];
  proofs: string[];
  desiredFormats: string[];
  analysis?: ContentBriefAnalysis;
};

export type ContentBriefAnalysis = {
  bestFormat: string;
  bestFormatReason: string;
  actualObjective: string;
  viralPotential: number;
  viralClassification: string;
  viralReason: string;
  conversionPotential: number;
  sharingPotential: number;
  savingPotential: number;
  hookStrength: number;
  personaClarity: number;
  objectiveClarity: number;
  emotionalAppeal: number;
  messageClarity: number;
  engagementPotential: number;
  overallScore: number;
  diagnosis: {
    strengths: string[];
    weaknesses: string[];
    missing: string[];
    excellent: string[];
  };
  improvements: {
    hook: string;
    message: string;
    cta: string;
    persona: string;
    pain: string;
    transformation: string;
  };
  naturalTriggers: string[];
  suggestedTriggers: string[];
  unansweredObjection: string;
  storytellingOpportunity: string;
  socialProofOpportunity: string;
  numbersOpportunity: string;
  executiveSummary: string;
};

export type ContentBriefCriterion = {
  label: string;
  score: number;
  suggestion: string;
};

export type ContentBriefScore = {
  overall: number;
  criteria: ContentBriefCriterion[];
};

const contentBriefKeys = [
  "theme",
  "category",
  "persona",
  "contentObjective",
  "personaStage",
  "mainPain",
  "mainDesire",
  "transformation",
  "hook",
  "primaryEmotion",
  "mentalTriggers",
  "objections",
  "mainMessage",
  "cta",
  "keywords",
  "toneOfVoice",
  "restrictions",
  "proofs",
  "desiredFormats",
] as const satisfies readonly (keyof ContentBrief)[];

type ContentBriefFieldKey = (typeof contentBriefKeys)[number];

const legacyContentBriefKeys = [
  "topic",
  "audience",
  "goal",
  "funnelStage",
  "pain",
  "desire",
  "message",
  "tone",
  "proof",
  "format",
] as const;

export function emptyContentBrief(): ContentBrief {
  return {
    theme: "",
    category: "",
    persona: "",
    contentObjective: "",
    personaStage: "",
    mainPain: "",
    mainDesire: "",
    transformation: "",
    hook: "",
    primaryEmotion: "",
    mentalTriggers: [],
    objections: [],
    mainMessage: "",
    cta: "",
    keywords: [],
    toneOfVoice: "",
    restrictions: [],
    proofs: [],
    desiredFormats: [],
    analysis: undefined,
  };
}

export function contentBriefFromData(data: Record<string, unknown>): ContentBrief {
  return {
    theme: stringValue(data.theme ?? data.topic),
    category: stringValue(data.category),
    persona: stringValue(data.persona ?? data.audience),
    contentObjective: stringValue(data.contentObjective ?? data.goal),
    personaStage: stringValue(data.personaStage ?? data.funnelStage),
    mainPain: stringValue(data.mainPain ?? data.pain),
    mainDesire: stringValue(data.mainDesire ?? data.desire),
    transformation: stringValue(data.transformation),
    hook: stringValue(data.hook),
    primaryEmotion: stringValue(data.primaryEmotion),
    mentalTriggers: listValue(data.mentalTriggers),
    objections: listValue(data.objections),
    mainMessage: stringValue(data.mainMessage ?? data.message),
    cta: stringValue(data.cta),
    keywords: listValue(data.keywords),
    toneOfVoice: stringValue(data.toneOfVoice ?? data.tone),
    restrictions: listValue(data.restrictions),
    proofs: listValue(data.proofs ?? data.proof),
    desiredFormats: listValue(data.desiredFormats ?? data.format),
    analysis: analysisValue(data.analysis),
  };
}

export function mergeContentBriefData(
  data: Record<string, unknown>,
  brief: ContentBrief,
): Record<string, unknown> {
  const merged = { ...data };
  delete merged.analysis;
  for (const key of contentBriefKeys) delete merged[key];
  for (const key of legacyContentBriefKeys) delete merged[key];
  for (const key of contentBriefKeys) {
    const value = brief[key];
    if (Array.isArray(value)) {
      const items = value.map((item) => item.trim()).filter(Boolean);
      if (items.length > 0) merged[key] = items;
      continue;
    }
    const normalized = value.trim();
    if (normalized) merged[key] = normalized;
  }
  if (brief.analysis) merged.analysis = brief.analysis;
  return merged;
}

export function scoreContentBrief(brief: ContentBrief): ContentBriefScore {
  const criteria = [
    criterion(
      "Clareza da persona",
      brief,
      [
        ["persona", 45],
        ["personaStage", 20],
        ["mainPain", 20],
        ["mainDesire", 15],
      ],
      "Defina quem é a pessoa, seu estágio, dor e desejo.",
    ),
    criterion(
      "Força do gancho",
      brief,
      [
        ["hook", 70],
        ["mainPain", 15],
        ["mainMessage", 15],
      ],
      "Escreva um gancho ligado à dor e à mensagem principal.",
    ),
    criterion(
      "Apelo emocional",
      brief,
      [
        ["primaryEmotion", 30],
        ["mainPain", 20],
        ["mainDesire", 20],
        ["transformation", 30],
      ],
      "Conecte emoção, dor, desejo e transformação.",
    ),
    criterion(
      "Potencial de engajamento",
      brief,
      [
        ["hook", 25],
        ["desiredFormats", 20],
        ["mentalTriggers", 20],
        ["keywords", 15],
        ["mainMessage", 20],
      ],
      "Combine gancho, formato, gatilhos, palavras-chave e mensagem.",
    ),
    criterion(
      "Potencial de conversão",
      brief,
      [
        ["contentObjective", 20],
        ["mainMessage", 20],
        ["cta", 25],
        ["objections", 15],
        ["proofs", 20],
      ],
      "Defina objetivo, CTA, objeções e provas disponíveis.",
    ),
    criterion(
      "Potencial de compartilhamento",
      brief,
      [
        ["mainMessage", 25],
        ["desiredFormats", 15],
        ["keywords", 15],
        ["mainPain", 15],
        ["mainDesire", 15],
        ["transformation", 15],
      ],
      "Torne a mensagem útil e reconhecível para a persona compartilhar.",
    ),
    criterion(
      "Qualidade do contexto para IA",
      brief,
      contentBriefKeys.map((key) => [key, 1] as const),
      "Preencha mais campos do briefing para reduzir inferências da IA.",
    ),
  ];
  const overall = Math.round(
    criteria.reduce((total, item) => total + item.score, 0) / criteria.length,
  );
  return { overall, criteria };
}

function criterion(
  label: string,
  brief: ContentBrief,
  weights: readonly (readonly [ContentBriefFieldKey, number])[],
  missingSuggestion: string,
): ContentBriefCriterion {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const completed = weights.reduce(
    (sum, [key, weight]) => sum + (hasValue(brief[key]) ? weight : 0),
    0,
  );
  const score = total === 0 ? 0 : Math.round((completed / total) * 100);
  return {
    label,
    score,
    suggestion:
      score === 100 ? "Contexto completo para este critério." : missingSuggestion,
  };
}

function hasValue(value: string | string[]) {
  return Array.isArray(value)
    ? value.some((item) => item.trim().length > 0)
    : value.trim().length > 0;
}

function stringValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function listValue(value: unknown) {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function analysisValue(value: unknown): ContentBriefAnalysis | undefined {
  if (!isRecord(value)) return undefined;
  const diagnosis = isRecord(value.diagnosis) ? value.diagnosis : {};
  const improvements = isRecord(value.improvements) ? value.improvements : {};
  const suggestions = isRecord(value.suggestions) ? value.suggestions : {};
  return {
    bestFormat: stringValue(value.bestFormat),
    bestFormatReason: stringValue(value.bestFormatReason),
    actualObjective: stringValue(value.actualObjective),
    viralPotential: scoreValue(value.viralPotential),
    viralClassification: stringValue(value.viralClassification),
    viralReason: stringValue(value.viralReason),
    conversionPotential: scoreValue(value.conversionPotential),
    sharingPotential: scoreValue(value.sharingPotential),
    savingPotential: scoreValue(value.savingPotential),
    hookStrength: scoreValue(value.hookStrength),
    personaClarity: scoreValue(value.personaClarity),
    objectiveClarity: scoreValue(value.objectiveClarity),
    emotionalAppeal: scoreValue(value.emotionalAppeal),
    messageClarity: scoreValue(value.messageClarity),
    engagementPotential: scoreValue(value.engagementPotential),
    overallScore: scoreValue(value.overallScore),
    diagnosis: {
      strengths: listValue(diagnosis.strengths),
      weaknesses: listValue(diagnosis.weaknesses),
      missing: listValue(diagnosis.missing),
      excellent: listValue(diagnosis.excellent),
    },
    improvements: {
      hook: stringValue(improvements.hook ?? suggestions.hook),
      message: stringValue(improvements.message),
      cta: stringValue(improvements.cta ?? suggestions.cta),
      persona: stringValue(improvements.persona ?? suggestions.persona),
      pain: stringValue(improvements.pain),
      transformation: stringValue(improvements.transformation),
    },
    naturalTriggers: listValue(value.naturalTriggers),
    suggestedTriggers: listValue(value.suggestedTriggers),
    unansweredObjection: stringValue(value.unansweredObjection),
    storytellingOpportunity: stringValue(value.storytellingOpportunity),
    socialProofOpportunity: stringValue(value.socialProofOpportunity),
    numbersOpportunity: stringValue(value.numbersOpportunity),
    executiveSummary: stringValue(value.executiveSummary),
  };
}

function scoreValue(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
