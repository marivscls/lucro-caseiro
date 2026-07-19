import { describe, expect, it } from "vitest";

import type { MarketingCampaignPlan } from "@/shared/types";

import {
  campaignAiBriefingFields,
  campaignNeedsStrategyEnrichment,
  mergeCampaignStrategyEnrichment,
} from "./campaign-strategy";

const oldPlan: MarketingCampaignPlan = {
  name: "Campanha atual",
  audienceSummary: "Pequenos negócios",
  offer: "Lucro Caseiro",
  channels: ["instagram"],
  messages: { instagram: "Organize seus preços" },
  creativeNeeds: ["Vídeo curto"],
  kpis: [{ label: "Cliques", target: "100" }],
};

describe("campaign strategy enrichment", () => {
  it("keeps empty optional fields compatible with the published campaign API", () => {
    const fields = campaignAiBriefingFields("", "");

    expect(fields.audience.length).toBeGreaterThanOrEqual(2);
    expect(fields.audience).toContain("público desta campanha");
    expect(fields.audience).toContain("mercado total");
    expect(fields.offer.length).toBeGreaterThanOrEqual(2);
  });

  it("preserves an explicit campaign audience and offer", () => {
    expect(campaignAiBriefingFields("  Papeleiras  ", "  Plano Essencial  ")).toEqual({
      audience: "Papeleiras",
      offer: "Plano Essencial",
    });
  });

  it("detects plans returned by the legacy campaign API", () => {
    expect(campaignNeedsStrategyEnrichment(oldPlan)).toBe(true);
  });

  it("merges the strategic research and creative direction", () => {
    const enriched = mergeCampaignStrategyEnrichment(oldPlan, {
      research: {
        audienceSlice: "Confeiteiras que vendem por encomenda",
        audienceLanguage: ["Não sei quanto realmente sobra"],
        realDesire: "Cobrar com segurança",
        saturatedSolutions: ["Multiplicar o custo por três"],
        problemMechanism: "Custos invisíveis ficam fora da conta",
        solutionMechanism: "Cálculo completo de custos e margem",
        differentiators: ["Catálogo ligado à precificação"],
        proofs: [],
        saturationNotes: "Evitar promessas de renda",
      },
      creativeStrategy: {
        bigIdea: "O valor da venda não é o valor que sobra",
        angle: "Custos invisíveis",
        promise: "Enxergar a margem antes de vender",
        reasonToBelieve: "Demonstração do cálculo real",
        stickyName: "Preço sem chute",
        commonEnemy: "Conta incompleta",
        organicInsight: "Bastidores de encomendas",
        avatar: "Confeiteira preparando um pedido",
        format: "Vídeo curto",
        visualHook: "Pedido pronto com custos surgindo na tela",
        landing: "Seu faturamento ainda não é o seu lucro",
        retentionBeats: ["Revelar custo esquecido"],
        productionNotes: ["Usar tela real"],
      },
    });

    expect(enriched.research?.problemMechanism).toContain("Custos invisíveis");
    expect(enriched.creativeStrategy?.bigIdea).toContain("valor da venda");
    expect(campaignNeedsStrategyEnrichment(enriched)).toBe(false);
  });
});
