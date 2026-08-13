import {
  CharacterProfileInputSchema,
  SceneMovementGenerationInputSchema,
  VideoPromptOutputSchema,
  VideoPromptProjectInputSchema,
  type CharacterProfileInput,
  type SceneMovementGenerationInput,
  type VideoPromptGenerationInput,
  type VideoPromptProjectInput,
  type VideoPromptOutput,
} from "@lucro-caseiro/contracts";

import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from "../../shared/errors";
import type { MarketingAiGenerator } from "./marketing.usecases";
import type { MarketingRepoPg } from "./marketing.repo.pg";
import {
  buildVideoPromptGenerationPrompt,
  buildVideoPromptRepairPrompt,
  buildSceneChoreographyPrompt,
  ORIGINAL_CHARACTER_BASE_PROMPT,
  parseVideoPromptOutput,
  parseSceneMovementPlan,
  PRESERVE_CHARACTER_BASE_PROMPT,
  VIDEO_PROMPT_TARGET_TOOLS,
  videoPromptFingerprint,
  videoPromptQualityWarnings,
  videoPromptSimilarityWarnings,
} from "./video-prompt-ai";
import type { VideoPromptRepoPg } from "./video-prompt.repo.pg";

export class VideoPromptUseCases {
  constructor(
    private repo: VideoPromptRepoPg,
    private marketingRepo: MarketingRepoPg,
    private generate?: MarketingAiGenerator,
  ) {}

  tools() {
    return VIDEO_PROMPT_TARGET_TOOLS;
  }

  listProjects(
    userId: string,
    filters: Parameters<VideoPromptRepoPg["listProjects"]>[1],
  ) {
    return this.repo.listProjects(userId, filters);
  }

  async getProject(userId: string, id: string) {
    const project = await this.repo.getProject(userId, id);
    if (!project) throw new NotFoundError("Projeto de prompt não encontrado");
    return project;
  }

  async createProject(userId: string, input: VideoPromptProjectInput) {
    await this.assertCharacterOwnership(userId, input.characterProfileId);
    const { project, scenes } = projectRows(input);
    return this.repo.createProject(userId, project, scenes);
  }

  async updateProject(
    userId: string,
    id: string,
    patch: Partial<VideoPromptProjectInput>,
  ) {
    const current = await this.getProject(userId, id);
    const merged = VideoPromptProjectInputSchema.parse({
      ...projectInputFromRow(current),
      ...patch,
    });
    await this.assertCharacterOwnership(userId, merged.characterProfileId);
    const { project, scenes } = projectRows(merged);
    const updated = await this.repo.updateProject(userId, id, project, scenes);
    if (!updated) throw new NotFoundError("Projeto de prompt não encontrado");
    return updated;
  }

