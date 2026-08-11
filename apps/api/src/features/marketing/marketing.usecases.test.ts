import { describe, expect, it, vi } from "vitest";

import { MarketingCampaignPlanSchema } from "@lucro-caseiro/contracts";

import { carouselExecutionContract } from "./campaign-ai";
import type { MarketingRepoPg } from "./marketing.repo.pg";
import { MarketingUseCases } from "./marketing.usecases";

describe("marketing use cases", () => {
  it("repairs an automatic content suggestion that repeats the current post", async () => {
    const current = {
      title: "Consulte o histórico antes de registrar uma nova venda",
      summary: "Atendimentos parecidos podem exigir registros diferentes.",
      status: "draft",
      scheduledFor: null,
      data: {
        format: "Carrossel",
        slides: [
          {
            headline: "Atendimentos parecidos não são necessariamente iguais",
            text: "Consulte o histórico antes de registrar o próximo.",
            visualOrientation: "Pessoa analisando dois registros.",
          },
        ],
        analysis: { overallScore: 70 },
      },
    };
    const repeated = JSON.stringify({
      ...current,
      data: { ...current.data, analysis: { overallScore: 92 } },
    });
    const alternative = JSON.stringify({
      ...current,
      title: "Antes de cadastrar, descubra se o atendimento já existe",
      summary: "Um carrossel sobre como evitar duplicidades sem perder contexto.",
      data: {
        ...current.data,
        slides: [
          {
            headline: "Dois pedidos parecidos podem esconder diferenças",
            text: "Compare cliente, data e serviço antes de criar outro registro.",
            visualOrientation: "Histórico em destaque sobre fundo tipográfico.",
          },
        ],
        analysis: { overallScore: 88 },
      },
    });
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: repeated, model: "test-model" })
      .mockResolvedValueOnce({ text: alternative, model: "test-model" });
    const repo = {
      activeInstruction: vi.fn().mockResolvedValue(null),
      listKnowledge: vi.fn().mockResolvedValue([]),
      listExamples: vi.fn().mockResolvedValue([]),
      listResources: vi.fn().mockResolvedValue([]),
    } as unknown as MarketingRepoPg;

    const result = await new MarketingUseCases(repo, generate).draftResource("user-id", {
      kind: "content",
      intent: "generate",
      prompt: "Sugira automaticamente uma nova versão deste post.",
      current,
    });

    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[0]?.[0].prompt).toContain(
      "CAMPOS ATUAIS servem como contexto e não como resposta a copiar",
    );
    expect(generate.mock.calls[1]?.[0].prompt).toContain(
      "A resposta repetiu quase todos os CAMPOS ATUAIS",
    );
    expect(result.title).toBe("Antes de cadastrar, descubra se o atendimento já existe");
  });

  it("repairs a parsed carousel bundle that violates the execution contract", async () => {
    const plan = MarketingCampaignPlanSchema.parse({
      name: "Movimentos separados",
      creativeStrategy: { format: "carrossel", carouselSlides: 3 },
      channels: ["instagram"],
      messages: {},
      creativeNeeds: [],
      kpis: [],
    });
    const invalidBundle = JSON.stringify({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Organize cada movimento… >>>",
          productionNotes: "Execute todas as 3 gerações nesta solicitação.",
          cta: "Organize agora.",
        },
      ],
    });
    const repairedBundle = JSON.stringify({
      variants: [
        {
          channel: "instagram",
          format: "carrossel",
          headline: "Venda entrou hoje",
          body: "[APOIO] <<< Organize cada movimento separadamente. >>>",
          slidePrompts: [
            "SLIDE 1\nFAMÍLIA DE LAYOUT: foto-dominante\nCrie a arte final do slide 1.",
            "SLIDE 2\nFAMÍLIA DE LAYOUT: campo-tipografico\nCrie a arte final do slide 2.",
            "SLIDE 3\nFAMÍLIA DE LAYOUT: encerramento-editorial\nCrie a arte final do slide 3.",
          ],
          productionNotes: carouselExecutionContract(3),
          cta: "Organize agora.",
        },
      ],
    });
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: invalidBundle, model: "test-model" })
      .mockResolvedValueOnce({ text: repairedBundle, model: "test-model" });
    const repo = {
      activeInstruction: vi.fn().mockResolvedValue(null),
      listKnowledge: vi.fn().mockResolvedValue([]),
      listExamples: vi.fn().mockResolvedValue([]),
      listResources: vi.fn().mockResolvedValue([]),
      createSession: vi.fn().mockResolvedValue({ id: "session-id" }),
      addMessage: vi.fn().mockResolvedValue({ id: "message-id" }),
    } as unknown as MarketingRepoPg;

    const result = await new MarketingUseCases(repo, generate).generateCampaignCopies(
      "user-id",
      { plan, style: "promotional" },
    );

    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1]?.[0].prompt).toContain(
      "productionNotes não contém somente o contrato literal",
    );
    expect(
      result.bundle?.variants[0]?.productionNotes.startsWith(
        carouselExecutionContract(3),
      ),
    ).toBe(true);
    expect(result.telemetry.parseSucceeded).toBe(true);
  });
});
