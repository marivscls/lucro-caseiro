"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { apiClient } from "@/shared/lib/api-client";
import type { MarketingResource, ResourceKind } from "@/shared/types";
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

export function ResourceBoard({ kind }: { kind: ResourceKind }) {
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
  const query = useQuery({
    queryKey: ["resources", kind],
    queryFn: () => apiClient<MarketingResource[]>(`/resources?kind=${kind}`),
  });
  const save = useMutation({
    mutationFn: () => {
      const data = JSON.parse(dataText) as Record<string, unknown>;
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
  const items = useMemo(
    () =>
      (query.data ?? []).filter((item) =>
        `${item.title} ${item.summary ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [query.data, search],
  );
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
          </article>
        ))}
      </section>
    );
  }

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
            className="modal-card resource-editor-modal"
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
            <label>
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Resumo
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
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
            <details>
              <summary>Contexto estruturado</summary>
              <p className="field-help">
                Use JSON para público, formato, canais, CTA, hipótese, métrica e outros
                detalhes que a IA deve considerar.
              </p>
              <textarea
                className="json-editor"
                value={dataText}
                onChange={(event) => setDataText(event.target.value)}
                rows={8}
                spellCheck={false}
              />
            </details>
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
    setCreating(true);
  }

  function closeEditor() {
    setCreating(false);
    setEditing(undefined);
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
