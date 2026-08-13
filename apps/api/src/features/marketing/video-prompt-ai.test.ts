import { describe, expect, it } from "vitest";

import {
  parseVideoPromptOutput,
  videoPromptQualityWarnings,
  videoPromptSimilarityWarnings,
} from "./video-prompt-ai";
import { completeVideoPromptProject } from "./video-prompt.test-fixtures";

describe("video prompt domain", () => {
  it("bloqueia promessa inventada e interface real sem evidência", () => {
    const project = completeVideoPromptProject({
      visualMode: "hybrid-character-interface",
      creativeBrief: {
        ...completeVideoPromptProject().creativeBrief,
        productEvidenceIds: [],
      },
      scenes: completeVideoPromptProject().scenes.map((scene, index) => ({
        ...scene,
        narration: index === 0 ? "Lucro garantido em 100% dos casos" : scene.narration,
      })),
    });
    expect(videoPromptQualityWarnings(project).map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["unsupported-promise", "missing-interface-evidence"]),
    );
  });

  it("compara estrutura visual e narrativa, não apenas texto idêntico", () => {
    const project = completeVideoPromptProject();
    const warnings = videoPromptSimilarityWarnings(project, [
      {
        projectId: "22222222-2222-4222-8222-222222222222",
        title: "Outro título",
        format: project.format,
        objective: project.objective,
        visualMode: project.visualMode,
        featureId: project.featureId,
        cta: project.cta,
        configuration: {},
        generationContext: {
          fingerprint: {
            hook: "Você ainda calcula o preço no chute?",
            theme: "Precificação guiada para confeiteiras",
            setting: "cozinha de produção acolhedora",
            character: `${project.characterProfileId ?? ""} ${project.visualMode}`,
            openingShot: "plano médio frontal",
            action: "confeiteira confere caderno e celular",
            structure: "gancho contexto demonstração benefício encerramento",
            cta: project.cta,
            metaphor: project.angle,
            objects: "caderno calculadora celular bolo",
          },
        },
      },
    ]);
    expect(warnings[0]?.matchingDimensions).toContain("estrutura narrativa");
    expect(warnings[0]?.matchingDimensions).toContain("CTA");
  });

  it("rejeita resposta parcial da IA", () => {
    expect(parseVideoPromptOutput('{"masterPrompt":"curto"}')).toBeNull();
  });

  it("bloqueia duas ações principais sobrepostas na mesma cena", () => {
    const base = completeVideoPromptProject();
    const first = base.scenes[0]!;
    const project = completeVideoPromptProject({
      scenes: [
        {
          ...first,
          movementPlan: {
            ...first.movementPlan,
            actions: [
              movementAction("character", 0, 3),
              movementAction("object", 1, 3.5),
            ],
          },
        },
        ...base.scenes.slice(1),
      ],
    });
    expect(videoPromptQualityWarnings(project).map((warning) => warning.code)).toContain(
      "overlapping-primary-movements",
    );
  });

  it("bloqueia troca de mão sem ação de continuidade", () => {
    const base = completeVideoPromptProject();
    const scenes = base.scenes.map((scene) => ({ ...scene }));
    scenes[0] = {
      ...scenes[0]!,
      movementPlan: {
        ...scenes[0]!.movementPlan,
        continuity: {
          ...scenes[0]!.movementPlan.continuity,
          heldObjectsEnd: [{ object: "celular", hand: "right", orientation: "vertical" }],
        },
      },
    };
    scenes[1] = {
      ...scenes[1]!,
      movementPlan: {
        ...scenes[1]!.movementPlan,
        continuity: {
          ...scenes[1]!.movementPlan.continuity,
          heldObjectsStart: [
            { object: "celular", hand: "left", orientation: "vertical" },
          ],
        },
      },
    };
    expect(
      videoPromptQualityWarnings(completeVideoPromptProject({ scenes })).map(
        (warning) => warning.code,
      ),
    ).toContain("unexplained-object-hand-change");
  });
});

function movementAction(
  category: "character" | "object",
  startTime: number,
  endTime: number,
) {
  return {
    category,
    type: "ação principal",
    startTime,
    endTime,
    instruction: "Executa uma ação principal clara e fisicamente plausível.",
    initialPosition: "junto à bancada",
    action: "move o objeto",
    direction: "para frente",
    speed: "natural" as const,
    customSpeed: "",
    amplitude: "pequena",
    finalPosition: "voltada para a câmera",
    involvedSubject: "objeto",
    intensity: "subtle-natural" as const,
    customIntensity: "",
    continuity: "mantém a posição",
    hand: "right" as const,
    handsInitialPosition: "junto ao corpo",
    touchedObject: "objeto",
    gesture: "",
    distance: "",
    stability: "estável",
    startPoint: "",
    endPoint: "",
    trackedObject: "",
    primary: true,
  };
}
