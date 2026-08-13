import type {
  CharacterProfileInput,
  SceneMovementPlan,
  VideoSceneInput,
  VideoPromptOutput,
  VideoPromptProjectInput,
  VideoPromptQualityWarning,
  VideoPromptSimilarityWarning,
  VideoPromptTool,
} from "@lucro-caseiro/contracts";
import {
  SceneMovementPlanSchema,
  VideoPromptOutputSchema,
} from "@lucro-caseiro/contracts";

export const VIDEO_PROMPT_TARGET_TOOLS = [
  {
    id: "sora",
    label: "Sora",
    description: "Adaptação descritiva por planos, continuidade e áudio.",
    promptHint:
      "Priorize instruções temporais claras, continuidade entre planos e diálogo separado.",
  },
  {
    id: "veo",
    label: "Veo",
    description: "Adaptação audiovisual com câmera, áudio e física observável.",
    promptHint:
      "Organize por cena e explicite câmera, áudio, ação física e restrições observáveis.",
  },
  {
    id: "heygen",
    label: "HeyGen",
    description: "Adaptação centrada em apresentador, voz e roteiro falado.",
    promptHint:
      "Separe fala, direção do apresentador, pronúncia pt-BR e cortes para material real.",
  },
] as const satisfies readonly VideoPromptTool[];

export const ORIGINAL_CHARACTER_BASE_PROMPT = `Crie uma personagem adulta fictícia e original para conteúdo UGC. As referências fornecidas devem orientar somente a linguagem fotográfica, apresentação, estilo e sensação estética geral. Não copie ou recombine literalmente o rosto, a identidade, as expressões características ou traços biométricos únicos de pessoas reais.

Defina uma identidade visual própria e persistente, descrevendo objetivamente formato facial, pele, olhos, sobrancelhas, nariz, lábios, mandíbula, cabelo, proporções gerais e características distintivas. Preserve textura natural da pele, pequenas variações de tonalidade e detalhes humanos plausíveis, sem aparência excessivamente alisada ou plástica.

A personagem deve parecer uma criadora de conteúdo brasileira, acessível, segura e espontânea, sem pose de modelo profissional e sem representar uma cliente real do Lucro Caseiro.`;

export const PRESERVE_CHARACTER_BASE_PROMPT = `Utilize as referências autorizadas da personagem como fonte de identidade. Preserve os atributos bloqueados na Ficha de Identidade Visual: estrutura facial, tom e subtom de pele, olhos, sobrancelhas, nariz, lábios, mandíbula, cabelo, faixa etária aparente, proporções gerais e características distintivas.

A personagem deve parecer a mesma pessoa registrada em outro momento. Não redesenhe, embeleze, rejuvenesça, afine ou altere sua identidade. Modifique somente os atributos explicitamente liberados para esta cena.

Mantenha continuidade de rosto, cabelo, roupa, acessórios e proporções entre os planos. Preserve textura natural da pele e anatomia humana plausível.`;

type SimilarityCandidate = {
  projectId: string;
  title: string;
  format: string;
  objective: string;
  visualMode: string;
  featureId: string | null;
  cta: string;
  configuration: Record<string, unknown>;
  generationContext: Record<string, unknown>;
};

