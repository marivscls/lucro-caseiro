import {
  MarketingCampaignPlanSchema,
  MarketingCreativeBundleSchema,
  type MarketingCampaignBriefInput,
  type MarketingCampaignCopiesInput,
  type MarketingCampaignPlan,
  type MarketingCreativeBundle,
} from "@lucro-caseiro/contracts";

import { MARKET_POSITIONING_GUARDRAIL } from "./marketing.system-prompt";

export const CAMPAIGN_STRATEGIST_PROMPT_ID = "campaign-strategist";
export const CAMPAIGN_STRATEGIST_PROMPT_VERSION = "4";
export const AD_COPYWRITER_PROMPT_ID = "ad-copywriter";
export const AD_COPYWRITER_PROMPT_VERSION = "2";

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
Sua função é pesquisar o contexto disponível e transformar o briefing em um plano de campanha multicanal claro, específico e defensável.

${MARKET_POSITIONING_GUARDRAIL}

Princípios:
- Evite promessas absolutas de resultado e nunca invente fatos, provas ou funcionalidades.
- Linguagem direta, consultiva e adequada ao público definido.
- Separe psicologia (o que e por que comunicar) de comunicação (como escrever).
- Defina uma fatia de público identificável; não misture nichos numa mesma peça.
- audienceSummary e research.audienceSlice descrevem o público desta campanha, não o mercado total da marca.
- Quando o briefing não escolher um público, compare os segmentos disponíveis e não eleja confeitaria ou qualquer outro nicho por ordem, frequência ou hábito.
- Preserve o que já foi validado, mas procure uma Big Idea e uma comunicação próprias.
- Trate exemplos e referências como estruturas a compreender, nunca frases a copiar.
- Diferencie evidência confirmada, hipótese e lacuna. Se não houver prova, registre a lacuna.
- Se público ou oferta não vierem preenchidos, derive a opção mais bem sustentada pelo contexto confirmado da Central; não invente dados para esconder lacunas.
- "Inimigo comum" e nome memorável são opcionais: só use quando houver fundamento real.
- Priorize próximos passos acionáveis.
- Sempre devolva JSON válido, sem texto fora do JSON.

Schema de saída (JSON):
{
  "name": string,
  "segment": "pme" | "ecommerce" | "agency",
  "goal": "sales" | "leads" | "repurchase" | "awareness" | "reactivation",
  "audienceSummary": string,
  "offer": string,
  "research": {
    "audienceSlice": string,
    "audienceLanguage": string[],
    "realDesire": string,
    "saturatedSolutions": string[],
    "problemMechanism": string,
    "solutionMechanism": string,
    "differentiators": string[],
    "proofs": string[],
    "saturationNotes": string
  },
  "creativeStrategy": {
    "bigIdea": string,
    "angle": string,
    "promise": string,
    "reasonToBelieve": string,
    "stickyName": string,
    "commonEnemy": string,
    "organicInsight": string,
    "avatar": string,
    "format": string,
    "visualHook": string,
    "landing": string,
    "retentionBeats": string[],
    "productionNotes": string[]
  },
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
- Abra com a informação mais relevante para a fatia de público definida.
- Use especificidade concreta; elimine conectores, introduções e frases sem função.
- O gancho deve qualificar o público, a aterrissagem deve sustentar a atenção e o corpo deve renovar o interesse.
- Escreva a partir da função psicológica da estratégia, nunca por substituição superficial de palavras.
- Faça uma autorrevisão, corrija o pacote antes de responder e marque ready=false somente se restar risco de prova, contradição com o plano ou lacuna impeditiva.
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
  "variants": Array<{
    "channel": string,
    "format": string,
    "headline": string,
    "hook": string,
    "landing": string,
    "body": string,
    "retentionBeats": string[],
    "productionNotes": string,
    "evidence": string,
    "cta": string
  }>,
  "reuseMap": string[],
  "qualityReview": {
    "ready": boolean,
    "score": number,
    "criteria": {
      "congruence": number,
      "specificity": number,
      "novelty": number,
      "evidenceSafety": number,
      "concision": number
    },
    "strengths": string[],
    "warnings": string[],
    "nextTest": string
  }
}`;

const PROMOTIONAL_GUIDANCE = `ESTILO: PROMOCIONAL
- Headline e gancho diretos, específicos e coerentes com o nível de consciência do público.
- Aterrissagem forte o bastante para continuar a atenção sem repetir o gancho.
- Body com prova ou diferenciação permitida pela memória da marca e 2 a 4 movimentos de retenção.
- CTA explícito, coerente com a próxima ação do plano.
- Tom consultivo e direto.`;

const ORGANIC_GUIDANCE = `ESTILO: ORGÂNICO (creator-style, nativo em feed de descoberta)
- Headline em primeira pessoa, listicle, POV ou story-time.
- Body conta uma micro-história, observação ou aprendizado pessoal.
- CTA suave: salvar, comentar, hashtag da marca, menção discreta ou link na bio.
- Não use CTA de compra direta.
- Reescreva 100% do conteúdo na voz da marca atual.
- Preserve aparência de conteúdo nativo e detalhe a produção necessária para executar o formato.

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
- Público: ${input.audience || "não informado; derive do contexto confirmado"}
- Oferta: ${input.offer || "não informada; derive do contexto confirmado"}
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

Gere uma variante para cada canal da estratégia aprovada. Preserve exatamente o público, a oferta e a promessa do plano.
Antes de responder, revise congruência, especificidade, novidade, segurança das evidências e concisão; corrija as variantes e só então preencha qualityReview.
Responda somente com o JSON do schema.`,
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
