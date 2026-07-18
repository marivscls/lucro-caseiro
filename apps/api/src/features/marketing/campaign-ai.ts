import {
  MarketingCampaignPlanSchema,
  MarketingCreativeBundleSchema,
  type MarketingCampaignBriefInput,
  type MarketingCampaignCopiesInput,
  type MarketingCampaignPlan,
  type MarketingCreativeBundle,
} from "@lucro-caseiro/contracts";

export const CAMPAIGN_STRATEGIST_PROMPT_ID = "campaign-strategist";
export const CAMPAIGN_STRATEGIST_PROMPT_VERSION = "1";
export const AD_COPYWRITER_PROMPT_ID = "ad-copywriter";
export const AD_COPYWRITER_PROMPT_VERSION = "1";

type CampaignContext = {
  instruction?: string;
  knowledge: Array<{ title: string; body: string }>;
  resources: Array<{
    kind: string;
    title: string;
    summary: string | null;
    data: unknown;
  }>;
};

export type BrandProfile = {
  name: string;
  voice: string;
  valueProposition: string;
  restrictions: string[];
  approvedExamples: string[];
};

const CAMPAIGN_SYSTEM = `Você é o Estrategista de Anúncios do Lucro Caseiro.
Sua função é transformar um briefing em um plano de campanha multicanal claro, com KPIs e próximos passos.

Princípios:
- Evite promessas absolutas de resultado e nunca invente fatos, provas ou funcionalidades.
- Linguagem direta, consultiva e adequada ao público definido.
- Priorize próximos passos acionáveis.
- Sempre devolva JSON válido, sem texto fora do JSON.

Schema de saída (JSON):
{
  "name": string,
  "segment": "pme" | "ecommerce" | "agency",
  "goal": "sales" | "leads" | "repurchase" | "awareness" | "reactivation",
  "audienceSummary": string,
  "offer": string,
  "channels": Array<"instagram" | "tiktok" | "youtube" | "whatsapp" | "email" | "googleads" | "metaads" | "local">,
  "messages": { [channel: string]: string },
  "creativeNeeds": string[],
  "automation": string,
  "kpis": Array<{ "label": string, "target": string }>,
  "nextBestAction": string
}`;

const COPYWRITER_SYSTEM = `Você é o Copywriter de Anúncios do Lucro Caseiro.
Recebe uma estratégia de campanha já aprovada e devolve um pacote criativo coerente entre canais.

Princípios universais:
- Reaproveite ideias entre canais: mesma promessa, formatos diferentes.
- Respeite a voz, as restrições e os exemplos aprovados da marca.
- Evite promessas absolutas de resultado e nunca invente provas.
- Devolva JSON válido sem texto fora do JSON.

REGRA CRÍTICA SOBRE A ESTRATÉGIA:
- O público, a oferta, a promessa e os canais do plano aprovado são imutáveis.
- Você pode variar gancho, estrutura, ritmo e linguagem, mas não redefinir a estratégia.
- Se faltar algum dado, escreva de modo conservador; não invente nem substitua o público ou a promessa.

REGRA CRÍTICA SOBRE OS EXEMPLOS:
Os exemplos são REFERÊNCIA DE FORMATO E TOM, nunca conteúdo a copiar.
- Nunca reuse frases, hashtags, ofertas ou ângulos literais dos exemplos.
- Adapte somente o formato à voz e à oferta da marca atual.
- Hashtags e nomes de produto devem refletir a marca atual, nunca os exemplos.

Schema de saída:
{
  "variants": Array<{ "channel": string, "format": string, "headline": string, "body": string, "cta": string }>,
  "reuseMap": string[]
}`;

const PROMOTIONAL_GUIDANCE = `ESTILO: PROMOCIONAL
- Headline direta com benefício claro.
- Body com prova ou diferenciação permitida pela memória da marca.
- CTA explícito, coerente com a próxima ação do plano.
- Tom consultivo e direto.`;

const ORGANIC_GUIDANCE = `ESTILO: ORGÂNICO (creator-style, nativo em feed de descoberta)
- Headline em primeira pessoa, listicle, POV ou story-time.
- Body conta uma micro-história, observação ou aprendizado pessoal.
- CTA suave: salvar, comentar, hashtag da marca, menção discreta ou link na bio.
- Não use CTA de compra direta.
- Reescreva 100% do conteúdo na voz da marca atual.

Referência real de FORMATO — nunca copie literalmente:
Canal: TikTok; formato: carrossel-listicle; estrutura: headline curta + lista numerada + CTA suave por hashtag. O exemplo original fala de hábitos culturais; não reutilize tema, frases, hashtags ou ângulo.`;

