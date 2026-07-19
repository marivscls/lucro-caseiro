const MARKETING_AI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;

type GenerateWithModel = (model: string, abortSignal: AbortSignal) => Promise<string>;

export class MarketingAiQuotaError extends Error {
  constructor() {
    super("Marketing AI quota exhausted");
    this.name = "MarketingAiQuotaError";
  }
}

export async function generateMarketingAiWithFallback(
  generate: GenerateWithModel,
  timeoutMs = 45_000,
) {
  const abortSignal = AbortSignal.timeout(timeoutMs);
  const errors: unknown[] = [];

  for (const model of MARKETING_AI_MODELS) {
    try {
      return { text: await generate(model, abortSignal), model };
    } catch (error) {
      errors.push(error);
      console.warn(`Marketing AI model failed: ${model}`, error);
    }
  }

  if (errors.some(isQuotaError)) throw new MarketingAiQuotaError();
  throw errors.at(-1);
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    statusCode?: unknown;
    message?: unknown;
    responseBody?: unknown;
    cause?: unknown;
    lastError?: unknown;
    errors?: unknown;
  };
  if (
    candidate.statusCode === 429 ||
    textIncludesQuota(candidate.message) ||
    textIncludesQuota(candidate.responseBody)
  ) {
    return true;
  }
  if (isQuotaError(candidate.cause) || isQuotaError(candidate.lastError)) return true;
  return Array.isArray(candidate.errors) && candidate.errors.some(isQuotaError);
}

function textIncludesQuota(value: unknown) {
  return typeof value === "string" && /quota|resource_exhausted/i.test(value);
}
