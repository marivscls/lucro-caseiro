import { describe, expect, it } from "vitest";

import { initialMarketingResources } from "./marketing.seed";
import { DEFAULT_MARKETING_SYSTEM_PROMPT } from "./marketing.system-prompt";
import { overlapScore } from "./marketing.usecases";

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
});
