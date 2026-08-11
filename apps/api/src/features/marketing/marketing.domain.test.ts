import { describe, expect, it } from "vitest";

import { MarketingCampaignBriefInputSchema } from "@lucro-caseiro/contracts";

import { initialMarketingResources } from "./marketing.seed";
import {
  DEFAULT_MARKETING_SYSTEM_PROMPT,
  IDEA_BANK_SYSTEM_PROMPT,
  REFINE_STRATEGY_SYSTEM_PROMPT,
  VISUAL_ART_DIRECTION_GUARDRAIL,
} from "./marketing.system-prompt";
import {
  initialMarketingDocumentDefinitions,
  loadInitialMarketingDocument,
  marketingSystemPrompt,
  overlapScore,
  parseMarketingContentIdeas,
  parseMarketingResourceDraft,
} from "./marketing.usecases";

describe("marketing intelligence", () => {
  it("ships a complete four-week editorial starting base", () => {
    const content = initialMarketingResources.filter((item) => item.kind === "content");
    expect(content).toHaveLength(28);
    expect(new Set(content.map((item) => item.slug)).size).toBe(28);
    expect(new Set(content.map((item) => item.data.week))).toEqual(new Set([1, 2, 3, 4]));
  });

  it("keeps the brand market broader than each campaign segment", () => {
    const market = initialMarketingResources.find(
      (item) => item.kind === "audience" && item.slug === "mercado-lucro-caseiro",
    );
    expect(market?.title).toBe("Mercado amplo do Lucro Caseiro");
    expect(market?.data.scope).toBe("brand-market");
    expect(market?.data.rule).toContain("não limitam o mercado da marca");
  });

  it("accepts an explicit carousel size within the editorial limit", () => {
    const input = MarketingCampaignBriefInputSchema.parse({
      goal: "leads",
      carouselSlides: 4,
    });

    expect(input.carouselSlides).toBe(4);
    expect(() =>
      MarketingCampaignBriefInputSchema.parse({ goal: "leads", carouselSlides: 2 }),
    ).toThrow();
    expect(() =>
      MarketingCampaignBriefInputSchema.parse({ goal: "leads", carouselSlides: 11 }),
    ).toThrow();
  });

  it("covers the product portfolio beyond pricing campaigns", () => {
    const features = initialMarketingResources.filter((item) => item.kind === "feature");
    const slugs = new Set(features.map((item) => item.slug));

    expect(features.length).toBeGreaterThanOrEqual(11);
    expect([...slugs]).toEqual(
      expect.arrayContaining([
        "precificacao",
        "servicos-e-agenda",
        "clientes-e-historico",
        "produtos-e-receitas",
        "catalogo",
        "vendas-e-pedidos",
        "financeiro",
        "estoque-e-compras",
        "alertas-e-lembretes",
        "offline-e-sincronizacao",
        "relatorios-e-exportacoes",
      ]),
    );
  });

  it("keeps the protected AI rules in the official instruction", () => {
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain("Não invente resultados");
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain("ações externas são protegidos");
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain(
      "Toda resposta deve gerar valor prático",
    );
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain(
      "nunca ignore uma informação fornecida",
    );
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain("potencial de compartilhamento");
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain(
      "título, resumo, ideia, texto ou transcrição",
    );
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain("potencial de salvamento");
    expect(DEFAULT_MARKETING_SYSTEM_PROMPT).toContain("não é exclusivo de confeiteiras");
    expect(marketingSystemPrompt("Instrução personalizada.")).toContain(
      "mercado amplo da marca",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain("um único foco dominante");
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Fotografia e tipografia carregam aproximadamente 90%",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "referências aprovadas validam o sistema de composição",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "rosa #B65F72 ocupa no máximo 15–20%",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "nunca repita a mesma em slides consecutivos",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "O slide 1 é a âncora visual imutável",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Não avance para o slide 2 sem vincular a imagem do slide 1",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain("`1/N`, `2/N`, `3/N`");
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain("pelo menos 40% de espaço negativo");
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "O último slide deve parecer encerramento",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "“lucro caseiro”, todo em minúsculas, numa única linha",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Nunca acrescente estrela, brilho, ponto, símbolo, ícone",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Não empilhe “lucro” sobre “caseiro”",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Quando ela não for informada, use 5 slides",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "não precisam aparecer sempre como duas metades lado a lado",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Nunca transforme “foto de um lado e texto do outro” no template padrão",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "A família divisao-vertical — foto de um lado e texto do outro — pode aparecer no máximo uma vez",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "uma palavra-chave de peso semântico — como “vende”",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Nunca desenhe linha, onda, rabisco, pincelada ou sublinhado abaixo",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain(
      "Pessoa ou personagem humana gerada por IA só é permitida na variação “Editorial com personagem IA”",
    );
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).toContain("PESSOAS GERADAS POR IA: PROIBIDAS");
    expect(VISUAL_ART_DIRECTION_GUARDRAIL).not.toContain(
      "mantenha exatamente a identidade da personagem",
    );
    expect(marketingSystemPrompt("Instrução personalizada.")).toContain(
      "Este elemento melhora claramente a narrativa ou apenas ocupa espaço?",
    );
  });

  it("replaces a persisted legacy visual prompt instead of keeping conflicting rules", () => {
    const prompt = marketingSystemPrompt(`Instrução personalizada.

## Direção de arte permanente — Visual DNA aprovado
Regra visual antiga que não pode continuar ativa.

## Limites personalizados
Preserve este limite.`);

    expect(prompt).not.toContain("Regra visual antiga");
    expect(prompt).toContain("O slide 1 é a âncora visual imutável");
    expect(prompt).toContain("## Limites personalizados\nPreserve este limite.");
    expect(prompt.match(/## Direção de arte permanente/g)).toHaveLength(1);
  });

  it("keeps refinement focused on strategy instead of final content", () => {
    expect(REFINE_STRATEGY_SYSTEM_PROMPT).toContain("NÃO escreve o conteúdo final");
    expect(REFINE_STRATEGY_SYSTEM_PROMPT).toContain("nunca avalie campos isoladamente");
    expect(REFINE_STRATEGY_SYSTEM_PROMPT).toContain("clareza do objetivo");
    expect(REFINE_STRATEGY_SYSTEM_PROMPT).toContain("oportunidades de storytelling");
    expect(REFINE_STRATEGY_SYSTEM_PROMPT).toContain("resumo executivo");
  });

  it("keeps the idea bank strategic, diverse and honest about estimates", () => {
    expect(IDEA_BANK_SYSTEM_PROMPT).toContain("motivo estratégico para existir");
    expect(IDEA_BANK_SYSTEM_PROMPT).toContain("inferências conservadoras");
    expect(IDEA_BANK_SYSTEM_PROMPT).toContain(
      "estimativas heurísticas, não previsões garantidas",
    );
    expect(IDEA_BANK_SYSTEM_PROMPT).toContain(
      "Não repita títulos, ganchos, CTAs nem emoções principais",
    );
    expect(IDEA_BANK_SYSTEM_PROMPT).toContain("briefing pronto para revisão");
  });

  it("ships distinct operational documents as canonical AI knowledge", () => {
    expect(initialMarketingDocumentDefinitions).toHaveLength(8);
    expect(
      new Set(initialMarketingDocumentDefinitions.map((document) => document.slug)).size,
    ).toBe(initialMarketingDocumentDefinitions.length);
    expect(
      initialMarketingDocumentDefinitions.filter((document) => document.aiKnowledge),
    ).toHaveLength(7);
  });

  it("loads every initial marketing document from the repository", async () => {
    const documents = await Promise.all(
      initialMarketingDocumentDefinitions.map(async (definition) => ({
        definition,
        body: await loadInitialMarketingDocument(definition.fileName),
      })),
    );
    for (const { definition, body } of documents) {
      expect(body, definition.fileName).toMatch(/^# /);
      expect(body.length, definition.fileName).toBeGreaterThan(500);
    }
  });

  it("scores evaluation output by meaningful expected terms", () => {
    expect(
      overlapScore(
        "plano com público, CTA e métrica",
        "Plano: público definido, CTA direto e métrica de ativação.",
      ),
    ).toBeGreaterThanOrEqual(75);
    expect(overlapScore("CAC retenção lucro", "Um texto genérico sem indicadores.")).toBe(
      0,
    );
  });

  it("parses an AI resource draft and normalizes unsupported statuses", () => {
    expect(
      parseMarketingResourceDraft(
        '```json\n{"title":"Parceria com confeiteiras","summary":"Abordagem colaborativa.","status":"invented","scheduledFor":null,"data":{"canal":"Instagram"}}\n```',
        "outreach",
      ),
    ).toEqual({
      title: "Parceria com confeiteiras",
      summary: "Abordagem colaborativa.",
      status: "active",
      scheduledFor: null,
      data: { canal: "Instagram" },
    });
  });

  it("parses ranked content ideas and removes repeated strategic angles", () => {
    const first = contentIdea({
      title: "Você vende muito e o dinheiro some?",
      primaryEmotion: "Alívio",
      hook: "Seu faturamento pode estar escondendo um prejuízo.",
      cta: "Calcule um produto agora.",
    });
    const repeatedEmotion = contentIdea({
      title: "Cinco custos esquecidos",
      primaryEmotion: "Alívio",
      hook: "O custo invisível que diminui sua margem.",
      cta: "Salve para revisar seus preços.",
    });
    const second = contentIdea({
      title: "Preço copiado não protege sua margem",
      primaryEmotion: "Segurança",
      hook: "O preço da concorrência não conhece os seus custos.",
      cta: "Compare com o seu cálculo.",
    });

    expect(
      parseMarketingContentIdeas(
        `\`\`\`json\n${JSON.stringify({ ideas: [first, repeatedEmotion, second] })}\n\`\`\``,
      ).ideas.map((idea) => idea.title),
    ).toEqual([first.title, second.title]);
  });
});

function contentIdea(
  overrides: Partial<{
    title: string;
    primaryEmotion: string;
    hook: string;
    cta: string;
  }> = {},
) {
  const title = overrides.title ?? "Ideia estratégica";
  const primaryEmotion = overrides.primaryEmotion ?? "Confiança";
  const hook = overrides.hook ?? "Um gancho específico";
  const cta = overrides.cta ?? "Revise seu briefing.";
  return {
    title,
    example: title,
    category: "Educativos",
    objective: "Ensinar precificação",
    persona: "Confeiteira que vende por encomenda",
    primaryEmotion,
    mainPain: "Vender sem saber se existe lucro",
    mainDesire: "Cobrar com segurança",
    bestFormat: "Carrossel",
    hook,
    cta,
    strategicPotential: 5,
    justification: "Une uma dor reconhecível a uma ação prática.",
    scores: {
      conversion: 82,
      sharing: 71,
      saving: 88,
      identification: 79,
      viral: 62,
    },
    brief: {
      theme: "Precificação",
      category: "Educativos",
      persona: "Confeiteira que vende por encomenda",
      contentObjective: "Ensinar precificação",
      personaStage: "Consciente do problema",
      mainPain: "Vender sem saber se existe lucro",
      mainDesire: "Cobrar com segurança",
      transformation: "Do preço no chute ao preço calculado",
      primaryEmotion,
      hook,
      mainMessage: "Preço sustentável considera custos, tempo e margem.",
      cta,
    },
  };
}
