import { describe, expect, it } from "vitest";

import type { MarketingCampaignPlan } from "@/shared/types";

import {
  campaignAiBriefingFields,
  campaignDestinations,
  campaignNeedsStrategyEnrichment,
  campaignStrategyEnrichmentPrompt,
  DEFAULT_CAROUSEL_SLIDES,
  mergeCampaignStrategyEnrichment,
  normalizeCarouselSlides,
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
  it("restaura os destinos já publicados ao recarregar a campanha", () => {
    expect(
      campaignDestinations({
        0: {
          destination: "content",
          targetId: "content-id",
          publishedAt: "2026-08-10T13:00:00.000Z",
        },
        1: {
          destination: "document",
          targetId: "document-id",
          publishedAt: "2026-08-10T13:01:00.000Z",
        },
        invalid: { destination: "outside" },
        x: {
          destination: "content",
          targetId: "invalid-index",
          publishedAt: "2026-08-10T13:02:00.000Z",
        },
      }),
    ).toEqual({ 0: "content", 1: "document" });
  });

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

  it("uses five carousel slides by default and preserves an explicit choice", () => {
    expect(normalizeCarouselSlides(undefined)).toBe(DEFAULT_CAROUSEL_SLIDES);
    expect(normalizeCarouselSlides(4)).toBe(4);
    expect(normalizeCarouselSlides(2)).toBe(DEFAULT_CAROUSEL_SLIDES);
    expect(normalizeCarouselSlides(11)).toBe(DEFAULT_CAROUSEL_SLIDES);
  });

  it("keeps the approved first slide as the anchor for every later carousel slide", () => {
    const prompt = campaignStrategyEnrichmentPrompt(7);

    expect(prompt).toContain("slide 1 seja gerado uma única vez");
    expect(prompt).toContain("marcador 1/7");
    expect(prompt).toContain("somente os slides 2..7");
    expect(prompt).toContain("2/7 até 7/7");
    expect(prompt).toContain("sem reiniciar a direção de arte");
    expect(prompt).toContain("alterne famílias de composição");
    expect(prompt).toContain(
      "foto de um lado e texto do outro pode aparecer no máximo uma vez",
    );
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
        carouselSlides: 4,
        visualHook: "Pedido pronto com custos surgindo na tela",
        landing: "Seu faturamento ainda não é o seu lucro",
        retentionBeats: ["Revelar custo esquecido"],
        productionNotes: ["Usar tela real"],
      },
    });

    expect(enriched.research?.problemMechanism).toContain("Custos invisíveis");
    expect(enriched.creativeStrategy?.bigIdea).toContain("valor da venda");
    expect(enriched.creativeStrategy?.carouselSlides).toBe(4);
    expect(campaignNeedsStrategyEnrichment(enriched)).toBe(false);
  });
});
