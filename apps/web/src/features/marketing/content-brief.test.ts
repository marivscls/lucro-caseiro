import { describe, expect, it } from "vitest";

import {
  contentBriefFromData,
  emptyContentBrief,
  mergeContentBriefData,
  scoreContentBrief,
} from "./content-brief";

describe("content brief", () => {
  it("migrates legacy content keys and preserves unrelated fields", () => {
    const data = {
      audience: "Confeiteiras iniciantes",
      goal: "Gerar salvamentos",
      format: "Carrossel",
      week: 2,
    };
    const brief = contentBriefFromData(data);

    expect(brief.persona).toBe("Confeiteiras iniciantes");
    expect(brief.contentObjective).toBe("Gerar salvamentos");
    expect(brief.desiredFormats).toEqual(["Carrossel"]);
    expect(mergeContentBriefData(data, brief)).toEqual({
      week: 2,
      persona: "Confeiteiras iniciantes",
      contentObjective: "Gerar salvamentos",
      desiredFormats: ["Carrossel"],
    });
  });

  it("derives the strategic score from the current briefing", () => {
    const emptyScore = scoreContentBrief(emptyContentBrief());
    const complete = {
      theme: "Definido",
      category: "Definido",
      persona: "Definido",
      contentObjective: "Definido",
      personaStage: "Definido",
      mainPain: "Definido",
      mainDesire: "Definido",
      transformation: "Definido",
      hook: "Definido",
      primaryEmotion: "Definido",
      mentalTriggers: ["Definido"],
      objections: ["Definido"],
      mainMessage: "Definido",
      cta: "Definido",
      keywords: ["Definido"],
      toneOfVoice: "Definido",
      restrictions: ["Definido"],
      proofs: ["Definido"],
      desiredFormats: ["Definido"],
    };
    const completeScore = scoreContentBrief(complete);

    expect(emptyScore.overall).toBe(0);
    expect(emptyScore.criteria).toHaveLength(7);
    expect(
      emptyScore.criteria.every((criterion) => criterion.suggestion.length > 0),
    ).toBe(true);
    expect(completeScore.overall).toBe(100);
  });

  it("normalizes the AI strategic analysis before displaying or saving it", () => {
    const brief = contentBriefFromData({
      persona: "Confeiteiras iniciantes",
      analysis: {
        bestFormat: "Carrossel",
        bestFormatReason: "Ensina o processo em etapas salváveis.",
        actualObjective: "Educação",
        viralPotential: 120,
        viralClassification: "Alto",
        viralReason: "A dor é reconhecível e compartilhável.",
        conversionPotential: "76",
        sharingPotential: 68.4,
        savingPotential: -5,
        hookStrength: 82,
        personaClarity: 91,
        objectiveClarity: 88,
        emotionalAppeal: 74,
        messageClarity: 84,
        engagementPotential: 79,
        overallScore: 80,
        diagnosis: {
          strengths: ["Dor específica"],
          weaknesses: ["CTA genérico"],
          missing: ["Objeção de tempo"],
          excellent: ["Transformação clara"],
        },
        suggestions: {
          cta: "Peça para salvar o conteúdo.",
          hook: "Abra com a perda causada pelo preço no chute.",
          persona: "Especifique o estágio do negócio.",
          format: "Use passos curtos em cada slide.",
          conversion: "Leve para a calculadora.",
        },
        naturalTriggers: ["Identificação"],
        suggestedTriggers: ["Contraste"],
        unansweredObjection: "Falta responder se o cálculo demora.",
        storytellingOpportunity: "Mostrar a primeira venda com lucro.",
        socialProofOpportunity: "Usar relato real autorizado.",
        numbersOpportunity: "Usar somente dados observados.",
        executiveSummary: "A estratégia está forte, mas o CTA deve ser específico.",
      },
    });

    expect(brief.analysis).toMatchObject({
      bestFormat: "Carrossel",
      viralPotential: 100,
      conversionPotential: 76,
      sharingPotential: 68,
      savingPotential: 0,
      objectiveClarity: 88,
      messageClarity: 84,
      engagementPotential: 79,
      overallScore: 80,
      diagnosis: {
        strengths: ["Dor específica"],
        weaknesses: ["CTA genérico"],
        missing: ["Objeção de tempo"],
        excellent: ["Transformação clara"],
      },
      improvements: {
        cta: "Peça para salvar o conteúdo.",
        hook: "Abra com a perda causada pelo preço no chute.",
        persona: "Especifique o estágio do negócio.",
      },
    });
    expect(mergeContentBriefData({}, brief).analysis).toEqual(brief.analysis);
  });
});