  async generateVersion(
    userId: string,
    projectId: string,
    input: VideoPromptGenerationInput,
  ) {
    if (!this.generate)
      throw new ServiceUnavailableError(
        "Configure GOOGLE_GENERATIVE_AI_API_KEY para gerar prompts de vídeo",
      );
    const row = await this.getProject(userId, projectId);
    const project = VideoPromptProjectInputSchema.parse(projectInputFromRow(row));
    const qualityWarnings = videoPromptQualityWarnings(project);
    const blocking = qualityWarnings.filter((warning) => warning.severity === "blocking");
    if (blocking.length)
      throw new ValidationError(blocking.map((warning) => warning.message));

    const [characterRow, brandContext, recent] = await Promise.all([
      project.characterProfileId
        ? this.repo.getCharacter(userId, project.characterProfileId)
        : Promise.resolve(null),
      this.marketingRepo.listResources(userId),
      this.repo.recentGenerationContexts(userId, project.brandId),
    ]);
    const similarityWarnings = videoPromptSimilarityWarnings(project, recent, projectId);
    if (similarityWarnings.length && !input.similarityResolution)
      return {
        needsSimilarityDecision: true as const,
        similarityWarnings,
        qualityWarnings,
      };

    const targetToolId = input.targetTool ?? project.targetTool;
    const targetTool =
      VIDEO_PROMPT_TARGET_TOOLS.find((tool) => tool.id === targetToolId) ?? null;
    const character = characterRow
      ? CharacterProfileInputSchema.parse(characterRow)
      : null;
    const prompt = buildVideoPromptGenerationPrompt({
      project: { ...project, id: projectId },
      character,
      brandContext: prioritizedBrandContext(project, brandContext),
      qualityWarnings,
      similarityWarnings,
      targetTool,
      adjustment: input.similarityResolution ?? input.adjustment,
      ...(input.sceneOrder === undefined ? {} : { sceneOrder: input.sceneOrder }),
    });
    let result = await this.generate({
      system:
        "Você é diretora audiovisual e engenheira de prompts do Lucro Caseiro. Obedeça ao contrato e responda somente em JSON.",
      prompt,
    });
    let output = parseVideoPromptOutput(result.text);
    if (!output) {
      result = await this.generate({
        system: "Repare a resposta e devolva somente o JSON completo válido.",
        prompt: buildVideoPromptRepairPrompt(prompt, result.text),
      });
      output = parseVideoPromptOutput(result.text);
    }
    if (!output)
      throw new ServiceUnavailableError(
        "A IA não devolveu um prompt válido. Nenhuma versão foi salva; tente novamente.",
      );

    const adaptedPrompt = targetTool
      ? adaptPromptForTool(targetTool.label, targetTool.promptHint, output)
      : null;
    const version = await this.repo.createVersion(userId, projectId, {
      canonicalPrompt: output,
      adaptedPrompt,
      targetTool: targetTool?.id ?? null,
      qualityWarnings,
      similarityWarnings,
      generationContext: {
        model: result.model,
        contextVersion: project.contextVersion,
        adjustment: input.similarityResolution ?? input.adjustment,
        fingerprint: videoPromptFingerprint(project),
      },
    });
    if (!version) throw new NotFoundError("Projeto de prompt não encontrado");
    return {
      needsSimilarityDecision: false as const,
      version,
      qualityWarnings,
      similarityWarnings,
      telemetry: { model: result.model, parseSucceeded: true },
    };
  }

  async generateSceneChoreography(
    userId: string,
    projectId: string,
    sceneOrder: number,
    rawInput: SceneMovementGenerationInput,
  ) {
    if (!this.generate)
      throw new ServiceUnavailableError(
        "Configure GOOGLE_GENERATIVE_AI_API_KEY para gerar a coreografia",
      );
    const input = SceneMovementGenerationInputSchema.parse(rawInput);
    const row = await this.getProject(userId, projectId);
    const project = VideoPromptProjectInputSchema.parse(projectInputFromRow(row));
    const scenes = [...project.scenes].sort((left, right) => left.order - right.order);
    const index = scenes.findIndex((scene) => scene.order === sceneOrder);
    const scene = scenes.at(index);
    if (!scene) throw new NotFoundError("Cena não encontrada");
    const prompt = buildSceneChoreographyPrompt({
      project,
      scene,
      previousScene: index > 0 ? (scenes.at(index - 1) ?? null) : null,
      nextScene: scenes.at(index + 1) ?? null,
      command: input.command,
    });
    let result = await this.generate({
      system:
        "Você é Diretora de Movimento do Lucro Caseiro. Gere coreografia física, temporal e observável em JSON.",
      prompt,
    });
    let movementPlan = parseSceneMovementPlan(result.text);
    if (
      !movementPlan ||
      !movementPlanFitsScene(movementPlan, scene.endTime - scene.startTime)
    ) {
      result = await this.generate({
        system: "Repare a coreografia e devolva somente o JSON completo válido.",
        prompt: buildVideoPromptRepairPrompt(
          `${prompt}\n\nTodos os movimentos devem terminar até ${scene.endTime - scene.startTime} segundos.`,
          result.text,
        ),
      });
      movementPlan = parseSceneMovementPlan(result.text);
    }
    if (
      !movementPlan ||
      !movementPlanFitsScene(movementPlan, scene.endTime - scene.startTime)
    )
      throw new ServiceUnavailableError(
        "A IA não devolveu uma coreografia compatível com a duração. Nenhuma alteração foi salva.",
      );

    const updatedScenes = project.scenes.map((item) =>
      item.order === sceneOrder ? { ...item, movementPlan } : item,
    );
    const updatedProject = { ...project, scenes: updatedScenes };
    const rows = projectRows(updatedProject);
    const updated = await this.repo.updateProject(
      userId,
      projectId,
      rows.project,
      rows.scenes,
    );
    if (!updated) throw new NotFoundError("Projeto de prompt não encontrado");
    return {
      movementPlan,
      qualityWarnings: videoPromptQualityWarnings(updatedProject).filter(
        (warning) => warning.sceneId === scene.id || !warning.sceneId,
      ),
      telemetry: { model: result.model, parseSucceeded: true },
    };
  }

