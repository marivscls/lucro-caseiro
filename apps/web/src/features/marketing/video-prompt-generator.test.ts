import { describe, expect, it } from "vitest";

import {
  adaptProjectDuration,
  createInfluencerReferenceKit,
  createMovementPlan,
  createEmptyVideoPromptProject,
  createEmptyCharacterProfile,
  updateFormat,
  validateVideoPromptProject,
} from "./video-prompt-generator";

describe("video prompt project", () => {
  it("começa em 9:16 e 50 segundos sem exigir campanha", () => {
    const project = createEmptyVideoPromptProject();
    expect(project).toMatchObject({ aspectRatio: "9:16", duration: 50 });
    expect("campaignId" in project).toBe(false);
  });

  it("adapta a linha do tempo ao mudar a duração", () => {
    const adapted = adaptProjectDuration(createEmptyVideoPromptProject(), 30);
    expect(adapted.scenes.at(-1)?.endTime).toBe(30);
    expect(
      adapted.scenes.every((scene) =>
        scene.movementPlan.actions.every(
          (movement) => movement.endTime <= scene.endTime - scene.startTime,
        ),
      ),
    ).toBe(true);
    expect(validateVideoPromptProject(adapted)).toEqual([]);
  });

  it("mantém proporção e formato sincronizados", () => {
    expect(updateFormat(createEmptyVideoPromptProject(), "horizontal").aspectRatio).toBe(
      "16:9",
    );
  });

  it("cria preset editável com uma ação dominante e intervalos observáveis", () => {
    const plan = createMovementPlan("phone-demo", 6);
    expect(plan.actions.filter((movement) => movement.primary)).toHaveLength(1);
    expect(plan.actions.every((movement) => movement.endTime <= 6)).toBe(true);
    expect(plan.movementPrompt).toContain("segundos");
    expect(plan.negativePrompt).toContain("troca involuntária de mão");
  });

  it("cria o kit completo de referência para uma influenciadora consistente", () => {
    const character = createEmptyCharacterProfile();
    character.internalName = "Lia";
    character.immutableTraits.hair = "cacheado castanho-escuro";
    const kit = createInfluencerReferenceKit(character, {
      scene: "Lia organiza encomendas em uma cozinha de produção",
      selectedFrame: 2,
    });

    expect(kit.map((step) => step.id)).toEqual([
      "base",
      "face-board",
      "body-board",
      "scene-board",
      "extract",
      "animate",
    ]);
    expect(kit.find((step) => step.id === "face-board")?.prompt).toContain(
      "3×3 com nove retratos",
    );
    expect(kit.find((step) => step.id === "body-board")?.prompt).toContain(
      "seis vistas da mesma personagem",
    );
    expect(kit.find((step) => step.id === "scene-board")?.prompt).toContain(
      "exatamente três fotografias verticais",
    );
    expect(kit.find((step) => step.id === "extract")?.title).toBe("Extrair o quadro 2");
    expect(kit.find((step) => step.id === "animate")?.prompt).toContain(
      "uma única ação dominante",
    );
    for (const step of kit) {
      expect(step.prompt).toContain("REALISMO FOTOGRÁFICO OBRIGATÓRIO");
      expect(step.prompt).toContain("Pele com microtextura irregular visível");
      expect(step.prompt).toContain("Fotografia editorial documental");
      expect(step.prompt).toContain("aparência de influenciadora virtual genérica");
    }
  });

  it("impede que referência estética seja tratada como identidade autorizada", () => {
    const kit = createInfluencerReferenceKit(createEmptyCharacterProfile());
    expect(kit[0]?.prompt).toContain("não copie rosto, biometria ou identidade");
    expect(kit[0]?.prompt).not.toContain("Ilustração");
  });

  it("retira chavões que induzem acabamento brilhante e publicitário", () => {
    const character = createEmptyCharacterProfile();
    character.immutableTraits.visualPersonality =
      "influenciadora hiper-realista premium com qualidade extrema em 4K";
    const kit = createInfluencerReferenceKit(character, {
      scene: "Retrato hiper realista PREMIUM, qualidade extrema, 4k",
    });

    for (const step of kit) {
      expect(step.prompt).not.toMatch(
        /hiper-realista|hiper realista|\b4k\b|\bpremium\b|qualidade extrema/iu,
      );
    }
  });
});
