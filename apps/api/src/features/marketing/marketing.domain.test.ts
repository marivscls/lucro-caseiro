import { describe, expect, it } from "vitest";

import { initialMarketingResources } from "./marketing.seed";
import { DEFAULT_MARKETING_SYSTEM_PROMPT } from "./marketing.system-prompt";
import {
  initialMarketingDocumentDefinitions,
  loadInitialMarketingDocument,
  overlapScore,
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
});
