import {
  MarketingCampaignCreativeStrategySchema,
  MarketingCampaignResearchSchema,
} from "@lucro-caseiro/contracts";

import type { MarketingCampaignPlan } from "../../shared/types";

const AUTO_CAMPAIGN_AUDIENCE =
  "Compare os segmentos confirmados e defina o melhor público desta campanha sem tratá-lo como o mercado total do Lucro Caseiro.";
const AUTO_CAMPAIGN_OFFER =
  "Defina a oferta mais relevante para esse público usando apenas o contexto confirmado da Central.";

export const DEFAULT_CAROUSEL_SLIDES = 5;

export function normalizeCarouselSlides(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 3 && value <= 10
    ? value
    : DEFAULT_CAROUSEL_SLIDES;
}

export function campaignStrategyEnrichmentPrompt(carouselSlides: number) {
  return `Complete os blocos Pesquisa estratégica e Big Idea e produção da campanha atual.
Use somente o briefing, o plano e o conhecimento confirmado da Central. Não invente provas.
Se o formato for carrossel, preserve exatamente ${carouselSlides} slides, conforme adBriefing.carouselSlides. Em productionNotes, determine que o slide 1 seja gerado uma única vez com o marcador 1/${carouselSlides} e fixado como âncora visual real; depois gere somente os slides 2..${carouselSlides} como continuações referenciadas, numeradas de 2/${carouselSlides} até ${carouselSlides}/${carouselSlides}, sem reiniciar a direção de arte. Preserve a identidade, mas alterne famílias de composição; o layout vertical com foto de um lado e texto do outro pode aparecer no máximo uma vez.
No objeto data da resposta, devolva exatamente estas duas chaves:
{"research":{"audienceSlice":"...","audienceLanguage":["..."],"realDesire":"...","saturatedSolutions":["..."],"problemMechanism":"...","solutionMechanism":"...","differentiators":["..."],"proofs":["..."],"saturationNotes":"..."},"creativeStrategy":{"bigIdea":"...","angle":"...","promise":"...","reasonToBelieve":"...","stickyName":"...","commonEnemy":"...","organicInsight":"...","avatar":"...","format":"...","carouselSlides":${carouselSlides},"visualHook":"...","landing":"...","retentionBeats":["..."],"productionNotes":["..."]}}.
Preencha todos os campos com conteúdo específico. proofs pode ser [] e stickyName/commonEnemy podem ficar vazios quando não houver fundamento.`;
}

export function campaignAiBriefingFields(audience: string, offer: string) {
  return {
    audience: audience.trim() || AUTO_CAMPAIGN_AUDIENCE,
    offer: offer.trim() || AUTO_CAMPAIGN_OFFER,
  };
}

export function campaignDestinations(
  value: unknown,
): Record<number, "content" | "document"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([index, publication]) => {
      if (!publication || typeof publication !== "object" || Array.isArray(publication))
        return [];
      const variantIndex = Number(index);
      if (!Number.isInteger(variantIndex) || variantIndex < 0) return [];
      const destination = (publication as Record<string, unknown>).destination;
      if (destination !== "content" && destination !== "document") return [];
      return [[variantIndex, destination]];
    }),
  );
}

export function campaignNeedsStrategyEnrichment(plan: MarketingCampaignPlan) {
  const research = plan.research;
  const creativeStrategy = plan.creativeStrategy;
  return !(
    research?.audienceSlice.trim() &&
    research.problemMechanism.trim() &&
    research.solutionMechanism.trim() &&
    creativeStrategy?.bigIdea.trim() &&
    creativeStrategy.angle.trim() &&
    creativeStrategy.visualHook.trim() &&
    creativeStrategy.landing.trim()
  );
}

export function mergeCampaignStrategyEnrichment(
  plan: MarketingCampaignPlan,
  data: Record<string, unknown>,
): MarketingCampaignPlan {
  const nestedStrategy = recordValue(data.adStrategy);
  const nestedPlan = recordValue(data.plan);
  const candidates = [data, nestedStrategy, nestedPlan].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
  );
  const source = candidates.find(
    (candidate) =>
      recordValue(candidate.research) && recordValue(candidate.creativeStrategy),
  );
  if (!source) throw new Error("A IA não completou a pesquisa e a Big Idea.");

  const research = MarketingCampaignResearchSchema.safeParse(source.research);
  const creativeStrategy = MarketingCampaignCreativeStrategySchema.safeParse(
    source.creativeStrategy,
  );
  if (!research.success || !creativeStrategy.success) {
    throw new Error("A IA devolveu a pesquisa ou a Big Idea em formato inválido.");
  }

  return {
    ...plan,
    research: research.data,
    creativeStrategy: {
      ...creativeStrategy.data,
      carouselSlides:
        creativeStrategy.data.carouselSlides ?? plan.creativeStrategy?.carouselSlides,
    },
  };
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
