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
    expect(built.promptVersion).toBe("1");
    expect(built.prompt).toContain("Confeiteiras iniciantes");
    expect(built.prompt).toContain("R$ 300");
    expect(built.prompt).toContain("Não prometa renda.");
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
    expect(built.prompt).toContain("ESTRATÉGIA APROVADA E IMUTÁVEL");
    expect(built.prompt).toContain("nunca conteúdo a copiar");
    expect(built.prompt).toContain(plan.audienceSummary);
    expect(built.prompt).toContain(plan.offer);
  });

  it("parses a creative bundle without requiring raw JSON UI", () => {
    const result = parseCreativeBundle(
      `Texto antes\n${JSON.stringify({
        variants: [
          {
            channel: "instagram",
            format: "carrossel",
            headline: "Pare de chutar o preço",
            body: "Some custos, tempo e margem.",
            cta: "Salve para calcular depois.",
          },
        ],
        reuseMap: ["Levar a headline para Stories"],
      })}\nTexto depois`,
    );
    expect(result?.variants).toHaveLength(1);
    expect(result?.reuseMap).toEqual(["Levar a headline para Stories"]);
  });
});