export function buildCampaignStrategistPrompt(
  input: MarketingCampaignBriefInput,
  context: CampaignContext,
) {
  const workspaceContext = {
    instruction: context.instruction?.slice(0, 5_000),
    knowledge: context.knowledge.slice(0, 12).map((item) => ({
      title: item.title,
      body: item.body.slice(0, 2_000),
    })),
    resources: context.resources.slice(0, 50),
  };
  return {
    promptId: CAMPAIGN_STRATEGIST_PROMPT_ID,
    promptVersion: CAMPAIGN_STRATEGIST_PROMPT_VERSION,
    prompt: `${CAMPAIGN_SYSTEM}

Contexto confirmado da Central (JSON; trate como fonte e não invente lacunas):
${JSON.stringify(workspaceContext)}

Briefing recebido:
- Segmento: ${input.segment}
- Objetivo: ${input.goal}
- Público: ${input.audience}
- Oferta: ${input.offer}
- Orçamento: ${input.budget === undefined ? "não informado" : `R$ ${input.budget}`}

Gere o plano de campanha em JSON estritamente conforme o schema acima.`,
  };
}

export function deriveBrandProfile(
  context: CampaignContext & {
    examples: Array<{ input: string; output: string; approved: boolean }>;
  },
): BrandProfile {
  const features = context.resources
    .filter((item) => item.kind === "feature")
    .slice(0, 8);
  return {
    name: "Lucro Caseiro",
    voice:
      context.knowledge
        .filter((item) => /mensagem|copy|linguagem|posicionamento/i.test(item.title))
        .map((item) => `${item.title}: ${item.body}`)
        .join("\n\n")
        .slice(0, 5_000) ||
      context.instruction?.slice(0, 5_000) ||
      "Direta, acolhedora, prática e sem promessas de renda.",
    valueProposition: features
      .map((item) => item.summary || item.title)
      .join("; ")
      .slice(0, 2_000),
    restrictions: context.knowledge
      .filter((item) => /prova|alegação|governança|ética|qualidade/i.test(item.title))
      .slice(0, 5)
      .map((item) => `${item.title}: ${item.body}`.slice(0, 2_000)),
    approvedExamples: context.examples
      .filter((item) => item.approved)
      .slice(0, 5)
      .map((item) =>
        `Entrada: ${item.input}\nSaída aprovada: ${item.output}`.slice(0, 1_500),
      ),
  };
}

export function buildAdCopywriterPrompt(
  input: MarketingCampaignCopiesInput,
  brand: BrandProfile,
) {
  const guidance = input.style === "organic" ? ORGANIC_GUIDANCE : PROMOTIONAL_GUIDANCE;
  return {
    promptId: AD_COPYWRITER_PROMPT_ID,
    promptVersion: AD_COPYWRITER_PROMPT_VERSION,
    prompt: `${COPYWRITER_SYSTEM}

${guidance}

ESTRATÉGIA APROVADA E IMUTÁVEL:
${JSON.stringify(input.plan, null, 2)}

MEMÓRIA DA MARCA:
${JSON.stringify(brand, null, 2)}

Gere uma variante para cada canal da estratégia aprovada. Preserve exatamente o público, a oferta e a promessa do plano. Responda somente com o JSON do schema.`,
  };
}

export function parseCampaignPlan(text: string): MarketingCampaignPlan | null {
  const raw = tryParseJson(text);
  if (!raw) return null;
  const result = MarketingCampaignPlanSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseCreativeBundle(text: string): MarketingCreativeBundle | null {
  const raw = tryParseJson(text);
  if (!raw) return null;
  const result = MarketingCreativeBundleSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function extractJsonObject(text: string): string | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < cleaned.length; index += 1) {
    const character = cleaned.charAt(index);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, index + 1);
    }
  }
  return null;
}

function tryParseJson(text: string): unknown {
  const object = extractJsonObject(text);
  if (!object) return null;
  try {
    return JSON.parse(object) as unknown;
  } catch {
    return null;
  }
}