  async saveVersion(
    userId: string,
    projectId: string,
    input: {
      canonicalPrompt: VideoPromptOutput;
      adaptedPrompt?: string | null;
      targetTool?: string | null;
    },
  ) {
    const row = await this.getProject(userId, projectId);
    const project = VideoPromptProjectInputSchema.parse(projectInputFromRow(row));
    const canonicalPrompt = VideoPromptOutputSchema.parse(input.canonicalPrompt);
    const recent = await this.repo.recentGenerationContexts(userId, project.brandId);
    const qualityWarnings = videoPromptQualityWarnings(project);
    const similarityWarnings = videoPromptSimilarityWarnings(project, recent, projectId);
    const version = await this.repo.createVersion(userId, projectId, {
      canonicalPrompt,
      adaptedPrompt: input.adaptedPrompt ?? null,
      targetTool: input.targetTool ?? null,
      qualityWarnings,
      similarityWarnings,
      generationContext: {
        source: "manual-edit",
        contextVersion: project.contextVersion,
        fingerprint: videoPromptFingerprint(project),
      },
    });
    if (!version) throw new NotFoundError("Projeto de prompt não encontrado");
    return version;
  }

  listCharacters(userId: string, brandId: string, includeArchived = false) {
    return this.repo.listCharacters(userId, brandId, includeArchived);
  }

  async getCharacter(userId: string, id: string) {
    const character = await this.repo.getCharacter(userId, id);
    if (!character) throw new NotFoundError("Personagem não encontrada");
    return character;
  }

  createCharacter(userId: string, input: CharacterProfileInput) {
    return this.repo.createCharacter(userId, withCharacterPrompts(input));
  }

  async updateCharacter(
    userId: string,
    id: string,
    patch: Partial<CharacterProfileInput>,
  ) {
    const current = await this.getCharacter(userId, id);
    const merged = CharacterProfileInputSchema.parse({ ...current, ...patch });
    const updated = await this.repo.updateCharacter(
      userId,
      id,
      withCharacterPrompts(merged),
    );
    if (!updated) throw new NotFoundError("Personagem não encontrada");
    return updated;
  }

  async duplicateCharacter(userId: string, id: string) {
    const current = await this.getCharacter(userId, id);
    return this.repo.createCharacter(userId, {
      ...withCharacterPrompts(CharacterProfileInputSchema.parse(current)),
      internalName: `Variação de ${current.internalName} · ${Date.now()}`,
      archivedAt: null,
    });
  }

  async archiveCharacter(userId: string, id: string) {
    const updated = await this.repo.updateCharacter(userId, id, {
      archivedAt: new Date(),
    });
    if (!updated) throw new NotFoundError("Personagem não encontrada");
    return updated;
  }

  async publishToContent(userId: string, projectId: string) {
    const project = await this.getProject(userId, projectId);
    if (project.status !== "approved")
      throw new ValidationError(["Aprove o prompt antes de enviá-lo para produção."]);
    const latest = project.versions[0];
    if (!latest) throw new ValidationError(["Gere e salve uma versão antes de enviar."]);
    return this.marketingRepo.seedResource(userId, {
      kind: "content",
      slug: `video-prompt-${projectId}-${latest.version}`,
      title: project.title,
      summary: "Prompt de vídeo aprovado e enviado manualmente para produção.",
      status: "ready",
      scheduledFor: null,
      data: {
        source: "video-prompt-studio",
        videoPromptProjectId: projectId,
        videoPromptVersionId: latest.id,
        canonicalPrompt: latest.canonicalPrompt,
      },
    });
  }

