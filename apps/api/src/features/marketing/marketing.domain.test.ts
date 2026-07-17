import { describe, expect, it } from "vitest";

import { initialMarketingResources } from "./marketing.seed";
import {
  DEFAULT_MARKETING_SYSTEM_PROMPT,
  IDEA_BANK_SYSTEM_PROMPT,
  REFINE_STRATEGY_SYSTEM_PROMPT,
} from "./marketing.system-prompt";
import {
  initialMarketingDocumentDefinitions,
  loadInitialMarketingDocument,
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
