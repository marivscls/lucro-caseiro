"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Bot, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { apiClient } from "@/shared/lib/api-client";
import type {
  MarketingAiResourceDraft,
  MarketingContentIdea,
  MarketingContentIdeas,
  MarketingResource,
  ResourceKind,
} from "@/shared/types";
import { ContentBriefEditor } from "./content-brief-editor";
import {
  contentBriefFromData,
  emptyContentBrief,
  mergeContentBriefData,
  scoreContentBrief,
  type ContentBrief,
} from "./content-brief";
import { PageHeader } from "./page-header";

const labels: Record<
  ResourceKind,
  { eyebrow: string; title: string; description: string; singular: string }
> = {
  content: {
    eyebrow: "Biblioteca editorial",
    title: "Conteúdo que ensina e converte",
    description:
      "Ideias, roteiros e publicações ligados a um público, uma dor e uma próxima ação.",
    singular: "conteúdo",
  },
  audience: {
    eyebrow: "Pesquisa de mercado",
    title: "Públicos específicos, mensagens específicas",
    description: "Dores, desejos, linguagem, canais e promessa central de cada segmento.",
    singular: "público",
  },
  feature: {
    eyebrow: "Produto → mensagem",
    title: "Cada funcionalidade com seu melhor público",
    description: "Conecte capacidade do produto, problema resolvido, prova e CTA.",
    singular: "funcionalidade",
  },
  topic: {
    eyebrow: "Territórios editoriais",
    title: "Temas que constroem autoridade",
    description: "Pilares repetíveis para precificação, lucro e organização.",
    singular: "tema",
  },
  outreach: {
    eyebrow: "Distribuição",
    title: "Onde chegar e como começar a conversa",
    description: "Canais, comunidades, parcerias e abordagens sem spam.",
    singular: "canal de prospecção",
  },
  campaign: {
    eyebrow: "Crescimento",
    title: "Campanhas com hipótese e métrica",
    description: "Sequências coordenadas para aquisição, ativação, retenção e indicação.",
    singular: "campanha",
  },
  performance: {
    eyebrow: "Aprendizado",
    title: "Resultados que orientam o próximo teste",
    description:
      "Registre sinais de conteúdo e negócio para repetir o que realmente funciona.",
    singular: "resultado",
  },
};

const audienceIdeas = [
  "Confeiteiras iniciantes que já vendem, mas ainda calculam o preço no chute",
  "Quem recebe pedidos pelo WhatsApp e se perde entre custos, encomendas e pagamentos",
  "Empreendedoras que vendem bem, mas não sabem se cada produto realmente dá lucro",
];

type DraftIntent = "generate" | "refine";
type AppliedIntent = DraftIntent | "idea";