  private async assertCharacterOwnership(userId: string, characterId: string | null) {
    if (characterId && !(await this.repo.getCharacter(userId, characterId)))
      throw new ValidationError([
        "A personagem selecionada não pertence a esta Central.",
      ]);
  }
}

function projectRows(input: VideoPromptProjectInput) {
  const { scenes, customObjective, scriptMode, creativeBrief, direction, ...project } =
    input;
  return {
    project: {
      ...project,
      configuration: { customObjective, scriptMode, creativeBrief, direction },
    },
    scenes: scenes.map(({ id: _id, ...scene }) => scene),
  };
}

function projectInputFromRow(row: Record<string, unknown>) {
  const configuration =
    row.configuration && typeof row.configuration === "object"
      ? (row.configuration as Record<string, unknown>)
      : {};
  return { ...row, ...configuration, configuration: undefined, versions: undefined };
}

function withCharacterPrompts(input: CharacterProfileInput) {
  const identityBase =
    input.sourceType === "original-description"
      ? ORIGINAL_CHARACTER_BASE_PROMPT
      : PRESERVE_CHARACTER_BASE_PROMPT;
  const aestheticGuard =
    input.consentMode === "aesthetic-reference-only"
      ? " Não copiar rosto, identidade ou biometria; criar pessoa fictícia, original e sem intenção de representar uma pessoa real específica."
      : "";
  return {
    ...input,
    identityPrompt:
      input.identityPrompt ||
      `${identityBase}\n\nATRIBUTOS IMUTÁVEIS: ${JSON.stringify(input.immutableTraits)}.${aestheticGuard}`,
    negativePrompt:
      input.negativePrompt ||
      "Sem identidade facial oscilante; sem mudança de idade; sem pele plástica; sem olhos desalinhados; sem troca involuntária de roupa ou acessórios.",
    archivedAt: null,
  };
}

function prioritizedBrandContext(
  project: VideoPromptProjectInput,
  resources: Awaited<ReturnType<MarketingRepoPg["listResources"]>>,
) {
  const ids = new Set(
    [project.topicId, project.offerId, project.featureId, project.audienceId].filter(
      Boolean,
    ),
  );
  return resources
    .filter(
      (item) =>
        ids.has(item.id) ||
        ["feature", "topic", "audience", "campaign"].includes(item.kind),
    )
    .sort((left, right) => Number(ids.has(right.id)) - Number(ids.has(left.id)))
    .slice(0, 30)
    .map((item) => ({
      kind: item.kind,
      title: item.title,
      summary: item.summary,
      data: item.data,
    }));
}

function adaptPromptForTool(
  tool: string,
  hint: string,
  output: {
    masterPrompt: string;
    sceneDirections: Array<{ time: string; direction: string }>;
    movementDirections: Array<{
      time: string;
      prompt: string;
      negativePrompt: string;
    }>;
    restrictionsAndNegativePrompt: string;
  },
) {
  return [
    `ADAPTAÇÃO PARA ${tool.toUpperCase()}`,
    hint,
    output.masterPrompt,
    "CENAS",
    ...output.sceneDirections.map((scene) => `${scene.time}: ${scene.direction}`),
    "MOVIMENTOS",
    ...output.movementDirections.map(
      (scene) => `${scene.time}: ${scene.prompt}\nRestrições: ${scene.negativePrompt}`,
    ),
    "RESTRIÇÕES",
    output.restrictionsAndNegativePrompt,
  ].join("\n\n");
}

function movementPlanFitsScene(
  plan: { actions: Array<{ startTime: number; endTime: number }> },
  sceneDuration: number,
) {
  return plan.actions.every(
    (movement) =>
      movement.startTime >= 0 &&
      movement.endTime > movement.startTime &&
      movement.endTime <= sceneDuration,
  );
}
