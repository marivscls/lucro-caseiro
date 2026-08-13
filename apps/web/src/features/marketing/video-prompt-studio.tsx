"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CharacterProfileInputSchema,
  VideoPromptProjectInputSchema,
} from "@lucro-caseiro/contracts";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  FileClock,
  Film,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { useBrand } from "@/app/brand-provider";
import { apiClient } from "@/shared/lib/api-client";
import { getSupabase } from "@/shared/lib/supabase";
import type { MarketingResource } from "@/shared/types";

import {
  adaptProjectDuration,
  createEmptyCharacterProfile,
  createMovementPlan,
  createEmptyVideoPromptProject,
  createInfluencerReferenceKit,
  environments,
  lucroCaseiroTopics,
  movementCategories,
  movementIntensities,
  movementPresets,
  movementSpeeds,
  movementSuggestions,
  scriptModes,
  serializePromptOutput,
  updateFormat,
  validateVideoPromptProject,
  videoDurations,
  videoFormats,
  videoObjectives,
  visualModes,
  type CharacterProfileRecord,
  type SceneMovementAction,
  type SceneMovementGenerationResult,
  type SceneMovementPlan,
  type VideoPromptGenerationResult,
  type VideoPromptOutput,
  type VideoPromptProjectInput,
  type VideoPromptProjectRecord,
  type VideoPromptTool,
  type VideoPromptVersionRecord,
} from "./video-prompt-generator";
import styles from "./video-prompt-studio.module.css";

type HistoryFilters = {
  character: string;
  mode: string;
  objective: string;
  feature: string;
  duration: string;
  format: string;
  tool: string;
  status: string;
  from: string;
};

type MovementCommand =
  | "generate-choreography"
  | "simplify-movements"
  | "naturalize-movements"
  | "increase-movement-energy"
  | "reduce-gestures"
  | "fix-movement-continuity"
  | "sync-movement-dialogue"
  | "fixed-camera"
  | "movement-variation";

const movementCommands: ReadonlyArray<[MovementCommand, string]> = [
  ["generate-choreography", "Gerar coreografia da cena"],
  ["simplify-movements", "Simplificar movimentos"],
  ["naturalize-movements", "Deixar mais natural"],
  ["increase-movement-energy", "Aumentar energia"],
  ["reduce-gestures", "Reduzir gestos"],
  ["fix-movement-continuity", "Corrigir continuidade"],
  ["sync-movement-dialogue", "Sincronizar com a fala"],
  ["fixed-camera", "Adaptar para câmera fixa"],
  ["movement-variation", "Criar variação"],
];

const emptyFilters: HistoryFilters = {
  character: "",
  mode: "",
  objective: "",
  feature: "",
  duration: "",
  format: "",
  tool: "",
  status: "",
  from: "",
};