export function videoPromptQualityWarnings(
  project: VideoPromptProjectInput,
): VideoPromptQualityWarning[] {
  const warnings: VideoPromptQualityWarning[] = [];
  const evidence = project.creativeBrief.productEvidenceIds;
  const text = [
    project.creativeBrief.topic,
    project.creativeBrief.painOrDesire,
    project.angle,
    project.cta,
    ...project.scenes.flatMap((scene) => [scene.action, scene.dialogue, scene.narration]),
  ].join(" ");

  if (!project.featureId && project.creativeBrief.topic.length < 35)
    warnings.push({
      code: "generic-content",
      severity: "blocking",
      message:
        "Defina uma funcionalidade ou detalhe melhor o tema para evitar um vídeo genérico.",
    });
  const normalizedText = text.toLocaleLowerCase("pt-BR");
  if (
    [
      "garante",
      "garantia",
      "100%",
      "sem risco",
      "lucro certo",
      "resultado imediato",
    ].some((term) => normalizedText.includes(term))
  )
    warnings.push({
      code: "unsupported-promise",
      severity: "blocking",
      message:
        "O roteiro contém promessa absoluta ou resultado não sustentado por evidência.",
    });
  if (
    ["depoimento real", "cliente real disse", "caso real"].some((term) =>
      normalizedText.includes(term),
    ) &&
    evidence.length === 0
  )
    warnings.push({
      code: "invented-testimonial",
      severity: "blocking",
      message:
        "Um depoimento só pode ser apresentado como real quando houver evidência vinculada.",
    });
  if (
    ["real-interface", "hybrid-character-interface"].includes(project.visualMode) &&
    evidence.length === 0
  )
    warnings.push({
      code: "missing-interface-evidence",
      severity: "warning",
      message:
        "Sem captura real, a interface será mantida fora de foco, fora do quadro ou sem conteúdo legível.",
    });
  if (project.visualMode === "consistent-character" && !project.characterProfileId)
    warnings.push({
      code: "missing-character-profile",
      severity: "blocking",
      message:
        "Selecione uma Ficha de Identidade Visual para manter a personagem consistente.",
    });
  const sorted = [...project.scenes].sort((a, b) => a.startTime - b.startTime);
  sorted.forEach((scene, index) => {
    if (
      scene.endTime > project.duration ||
      (index > 0 && scene.startTime < sorted[index - 1]!.endTime)
    )
      warnings.push({
        code: "incompatible-timeline",
        severity: "blocking",
        message: `A cena ${scene.order + 1} ultrapassa a duração ou se sobrepõe a outra cena.`,
        ...(scene.id ? { sceneId: scene.id } : {}),
      });
    if (scene.characterPresent && (!scene.action || !scene.characterDirection))
      warnings.push({
        code: "static-character",
        severity: "warning",
        message: `A cena ${scene.order + 1} precisa orientar ação, postura, expressão ou gesto da personagem.`,
        ...(scene.id ? { sceneId: scene.id } : {}),
      });
    if (scene.action.toLocaleLowerCase("pt-BR").split(" e ").length > 4)
      warnings.push({
        code: "too-many-actions",
        severity: "warning",
        message: `A cena ${scene.order + 1} concentra ações demais; mantenha uma ação visual dominante.`,
        ...(scene.id ? { sceneId: scene.id } : {}),
      });
    warnings.push(...sceneMovementWarnings(scene));
    if (
      project.direction.realism === "spontaneous-ugc" &&
      scene.movementPlan.actions.some(
        (movement) =>
          movement.category === "camera" &&
          ["órbita", "travelling", "tilt", "pan"].some((term) =>
            normalized(movement.type).includes(term),
          ),
      )
    )
      warnings.push(
        movementWarning(
          scene,
          "complex-ugc-camera",
          "warning",
          `A cena ${scene.order + 1} usa câmera complexa para UGC; prefira câmera fixa ou handheld mínimo.`,
        ),
      );
  });
  sorted.slice(1).forEach((scene, index) => {
    const previous = sorted.at(index);
    if (previous) warnings.push(...movementContinuityWarnings(previous, scene));
  });
  return dedupeWarnings(warnings);
}

