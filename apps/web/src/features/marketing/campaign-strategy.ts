import {
  MarketingCampaignCreativeStrategySchema,
  MarketingCampaignResearchSchema,
} from "@lucro-caseiro/contracts";

import type { MarketingCampaignPlan } from "../../shared/types";

const AUTO_CAMPAIGN_AUDIENCE =
  "Compare os segmentos confirmados e defina o melhor público desta campanha sem tratá-lo como o mercado total do Lucro Caseiro.";
const AUTO_CAMPAIGN_OFFER =
  "Defina a oferta mais relevante para esse público usando apenas o contexto confirmado da Central.";

export function campaignAiBriefingFields(audience: string, offer: string) {
  return {
    audience: audience.trim() || AUTO_CAMPAIGN_AUDIENCE,
    offer: offer.trim() || AUTO_CAMPAIGN_OFFER,
  };
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
    creativeStrategy: creativeStrategy.data,
  };
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