export function VideoPromptStudio({
  initialFocus,
}: {
  initialFocus?: "influencer";
} = {}) {
  const brand = useBrand();
  const queryClient = useQueryClient();
  const [project, setProject] = useState(() => {
    const emptyProject = createEmptyVideoPromptProject(brand.id);
    return initialFocus === "influencer"
      ? { ...emptyProject, visualMode: "new-presenter" as const }
      : emptyProject;
  });
  const [projectId, setProjectId] = useState<string>();
  const [currentVersion, setCurrentVersion] = useState<VideoPromptVersionRecord>();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [similarityDecision, setSimilarityDecision] = useState<
    VideoPromptGenerationResult & { needsSimilarityDecision: true }
  >();
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
  const [characterDraft, setCharacterDraft] = useState(() =>
    createEmptyCharacterProfile(brand.id),
  );
  const [editingCharacterId, setEditingCharacterId] = useState<string>();
  const [compareIds, setCompareIds] = useState<[string, string]>(["", ""]);
  const [loadedVersions, setLoadedVersions] = useState<VideoPromptVersionRecord[]>([]);
  const resultRef = useRef<HTMLElement>(null);

  const resourcesQuery = useQuery({
    queryKey: ["video-prompt-brand-resources"],
    queryFn: () => apiClient<MarketingResource[]>("/resources"),
  });
  const projectsQuery = useQuery({
    queryKey: ["video-prompt-projects"],
    queryFn: () => apiClient<VideoPromptProjectRecord[]>("/video-prompts/projects"),
  });
  const toolsQuery = useQuery({
    queryKey: ["video-prompt-tools"],
    queryFn: () => apiClient<VideoPromptTool[]>("/video-prompts/tools"),
  });
  const charactersQuery = useQuery({
    queryKey: ["video-prompt-characters", brand.id],
    queryFn: () =>
      apiClient<CharacterProfileRecord[]>(
        `/video-prompts/characters?brandId=${encodeURIComponent(brand.id)}`,
      ),
  });
  const characterDetailQuery = useQuery({
    queryKey: ["video-prompt-character", editingCharacterId],
    queryFn: () =>
      apiClient<CharacterProfileRecord>(
        `/video-prompts/characters/${editingCharacterId}`,
      ),
    enabled: Boolean(editingCharacterId),
  });

  const resources = resourcesQuery.data ?? [];
  const features = resources.filter((item) => item.kind === "feature");
  const audiences = resources.filter((item) => item.kind === "audience");
  const topics = resources.filter((item) => item.kind === "topic");
  const characters = charactersQuery.data ?? [];
  const tools = toolsQuery.data ?? [];

  const saveProject = useMutation({
    mutationFn: () => persistProject(projectId, project),
    onSuccess: (saved) => {
      setProjectId(saved.id);
      setProject(projectFromRecord(saved));
      setSaveMessage("Projeto salvo");
      window.setTimeout(() => setSaveMessage(""), 2200);
      void queryClient.invalidateQueries({ queryKey: ["video-prompt-projects"] });
    },
  });

  const generate = useMutation({
    mutationFn: async (
      input: {
        adjustment?: string;
        similarityResolution?: string;
        sceneOrder?: number;
        projectOverride?: VideoPromptProjectInput;
      } = {},
    ) => {
      const sourceProject = input.projectOverride ?? project;
      const errors = validateVideoPromptProject(sourceProject);
      setFormErrors(errors);
      if (errors.length) throw new Error("Revise os campos destacados antes de gerar.");
      const saved = await persistProject(projectId, sourceProject);
      setProjectId(saved.id);
      setProject(projectFromRecord(saved));
      return apiClient<VideoPromptGenerationResult>(
        `/video-prompts/projects/${saved.id}/generate`,
        {
          method: "POST",
          timeoutMs: 65_000,
          body: {
            targetTool: sourceProject.targetTool,
            adjustment: input.adjustment ?? "none",
            ...(input.similarityResolution
              ? { similarityResolution: input.similarityResolution }
              : {}),
            ...(input.sceneOrder === undefined ? {} : { sceneOrder: input.sceneOrder }),
          },
        },
      );
    },
    onSuccess: (result) => {
      if (result.needsSimilarityDecision) {
        setSimilarityDecision(result);
        return;
      }
      setSimilarityDecision(undefined);
      setCurrentVersion(result.version);
      setProject((previous) => ({ ...previous, status: "ready" }));
      void queryClient.invalidateQueries({ queryKey: ["video-prompt-projects"] });
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    },
  });

  const saveEditedVersion = useMutation({
    mutationFn: async () => {
      if (!projectId || !currentVersion) throw new Error("Gere um prompt primeiro.");
      return apiClient<VideoPromptVersionRecord>(
        `/video-prompts/projects/${projectId}/versions`,
        {
          method: "POST",
          body: {
            canonicalPrompt: currentVersion.canonicalPrompt,
            adaptedPrompt: currentVersion.adaptedPrompt,
            targetTool: currentVersion.targetTool,
          },
        },
      );
    },
    onSuccess: (version) => {
      setCurrentVersion(version);
      setSaveMessage(`Versão ${version.version} salva`);
      void reloadProject(projectId);
    },
  });

  const generateMovement = useMutation({
    mutationFn: async ({
      sceneIndex,
      command,
    }: {
      sceneIndex: number;
      command: MovementCommand;
    }) => {
      const saved = await persistProject(projectId, project);
      setProjectId(saved.id);
      setProject(projectFromRecord(saved));
      const sceneOrder = saved.scenes[sceneIndex]?.order;
      if (sceneOrder === undefined) throw new Error("Cena não encontrada.");
      const result = await apiClient<SceneMovementGenerationResult>(
        `/video-prompts/projects/${saved.id}/scenes/${sceneOrder}/choreography`,
        {
          method: "POST",
          timeoutMs: 65_000,
          body: { command },
        },
      );
      return { ...result, sceneIndex };
    },
    onSuccess: ({ movementPlan, sceneIndex }) => {
      setProject((previous) => ({
        ...previous,
        scenes: previous.scenes.map((scene, index) =>
          index === sceneIndex ? { ...scene, movementPlan } : scene,
        ),
      }));
      setSaveMessage("Coreografia gerada e salva");
      window.setTimeout(() => setSaveMessage(""), 2200);
    },
  });

  const saveCharacter = useMutation({
    mutationFn: () =>
      apiClient<CharacterProfileRecord>(
        editingCharacterId
          ? `/video-prompts/characters/${editingCharacterId}`
          : "/video-prompts/characters",
        {
          method: editingCharacterId ? "PATCH" : "POST",
          body: characterDraft,
        },
      ),
    onSuccess: (profile) => {
      setEditingCharacterId(profile.id);
      setCharacterDraft(characterInputFromRecord(profile));
      setProject((previous) => ({ ...previous, characterProfileId: profile.id }));
      void queryClient.invalidateQueries({ queryKey: ["video-prompt-characters"] });
    },
  });

  async function reloadProject(id = projectId) {
    if (!id) return;
    const detail = await apiClient<VideoPromptProjectRecord>(
      `/video-prompts/projects/${id}`,
    );
    setProjectId(id);
    setProject(projectFromRecord(detail));
    setCurrentVersion(detail.versions[0]);
    setLoadedVersions(detail.versions);
    setCompareIds([detail.versions[0]?.id ?? "", detail.versions[1]?.id ?? ""]);
  }

  async function uploadCharacterReference(file: File) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setFormErrors(["Envie uma imagem JPG, PNG ou WebP de até 10 MB."]);
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const assetId = crypto.randomUUID();
    const path = `${data.user.id}/${editingCharacterId ?? "draft"}/${assetId}-${file.name}`;
    const upload = await supabase.storage
      .from("marketing-video-references")
      .upload(path, file);
    if (upload.error) {
      setFormErrors([upload.error.message]);
      return;
    }
    setCharacterDraft((previous) => ({
      ...previous,
      referenceAssets: [
        ...previous.referenceAssets,
        {
          id: assetId,
          name: file.name,
          mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
          storagePath: path,
          purpose: previous.consentMode,
        },
      ],
    }));
  }

  async function selectCharacter(id: string) {
    if (!id) {
      setEditingCharacterId(undefined);
      setCharacterDraft(createEmptyCharacterProfile(brand.id));
      setProject((previous) => ({ ...previous, characterProfileId: null }));
      return;
    }
    const detail = await apiClient<CharacterProfileRecord>(
      `/video-prompts/characters/${id}`,
    );
    setEditingCharacterId(id);
    setCharacterDraft(characterInputFromRecord(detail));
    setProject((previous) => ({ ...previous, characterProfileId: id }));
  }

  async function duplicateCharacter() {
    if (!editingCharacterId) return;
    const profile = await apiClient<CharacterProfileRecord>(
      `/video-prompts/characters/${editingCharacterId}/duplicate`,
      { method: "POST" },
    );
    setEditingCharacterId(profile.id);
    setCharacterDraft(characterInputFromRecord(profile));
    setProject((previous) => ({ ...previous, characterProfileId: profile.id }));
    void queryClient.invalidateQueries({ queryKey: ["video-prompt-characters"] });
  }

  async function archiveCharacter() {
    if (!editingCharacterId) return;
    await apiClient(`/video-prompts/characters/${editingCharacterId}/archive`, {
      method: "POST",
    });
    await selectCharacter("");
    void queryClient.invalidateQueries({ queryKey: ["video-prompt-characters"] });
  }

  async function publishToProduction() {
    if (!projectId) return;
    const saved = await persistProject(projectId, project);
    await apiClient(`/video-prompts/projects/${saved.id}/publish`, { method: "POST" });
    setSaveMessage("Enviado manualmente para a produção de conteúdo");
  }

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    generate.mutate({});
  }

  function updateProject<K extends keyof VideoPromptProjectInput>(
    key: K,
    value: VideoPromptProjectInput[K],
  ) {
    setProject((previous) => ({ ...previous, [key]: value }));
    if (formErrors.length) setFormErrors([]);
  }

  function updateScene(
    index: number,
    patch: Partial<VideoPromptProjectInput["scenes"][number]>,
  ) {
    updateProject(
      "scenes",
      project.scenes.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, ...patch } : scene,
      ),
    );
  }

  function moveScene(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= project.scenes.length) return;
    const scenes = [...project.scenes];
    [scenes[index], scenes[target]] = [scenes[target]!, scenes[index]!];
    updateProject(
      "scenes",
      scenes.map((scene, order) => ({ ...scene, order })),
    );
  }

  function duplicateScene(index: number) {
    const source = project.scenes[index]!;
    const scenes = [...project.scenes];
    scenes.splice(index + 1, 0, {
      ...source,
      id: undefined,
      narrativeRole: `${source.narrativeRole} — variação`,
    });
    updateProject(
      "scenes",
      scenes.map((scene, order) => ({ ...scene, order })),
    );
  }

  async function importScript(file: File) {
    const text = await file.text();
    const paragraphs = text
      .split("\n\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (!paragraphs.length) {
      setFormErrors(["O arquivo de roteiro está vazio."]);
      return;
    }
    const sceneDuration = project.duration / paragraphs.length;
    updateProject(
      "scenes",
      paragraphs.map((paragraph, order) => ({
        order,
        startTime: Math.round(order * sceneDuration),
        endTime:
          order === paragraphs.length - 1
            ? project.duration
            : Math.max(
                Math.round(order * sceneDuration) + 1,
                Math.round((order + 1) * sceneDuration),
              ),
        narrativeRole: importedNarrativeRole(order, paragraphs.length),
        characterPresent: ![
          "no-character",
          "product-environment",
          "real-interface",
        ].includes(project.visualMode),
        environment: "",
        action: "",
        characterDirection: "",
        cameraDirection: "",
        lightingDirection: "",
        dialogue: project.scriptMode === "visual-only" ? "" : paragraph,
        narration: "",
        onScreenText: "",
        transition: "corte limpo",
        productEvidenceIds: [],
        continuityNotes: "",
        movementPlan: createMovementPlan(
          ["no-character", "product-environment", "real-interface"].includes(
            project.visualMode,
          )
            ? "no-character"
            : "presenter-talking",
          Math.max(0.5, sceneDuration),
        ),
      })),
    );
  }

  function updateOutput<K extends keyof VideoPromptOutput>(
    key: K,
    value: VideoPromptOutput[K],
  ) {
    if (!currentVersion) return;
    setCurrentVersion({
      ...currentVersion,
      canonicalPrompt: { ...currentVersion.canonicalPrompt, [key]: value },
    });
  }

  const filteredProjects = useMemo(
    () =>
      (projectsQuery.data ?? []).filter((item) => {
        if (filters.character && item.characterProfileId !== filters.character)
          return false;
        if (filters.mode && item.visualMode !== filters.mode) return false;
        if (filters.objective && item.objective !== filters.objective) return false;
        if (filters.feature && item.featureId !== filters.feature) return false;
        if (filters.duration && item.duration !== Number(filters.duration)) return false;
        if (filters.format && item.format !== filters.format) return false;
        if (filters.tool && item.targetTool !== filters.tool) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (filters.from && item.createdAt < new Date(filters.from).toISOString())
          return false;
        return true;
      }),
    [filters, projectsQuery.data],
  );

  const versions = loadedVersions;
  const comparison = compareIds.map(
    (id) =>
      versions.find((version) => version.id === id) ??
      (currentVersion?.id === id ? currentVersion : undefined),
  );

  return (
    <div className={styles.studio}>
      <div className={styles.workspace}>
        <form className={styles.configuration} onSubmit={submit} noValidate>
          <header className={styles.configurationHeader}>
            <div>
              <span>Configuração do vídeo</span>
              <h2>Da proporção ao plano de cena</h2>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => saveProject.mutate()}
              disabled={saveProject.isPending}
            >
              <Save size={16} /> {saveProject.isPending ? "Salvando…" : "Salvar rascunho"}
            </button>
          </header>

          {formErrors.length > 0 && (
            <div className={styles.errorBox} role="alert">
              <strong>Revise antes de continuar</strong>
              <ul>
                {formErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {(saveProject.error ||
            generate.error ||
            saveCharacter.error ||
            saveEditedVersion.error) && (
            <div className={styles.errorBox} role="alert">
              {errorMessage(
                saveProject.error ??
                  generate.error ??
                  saveCharacter.error ??
                  saveEditedVersion.error,
              )}
            </div>
          )}

          <ProgressSection
            number="01"
            title="Formato"
            summary={`${project.aspectRatio} · ${project.duration} s`}
            defaultOpen
          >
            <div className={styles.optionGrid}>
              {videoFormats.map((option) => (
                <ChoiceCard
                  key={option.value}
                  active={project.format === option.value}
                  title={option.label}
                  meta={option.meta}
                  featured={option.value === "short-vertical"}
                  onClick={() =>
                    setProject((previous) => updateFormat(previous, option.value))
                  }
                />
              ))}
            </div>
            {project.format === "custom" && (
              <Field label="Proporção personalizada">
                <input
                  value={project.aspectRatio}
                  onChange={(event) => updateProject("aspectRatio", event.target.value)}
                  placeholder="Ex.: 3:2"
                />
              </Field>
            )}
            <div className={styles.chips} aria-label="Duração sugerida">
              {videoDurations.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={
                    project.duration === option.value ? styles.chipActive : styles.chip
                  }
                  onClick={() =>
                    setProject((previous) => adaptProjectDuration(previous, option.value))
                  }
                >
                  {option.label}
                  {option.value === 50 && <small>Sugestão</small>}
                </button>
              ))}
              <label className={styles.customDuration}>
                Personalizada{" "}
                <input
                  type="number"
                  min={6}
                  max={180}
                  value={project.duration}
                  onChange={(event) =>
                    setProject((previous) =>
                      adaptProjectDuration(previous, Number(event.target.value) || 6),
                    )
                  }
                />{" "}
                s
              </label>
            </div>
            <div>
              <strong className={styles.groupLabel}>Destinos do vídeo</strong>
              <div className={styles.chips}>
                {[
                  "Instagram Reels",
                  "Instagram Stories",
                  "TikTok",
                  "Facebook",
                  "YouTube",
                  "LinkedIn",
                ].map((channel) => {
                  const selected = project.destinationChannels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      className={selected ? styles.chipActive : styles.chip}
                      onClick={() =>
                        updateProject(
                          "destinationChannels",
                          selected
                            ? project.destinationChannels.filter(
                                (item) => item !== channel,
                              )
                            : [...project.destinationChannels, channel],
                        )
                      }
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>
          </ProgressSection>

          <ProgressSection
            number="02"
            title="Objetivo"
            summary={labelFor(videoObjectives, project.objective)}
            defaultOpen
          >
            <div className={styles.selectGrid}>
              {videoObjectives.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    project.objective === value
                      ? styles.selectActive
                      : styles.selectButton
                  }
                  onClick={() => updateProject("objective", value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {project.objective === "custom" && (
              <Field label="Objetivo personalizado">
                <textarea
                  value={project.customObjective}
                  onChange={(event) =>
                    updateProject("customObjective", event.target.value)
                  }
                />
              </Field>
            )}
          </ProgressSection>

          <ProgressSection
            number="03"
            title="Modalidade visual"
            summary={labelFor(visualModes, project.visualMode)}
            defaultOpen
          >
            <div className={styles.modeGrid}>
              {visualModes.map(([value, label, description]) => (
                <ChoiceCard
                  key={value}
                  active={project.visualMode === value}
                  title={label}
                  description={description}
                  onClick={() => updateProject("visualMode", value)}
                />
              ))}
            </div>
          </ProgressSection>

          <ProgressSection
            number="04"
            title="Tema e Mundo da Marca"
            summary={project.creativeBrief.topic}
            defaultOpen
          >
            <Field label="Tema ou funcionalidade">
              <select
                value={project.topicId ?? ""}
                onChange={(event) => {
                  const selected = event.target.value;
                  const resource = topics.find((item) => item.id === selected);
                  updateProject("topicId", selected || null);
                  if (resource)
                    updateProject("creativeBrief", {
                      ...project.creativeBrief,
                      topic: resource.title,
                    });
                }}
              >
                <option value="">
                  Escolha no Mundo da Marca ou use um tema sugerido
                </option>
                {topics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.chips}>
              {lucroCaseiroTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={
                    project.creativeBrief.topic === topic
                      ? styles.chipActive
                      : styles.chip
                  }
                  onClick={() =>
                    updateProject("creativeBrief", { ...project.creativeBrief, topic })
                  }
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className={styles.twoColumns}>
              <Field label="Funcionalidade comprovada">
                <select
                  value={project.featureId ?? ""}
                  onChange={(event) =>
                    updateProject("featureId", event.target.value || null)
                  }
                >
                  <option value="">Nenhuma selecionada</option>
                  {features.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Público">
                <select
                  value={project.audienceId ?? ""}
                  onChange={(event) =>
                    updateProject("audienceId", event.target.value || null)
                  }
                >
                  <option value="">Definir por descrição</option>
                  {audiences.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dor ou desejo">
                <textarea
                  value={project.creativeBrief.painOrDesire}
                  onChange={(event) =>
                    updateProject("creativeBrief", {
                      ...project.creativeBrief,
                      painOrDesire: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Ângulo">
                <textarea
                  value={project.angle}
                  onChange={(event) => updateProject("angle", event.target.value)}
                  placeholder="Ex.: do preço no chute à decisão com clareza"
                />
              </Field>
              <Field label="Estágio do funil">
                <select
                  value={project.funnelStage}
                  onChange={(event) => updateProject("funnelStage", event.target.value)}
                >
                  <option>descoberta</option>
                  <option>consideração</option>
                  <option>decisão</option>
                  <option>ativação</option>
                </select>
              </Field>
              <Field label="Uma única chamada para ação">
                <input
                  value={project.cta}
                  onChange={(event) => updateProject("cta", event.target.value)}
                />
              </Field>
            </div>
            <Field label="Fatos de apoio, um por linha">
              <textarea
                value={project.creativeBrief.supportingFacts.join("\n")}
                onChange={(event) =>
                  updateProject("creativeBrief", {
                    ...project.creativeBrief,
                    supportingFacts: lines(event.target.value),
                  })
                }
              />
            </Field>
            <Field label="IDs ou caminhos de screenshots e gravações reais, um por linha">
              <textarea
                value={project.creativeBrief.productEvidenceIds.join("\n")}
                onChange={(event) =>
                  updateProject("creativeBrief", {
                    ...project.creativeBrief,
                    productEvidenceIds: lines(event.target.value),
                  })
                }
                placeholder="Sem material, a tela ficará fora de foco ou ilegível."
              />
            </Field>
          </ProgressSection>

          <ProgressSection
            number="05"
            title="Personagem"
            summary={
              characters.find((item) => item.id === project.characterProfileId)
                ?.internalName ?? "Sem ficha selecionada"
            }
            id="influenciadora-ia"
            defaultOpen={
              initialFocus === "influencer" || project.visualMode === "new-presenter"
            }
          >
            <CharacterEditor
              characters={characters}
              selectedId={editingCharacterId}
              draft={characterDraft}
              usageCount={characterDetailQuery.data?.projects?.length ?? 0}
              pending={saveCharacter.isPending}
              onSelect={(id) => void selectCharacter(id)}
              onChange={setCharacterDraft}
              onSave={() => saveCharacter.mutate()}
              onDuplicate={() => void duplicateCharacter()}
              onArchive={() => void archiveCharacter()}
              onUpload={(file) => void uploadCharacterReference(file)}
            />
          </ProgressSection>

          <ProgressSection
            number="06"
            title="Roteiro e cenas"
            summary={`${project.scenes.length} cenas · ${labelFor(scriptModes, project.scriptMode)}`}
            defaultOpen
          >
            <div className={styles.chips}>
              {scriptModes.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    project.scriptMode === value ? styles.chipActive : styles.chip
                  }
                  onClick={() => updateProject("scriptMode", value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {project.scriptMode === "imported" && (
              <label className={styles.importScript}>
                <FileClock size={16} /> Importar TXT ou Markdown
                <input
                  type="file"
                  accept="text/plain,text/markdown,.txt,.md"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importScript(file);
                  }}
                />
              </label>
            )}
            <div className={styles.timeline}>
              {project.scenes.map((scene, index) => (
                <details
                  className={styles.scene}
                  key={`${scene.order}-${scene.startTime}`}
                  open={index === 0}
                >
                  <summary>
                    <span>
                      {scene.startTime}–{scene.endTime}s
                    </span>
                    <strong>{scene.narrativeRole}</strong>
                    <ChevronDown size={16} />
                  </summary>
                  <div className={styles.sceneBody}>
                    <div className={styles.sceneActions}>
                      <button
                        type="button"
                        title="Mover para cima"
                        onClick={() => moveScene(index, -1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        title="Mover para baixo"
                        onClick={() => moveScene(index, 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button type="button" onClick={() => duplicateScene(index)}>
                        <Copy size={15} /> Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateProject(
                            "scenes",
                            project.scenes
                              .filter((_, sceneIndex) => sceneIndex !== index)
                              .map((item, order) => ({ ...item, order })),
                          )
                        }
                        disabled={project.scenes.length === 1}
                      >
                        <Trash2 size={15} /> Remover
                      </button>
                    </div>
                    <div className={styles.threeColumns}>
                      <Field label="Início (s)">
                        <input
                          type="number"
                          min={0}
                          value={scene.startTime}
                          onChange={(event) =>
                            updateScene(index, { startTime: Number(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Fim (s)">
                        <input
                          type="number"
                          min={1}
                          value={scene.endTime}
                          onChange={(event) =>
                            updateScene(index, { endTime: Number(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Função narrativa">
                        <input
                          value={scene.narrativeRole}
                          onChange={(event) =>
                            updateScene(index, { narrativeRole: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={scene.characterPresent}
                        onChange={(event) =>
                          updateScene(index, { characterPresent: event.target.checked })
                        }
                      />{" "}
                      Personagem presente
                    </label>
                    <div className={styles.twoColumns}>
                      <Field label="Ambiente">
                        <textarea
                          value={scene.environment}
                          onChange={(event) =>
                            updateScene(index, { environment: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Ação principal">
                        <textarea
                          value={scene.action}
                          onChange={(event) =>
                            updateScene(index, { action: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Personagem: expressão, gesto e postura">
                        <textarea
                          value={scene.characterDirection}
                          onChange={(event) =>
                            updateScene(index, { characterDirection: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Enquadramento e câmera">
                        <textarea
                          value={scene.cameraDirection}
                          onChange={(event) =>
                            updateScene(index, { cameraDirection: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Fala">
                        <textarea
                          value={scene.dialogue}
                          onChange={(event) =>
                            updateScene(index, { dialogue: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Narração">
                        <textarea
                          value={scene.narration}
                          onChange={(event) =>
                            updateScene(index, { narration: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Texto na tela">
                        <input
                          value={scene.onScreenText}
                          onChange={(event) =>
                            updateScene(index, { onScreenText: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Elemento real do Lucro Caseiro">
                        <input
                          value={scene.productEvidenceIds.join(", ")}
                          onChange={(event) =>
                            updateScene(index, {
                              productEvidenceIds: event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </Field>
                      <Field label="Transição">
                        <input
                          value={scene.transition}
                          onChange={(event) =>
                            updateScene(index, { transition: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Continuidade">
                        <textarea
                          value={scene.continuityNotes}
                          onChange={(event) =>
                            updateScene(index, { continuityNotes: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <MovementDirector
                      scene={scene}
                      nextScene={project.scenes[index + 1]}
                      pending={
                        generateMovement.isPending &&
                        generateMovement.variables?.sceneIndex === index
                      }
                      onChange={(movementPlan) => updateScene(index, { movementPlan })}
                      onGenerate={(command) =>
                        generateMovement.mutate({ sceneIndex: index, command })
                      }
                    />
                  </div>
                </details>
              ))}
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                updateProject("scenes", [
                  ...project.scenes,
                  {
                    ...project.scenes.at(-1)!,
                    id: undefined,
                    order: project.scenes.length,
                    startTime: project.scenes.at(-1)!.endTime,
                    endTime: Math.min(
                      project.duration,
                      project.scenes.at(-1)!.endTime + 4,
                    ),
                    narrativeRole: "Nova cena",
                  },
                ])
              }
            >
              <Plus size={16} /> Adicionar cena
            </button>
          </ProgressSection>

          <ProgressSection
            number="07"
            title="Direção audiovisual"
            summary={`${project.direction.realism} · ${project.direction.environment}`}
          >
            <div className={styles.twoColumns}>
              <Field label="Ambiente">
                <select
                  value={project.direction.environment}
                  onChange={(event) =>
                    updateProject("direction", {
                      ...project.direction,
                      environment: event.target.value,
                    })
                  }
                >
                  {environments.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Realismo">
                <select
                  value={project.direction.realism}
                  onChange={(event) =>
                    updateProject("direction", {
                      ...project.direction,
                      realism: event.target
                        .value as VideoPromptProjectInput["direction"]["realism"],
                    })
                  }
                >
                  <option value="documentary">Documental</option>
                  <option value="spontaneous-ugc">UGC espontâneo</option>
                  <option value="editorial">Editorial</option>
                  <option value="naturalistic-advertising">
                    Publicitário naturalista
                  </option>
                  <option value="cinematic">Cinematográfico</option>
                  <option value="product-demo">Demonstração de produto</option>
                </select>
              </Field>
              <Field label="Iluminação">
                <select
                  value={project.direction.lighting}
                  onChange={(event) =>
                    updateProject("direction", {
                      ...project.direction,
                      lighting: event.target.value,
                    })
                  }
                >
                  <option>luz natural lateral, suave e difusa</option>
                  <option>Luz natural</option>
                  <option>Janela lateral</option>
                  <option>Suave e difusa</option>
                  <option>Fim de tarde</option>
                  <option>Estúdio naturalista</option>
                  <option>Personalizada</option>
                </select>
              </Field>
            </div>
            <DirectionGroup title="Personagem">
              {(
                [
                  ["expression", "Expressão"],
                  ["energy", "Energia"],
                  ["eyeContact", "Contato visual"],
                  ["gestures", "Gestos"],
                  ["posture", "Postura"],
                  ["movementSpeed", "Velocidade dos movimentos"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={project.direction.character[key]}
                    onChange={(event) =>
                      updateProject("direction", {
                        ...project.direction,
                        character: {
                          ...project.direction.character,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </DirectionGroup>
            <DirectionGroup title="Voz">
              {(
                [
                  ["language", "Idioma e variante regional"],
                  ["vocalGender", "Gênero vocal opcional"],
                  ["apparentAge", "Faixa etária aparente"],
                  ["warmth", "Calor"],
                  ["energy", "Energia"],
                  ["speed", "Velocidade"],
                  ["pauses", "Pausas e respiração"],
                  ["intonation", "Entonação"],
                  ["savedVoice", "Voz salva ou nome na ferramenta"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={project.direction.voice[key]}
                    onChange={(event) =>
                      updateProject("direction", {
                        ...project.direction,
                        voice: {
                          ...project.direction.voice,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </DirectionGroup>
            <DirectionGroup title="Câmera">
              {(
                [
                  ["focalLength", "Distância focal"],
                  ["shot", "Plano"],
                  ["height", "Altura"],
                  ["angle", "Ângulo"],
                  ["movement", "Movimento"],
                  ["depthOfField", "Profundidade de campo"],
                  ["stability", "Estabilidade"],
                  ["speed", "Velocidade"],
                  ["perspective", "Smartphone ou câmera profissional"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={project.direction.camera[key]}
                    onChange={(event) =>
                      updateProject("direction", {
                        ...project.direction,
                        camera: {
                          ...project.direction.camera,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </DirectionGroup>
          </ProgressSection>

          <ProgressSection
            number="08"
            title="Geração do prompt"
            summary={
              project.targetTool
                ? (tools.find((tool) => tool.id === project.targetTool)?.label ??
                  project.targetTool)
                : "Canônico independente"
            }
            defaultOpen
          >
            <div className={styles.twoColumns}>
              <Field label="Título do projeto">
                <input
                  value={project.title}
                  onChange={(event) => updateProject("title", event.target.value)}
                />
              </Field>
              <Field label="Ferramenta de destino (opcional)">
                <select
                  value={project.targetTool ?? ""}
                  onChange={(event) =>
                    updateProject("targetTool", event.target.value || null)
                  }
                >
                  <option value="">Prompt canônico, sem adaptação</option>
                  {tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className={styles.generatePanel}>
              <div>
                <Sparkles />
                <strong>
                  O prompt só é salvo depois de passar pelo contrato de qualidade.
                </strong>
                <span>Interface e resultados sem evidência não serão inventados.</span>
              </div>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={generate.isPending}
              >
                {generate.isPending ? (
                  <LoaderCircle className={styles.spin} />
                ) : (
                  <WandSparkles />
                )}{" "}
                {generate.isPending
                  ? "Gerando e validando…"
                  : "Gerar prompt profissional"}
              </button>
            </div>
          </ProgressSection>
        </form>

        <section ref={resultRef} className={styles.result} aria-labelledby="result-title">
          <header className={styles.resultHeader}>
            <div>
              <span>Resultado gerado</span>
              <h2 id="result-title">Direção pronta para produzir</h2>
            </div>
            {currentVersion && <strong>v{currentVersion.version}</strong>}
          </header>

          {similarityDecision && (
            <div className={styles.similarityBox}>
              <strong>Há semelhança narrativa ou visual com o histórico recente.</strong>
              {similarityDecision.similarityWarnings.map((warning) => (
                <p key={warning.projectId}>
                  {warning.message}{" "}
                  <small>{warning.matchingDimensions.join(" · ")}</small>
                </p>
              ))}
              <div className={styles.actionRow}>
                <button
                  type="button"
                  onClick={() => generate.mutate({ similarityResolution: "keep" })}
                >
                  Manter mesmo assim
                </button>
                <button
                  type="button"
                  onClick={() => generate.mutate({ similarityResolution: "new-hook" })}
                >
                  Trocar só o gancho
                </button>
                <button
                  type="button"
                  onClick={() => generate.mutate({ similarityResolution: "new-setting" })}
                >
                  Trocar só o cenário
                </button>
                <button
                  type="button"
                  onClick={() =>
                    generate.mutate({ similarityResolution: "alternative-direction" })
                  }
                >
                  Direção alternativa
                </button>
              </div>
            </div>
          )}

          {!currentVersion ? (
            <div className={styles.emptyResult}>
              <Film size={42} />
              <h3>O prompt aparecerá em blocos editáveis.</h3>
              <p>
                Configure formato e objetivo primeiro. Você não precisa escolher uma
                campanha.
              </p>
            </div>
          ) : (
            <PromptResult
              version={currentVersion}
              tools={tools}
              projectStatus={project.status}
              onChange={updateOutput}
              onGenerate={(adjustment, sceneOrder) =>
                generate.mutate({ adjustment, sceneOrder })
              }
              onSave={() => saveEditedVersion.mutate()}
              onStatus={(status) => updateProject("status", status)}
              onPublish={() => void publishToProduction()}
              onAdaptDuration={() => {
                const adapted = adaptProjectDuration(
                  project,
                  project.duration === 50 ? 30 : 50,
                );
                setProject(adapted);
                generate.mutate({ projectOverride: adapted });
              }}
              onAdaptRatio={() => {
                const adapted = updateFormat(
                  project,
                  project.format === "horizontal" ? "short-vertical" : "horizontal",
                );
                setProject(adapted);
                generate.mutate({ projectOverride: adapted });
              }}
            />
          )}

          {saveMessage && (
            <div className={styles.saveToast} role="status">
              <Check size={16} /> {saveMessage}
            </div>
          )}
        </section>
      </div>

      <details className={styles.history} open>
        <summary>
          <span>
            <FileClock /> Histórico e versões
          </span>
          <strong>{filteredProjects.length} projetos</strong>
          <ChevronDown />
        </summary>
        <div className={styles.historyBody}>
          <div className={styles.filters}>
            <FilterSelect
              label="Personagem"
              value={filters.character}
              onChange={(value) => setFilters({ ...filters, character: value })}
              options={characters.map((item) => [item.id, item.internalName])}
            />
            <FilterSelect
              label="Modalidade"
              value={filters.mode}
              onChange={(value) => setFilters({ ...filters, mode: value })}
              options={visualModes.map(([value, label]) => [value, label])}
            />
            <FilterSelect
              label="Objetivo"
              value={filters.objective}
              onChange={(value) => setFilters({ ...filters, objective: value })}
              options={videoObjectives.map(([value, label]) => [value, label])}
            />
            <FilterSelect
              label="Funcionalidade"
              value={filters.feature}
              onChange={(value) => setFilters({ ...filters, feature: value })}
              options={features.map((item) => [item.id, item.title])}
            />
            <FilterSelect
              label="Duração"
              value={filters.duration}
              onChange={(value) => setFilters({ ...filters, duration: value })}
              options={videoDurations.map((item) => [String(item.value), item.label])}
            />
            <FilterSelect
              label="Formato"
              value={filters.format}
              onChange={(value) => setFilters({ ...filters, format: value })}
              options={videoFormats.map((item) => [item.value, item.label])}
            />
            <FilterSelect
              label="Ferramenta"
              value={filters.tool}
              onChange={(value) => setFilters({ ...filters, tool: value })}
              options={tools.map((item) => [item.id, item.label])}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                ["draft", "Rascunho"],
                ["ready", "Pronto"],
                ["tested", "Testado"],
                ["approved", "Aprovado"],
                ["archived", "Arquivado"],
              ]}
            />
            <Field label="Criado desde">
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters({ ...filters, from: event.target.value })}
              />
            </Field>
          </div>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setFilters(emptyFilters)}
          >
            Limpar filtros
          </button>
          <div className={styles.historyGrid}>
            {filteredProjects.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  item.id === projectId ? styles.historyCardActive : styles.historyCard
                }
                onClick={() => void reloadProject(item.id)}
              >
                <span>
                  {item.aspectRatio} · {item.duration}s
                </span>
                <strong>{item.title}</strong>
                <small>
                  {labelFor(visualModes, item.visualMode)} · {statusLabel(item.status)}
                </small>
                <time>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</time>
              </button>
            ))}
          </div>
          {versions.length > 1 && (
            <VersionComparison
              versions={versions}
              selected={compareIds}
              onSelect={setCompareIds}
              comparison={comparison}
            />
          )}
        </div>
      </details>
    </div>
  );
}

function MovementDirector({
  scene,
  nextScene,
  pending,
  onChange,
  onGenerate,
}: {
  scene: VideoPromptProjectInput["scenes"][number];
  nextScene?: VideoPromptProjectInput["scenes"][number];
  pending: boolean;
  onChange: (plan: SceneMovementPlan) => void;
  onGenerate: (command: MovementCommand) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<SceneMovementAction["category"]>(
    scene.characterPresent ? "character" : "object",
  );
  const plan = scene.movementPlan;
  const sceneDuration = Math.max(0.1, scene.endTime - scene.startTime);
  const categoryActions = plan.actions
    .map((movement, index) => ({ movement, index }))
    .filter(({ movement }) => movement.category === activeCategory);
  const warnings = movementEditorWarnings(scene, nextScene);

  function updateAction(index: number, patch: Partial<SceneMovementAction>) {
    onChange({
      ...plan,
      actions: plan.actions.map((movement, movementIndex) =>
        movementIndex === index ? { ...movement, ...patch } : movement,
      ),
    });
  }

  function addAction() {
    const type = movementSuggestions[activeCategory][0]!;
    onChange({
      ...plan,
      actions: [
        ...plan.actions,
        createMovementAction(activeCategory, type, sceneDuration),
      ],
    });
  }

  function updateContinuity(patch: Partial<SceneMovementPlan["continuity"]>) {
    onChange({
      ...plan,
      continuity: { ...plan.continuity, ...patch },
    });
  }

  return (
    <section className={styles.movementDirector} aria-label="Diretor de movimento">
      <header className={styles.movementHeader}>
        <div>
          <span>Diretor de movimento</span>
          <h4>Movimentos</h4>
          <p>Coreografia temporal, observável e compatível com este plano.</p>
        </div>
        <Field label="Preset editável">
          <select
            value={plan.preset ?? ""}
            onChange={(event) =>
              onChange(
                createMovementPlan(
                  (event.target.value || null) as SceneMovementPlan["preset"],
                  sceneDuration,
                ),
              )
            }
          >
            <option value="">Sem preset</option>
            {movementPresets.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </header>

      {plan.preset && (
        <p className={styles.presetNote}>
          {movementPresets.find(([value]) => value === plan.preset)?.[2]}
        </p>
      )}

      <div className={styles.twoColumns}>
        <Field label="Intensidade geral">
          <select
            value={plan.intensity}
            onChange={(event) =>
              onChange({
                ...plan,
                intensity: event.target.value as SceneMovementPlan["intensity"],
              })
            }
          >
            {movementIntensities.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Velocidade geral">
          <select
            value={plan.speed}
            onChange={(event) =>
              onChange({
                ...plan,
                speed: event.target.value as SceneMovementPlan["speed"],
              })
            }
          >
            {movementSpeeds.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {plan.intensity === "custom" && (
          <Field label="Intensidade personalizada">
            <input
              value={plan.customIntensity}
              onChange={(event) =>
                onChange({ ...plan, customIntensity: event.target.value })
              }
            />
          </Field>
        )}
        {plan.speed === "custom" && (
          <Field label="Velocidade personalizada">
            <input
              value={plan.customSpeed}
              onChange={(event) => onChange({ ...plan, customSpeed: event.target.value })}
            />
          </Field>
        )}
      </div>

      <div className={styles.movementScore} aria-label="Linha do tempo do movimento">
        <div className={styles.scoreRuler}>
          <span>0,0 s</span>
          <span>{(sceneDuration / 2).toFixed(1)} s</span>
          <span>{sceneDuration.toFixed(1)} s</span>
        </div>
        {plan.actions.map((movement, index) => (
          <button
            type="button"
            className={
              movement.category === activeCategory
                ? styles.movementBarActive
                : styles.movementBar
            }
            key={movement.id ?? `${movement.category}-${index}`}
            style={{
              marginLeft: `${Math.min(100, (movement.startTime / sceneDuration) * 100)}%`,
              width: `${Math.max(
                3,
                Math.min(
                  100 - (movement.startTime / sceneDuration) * 100,
                  ((movement.endTime - movement.startTime) / sceneDuration) * 100,
                ),
              )}%`,
            }}
            onClick={() => setActiveCategory(movement.category)}
            title={`${movement.startTime.toFixed(1)}–${movement.endTime.toFixed(1)} s · ${movement.type}`}
          >
            {movement.type}
          </button>
        ))}
      </div>

      <div className={styles.movementCategoryTabs} role="tablist">
        {movementCategories.map(([value, label]) => {
          const count = plan.actions.filter((item) => item.category === value).length;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === value}
              className={activeCategory === value ? styles.chipActive : styles.chip}
              key={value}
              onClick={() => setActiveCategory(value)}
            >
              {label} <small>{count}</small>
            </button>
          );
        })}
      </div>

      <div className={styles.movementActions}>
        {categoryActions.map(({ movement, index }) => (
          <details className={styles.movementAction} key={movement.id ?? index} open>
            <summary>
              <strong>{movement.type}</strong>
              <span>
                {movement.startTime.toFixed(1)}–{movement.endTime.toFixed(1)} s
              </span>
              <ChevronDown size={15} />
            </summary>
            <div>
              <div className={styles.threeColumns}>
                <Field label="Sugestão">
                  <select
                    value={
                      movementSuggestions[movement.category].includes(movement.type)
                        ? movement.type
                        : movementSuggestions[movement.category].at(-1)
                    }
                    onChange={(event) =>
                      updateAction(index, {
                        type: event.target.value,
                        action: event.target.value,
                      })
                    }
                  >
                    {movementSuggestions[movement.category].map((suggestion) => (
                      <option key={suggestion} value={suggestion}>
                        {suggestion}
                      </option>
                    ))}
                  </select>
                </Field>
                {(!movementSuggestions[movement.category].includes(movement.type) ||
                  movement.type.includes("personaliz")) && (
                  <Field label="Movimento personalizado">
                    <input
                      value={movement.type}
                      onChange={(event) =>
                        updateAction(index, {
                          type: event.target.value,
                          action: event.target.value,
                        })
                      }
                    />
                  </Field>
                )}
                <Field label="Início relativo (s)">
                  <input
                    type="number"
                    min={0}
                    max={sceneDuration}
                    step={0.1}
                    value={movement.startTime}
                    onChange={(event) =>
                      updateAction(index, { startTime: Number(event.target.value) })
                    }
                  />
                </Field>
                <Field label="Fim relativo (s)">
                  <input
                    type="number"
                    min={0.1}
                    max={sceneDuration}
                    step={0.1}
                    value={movement.endTime}
                    onChange={(event) =>
                      updateAction(index, { endTime: Number(event.target.value) })
                    }
                  />
                </Field>
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={movement.primary}
                  onChange={(event) =>
                    updateAction(index, { primary: event.target.checked })
                  }
                />
                Ação principal deste plano
              </label>
              <Field label="O que acontece — sem descrições vagas">
                <textarea
                  value={movement.instruction}
                  onChange={(event) =>
                    updateAction(index, { instruction: event.target.value })
                  }
                />
              </Field>
              <div className={styles.threeColumns}>
                <Field label="Posição inicial">
                  <input
                    value={movement.initialPosition}
                    onChange={(event) =>
                      updateAction(index, { initialPosition: event.target.value })
                    }
                  />
                </Field>
                <Field label="Direção">
                  <input
                    value={movement.direction}
                    onChange={(event) =>
                      updateAction(index, { direction: event.target.value })
                    }
                  />
                </Field>
                <Field label="Posição final">
                  <input
                    value={movement.finalPosition}
                    onChange={(event) =>
                      updateAction(index, { finalPosition: event.target.value })
                    }
                  />
                </Field>
                <Field label="Velocidade">
                  <select
                    value={movement.speed}
                    onChange={(event) =>
                      updateAction(index, {
                        speed: event.target.value as SceneMovementAction["speed"],
                      })
                    }
                  >
                    {movementSpeeds.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Amplitude">
                  <input
                    value={movement.amplitude}
                    onChange={(event) =>
                      updateAction(index, { amplitude: event.target.value })
                    }
                  />
                </Field>
                <Field label="Objeto ou pessoa envolvida">
                  <input
                    value={movement.involvedSubject}
                    onChange={(event) =>
                      updateAction(index, { involvedSubject: event.target.value })
                    }
                  />
                </Field>
                <Field label="Intensidade">
                  <select
                    value={movement.intensity}
                    onChange={(event) =>
                      updateAction(index, {
                        intensity: event.target.value as SceneMovementAction["intensity"],
                      })
                    }
                  >
                    {movementIntensities.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Continuidade para o próximo plano">
                  <input
                    value={movement.continuity}
                    onChange={(event) =>
                      updateAction(index, { continuity: event.target.value })
                    }
                  />
                </Field>
                {movement.speed === "custom" && (
                  <Field label="Velocidade personalizada">
                    <input
                      value={movement.customSpeed}
                      onChange={(event) =>
                        updateAction(index, { customSpeed: event.target.value })
                      }
                    />
                  </Field>
                )}
                {movement.intensity === "custom" && (
                  <Field label="Intensidade personalizada">
                    <input
                      value={movement.customIntensity}
                      onChange={(event) =>
                        updateAction(index, { customIntensity: event.target.value })
                      }
                    />
                  </Field>
                )}
              </div>

              {movement.category === "gesture-hands" && (
                <div className={styles.threeColumns}>
                  <Field label="Mão utilizada">
                    <select
                      value={movement.hand}
                      onChange={(event) =>
                        updateAction(index, {
                          hand: event.target.value as SceneMovementAction["hand"],
                        })
                      }
                    >
                      <option value="none">Nenhuma</option>
                      <option value="left">Esquerda</option>
                      <option value="right">Direita</option>
                      <option value="both">Ambas</option>
                    </select>
                  </Field>
                  <Field label="Posição inicial das mãos">
                    <input
                      value={movement.handsInitialPosition}
                      onChange={(event) =>
                        updateAction(index, {
                          handsInitialPosition: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Objeto tocado">
                    <input
                      value={movement.touchedObject}
                      onChange={(event) =>
                        updateAction(index, { touchedObject: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Gesto">
                    <input
                      value={movement.gesture}
                      onChange={(event) =>
                        updateAction(index, { gesture: event.target.value })
                      }
                    />
                  </Field>
                </div>
              )}

              {movement.category === "camera" && (
                <div className={styles.threeColumns}>
                  {(
                    [
                      ["distance", "Distância"],
                      ["stability", "Estabilidade"],
                      ["startPoint", "Ponto inicial"],
                      ["endPoint", "Ponto final"],
                      ["trackedObject", "Objeto acompanhado"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field label={label} key={key}>
                      <input
                        value={movement[key]}
                        onChange={(event) =>
                          updateAction(index, { [key]: event.target.value })
                        }
                      />
                    </Field>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.dangerButton}
                onClick={() =>
                  onChange({
                    ...plan,
                    actions: plan.actions.filter(
                      (_, movementIndex) => movementIndex !== index,
                    ),
                  })
                }
              >
                <Trash2 size={14} /> Remover movimento
              </button>
            </div>
          </details>
        ))}
        {categoryActions.length === 0 && (
          <p className={styles.movementEmpty}>
            Nenhum movimento nesta categoria. Adicione apenas se ele ajudar a ação
            principal.
          </p>
        )}
        <button type="button" className={styles.secondaryButton} onClick={addAction}>
          <Plus size={15} /> Adicionar em {labelFor(movementCategories, activeCategory)}
        </button>
      </div>

      <details className={styles.continuityPanel}>
        <summary>
          <strong>Estado físico e continuidade</strong>
          <span>corpo, olhar, objetos, luz e eixo</span>
          <ChevronDown size={15} />
        </summary>
        <div className={styles.threeColumns}>
          {(
            [
              ["initialBodyPosition", "Corpo no início"],
              ["finalBodyPosition", "Corpo no fim"],
              ["initialGazeDirection", "Olhar no início"],
              ["finalGazeDirection", "Olhar no fim"],
              ["objectLocationsStart", "Objetos no início"],
              ["objectLocationsEnd", "Objetos no fim"],
              ["clothingAndAccessories", "Roupa e acessórios"],
              ["lightingDirection", "Direção da luz"],
              ["cameraAxis", "Eixo de câmera"],
            ] as const
          ).map(([key, label]) => (
            <Field label={label} key={key}>
              <input
                value={plan.continuity[key]}
                onChange={(event) => updateContinuity({ [key]: event.target.value })}
              />
            </Field>
          ))}
          <Field label="Lado de entrada">
            <FrameSideSelect
              value={plan.continuity.entrySide}
              onChange={(entrySide) => updateContinuity({ entrySide })}
            />
          </Field>
          <Field label="Lado de saída">
            <FrameSideSelect
              value={plan.continuity.exitSide}
              onChange={(exitSide) => updateContinuity({ exitSide })}
            />
          </Field>
          <HeldObjectField
            label="Objeto segurado no início"
            value={plan.continuity.heldObjectsStart[0]}
            onChange={(value) =>
              updateContinuity({ heldObjectsStart: value ? [value] : [] })
            }
          />
          <HeldObjectField
            label="Objeto segurado no fim"
            value={plan.continuity.heldObjectsEnd[0]}
            onChange={(value) =>
              updateContinuity({ heldObjectsEnd: value ? [value] : [] })
            }
          />
        </div>
      </details>

      {warnings.length > 0 && (
        <div className={styles.movementWarnings} role="alert">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}

      <div className={styles.twoColumns}>
        <Field label="Prompt de movimento da cena">
          <textarea
            value={plan.movementPrompt}
            onChange={(event) =>
              onChange({ ...plan, movementPrompt: event.target.value })
            }
          />
        </Field>
        <Field label="Prompt negativo de movimento">
          <textarea
            value={plan.negativePrompt}
            onChange={(event) =>
              onChange({ ...plan, negativePrompt: event.target.value })
            }
          />
        </Field>
      </div>

      <div className={styles.movementCommandBar}>
        {movementCommands.map(([command, label], index) => (
          <button
            type="button"
            className={index === 0 ? styles.primaryButton : styles.secondaryButton}
            key={command}
            disabled={pending}
            onClick={() => onGenerate(command)}
          >
            {index === 0 &&
              (pending ? (
                <LoaderCircle className={styles.spin} size={15} />
              ) : (
                <WandSparkles size={15} />
              ))}
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function FrameSideSelect({
  value,
  onChange,
}: {
  value: SceneMovementPlan["continuity"]["entrySide"];
  onChange: (value: SceneMovementPlan["continuity"]["entrySide"]) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value as SceneMovementPlan["continuity"]["entrySide"])
      }
    >
      <option value="none">Permanece no quadro</option>
      <option value="left">Esquerda</option>
      <option value="right">Direita</option>
      <option value="top">Acima</option>
      <option value="bottom">Abaixo</option>
    </select>
  );
}

type HeldObject = SceneMovementPlan["continuity"]["heldObjectsStart"][number];

function HeldObjectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: HeldObject;
  onChange: (value?: HeldObject) => void;
}) {
  return (
    <div className={styles.heldObjectField}>
      <Field label={label}>
        <input
          value={value?.object ?? ""}
          placeholder="Ex.: celular"
          onChange={(event) =>
            onChange(
              event.target.value
                ? {
                    object: event.target.value,
                    hand: value?.hand ?? "right",
                    orientation: value?.orientation ?? "",
                  }
                : undefined,
            )
          }
        />
      </Field>
      <select
        aria-label={`Mão — ${label}`}
        value={value?.hand ?? "right"}
        disabled={!value}
        onChange={(event) =>
          value && onChange({ ...value, hand: event.target.value as HeldObject["hand"] })
        }
      >
        <option value="left">Mão esquerda</option>
        <option value="right">Mão direita</option>
        <option value="both">Ambas as mãos</option>
      </select>
      <input
        aria-label={`Orientação — ${label}`}
        placeholder="Orientação"
        value={value?.orientation ?? ""}
        disabled={!value}
        onChange={(event) =>
          value && onChange({ ...value, orientation: event.target.value })
        }
      />
    </div>
  );
}

function createMovementAction(
  category: SceneMovementAction["category"],
  type: string,
  duration: number,
): SceneMovementAction {
  return {
    id: crypto.randomUUID(),
    category,
    type,
    startTime: 0,
    endTime: Math.min(duration, Math.max(0.5, duration / 2)),
    instruction: `Descreva exatamente como ${type} acontece neste intervalo.`,
    initialPosition: "",
    action: type,
    direction: "",
    speed: "natural",
    customSpeed: "",
    amplitude: "pequena e controlada",
    finalPosition: "",
    involvedSubject: "",
    intensity: "subtle-natural",
    customIntensity: "",
    continuity: "",
    hand: "none",
    handsInitialPosition: "dedos relaxados e articulações naturais",
    touchedObject: "",
    gesture: "",
    distance: "",
    stability: "estável",
    startPoint: "",
    endPoint: "",
    trackedObject: "",
    primary: false,
  };
}

function movementEditorWarnings(
  scene: VideoPromptProjectInput["scenes"][number],
  nextScene?: VideoPromptProjectInput["scenes"][number],
) {
  const warnings: string[] = [];
  const duration = scene.endTime - scene.startTime;
  if (scene.movementPlan.actions.some((movement) => movement.endTime > duration))
    warnings.push(`Há movimento fora dos ${duration.toFixed(1)} segundos da cena.`);
  const actions = [...scene.movementPlan.actions].sort(
    (left, right) => left.startTime - right.startTime,
  );
  if (
    actions.some((left, index) =>
      actions
        .slice(index + 1)
        .some((right) => right.startTime < left.endTime && left.primary && right.primary),
    )
  )
    warnings.push(
      "Duas ações principais estão sobrepostas. Mantenha uma ação dominante.",
    );
  if (nextScene) {
    const currentState = scene.movementPlan.continuity;
    const nextState = nextScene.movementPlan.continuity;
    if (
      currentState.finalBodyPosition &&
      nextState.initialBodyPosition &&
      currentState.finalBodyPosition !== nextState.initialBodyPosition
    )
      warnings.push("A posição final não coincide com o início da próxima cena.");
    for (const held of currentState.heldObjectsEnd) {
      const next = nextState.heldObjectsStart.find(
        (item) => item.object.toLowerCase() === held.object.toLowerCase(),
      );
      if (next && next.hand !== held.hand)
        warnings.push(`${held.object} troca de mão no próximo plano sem explicação.`);
    }
  }
  return warnings;
}

function PromptResult({
  version,
  tools,
  projectStatus,
  onChange,
  onGenerate,
  onSave,
  onStatus,
  onPublish,
  onAdaptDuration,
  onAdaptRatio,
}: {
  version: VideoPromptVersionRecord;
  tools: VideoPromptTool[];
  projectStatus: VideoPromptProjectInput["status"];
  onChange: <K extends keyof VideoPromptOutput>(
    key: K,
    value: VideoPromptOutput[K],
  ) => void;
  onGenerate: (adjustment: string, sceneOrder?: number) => void;
  onSave: () => void;
  onStatus: (status: VideoPromptProjectInput["status"]) => void;
  onPublish: () => void;
  onAdaptDuration: () => void;
  onAdaptRatio: () => void;
}) {
  const output = version.canonicalPrompt;
  const movementDirections = output.movementDirections ?? [];
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }
  return (
    <div className={styles.promptBlocks}>
      <div className={styles.resultToolbar}>
        <button type="button" onClick={() => void copy(serializePromptOutput(output))}>
          <Clipboard size={15} /> Copiar tudo
        </button>
        <button type="button" onClick={() => void copy(output.masterPrompt)}>
          <Copy size={15} /> Copiar prompt mestre
        </button>
        <button type="button" onClick={() => onGenerate("more-realistic")}>
          <Sparkles size={15} /> Mais realista
        </button>
        <button type="button" onClick={() => onGenerate("reduce-complexity")}>
          <SlidersHorizontal size={15} /> Reduzir complexidade
        </button>
        <button type="button" onClick={onAdaptDuration}>
          Adaptar duração
        </button>
        <button type="button" onClick={onAdaptRatio}>
          Adaptar proporção
        </button>
        <button type="button" onClick={onSave}>
          <Save size={15} /> Salvar versão
        </button>
      </div>
      <EditableBlock
        number="01"
        title="Resumo criativo"
        value={output.creativeSummary}
        onChange={(value) => onChange("creativeSummary", value)}
      />
      <EditableBlock
        number="02"
        title="Prompt mestre"
        value={output.masterPrompt}
        large
        onChange={(value) => onChange("masterPrompt", value)}
      />
      <EditableBlock
        number="03"
        title="Identidade fixa da personagem"
        value={output.fixedCharacterIdentity}
        onChange={(value) => onChange("fixedCharacterIdentity", value)}
      />
      <section className={styles.outputBlock}>
        <header>
          <span>04</span>
          <h3>Direção de cada cena</h3>
        </header>
        {output.sceneDirections.map((scene, index) => (
          <article className={styles.outputScene} key={`${scene.order}-${scene.time}`}>
            <div>
              <strong>{scene.time}</strong>
              <button type="button" onClick={() => void copy(scene.direction)}>
                Copiar cena
              </button>
              <button type="button" onClick={() => onGenerate("none", scene.order)}>
                <RefreshCw size={13} /> Regenerar
              </button>
            </div>
            <textarea
              value={scene.direction}
              onChange={(event) =>
                onChange(
                  "sceneDirections",
                  output.sceneDirections.map((item, sceneIndex) =>
                    sceneIndex === index
                      ? { ...item, direction: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </article>
        ))}
      </section>
      <section className={styles.outputBlock}>
        <header>
          <span>05</span>
          <h3>Movimentos por cena</h3>
        </header>
        {movementDirections.map((scene, index) => (
          <article className={styles.outputScene} key={`${scene.order}-${scene.time}`}>
            <div>
              <strong>{scene.time}</strong>
              <button
                type="button"
                onClick={() =>
                  void copy(`${scene.prompt}\n\nRestrições: ${scene.negativePrompt}`)
                }
              >
                Copiar movimento
              </button>
              <button
                type="button"
                onClick={() => onGenerate("generate-choreography", scene.order)}
              >
                <RefreshCw size={13} /> Regenerar
              </button>
            </div>
            <textarea
              value={scene.prompt}
              aria-label={`Prompt de movimento da cena ${scene.order + 1}`}
              onChange={(event) =>
                onChange(
                  "movementDirections",
                  movementDirections.map((item, sceneIndex) =>
                    sceneIndex === index ? { ...item, prompt: event.target.value } : item,
                  ),
                )
              }
            />
            <textarea
              className={styles.negativeMovementOutput}
              value={scene.negativePrompt}
              aria-label={`Prompt negativo de movimento da cena ${scene.order + 1}`}
              onChange={(event) =>
                onChange(
                  "movementDirections",
                  movementDirections.map((item, sceneIndex) =>
                    sceneIndex === index
                      ? { ...item, negativePrompt: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </article>
        ))}
      </section>
      <EditableBlock
        number="06"
        title="Falas e narração"
        value={output.speechAndNarration}
        onChange={(value) => onChange("speechAndNarration", value)}
      />
      <EditableBlock
        number="07"
        title="Direção de câmera"
        value={output.cameraDirection}
        onChange={(value) => onChange("cameraDirection", value)}
      />
      <EditableBlock
        number="08"
        title="Direção de iluminação"
        value={output.lightingDirection}
        onChange={(value) => onChange("lightingDirection", value)}
      />
      <EditableBlock
        number="09"
        title="Direção de voz"
        value={output.voiceDirection}
        onChange={(value) => onChange("voiceDirection", value)}
      />
      <EditableBlock
        number="10"
        title="Continuidade entre cenas"
        value={output.continuity}
        onChange={(value) => onChange("continuity", value)}
      />
      <EditableBlock
        number="11"
        title="Restrições e prompt negativo"
        value={output.restrictionsAndNegativePrompt}
        onChange={(value) => onChange("restrictionsAndNegativePrompt", value)}
      />
      <EditableBlock
        number="12"
        title="Materiais necessários"
        value={output.requiredMaterials.join("\n")}
        onChange={(value) => onChange("requiredMaterials", lines(value))}
      />
      <EditableBlock
        number="13"
        title="Checklist antes de gerar"
        value={output.preGenerationChecklist.join("\n")}
        onChange={(value) => onChange("preGenerationChecklist", lines(value))}
      />
      {version.adaptedPrompt && (
        <EditableBlock
          number="↳"
          title={`Adaptação para ${tools.find((tool) => tool.id === version.targetTool)?.label ?? version.targetTool}`}
          value={version.adaptedPrompt}
          onChange={() => undefined}
        />
      )}
      {(version.qualityWarnings.length > 0 || version.similarityWarnings.length > 0) && (
        <div className={styles.warningList}>
          {version.qualityWarnings.map((warning) => (
            <p key={warning.code}>
              <strong>{warning.severity === "blocking" ? "Bloqueio" : "Atenção"}</strong>
              {warning.message}
            </p>
          ))}
          {version.similarityWarnings.map((warning) => (
            <p key={warning.projectId}>
              <strong>Semelhança {Math.round(warning.score * 100)}%</strong>
              {warning.message}
            </p>
          ))}
        </div>
      )}
      <div className={styles.approvalBar}>
        <label>
          Status{" "}
          <select
            value={projectStatus}
            onChange={(event) =>
              onStatus(event.target.value as VideoPromptProjectInput["status"])
            }
          >
            <option value="draft">Rascunho</option>
            <option value="ready">Pronto</option>
            <option value="tested">Testado</option>
            <option value="approved">Aprovado</option>
            <option value="archived">Arquivado</option>
          </select>
        </label>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onPublish}
          disabled={projectStatus !== "approved"}
        >
          <Send size={16} /> Enviar para produção
        </button>
      </div>
    </div>
  );
}

function CharacterEditor({
  characters,
  selectedId,
  draft,
  usageCount,
  pending,
  onSelect,
  onChange,
  onSave,
  onDuplicate,
  onArchive,
  onUpload,
}: {
  characters: CharacterProfileRecord[];
  selectedId?: string;
  draft: ReturnType<typeof createEmptyCharacterProfile>;
  usageCount: number;
  pending: boolean;
  onSelect: (id: string) => void;
  onChange: (draft: ReturnType<typeof createEmptyCharacterProfile>) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onUpload: (file: File) => void;
}) {
  const [sceneDescription, setSceneDescription] = useState("");
  const [selectedFrame, setSelectedFrame] = useState<1 | 2 | 3>(1);
  const [copiedStep, setCopiedStep] = useState<string>();
  const referenceKit = createInfluencerReferenceKit(draft, {
    scene: sceneDescription,
    selectedFrame,
  });
  const immutableLabels: Record<keyof typeof draft.immutableTraits, string> = {
    apparentAge: "Faixa etária aparente",
    faceShape: "Formato facial",
    skinTone: "Tom e subtom de pele",
    eyes: "Olhos",
    eyebrows: "Sobrancelhas",
    nose: "Nariz",
    lips: "Lábios",
    jaw: "Mandíbula",
    hair: "Cabelo",
    skinTexture: "Textura da pele",
    approximateHeight: "Altura aproximada",
    bodyProportions: "Proporções corporais",
    visualPersonality: "Personalidade visual",
    distinctiveFeatures: "Características distintivas autorizadas",
  };
  const variableLabels: Record<keyof typeof draft.variableTraits, string> = {
    clothing: "Roupa",
    accessories: "Acessórios",
    allowedHairstyle: "Penteado permitido",
    expression: "Expressão",
    bodyPosition: "Posição corporal",
    action: "Ação",
    environment: "Ambiente",
    lighting: "Iluminação",
    framing: "Enquadramento",
  };
  async function copyReferencePrompt(stepId: string, prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedStep(stepId);
    window.setTimeout(() => setCopiedStep(undefined), 1800);
  }
  return (
    <div className={styles.characterEditor}>
      <div className={styles.characterToolbar}>
        <Field label="Ficha salva">
          <select
            value={selectedId ?? ""}
            onChange={(event) => onSelect(event.target.value)}
          >
            <option value="">Criar personagem inédita</option>
            {characters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.internalName}
              </option>
            ))}
          </select>
        </Field>
        {selectedId && (
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onDuplicate}
            >
              <Copy size={15} /> Duplicar
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onArchive}>
              <Archive size={15} /> Arquivar
            </button>
          </>
        )}
      </div>
      {selectedId && (
        <p className={styles.usage}>
          <Layers3 size={15} /> Usada em {usageCount} projeto(s) ou prompt(s).
        </p>
      )}
      <section className={styles.influencerIntro} aria-labelledby="influencer-title">
        <div className={styles.referenceAtlas} aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <div>
          <span>Influenciadora com IA</span>
          <h3 id="influencer-title">Uma identidade, muitos conteúdos</h3>
          <p>
            Defina a pessoa uma vez, gere as pranchas de rosto e corpo e use essas âncoras
            em fotos e vídeos. Os prompts abaixo seguem esse fluxo sem depender de um
            fornecedor específico.
          </p>
        </div>
        <ol className={styles.influencerStages}>
          <li>Base</li>
          <li>Rosto 3×3</li>
          <li>Corpo</li>
          <li>Cenas</li>
          <li>Extrair</li>
          <li>Animar</li>
        </ol>
      </section>
      <div className={styles.twoColumns}>
        <Field label="Nome interno">
          <input
            value={draft.internalName}
            onChange={(event) => onChange({ ...draft, internalName: event.target.value })}
          />
        </Field>
        <Field label="Origem">
          <select
            value={draft.sourceType}
            onChange={(event) =>
              onChange({
                ...draft,
                sourceType: event.target.value as typeof draft.sourceType,
              })
            }
          >
            <option value="original-description">Criar por descrição</option>
            <option value="authorized-references">Referências autorizadas</option>
          </select>
        </Field>
      </div>
      <fieldset className={styles.consent}>
        <legend>Finalidade das referências de pessoas</legend>
        <label>
          <input
            type="radio"
            checked={draft.consentMode === "authorized-identity"}
            onChange={() => onChange({ ...draft, consentMode: "authorized-identity" })}
          />{" "}
          É a personagem que tenho autorização para reproduzir.
        </label>
        <label>
          <input
            type="radio"
            checked={draft.consentMode === "aesthetic-reference-only"}
            onChange={() =>
              onChange({ ...draft, consentMode: "aesthetic-reference-only" })
            }
          />{" "}
          Usar apenas como referência estética geral.
        </label>
        {draft.consentMode === "aesthetic-reference-only" && (
          <p>
            O prompt proibirá copiar rosto, identidade, biometria ou combinar rostos e
            exigirá uma pessoa fictícia original.
          </p>
        )}
      </fieldset>
      <details className={styles.traitGroup}>
        <summary>
          Atributos imutáveis <ChevronDown size={15} />
        </summary>
        <div className={styles.twoColumns}>
          {Object.entries(immutableLabels).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                value={draft.immutableTraits[key as keyof typeof draft.immutableTraits]}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    immutableTraits: {
                      ...draft.immutableTraits,
                      [key]: event.target.value,
                    },
                  })
                }
              />
            </Field>
          ))}
        </div>
      </details>
      <details className={styles.traitGroup}>
        <summary>
          Atributos variáveis e bloqueios <ChevronDown size={15} />
        </summary>
        <div className={styles.variableGrid}>
          {Object.entries(variableLabels).map(([key, label]) => {
            const trait = key as keyof typeof draft.variableTraits;
            const locked = draft.lockedTraits.includes(trait);
            return (
              <div key={key} className={styles.variableTrait}>
                <Field label={label}>
                  <input
                    value={draft.variableTraits[trait]}
                    onChange={(event) =>
                      onChange({
                        ...draft,
                        variableTraits: {
                          ...draft.variableTraits,
                          [key]: event.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <label>
                  <input
                    type="checkbox"
                    checked={locked}
                    onChange={(event) =>
                      onChange({
                        ...draft,
                        lockedTraits: event.target.checked
                          ? [...draft.lockedTraits, trait]
                          : draft.lockedTraits.filter((item) => item !== trait),
                      })
                    }
                  />{" "}
                  {locked ? "Bloqueado" : "Liberado neste vídeo"}
                </label>
              </div>
            );
          })}
        </div>
      </details>
      <section className={styles.referenceKit} aria-labelledby="reference-kit-title">
        <header>
          <div>
            <span>Kit de consistência</span>
            <h3 id="reference-kit-title">Prompts prontos para cada etapa</h3>
          </div>
          <WandSparkles size={20} aria-hidden="true" />
        </header>
        <div className={styles.referenceKitInputs}>
          <Field label="Cena que você quer criar">
            <textarea
              value={sceneDescription}
              onChange={(event) => setSceneDescription(event.target.value)}
              placeholder="Ex.: A influenciadora organiza pedidos em uma cozinha de produção, no fim da tarde."
            />
          </Field>
          <Field label="Quadro para extrair">
            <select
              value={selectedFrame}
              onChange={(event) =>
                setSelectedFrame(Number(event.target.value) as 1 | 2 | 3)
              }
            >
              <option value={1}>1 · esquerda</option>
              <option value={2}>2 · centro</option>
              <option value={3}>3 · direita</option>
            </select>
          </Field>
        </div>
        <div className={styles.referenceSteps}>
          {referenceKit.map((step) => (
            <details key={step.id} className={styles.referenceStep}>
              <summary>
                <span>{step.number}</span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.purpose}</small>
                </div>
                <ChevronDown size={17} />
              </summary>
              <div>
                <dl>
                  <div>
                    <dt>Formato</dt>
                    <dd>{step.aspectRatio}</dd>
                  </div>
                  <div>
                    <dt>Referências</dt>
                    <dd>{step.references}</dd>
                  </div>
                </dl>
                <pre>{step.prompt}</pre>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void copyReferencePrompt(step.id, step.prompt)}
                >
                  {copiedStep === step.id ? <Check size={15} /> : <Copy size={15} />}
                  {copiedStep === step.id ? "Prompt copiado" : "Copiar prompt"}
                </button>
              </div>
            </details>
          ))}
        </div>
      </section>
      <div className={styles.referenceUpload}>
        <label>
          <ImagePlus size={18} /> Anexar pranchas e referências
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => Array.from(event.target.files ?? []).forEach(onUpload)}
          />
        </label>
        <span>
          {draft.referenceAssets.length} referência(s) anexada(s)
          {draft.referenceAssets.length < 2
            ? " · anexe rosto e corpo"
            : " · kit mínimo pronto"}
        </span>
      </div>
      <button
        type="button"
        className={styles.primaryButton}
        onClick={onSave}
        disabled={pending || draft.internalName.trim().length < 2}
      >
        <UserRound size={16} /> {characterSaveLabel(pending, Boolean(selectedId))}
      </button>
    </div>
  );
}

function ProgressSection({
  id,
  number,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  id?: string;
  number: string;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} className={styles.progressSection} open={defaultOpen}>
      <summary>
        <span>{number}</span>
        <div>
          <h3>{title}</h3>
          <p>{summary}</p>
        </div>
        <ChevronDown />
      </summary>
      <div className={styles.progressBody}>{children}</div>
    </details>
  );
}
function DirectionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.traitGroup}>
      <summary>
        {title} <ChevronDown size={15} />
      </summary>
      <div className={styles.twoColumns}>{children}</div>
    </details>
  );
}
function ChoiceCard({
  active,
  title,
  meta,
  description,
  featured,
  onClick,
}: {
  active: boolean;
  title: string;
  meta?: string;
  description?: string;
  featured?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? styles.choiceActive : styles.choice}
      onClick={onClick}
    >
      <span>
        {active && <Check size={14} />}
        {featured && <small>Sugestão</small>}
      </span>
      <strong>{title}</strong>
      {meta && <b>{meta}</b>}
      {description && <p>{description}</p>}
    </button>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function EditableBlock({
  number,
  title,
  value,
  large,
  onChange,
}: {
  number: string;
  title: string;
  value: string;
  large?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <section className={styles.outputBlock}>
      <header>
        <span>{number}</span>
        <h3>{title}</h3>
      </header>
      <textarea
        className={large ? styles.largeOutput : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Todos</option>
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}
function VersionComparison({
  versions,
  selected,
  onSelect,
  comparison,
}: {
  versions: VideoPromptVersionRecord[];
  selected: [string, string];
  onSelect: (value: [string, string]) => void;
  comparison: Array<VideoPromptVersionRecord | undefined>;
}) {
  return (
    <section className={styles.comparison}>
      <header>
        <div>
          <span>Comparação de versões</span>
          <h3>O que mudou entre os prompts</h3>
        </div>
        <div>
          <select
            value={selected[0]}
            onChange={(event) => onSelect([event.target.value, selected[1]])}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                Versão {version.version}
              </option>
            ))}
          </select>
          <select
            value={selected[1]}
            onChange={(event) => onSelect([selected[0], event.target.value])}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                Versão {version.version}
              </option>
            ))}
          </select>
        </div>
      </header>
      <div>
        {comparison.map((version, index) => (
          <article key={index}>
            <strong>
              {version ? `Versão ${version.version}` : "Selecione uma versão"}
            </strong>
            <pre>{version?.canonicalPrompt.masterPrompt ?? ""}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

async function persistProject(id: string | undefined, project: VideoPromptProjectInput) {
  return apiClient<VideoPromptProjectRecord>(
    id ? `/video-prompts/projects/${id}` : "/video-prompts/projects",
    { method: id ? "PATCH" : "POST", body: project },
  );
}
function projectFromRecord(record: VideoPromptProjectRecord): VideoPromptProjectInput {
  return VideoPromptProjectInputSchema.parse(record);
}
function characterInputFromRecord(record: CharacterProfileRecord) {
  return CharacterProfileInputSchema.parse(record);
}
function labelFor(
  options: ReadonlyArray<readonly [string, string, ...string[]]>,
  value: string,
) {
  return options.find(([id]) => id === value)?.[1] ?? value;
}
function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
function statusLabel(status: string) {
  return (
    (
      {
        draft: "Rascunho",
        ready: "Pronto",
        tested: "Testado",
        approved: "Aprovado",
        archived: "Arquivado",
      } as Record<string, string>
    )[status] ?? status
  );
}
function importedNarrativeRole(order: number, total: number) {
  if (order === 0) return "Gancho importado";
  if (order === total - 1) return "Encerramento importado";
  return "Desenvolvimento importado";
}
function characterSaveLabel(pending: boolean, editing: boolean) {
  if (pending) return "Salvando…";
  return editing ? "Atualizar ficha" : "Criar ficha reutilizável";
}