export function videoPromptSimilarityWarnings(
  project: VideoPromptProjectInput,
  recent: SimilarityCandidate[],
  currentProjectId?: string,
): VideoPromptSimilarityWarning[] {
  const current = similarityFingerprint(project);
  return recent
    .filter((candidate) => candidate.projectId !== currentProjectId)
    .map((candidate) => {
      const previous = candidateFingerprint(candidate);
      const dimensions: string[] = [];
      let score = 0;
      const comparisons = [
        [current.hook, previous.hook, 0.2, "gancho"],
        [current.theme, previous.theme, 0.14, "tema"],
        [current.setting, previous.setting, 0.14, "cenário"],
        [current.character, previous.character, 0.1, "personagem"],
        [current.openingShot, previous.openingShot, 0.1, "enquadramento inicial"],
        [current.action, previous.action, 0.1, "ação"],
        [current.structure, previous.structure, 0.08, "estrutura narrativa"],
        [current.cta, previous.cta, 0.08, "CTA"],
        [current.metaphor, previous.metaphor, 0.03, "ângulo ou metáfora"],
        [current.objects, previous.objects, 0.03, "objetos"],
      ] as const;
      for (const [currentValue, previousValue, weight, label] of comparisons) {
        const similarity = tokenSimilarity(currentValue, previousValue);
        score += similarity * weight;
        if (similarity >= 0.68) dimensions.push(label);
      }
      return {
        projectId: candidate.projectId,
        score: Math.round(score * 100) / 100,
        message: `Este início está muito parecido com “${candidate.title}”.`,
        matchingDimensions: dimensions,
      };
    })
    .filter((warning) => warning.score >= 0.58 && warning.matchingDimensions.length >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function buildVideoPromptGenerationPrompt(input: {
  project: VideoPromptProjectInput & { id?: string };
  character: (CharacterProfileInput & { id?: string }) | null;
  brandContext: Array<{
    kind: string;
    title: string;
    summary: string | null;
    data: unknown;
  }>;
  qualityWarnings: VideoPromptQualityWarning[];
  similarityWarnings: VideoPromptSimilarityWarning[];
  targetTool: VideoPromptTool | null;
  adjustment: string;
  sceneOrder?: number;
}) {
  const { project, character, targetTool } = input;
  const interfaceEvidence = project.creativeBrief.productEvidenceIds.length > 0;
  const interfaceInstruction = interfaceEvidence
    ? "Há material de interface vinculado: descreva como real somente o que estiver explicitamente nas evidências."
    : "Não há material real de interface: mantenha qualquer tela fora de foco, fora do enquadramento ou sem conteúdo legível.";
  const visualModeInstruction =
    project.visualMode === "hybrid-character-interface"
      ? "Modo híbrido: personagem no início, cortes intermediários para telas reais, personagem no encerramento, legendas curtas, destaques discretos e um único CTA."
      : "Respeite estritamente a modalidade visual selecionada.";
  let characterInstruction =
    "Não há Ficha de Identidade selecionada; não reivindique consistência entre produções anteriores.";
  if (character) {
    const basePrompt =
      character.sourceType === "original-description"
        ? ORIGINAL_CHARACTER_BASE_PROMPT
        : PRESERVE_CHARACTER_BASE_PROMPT;
    characterInstruction = `${basePrompt}\nFICHA: ${JSON.stringify(character)}`;
  }
  const consentInstruction =
    character?.consentMode === "aesthetic-reference-only"
      ? "As imagens são apenas referência estética geral: não copie rosto, não reproduza identidade, não combine rostos literalmente, não preserve biometria única; crie personagem fictícia, original e sem intenção de representar uma pessoa real específica."
      : "Use referências somente dentro da finalidade e autorização registradas.";
  const sceneAdjustment =
    input.sceneOrder === undefined
      ? "Ajuste o prompt inteiro."
      : `Regere somente a direção da cena de ordem ${input.sceneOrder}, preservando as demais.`;
  const toolInstruction = targetTool
    ? `ADAPTAÇÃO SEPARADA PARA ${targetTool.label}: ${targetTool.promptHint}`
    : "Não produza adaptação de fornecedor.";
  const scriptInstruction = scriptModeInstruction(project.scriptMode);
  return [
    "Crie um prompt profissional de geração de vídeo para a marca Lucro Caseiro. Responda SOMENTE com JSON válido.",
    "O prompt canônico é independente de fornecedor. Redes sociais são apenas destinos. Não invente fatos, resultados, depoimentos, telas, campos, botões, gráficos, números, funcionalidades ou fluxos.",
    "Comece pelo gancho; nunca use introdução institucional antes dele. Para 40–50 s, preserve a progressão 0–4 problema; 4–12 contexto; 12–30 demonstração; 30–40 benefício concreto; 40–50 encerramento com um único CTA.",
    "Direção Lucro Caseiro: cenário realista e acolhedor; creme ou off-white; marca com moderação; luz natural lateral; fundo levemente desfocado; editorial plausível; sem neon, halo ou futurismo; uma ação dominante por cena.",
    "Realismo observável: anatomia humana plausível; cinco dedos visíveis quando mãos aparecerem; articulações naturais; sem membros duplicados; contato coerente com objetos; sincronização labial natural; textura de pele; continuidade de rosto, roupa e acessórios.",
    interfaceInstruction,
    visualModeInstruction,
    scriptInstruction,
    characterInstruction,
    consentInstruction,
    `PROJETO: ${JSON.stringify(project)}`,
    `CONTEXTO CONFIRMADO DO MUNDO DA MARCA: ${JSON.stringify(input.brandContext)}`,
    `AVISOS DETERMINÍSTICOS: ${JSON.stringify(input.qualityWarnings)}`,
    `SEMELHANÇAS RECENTES: ${JSON.stringify(input.similarityWarnings)}`,
    `AJUSTE PEDIDO: ${input.adjustment}. ${sceneAdjustment}`,
    toolInstruction,
    `CONTRATO JSON EXATO: {"creativeSummary":"...","masterPrompt":"...","fixedCharacterIdentity":"...","sceneDirections":[{"sceneId":"uuid opcional","order":0,"time":"0–4 s","direction":"..."}],"movementDirections":[{"sceneId":"uuid opcional","order":0,"time":"0–4 s","prompt":"coreografia temporal clara e física","negativePrompt":"restrições relevantes à cena"}],"speechAndNarration":"...","cameraDirection":"...","lightingDirection":"...","voiceDirection":"...","continuity":"...","restrictionsAndNegativePrompt":"...","requiredMaterials":["..."],"preGenerationChecklist":["..."]}`,
    "Para cada cena, transforme a partitura estruturada de movimentos em instruções temporais observáveis. Nunca escreva apenas ‘movimentos naturais’. Priorize uma ação principal, poucos movimentos secundários, gestos simples sincronizados com a fala e continuidade física.",
    "Inclua somente restrições negativas relevantes ao projeto. Preserve português brasileiro correto, fala conversacional, pausas e respiração naturais, sem entonação de locutora publicitária.",
  ].join("\n\n");
}

export function parseVideoPromptOutput(text: string): VideoPromptOutput | null {
  let normalized = text.trim();
  if (normalized.startsWith("```")) {
    const firstLineEnd = normalized.indexOf("\n");
    normalized = firstLineEnd >= 0 ? normalized.slice(firstLineEnd + 1) : "";
  }
  if (normalized.endsWith("```")) normalized = normalized.slice(0, -3).trimEnd();
  try {
    const parsed: unknown = JSON.parse(normalized);
    const result = VideoPromptOutputSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function buildSceneChoreographyPrompt(input: {
  project: VideoPromptProjectInput;
  scene: VideoSceneInput;
  previousScene: VideoSceneInput | null;
  nextScene: VideoSceneInput | null;
  command: string;
}) {
  return [
    "Atue como Diretora de Movimento do Lucro Caseiro. Responda SOMENTE com JSON válido.",
    "Crie uma coreografia simples, temporal, editável e fisicamente plausível. Priorize uma ação principal, poucos movimentos secundários e continuidade entre planos.",
    "Não use descrições vagas como ‘movimentos naturais’: diga posição inicial, ação, direção, velocidade, amplitude, posição final, objeto ou pessoa, intervalo exato e continuidade.",
    "Gestos devem ser simples e compatíveis com a fala; dedos relaxados, articulações naturais, contato coerente e nenhuma indicação para elementos inexistentes. Mãos podem ficar parcialmente fora do quadro quando não forem importantes.",
    "Em UGC ou demonstração simples, evite movimentos cinematográficos complexos. Movimento de ambiente deve ser discreto e nunca competir com a ação principal.",
    "O prompt negativo deve selecionar apenas riscos relevantes: movimentos bruscos, velocidade artificial, gestos repetitivos, mãos atravessando objetos, pés deslizando, objetos flutuando, teletransporte, olhar congelado, sorriso artificial, lipsync fora de sincronia, troca de mão, tremor excessivo e fundo concorrente.",
    `COMANDO: ${input.command}`,
    `PROJETO: ${JSON.stringify({ duration: input.project.duration, visualMode: input.project.visualMode, realism: input.project.direction.realism, camera: input.project.direction.camera, character: input.project.direction.character })}`,
    `CENA ATUAL: ${JSON.stringify(input.scene)}`,
    `CENA ANTERIOR: ${JSON.stringify(input.previousScene)}`,
    `CENA SEGUINTE: ${JSON.stringify(input.nextScene)}`,
    `CONTRATO JSON EXATO: {"preset":"presenter-talking|phone-demo|business-routine|character-interface|no-character|spontaneous-ugc|null","intensity":"almost-static|subtle-natural|conversational|dynamic|energetic|custom","customIntensity":"","speed":"very-slow|slow|natural|fast|custom","customSpeed":"","actions":[{"category":"character|expression-gaze|gesture-hands|camera|object|environment|frame-entry-exit|transition","type":"...","startTime":0,"endTime":0.8,"instruction":"...","initialPosition":"...","action":"...","direction":"...","speed":"natural","customSpeed":"","amplitude":"...","finalPosition":"...","involvedSubject":"...","intensity":"subtle-natural","customIntensity":"","continuity":"...","hand":"none|left|right|both","handsInitialPosition":"...","touchedObject":"...","gesture":"...","distance":"...","stability":"...","startPoint":"...","endPoint":"...","trackedObject":"...","primary":true}],"continuity":{"initialBodyPosition":"...","finalBodyPosition":"...","initialGazeDirection":"...","finalGazeDirection":"...","entrySide":"none|left|right|top|bottom","exitSide":"none|left|right|top|bottom","heldObjectsStart":[{"object":"...","hand":"left|right|both","orientation":"..."}],"heldObjectsEnd":[],"objectLocationsStart":"...","objectLocationsEnd":"...","clothingAndAccessories":"...","lightingDirection":"...","cameraAxis":"...","movementSpeed":"natural"},"movementPrompt":"...","negativePrompt":"..."}`,
    "Todos os tempos são relativos ao início da cena e devem caber em sua duração. O movementPrompt deve narrar os intervalos em ordem e o negativePrompt deve ser específico.",
  ].join("\n\n");
}

export function parseSceneMovementPlan(text: string): SceneMovementPlan | null {
  let normalized = text.trim();
  if (normalized.startsWith("```")) {
    const firstLineEnd = normalized.indexOf("\n");
    normalized = firstLineEnd >= 0 ? normalized.slice(firstLineEnd + 1) : "";
  }
  if (normalized.endsWith("```")) normalized = normalized.slice(0, -3).trimEnd();
  try {
    const result = SceneMovementPlanSchema.safeParse(JSON.parse(normalized));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function buildVideoPromptRepairPrompt(originalPrompt: string, invalid: string) {
  return [
    originalPrompt,
    "A resposta abaixo violou o contrato. Corrija sem remover detalhes confirmados e devolva somente o JSON completo válido.",
    invalid,
  ].join("\n\n");
}

function similarityFingerprint(project: VideoPromptProjectInput) {
  const first = [...project.scenes].sort((a, b) => a.order - b.order)[0];
  return {
    hook: `${first?.narrativeRole ?? ""} ${first?.dialogue || first?.narration || first?.onScreenText || ""}`,
    theme: `${project.featureId ?? ""} ${project.creativeBrief.topic}`,
    setting: first?.environment ?? project.direction.environment,
    character: `${project.characterProfileId ?? ""} ${project.visualMode}`,
    openingShot: first?.cameraDirection ?? project.direction.camera.shot,
    action: first?.action ?? "",
    structure: project.scenes.map((scene) => scene.narrativeRole).join(" "),
    cta: project.cta,
    metaphor: project.angle,
    objects: project.scenes.map((scene) => scene.action).join(" "),
  };
}

function candidateFingerprint(candidate: SimilarityCandidate) {
  const context = candidate.generationContext;
  const fingerprint = context.fingerprint;
  if (fingerprint && typeof fingerprint === "object" && !Array.isArray(fingerprint))
    return fingerprint as ReturnType<typeof similarityFingerprint>;
  return {
    hook: "",
    theme: `${candidate.featureId ?? ""} ${candidate.title}`,
    setting: "",
    character: candidate.visualMode,
    openingShot: "",
    action: "",
    structure: candidate.objective,
    cta: candidate.cta,
    metaphor: "",
    objects: "",
  };
}

export function videoPromptFingerprint(project: VideoPromptProjectInput) {
  return similarityFingerprint(project);
}

function scriptModeInstruction(mode: VideoPromptProjectInput["scriptMode"]) {
  if (mode === "visual-only")
    return "Crie somente cenas visuais: não inclua fala, narração ou locução; texto na tela deve ser curto e opcional.";
  if (mode === "manual" || mode === "imported")
    return "Preserve literalmente as falas e narrações informadas nas cenas; complete apenas a direção audiovisual.";
  if (mode === "full")
    return "Entregue roteiro com fala, narração e legendas curtas, sem redundância entre os três.";
  return "Complete o roteiro automaticamente a partir do briefing e das funções narrativas das cenas.";
}

function tokenSimilarity(left: string, right: string) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}

function tokens(value: string) {
  return new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

const STOP_WORDS = new Set([
  "com",
  "sem",
  "para",
  "uma",
  "que",
  "por",
  "dos",
  "das",
  "seu",
  "sua",
  "lucro",
  "caseiro",
]);

function dedupeWarnings(warnings: VideoPromptQualityWarning[]) {
  return warnings.filter(
    (warning, index) =>
      warnings.findIndex(
        (candidate) =>
          candidate.code === warning.code && candidate.sceneId === warning.sceneId,
      ) === index,
  );
}

function sceneMovementWarnings(scene: VideoSceneInput): VideoPromptQualityWarning[] {
  const warnings: VideoPromptQualityWarning[] = [];
  const sceneDuration = scene.endTime - scene.startTime;
  const actions = [...scene.movementPlan.actions].sort(
    (left, right) => left.startTime - right.startTime,
  );
  if (scene.characterPresent && actions.length === 0)
    warnings.push(
      movementWarning(
        scene,
        "missing-movement-plan",
        "warning",
        `A cena ${scene.order + 1} ainda não possui coreografia específica.`,
      ),
    );
  for (const movement of actions) {
    if (movement.endTime > sceneDuration)
      warnings.push(
        movementWarning(
          scene,
          "movement-outside-scene",
          "blocking",
          `Um movimento da cena ${scene.order + 1} termina depois dos ${sceneDuration} segundos disponíveis.`,
        ),
      );
    if (
      normalized(`${movement.type} ${movement.action}`).includes("aponta") &&
      !movement.involvedSubject &&
      !movement.touchedObject
    )
      warnings.push(
        movementWarning(
          scene,
          "missing-pointing-target",
          "blocking",
          `A cena ${scene.order + 1} manda apontar, mas não identifica um elemento real existente.`,
        ),
      );
    if (
      movement.category === "expression-gaze" &&
      normalized(movement.type).includes("diretamente para a câmera") &&
      movement.startTime === 0 &&
      movement.endTime >= sceneDuration
    )
      warnings.push(
        movementWarning(
          scene,
          "frozen-gaze",
          "warning",
          `A cena ${scene.order + 1} mantém olhar direto por todo o plano; inclua uma mudança breve e motivada.`,
        ),
      );
    if (movement.speed === "very-slow" && movement.endTime - movement.startTime < 1)
      warnings.push(
        movementWarning(
          scene,
          "incompatible-movement-speed",
          "warning",
          `Um movimento muito lento da cena ${scene.order + 1} tem menos de um segundo disponível.`,
        ),
      );
  }
  for (let leftIndex = 0; leftIndex < actions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < actions.length; rightIndex += 1) {
      const left = actions.at(leftIndex)!;
      const right = actions.at(rightIndex)!;
      if (right.startTime >= left.endTime) break;
      if (left.primary && right.primary)
        warnings.push(
          movementWarning(
            scene,
            "overlapping-primary-movements",
            "blocking",
            `A cena ${scene.order + 1} sobrepõe duas ações principais; mantenha somente uma ação dominante.`,
          ),
        );
      else if (left.category === right.category)
        warnings.push(
          movementWarning(
            scene,
            "overlapping-movements",
            "warning",
            `A cena ${scene.order + 1} sobrepõe movimentos da mesma categoria.`,
          ),
        );
    }
  }
  const spokenWords = `${scene.dialogue} ${scene.narration}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  if (
    spokenWords / Math.max(sceneDuration, 1) > 3.2 &&
    actions.filter((item) => item.category === "gesture-hands").length > 1
  )
    warnings.push(
      movementWarning(
        scene,
        "speech-movement-overload",
        "warning",
        `A fala da cena ${scene.order + 1} está densa para vários gestos; reduza gestos ou aumente a duração.`,
      ),
    );
  return warnings;
}

function movementContinuityWarnings(
  previous: VideoSceneInput,
  current: VideoSceneInput,
): VideoPromptQualityWarning[] {
  const before = previous.movementPlan.continuity;
  const after = current.movementPlan.continuity;
  const mismatches: string[] = [];
  compareContinuity(
    before.finalBodyPosition,
    after.initialBodyPosition,
    "posição corporal",
    mismatches,
  );
  compareContinuity(
    before.finalGazeDirection,
    after.initialGazeDirection,
    "direção do olhar",
    mismatches,
  );
  compareContinuity(
    before.objectLocationsEnd,
    after.objectLocationsStart,
    "localização dos objetos",
    mismatches,
  );
  compareContinuity(
    before.clothingAndAccessories,
    after.clothingAndAccessories,
    "roupa e acessórios",
    mismatches,
  );
  compareContinuity(
    before.lightingDirection,
    after.lightingDirection,
    "direção da iluminação",
    mismatches,
  );
  compareContinuity(before.cameraAxis, after.cameraAxis, "eixo de câmera", mismatches);
  if (before.movementSpeed !== after.movementSpeed)
    mismatches.push("velocidade do movimento");
  if (
    before.exitSide !== "none" &&
    after.entrySide !== "none" &&
    before.exitSide !== after.entrySide
  )
    mismatches.push("lado de entrada e saída do quadro");

  const unexplainedHandChanges = before.heldObjectsEnd.filter((held) => {
    const next = after.heldObjectsStart.find(
      (item) => normalized(item.object) === normalized(held.object),
    );
    return (
      next &&
      next.hand !== held.hand &&
      !current.movementPlan.actions.some(
        (movement) =>
          normalized(`${movement.action} ${movement.instruction}`).includes("troca") &&
          normalized(movement.involvedSubject).includes(normalized(held.object)),
      )
    );
  });
  if (unexplainedHandChanges.length)
    return [
      movementWarning(
        current,
        "unexplained-object-hand-change",
        "blocking",
        `Entre as cenas ${previous.order + 1} e ${current.order + 1}, ${unexplainedHandChanges.map((item) => item.object).join(", ")} troca de mão sem ação que explique a mudança.`,
      ),
    ];
  const unexplainedObjectChanges: string[] = [];
  for (const held of before.heldObjectsEnd) {
    const remainsHeld = after.heldObjectsStart.some(
      (item) => normalized(item.object) === normalized(held.object),
    );
    if (
      !remainsHeld &&
      !actionsExplainObject(current, held.object, ["apoia", "solta", "entrega", "deixa"])
    )
      unexplainedObjectChanges.push(`${held.object} desaparece da mão`);
  }
  for (const held of after.heldObjectsStart) {
    const wasHeld = before.heldObjectsEnd.some(
      (item) => normalized(item.object) === normalized(held.object),
    );
    if (
      !wasHeld &&
      !actionsExplainObject(previous, held.object, [
        "pega",
        "levanta",
        "segura",
        "recebe",
      ])
    )
      unexplainedObjectChanges.push(`${held.object} surge na mão`);
  }
  if (unexplainedObjectChanges.length)
    return [
      movementWarning(
        current,
        "unexplained-object-state-change",
        "blocking",
        `Entre as cenas ${previous.order + 1} e ${current.order + 1}, ${unexplainedObjectChanges.join(" e ")} sem ação que explique a mudança.`,
      ),
    ];
  return mismatches.length
    ? [
        movementWarning(
          current,
          "movement-continuity-mismatch",
          "warning",
          `Revise a continuidade entre as cenas ${previous.order + 1} e ${current.order + 1}: ${mismatches.join(", ")}.`,
        ),
      ]
    : [];
}

function movementWarning(
  scene: VideoSceneInput,
  code: string,
  severity: VideoPromptQualityWarning["severity"],
  message: string,
): VideoPromptQualityWarning {
  return { code, severity, message, ...(scene.id ? { sceneId: scene.id } : {}) };
}

function compareContinuity(
  previous: string,
  current: string,
  label: string,
  mismatches: string[],
) {
  if (previous && current && normalized(previous) !== normalized(current))
    mismatches.push(label);
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function actionsExplainObject(scene: VideoSceneInput, object: string, verbs: string[]) {
  const target = normalized(object);
  return scene.movementPlan.actions.some((movement) => {
    const description = normalized(
      `${movement.action} ${movement.instruction} ${movement.involvedSubject}`,
    );
    return (
      description.includes(target) && verbs.some((verb) => description.includes(verb))
    );
  });
}
