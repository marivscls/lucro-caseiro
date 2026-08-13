import type { VideoEditPlan } from "@lucro-caseiro/contracts";
import { describe, expect, it } from "vitest";

import type { EditorialAsset } from "./openai-video-editor";
import { videoEditorInternals } from "./video-editor.processor";

const assetId = "1aa3e4bc-2587-483c-80c8-7b4522120832";
const asset: EditorialAsset = {
  id: assetId,
  name: "gravacao.mp4",
  durationMs: 5_000,
  width: 1080,
  height: 1920,
  transcript: [
    { text: "Preço", startMs: 100, endMs: 450, confidence: 0.98 },
    { text: "não", startMs: 500, endMs: 700, confidence: 0.99 },
    { text: "é", startMs: 730, endMs: 800, confidence: 0.99 },
    { text: "chute", startMs: 840, endMs: 1_200, confidence: 0.97 },
  ],
};

const plan: VideoEditPlan = {
  editorialSummary: "Abrir com uma afirmação forte e concluir sem pausas mortas.",
  hook: "Preço não é chute",
  estimatedDurationMs: 1_000,
  aspectRatio: "9:16",
  pacing: "direto",
  segments: [
    {
      assetId,
      sourceStartMs: 180,
      sourceEndMs: 1_050,
      narrativeRole: "gancho",
      reason: "abre com a promessa principal",
      transition: "cut",
    },
  ],
  captions: [],
  grade: "warm",
  audioTreatment: "normalização de voz",
  overlayInstructions: [],
  warnings: [],
};

describe("video editor deterministic guardrails", () => {
  it("ajusta cortes aos limites das palavras e recalcula a duração", () => {
    const snapped = videoEditorInternals.validateAndSnapPlan(plan, [asset]);

    expect(snapped.segments[0]).toMatchObject({ sourceStartMs: 50, sourceEndMs: 1_280 });
    expect(snapped.estimatedDurationMs).toBe(1_230);
  });

  it("reconstrói legendas no tempo do vídeo editado", () => {
    const snapped = videoEditorInternals.validateAndSnapPlan(plan, [asset]);
    const captions = videoEditorInternals.buildCaptions(snapped, [asset]);
    const srt = videoEditorInternals.captionsToSrt(captions);

    expect(captions).toHaveLength(4);
    expect(captions[0]?.startMs).toBe(50);
    expect(srt).toContain("00:00:00,050 --> 00:00:01,150");
    expect(srt).toContain("PREÇO NÃO É CHUTE");
  });

  it("gera dimensões pares para todos os formatos suportados", () => {
    expect(videoEditorInternals.outputDimensions("9:16", "final")).toEqual({
      width: 1080,
      height: 1920,
    });
    expect(videoEditorInternals.outputDimensions("4:5", "preview")).toEqual({
      width: 600,
      height: 750,
    });
  });
});
