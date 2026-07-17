"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FilePlus2,
  FileText,
  History,
  Paperclip,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient, authenticatedDownload } from "@/shared/lib/api-client";
import { getSupabase } from "@/shared/lib/supabase";
import type { MarketingDocument } from "@/shared/types";

export default function DocumentsPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiClient<MarketingDocument[]>("/documents"),
  });
  const [selectedId, setSelectedId] = useState<string>();
  const detail = useQuery({
    queryKey: ["document", selectedId],
    queryFn: () => apiClient<MarketingDocument>(`/documents/${selectedId}`),
    enabled: !!selectedId,
  });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("# Novo documento\n\nComece por aqui.");
  const hydratedId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!selectedId && query.data?.[0]) setSelectedId(query.data[0].id);
  }, [query.data, selectedId]);
  useEffect(() => {
    if (detail.data && hydratedId.current !== detail.data.id) {
      hydratedId.current = detail.data.id;
      const draft = readDraft(detail.data.id);
      setTitle(draft?.title ?? detail.data.title);
      setBody(draft?.body ?? detail.data.body);
      setSaved(!draft);
    }
  }, [detail.data]);
  const save = useMutation({
    mutationFn: () =>
      apiClient<MarketingDocument>(`/documents/${selectedId}`, {
        method: "PATCH",
        body: { title, body, versionNote: "Salvamento automático" },
      }),
    onSuccess: () => {
      setSaved(true);
      if (selectedId) window.localStorage.removeItem(draftKey(selectedId));
      void client.invalidateQueries({ queryKey: ["documents"] });
      void client.invalidateQueries({ queryKey: ["document", selectedId] });
    },
  });
  useEffect(() => {
    if (!selectedId || saved || !hydratedId.current) return;
    window.localStorage.setItem(draftKey(selectedId), JSON.stringify({ title, body }));
    const timer = window.setTimeout(() => save.mutate(), 1400);
    return () => window.clearTimeout(timer);
  }, [body, title, selectedId, saved]);
  useEffect(() => {
    const sync = () => {
      if (!saved && selectedId) save.mutate();
    };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [saved, selectedId]);
  const create = useMutation({
    mutationFn: () =>
      apiClient<MarketingDocument>("/documents", {
        method: "POST",
        body: {
          title: newTitle.trim(),
          slug: `${slugify(newTitle)}-${Date.now()}`,
          body: newBody,
          tags: [],
          source: "manual",
        },
      }),
    onSuccess: (document) => {
      void client.invalidateQueries({ queryKey: ["documents"] });
      hydratedId.current = undefined;
      setSelectedId(document.id);
      setCreating(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiClient(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: (_, deletedId) => {
      window.localStorage.removeItem(draftKey(deletedId));
      if (selectedId === deletedId) {
        setSelectedId(undefined);
        hydratedId.current = undefined;
      }
      void client.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  async function upload(file: File) {
    if (!selectedId) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type) || file.size > 20 * 1024 * 1024) {
      alert("Envie PDF ou DOCX de até 20 MB.");
      return;
    }
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const path = `${data.user.id}/${selectedId}/${crypto.randomUUID()}-${file.name}`;
    const result = await supabase.storage.from("marketing-documents").upload(path, file);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    await apiClient(`/documents/${selectedId}/attachments`, {
      method: "POST",
      body: {
        name: file.name,
        mimeType: file.type,
        storagePath: path,
        sizeBytes: file.size,
      },
    });
    void client.invalidateQueries({ queryKey: ["document", selectedId] });
  }

  async function downloadAttachment(path: string) {
    const { data, error } = await getSupabase()
      .storage.from("marketing-documents")
      .createSignedUrl(path, 60);
    if (error) {
      alert(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const saveLabel = getSaveLabel(save.isPending, saved);

  return (
    <>
      <PageHeader
        eyebrow="Memória da marca"
        title="Documentos de marketing"
        description="Crie briefings, pesquisas, campanhas e playbooks em Markdown, com salvamento e histórico de versões."
        action={
          <button
            type="button"
            className="button primary"
            onClick={() => {
              create.reset();
              setNewTitle("");
              setNewBody("# Novo documento\n\nComece por aqui.");
              setCreating(true);
            }}
          >
            <FilePlus2 size={18} />
            Novo documento
          </button>
        }
      />
      <section className="documents-layout">
        <aside className="document-list">
          {query.data?.map((document) => (
            <div
              key={document.id}
              className={`document-list-item${selectedId === document.id ? " active" : ""}`}
            >
              <button
                type="button"
                className="document-list-select"
                onClick={() => {
                  setSelectedId(document.id);
                  hydratedId.current = undefined;
                }}
              >
                <FileText size={18} />
                <span>
                  <strong>{document.title}</strong>
                  <small>
                    {new Date(document.updatedAt).toLocaleDateString("pt-BR")}
                  </small>
                </span>
              </button>
              <button
                type="button"
                className="icon-button danger document-list-delete"
                aria-label={`Excluir ${document.title}`}
                title="Excluir documento"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm("Excluir este documento e seu histórico?"))
                    remove.mutate(document.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </aside>
        {detail.data ? (
          <article className="document-editor">
            <div className="editor-toolbar">
              <span className={saved ? "saved" : "saving"}>
                <Save size={16} />
                {saveLabel}
              </span>
              <div>
                <label className="button ghost file-button document-file-action">
                  <Paperclip size={16} />
                  Anexar
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                </label>
                <button
                  className="button ghost document-file-action"
                  onClick={() =>
                    void authenticatedDownload(
                      `/documents/${selectedId}/export.md`,
                      `${detail.data.slug}.md`,
                    )
                  }
                >
                  <Download size={16} />
                  MD
                </button>
                <button
                  className="button ghost document-file-action"
                  onClick={() =>
                    void authenticatedDownload(
                      `/documents/${selectedId}/export.pdf`,
                      `${detail.data.slug}.pdf`,
                    )
                  }
                >
                  <Download size={16} />
                  PDF
                </button>
                <button
                  className="icon-button danger"
                  onClick={() => {
                    if (confirm("Excluir este documento e seu histórico?"))
                      remove.mutate(detail.data.id);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <input
              className="document-title-input"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSaved(false);
              }}
            />
            <textarea
              className="markdown-editor"
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setSaved(false);
              }}
              spellCheck
            />
            <footer className="document-meta">
              <span>
                <History size={15} />
                {detail.data.versions?.length ?? 0} versões
              </span>
              <span>
                <Paperclip size={15} />
                {detail.data.attachments?.length ?? 0} anexos
              </span>
            </footer>
            <div className="document-history">
              <details>
                <summary>Histórico recuperável</summary>
                {detail.data.versions?.slice(0, 8).map((version) => (
                  <div className="history-row" key={version.id}>
                    <span>
                      <strong>Versão {version.version}</strong>
                      <small>{version.note ?? "Salvamento"}</small>
                    </span>
                    <button
                      className="button ghost"
                      onClick={() => {
                        setTitle(version.title);
                        setBody(version.body);
                        setSaved(false);
                      }}
                    >
                      <RotateCcw size={14} />
                      Restaurar
                    </button>
                  </div>
                ))}
              </details>
              <details>
                <summary>Anexos privados</summary>
                {detail.data.attachments?.map((attachment) => (
                  <button
                    className="attachment-row"
                    key={attachment.id}
                    onClick={() => void downloadAttachment(attachment.storagePath)}
                  >
                    <Paperclip size={14} />
                    <span>{attachment.name}</span>
                    <small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small>
                  </button>
                ))}
              </details>
            </div>
          </article>
        ) : (
          <div className="empty-state compact">
            <FileText />
            <h2>Selecione ou crie um documento</h2>
          </div>
        )}
      </section>
      {creating && (
        <div
          className="modal-backdrop"
          onMouseDown={() => {
            if (!create.isPending) setCreating(false);
          }}
        >
          <form
            aria-labelledby="new-document-title"
            aria-modal="true"
            className="modal-card"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="modal-title">
              <div>
                <p className="eyebrow">Adicionar</p>
                <h2 id="new-document-title">Novo documento</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar"
                disabled={create.isPending}
                onClick={() => setCreating(false)}
              >
                <X />
              </button>
            </div>
            <label>
              Título
              <input
                autoFocus
                required
                minLength={2}
                maxLength={180}
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
            </label>
            <label>
              Conteúdo inicial
              <textarea
                rows={9}
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
              />
            </label>
            {create.error && (
              <p className="form-error" role="alert">
                {create.error.message}
              </p>
            )}
            <button
              className="button primary"
              disabled={create.isPending || newTitle.trim().length < 2}
            >
              <FilePlus2 size={17} />
              {create.isPending ? "Criando…" : "Criar documento"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function getSaveLabel(isPending: boolean, saved: boolean) {
  if (isPending) return "Salvando…";
  if (saved) return "Salvo";
  return "Alterado";
}

function draftKey(documentId: string) {
  return `lucro-marketing-draft:${documentId}`;
}

function readDraft(documentId: string) {
  const cached = window.localStorage.getItem(draftKey(documentId));
  if (!cached) return null;
  try {
    return JSON.parse(cached) as { title: string; body: string };
  } catch {
    window.localStorage.removeItem(draftKey(documentId));
    return null;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