export function ResourceBoard({
  kind,
  initialEditingId,
}: {
  kind: ResourceKind;
  initialEditingId?: string;
}) {
  const queryClient = useQueryClient();
  const meta = labels[kind];
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MarketingResource>();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState(initialStatus(kind));
  const [scheduledFor, setScheduledFor] = useState("");
  const [dataText, setDataText] = useState("{}");
  const [contentBrief, setContentBrief] = useState<ContentBrief>(emptyContentBrief);
  const [editorTab, setEditorTab] = useState<"manual" | "ai">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  const [draftIntent, setDraftIntent] = useState<AppliedIntent>();
  const initialEditorOpened = useRef(false);
  const query = useQuery({
    queryKey: ["resources", kind],
    queryFn: () => apiClient<MarketingResource[]>(`/resources?kind=${kind}`),
  });
  const save = useMutation({
    mutationFn: () => {
      const parsedData = JSON.parse(dataText) as Record<string, unknown>;
      const data =
        kind === "content" ? mergeContentBriefData(parsedData, contentBrief) : parsedData;
      const body = {
        title,
        summary,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        data,
      };
      if (editing)
        return apiClient<MarketingResource>(`/resources/${editing.id}`, {
          method: "PATCH",
          body,
        });
      return apiClient<MarketingResource>("/resources", {
        method: "POST",
        body: { ...body, kind, slug: slugify(title) },
      });
    },
    onSuccess: () => {
      closeEditor();
      void queryClient.invalidateQueries({ queryKey: ["resources", kind] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient(`/resources/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["resources", kind] }),
  });
  const draft = useMutation({
    mutationFn: (intent: DraftIntent) =>
      apiClient<MarketingAiResourceDraft>("/ai/resources/draft", {
        method: "POST",
        timeoutMs: 55_000,
        body: {
          kind,
          intent,
          prompt: briefingSource(aiPrompt, title, summary, intent),
          current: {
            title,
            summary,
            status,
            scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
            data: currentResourceData(kind, dataText, contentBrief),
          },
        },
      }),
    onMutate: (intent) => setDraftIntent(intent),
    onSuccess: (result) => {
      setTitle(result.title);
      setSummary(result.summary);
      setStatus(result.status);
      setScheduledFor(result.scheduledFor ? toLocalDateTime(result.scheduledFor) : "");
      setDataText(JSON.stringify(result.data, null, 2));
      setContentBrief(contentBriefFromData(result.data));
      setAiApplied(true);
      setEditorTab("manual");
    },
  });
  const contentIdeas = useMutation({
    mutationFn: () =>
      apiClient<MarketingContentIdeas>("/ai/content/ideas", {
        method: "POST",
        timeoutMs: 55_000,
        body: {
          prompt: aiPrompt,
          current: {
            title,
            summary,
            data: currentResourceData(kind, dataText, contentBrief),
          },
        },
      }),
  });
  const briefCompletion = scoreContentBrief(contentBrief).overall;
  const hasBriefingSource =
    aiPrompt.trim().length >= 2 || title.trim().length >= 2 || summary.trim().length >= 2;
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.title} ${item.summary ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
  useEffect(() => {
    if (!initialEditingId || initialEditorOpened.current || !query.data) return;
    initialEditorOpened.current = true;
    const item = query.data.find((resource) => resource.id === initialEditingId);
    if (!item) return;
    setEditing(item);
    setTitle(item.title);
    setSummary(item.summary ?? "");
    setStatus(item.status);
    setScheduledFor(item.scheduledFor ? toLocalDateTime(item.scheduledFor) : "");
    setDataText(JSON.stringify(item.data, null, 2));
    setContentBrief(contentBriefFromData(item.data));
    setEditorTab("manual");
    setCreating(true);
  }, [initialEditingId, query.data]);
  let board: React.ReactNode;
  if (query.isLoading) {
    board = <CardSkeletons />;
  } else if (items.length === 0) {
    board = <EmptyState onCreate={() => openEditor()} />;
  } else {
    board = (
      <section className="resource-grid">
        {items.map((item) => (
          <article className="resource-card" key={item.id}>
            <div className="card-top">
              <span className={`status ${item.status}`}>{statusLabel(item.status)}</span>
              <div className="card-actions">
                <button
                  className="icon-button"
                  aria-label={`Editar ${item.title}`}
                  onClick={() => openEditor(item)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Excluir ${item.title}`}
                  onClick={() => {
                    if (confirm(`Excluir “${item.title}”?`)) remove.mutate(item.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h2>{item.title}</h2>
            <p>{item.summary || "Adicione um resumo para tornar este item acionável."}</p>
            <DataPreview data={item.data} />
            <footer>
              <span>
                Atualizado {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
              </span>
              <ArrowUpRight size={17} />
            </footer>
            <button
              className="resource-card-link"
              aria-label={`Abrir ${item.title}`}
              onClick={() => openEditor(item)}
            />
          </article>
        ))}
      </section>
    );
  }
  let draftActionLabel = kind === "content" ? "Gerar briefing" : "Preencher campos";
  if (draft.isPending) draftActionLabel = "Preparando…";
  else if (draft.isError) draftActionLabel = "Tentar novamente";

  return (
    <>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        action={
          <button className="button primary" onClick={() => openEditor()}>
            <Plus size={18} />
            Novo {meta.singular}
          </button>
        }
      />
      <section className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar nesta área"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span>{items.length} itens</span>
      </section>
      {board}
      {creating && (
        <div className="modal-backdrop" onMouseDown={closeEditor}>
          <form
            className={`modal-card resource-editor-modal ${
              kind === "content" ? "content-resource-editor-modal" : ""
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-title">
              <div>
                <p className="eyebrow">{editing ? "Editar" : "Adicionar"}</p>
                <h2>{editing ? editing.title : `Novo ${meta.singular}`}</h2>
              </div>
              <button type="button" className="icon-button" onClick={closeEditor}>
                <X />
              </button>
            </div>
            {!editing && (
              <div
                className="training-tabs resource-editor-tabs"
                role="tablist"
                aria-label="Modo de preenchimento"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "manual"}
                  className={editorTab === "manual" ? "active" : ""}
                  onClick={() => setEditorTab("manual")}
                >
                  Preencher manualmente
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorTab === "ai"}
                  className={editorTab === "ai" ? "active" : ""}
                  onClick={() => setEditorTab("ai")}
                >
                  <Bot size={15} />
                  Preencher com IA
                </button>
              </div>
            )}
            {editorTab === "ai" && !editing ? (
              <section className="ai-draft-panel" role="tabpanel">
                <div className="ai-draft-heading">
                  <span className="ai-draft-icon">
                    <Bot size={20} />
                  </span>
                  <div>
                    <h3>O que você quer criar?</h3>
                    <p>
                      A IA usa a estratégia, os aprendizados e os itens já cadastrados
                      para preparar todos os campos.
                    </p>
                  </div>
                </div>
                <label>
                  Descreva o {meta.singular}
                  <textarea
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    placeholder={`Ex.: Crie um ${meta.singular} voltado para confeiteiras iniciantes, com abordagem prática e uma ação clara.`}
                    rows={6}
                    autoFocus
                  />
                </label>
                {kind === "audience" && (
                  <div className="ai-prompt-ideas">
                    <p>
                      Conte quem é essa pessoa, em que momento ela está e qual problema
                      você quer entender — ou comece por uma ideia:
                    </p>
                    <div>
                      {audienceIdeas.map((idea) => (
                        <button
                          type="button"
                          key={idea}
                          className="ai-prompt-idea"
                          onClick={() => {
                            setAiPrompt(idea);
                            draft.reset();
                          }}
                        >
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {draft.error && <p className="form-error">{draft.error.message}</p>}
                <button
                  type="button"
                  className="button primary"
                  disabled={aiPrompt.trim().length < 2 || draft.isPending}
                  onClick={() => draft.mutate("generate")}
                >
                  <Bot size={17} />
                  {draftActionLabel}
                </button>
              </section>
            ) : (
              <div role="tabpanel">
                {aiApplied && (
                  <div className="notice success ai-draft-success">
                    {appliedNotice(draftIntent)}
                  </div>
                )}
                <label>
                  Título
                  <input
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (kind === "content")
                        setContentBrief((current) => ({
                          ...current,
                          analysis: undefined,
                        }));
                    }}
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Resumo
                  <textarea
                    value={summary}
                    onChange={(event) => {
                      setSummary(event.target.value);
                      if (kind === "content")
                        setContentBrief((current) => ({
                          ...current,
                          analysis: undefined,
                        }));
                    }}
                    rows={4}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      {statusOptions(kind).map((option) => (
                        <option key={option} value={option}>
                          {statusLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Publicar em
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(event) => setScheduledFor(event.target.value)}
                    />
                  </label>
                </div>
                {kind === "content" ? (
                  <ContentBriefEditor
                    value={contentBrief}
                    onChange={setContentBrief}
                    sourceText={aiPrompt}
                    onSourceTextChange={(value) => {
                      setAiPrompt(value);
                      setContentBrief((current) => ({
                        ...current,
                        analysis: undefined,
                      }));
                      draft.reset();
                      contentIdeas.reset();
                    }}
                    onGenerate={() => draft.mutate("generate")}
                    onRefine={() => draft.mutate("refine")}
                    onGenerateIdeas={() => contentIdeas.mutate()}
                    onUseIdea={useContentIdea}
                    ideas={contentIdeas.data?.ideas ?? []}
                    ideasPending={contentIdeas.isPending}
                    ideasError={contentIdeas.error?.message}
                    aiIntent={draftIntent === "idea" ? undefined : draftIntent}
                    aiPending={draft.isPending}
                    aiError={draft.error?.message}
                    canGenerate={hasBriefingSource || briefCompletion > 0}
                    canRefine={hasBriefingSource || briefCompletion > 0}
                  />
                ) : (
                  <details>
                    <summary>Contexto estruturado</summary>
                    <p className="field-help">
                      Use JSON para público, formato, canais, CTA, hipótese, métrica e
                      outros detalhes que a IA deve considerar.
                    </p>
                    <textarea
                      className="json-editor"
                      value={dataText}
                      onChange={(event) => setDataText(event.target.value)}
                      rows={8}
                      spellCheck={false}
                    />
                  </details>
                )}
                {save.error && (
                  <p className="form-error">
                    {save.error instanceof SyntaxError
                      ? "O contexto estruturado precisa ser um JSON válido."
                      : save.error.message}
                  </p>
                )}
                <button className="button primary" disabled={save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );

  function openEditor(item?: MarketingResource) {
    setEditing(item);
    setTitle(item?.title ?? "");
    setSummary(item?.summary ?? "");
    setStatus(item?.status ?? initialStatus(kind));
    setScheduledFor(item?.scheduledFor ? toLocalDateTime(item.scheduledFor) : "");
    setDataText(JSON.stringify(item?.data ?? {}, null, 2));
    setContentBrief(contentBriefFromData(item?.data ?? {}));
    setEditorTab("manual");
    setAiPrompt("");
    setAiApplied(false);
    setDraftIntent(undefined);
    draft.reset();
    contentIdeas.reset();
    setCreating(true);
  }

  function closeEditor() {
    setCreating(false);
    setEditing(undefined);
  }

  function useContentIdea(idea: MarketingContentIdea) {
    setTitle(idea.title);
    setSummary(idea.justification);
    setAiPrompt(idea.example || idea.title);
    setContentBrief({
      ...emptyContentBrief(),
      ...idea.brief,
      desiredFormats: [idea.bestFormat],
    });
    setDraftIntent("idea");
    setAiApplied(true);
  }
}

function DataPreview({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined)
    .slice(0, 3);
  if (!entries.length) return null;
  return (
    <dl className="data-preview">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{humanize(key)}</dt>
          <dd>{Array.isArray(value) ? value.slice(0, 3).join(" · ") : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
function CardSkeletons() {
  return (
    <section className="resource-grid">
      {[1, 2, 3].map((item) => (
        <div key={item} className="resource-card skeleton" />
      ))}
    </section>
  );
}
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="empty-state">
      <div className="empty-icon">
        <Plus />
      </div>
      <h2>Comece por um item útil</h2>
      <p>Registre a primeira hipótese e enriqueça à medida que os resultados chegam.</p>
      <button className="button secondary" onClick={onCreate}>
        Criar agora
      </button>
    </section>
  );
}
function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function humanize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
function statusLabel(value: string) {
  return (
    (
      {
        idea: "Ideia",
        planned: "Planejado",
        producing: "Produzindo",
        ready: "Pronto",
        published: "Publicado",
        active: "Ativo",
        archived: "Arquivado",
      } as Record<string, string>
    )[value] ?? value
  );
}
function initialStatus(kind: ResourceKind) {
  return kind === "content" ? "idea" : "active";
}
function statusOptions(kind: ResourceKind) {
  return kind === "content"
    ? ["idea", "planned", "producing", "ready", "published", "archived"]
    : ["active", "planned", "archived"];
}
function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function parseCurrentData(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function currentResourceData(
  kind: ResourceKind,
  dataText: string,
  contentBrief: ContentBrief,
) {
  const data = parseCurrentData(dataText);
  return kind === "content" ? mergeContentBriefData(data, contentBrief) : data;
}

function briefingSource(
  sourceText: string,
  title: string,
  summary: string,
  intent: DraftIntent,
) {
  const source =
    sourceText.trim() || [title.trim(), summary.trim()].filter(Boolean).join("\n");
  if (source.length >= 2) return source;
  return intent === "refine"
    ? "Refine o briefing atual sem inventar informações."
    : "Gere o briefing a partir dos campos atuais.";
}

function appliedNotice(intent?: AppliedIntent) {
  if (intent === "refine")
    return "Estratégia refinada pela IA. Revise o relatório antes de salvar.";
  if (intent === "idea")
    return "Ideia aplicada ao briefing. Revise os campos antes de salvar.";
  return "Briefing preenchido pela IA. Revise antes de salvar.";
}
