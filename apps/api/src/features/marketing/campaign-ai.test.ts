import { describe, expect, it } from "vitest";

import {
  buildAdCopywriterPrompt,
  buildCampaignStrategistPrompt,
  extractJsonObject,
  parseCampaignPlan,
  parseCreativeBundle,
} from "./campaign-ai";

const plan = {
  name: "Preço sem chute",
  segment: "pme" as const,
  goal: "leads" as const,
  audienceSummary: "Confeiteiras que vendem por encomenda",
  offer: "Calculadora para formar preço com custos e margem",
  research: {
    audienceSlice: "Confeiteiras que vendem bolos por encomenda pelo WhatsApp",
    audienceLanguage: ["Não sei quanto realmente sobra"],
    realDesire: "Cobrar com segurança sem perder clientes",
    saturatedSolutions: ["Multiplique o custo por três"],
    problemMechanism: "Custos indiretos e tempo ficam fora da conta",
    solutionMechanism: "O cálculo reúne custos, margem e continuidade da venda",
    differentiators: ["O cálculo vira produto e catálogo sem recadastro"],
    proofs: ["Fluxo publicado do produto"],
    saturationNotes: "Evitar promessas genéricas de gestão completa",
  },
  creativeStrategy: {
    bigIdea: "O pedido parece lucro até a conta completa aparecer",
    angle: "Custo invisível",
    promise: "Enxergar quanto sobra e reaproveitar o cálculo",
    reasonToBelieve: "Demonstração do fluxo real",
    stickyName: "Preço sem chute",
    commonEnemy: "Conta incompleta",
    organicInsight: "Vídeos de bastidor de encomendas prendem esse público",
    avatar: "Confeiteira preparando um pedido real",
    format: "Vídeo curto de bastidor",
    visualHook: "Pedido pronto e custos aparecendo na tela",
    landing: "O valor da venda não é o valor que fica para você",
    retentionBeats: ["Revelar custo esquecido", "Mostrar o catálogo pronto"],
    productionNotes: ["Usar tela real", "Não inventar resultado"],
  },
  channels: ["instagram", "whatsapp"],
  messages: { instagram: "Calcule antes de vender", whatsapp: "Revise seu preço" },
  creativeNeeds: ["Carrossel educativo"],
  automation: "Levar para a calculadora",
  kpis: [{ label: "Cliques", target: "100" }],
  nextBestAction: "Publicar o carrossel",
};

describe("campaign AI", () => {
  it("extracts balanced JSON from fences and surrounding text", () => {
    const text =
      'Resposta:\n```json\n{"name":"Plano {seguro}","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}\n```\nFim';
    expect(extractJsonObject(text)).toBe(
      '{"name":"Plano {seguro}","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}',
    );
    expect(parseCampaignPlan(text)?.name).toBe("Plano {seguro}");
  });

  it("builds the strategist from briefing and canonical context", () => {
    const built = buildCampaignStrategistPrompt(
      {
        segment: "pme",
        goal: "leads",
        audience: "Confeiteiras iniciantes",
        offer: "Calculadora de preço",
        budget: 300,
      },
      {
        instruction: "Não prometa renda.",
        knowledge: [{ title: "Mensagens", body: "Fale com clareza." }],
        resources: [],
      },
    );
    expect(built.promptId).toBe("campaign-strategist");
    expect(built.promptVersion).toBe("4");
    expect(built.prompt).toContain("Confeiteiras iniciantes");
    expect(built.prompt).toContain("R$ 300");
    expect(built.prompt).toContain("Não prometa renda.");
    expect(built.prompt).toContain("Big Idea");
    expect(built.prompt).toContain("saturatedSolutions");
    expect(built.prompt).toContain("não é exclusivo de confeiteiras");
    expect(built.prompt).toContain("público desta campanha");
  });

  it("uses canonical context when audience and offer are blank", () => {
    const built = buildCampaignStrategistPrompt(
      { segment: "pme", goal: "leads", audience: "", offer: "" },
      { instruction: "Priorize o produto atual.", knowledge: [], resources: [] },
    );

    expect(built.prompt).toContain(
      "Público: não informado; derive do contexto confirmado",
    );
    expect(built.prompt).toContain(
      "Oferta: não informada; derive do contexto confirmado",
    );
    expect(built.prompt).toContain("não invente dados para esconder lacunas");
    expect(built.prompt).toContain("não eleja confeitaria");
  });

  it("locks approved strategy and forbids copying organic references", () => {
    const built = buildAdCopywriterPrompt(
      { plan, style: "organic" },
      {
        name: "Lucro Caseiro",
        voice: "Direta e acolhedora",
        valueProposition: "Preço calculado com segurança",
        restrictions: ["Não prometer renda"],
        approvedExamples: ["Exemplo aprovado"],
      },
    );
    expect(built.promptId).toBe("ad-copywriter");
    expect(built.promptVersion).toBe("2");
    expect(built.prompt).toContain("ESTRATÉGIA APROVADA E IMUTÁVEL");
    expect(built.prompt).toContain("nunca conteúdo a copiar");
    expect(built.prompt).toContain(plan.audienceSummary);
    expect(built.prompt).toContain(plan.offer);
    expect(built.prompt).toContain(plan.creativeStrategy.bigIdea);
    expect(built.prompt).toContain("qualityReview");
  });

  it("parses a creative bundle without requiring raw JSON UI", () => {
    const result = parseCreativeBundle(
      `Texto antes\n${JSON.stringify({
        variants: [
          {
            channel: "instagram",
            format: "carrossel",
            headline: "Pare de chutar o preço",
            hook: "Você sabe quanto sobra desta encomenda?",
            landing: "O preço parece certo até os custos invisíveis entrarem.",
            body: "Some custos, tempo e margem.",
            retentionBeats: ["Mostrar um custo esquecido"],
            productionNotes: "Usar uma encomenda e a tela real do produto.",
            evidence: "Demonstração do fluxo publicado.",
            cta: "Salve para calcular depois.",
          },
        ],
        reuseMap: ["Levar a headline para Stories"],
        qualityReview: {
          ready: true,
          score: 91,
          criteria: {
            congruence: 95,
            specificity: 90,
            novelty: 86,
            evidenceSafety: 96,
            concision: 88,
          },
          strengths: ["Demonstração específica"],
          warnings: [],
          nextTest: "Comparar bastidor com demonstração direta.",
        },
      })}\nTexto depois`,
    );
    expect(result?.variants).toHaveLength(1);
    expect(result?.reuseMap).toEqual(["Levar a headline para Stories"]);
    expect(result?.variants[0]?.landing).toContain("custos invisíveis");
    expect(result?.qualityReview.ready).toBe(true);
    expect(result?.qualityReview.criteria.evidenceSafety).toBe(96);
  });

  it("keeps legacy plans and creative bundles compatible through defaults", () => {
    const legacyPlan = parseCampaignPlan(
      '{"name":"Plano antigo","channels":[],"messages":{},"creativeNeeds":[],"kpis":[]}',
    );
    expect(legacyPlan?.research.audienceLanguage).toEqual([]);
    expect(legacyPlan?.creativeStrategy.bigIdea).toBe("");

    const legacyBundle = parseCreativeBundle(
      '{"variants":[{"channel":"instagram","format":"post","headline":"Teste","body":"Corpo","cta":"Saiba mais"}],"reuseMap":[]}',
    );
    expect(legacyBundle?.variants[0]?.retentionBeats).toEqual([]);
    expect(legacyBundle?.qualityReview.ready).toBe(false);
  });
});
