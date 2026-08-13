"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  CalendarPlus,
  Check,
  ChartNoAxesCombined,
  ClipboardList,
  Clapperboard,
  FileText,
  MessageSquarePlus,
  Send,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient } from "@/shared/lib/api-client";
import type { AiMessage, AiSession } from "@/shared/types";

const starters = [
  "Crie uma semana de posts para confeiteiras iniciantes",
  "Transforme a funcionalidade de precificação em uma campanha",
  "Revise esta ideia usando uma visão de CMO e Growth",
  "Monte um roteiro de TikTok com gancho, prova e CTA",
];

type SelenitaActionTarget =
  | "campaign"
  | "briefing"
  | "calendar"
  | "result"
  | "video-edit";

const actionOptions = [
  {
    target: "campaign" as const,
    label: "Criar campanha",
    description: "Leva a proposta para o Estúdio de Campanhas.",
    icon: ClipboardList,
  },
  {
    target: "briefing" as const,
    label: "Criar briefing",
    description: "Salva o material como documento vivo da Biblioteca.",
    icon: FileText,
  },
  {
    target: "calendar" as const,
    label: "Planejar conteúdo",
    description: "Cria uma peça planejada com data de publicação.",
    icon: CalendarPlus,
  },
  {
    target: "video-edit" as const,
    label: "Editar vídeo",
    description: "Usa a resposta como direção para uma montagem autônoma.",
    icon: Clapperboard,
  },
  {
    target: "result" as const,
    label: "Registrar resultado",
    description: "Abre um registro para fechar o ciclo de aprendizado.",
    icon: ChartNoAxesCombined,
  },
];

export default function AiPage() {
  const client = useQueryClient();
  const [sessionId, setSessionId] = useState<string>();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const sessions = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: () => apiClient<AiSession[]>("/ai/sessions"),
  });
  const session = useQuery({
    queryKey: ["ai-session", sessionId],
    queryFn: () => apiClient<AiSession>(`/ai/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
  const chat = useMutation({
    mutationFn: (message: string) =>
      apiClient<{ sessionId: string; message: AiMessage }>("/ai/chat", {
        method: "POST",
        body: {
          message,
          sessionId,
          context: { source: "web-central", requestedOutcome: "operational-plan" },
          mode: "plan",
        },
      }),
    onSuccess: (result) => {
      setSessionId(result.sessionId);
      setText("");
      void client.invalidateQueries({ queryKey: ["ai-sessions"] });
      void client.invalidateQueries({ queryKey: ["ai-session", result.sessionId] });
    },
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.data?.messages, chat.isPending]);
  const messages = session.data?.messages ?? [];
  function send(value = text) {
    if (value.trim() && !chat.isPending) chat.mutate(value.trim());
  }

  return (
    <>
      <PageHeader
        eyebrow="Sua operadora de marketing"
        title="Selenita"
        description="Converse, revise a proposta e transforme a resposta em uma ação confirmada na Central."
        action={
          <Link className="button ghost" href="/ai/training">
            <Settings size={17} />
            Configurações
          </Link>
        }
      />
      <section className="chat-layout">
        <aside className="chat-sessions">
          <button className="button primary wide" onClick={() => setSessionId(undefined)}>
            <MessageSquarePlus size={17} />
            Nova conversa
          </button>
          {sessions.data?.map((item) => (
            <button
              className={sessionId === item.id ? "active" : ""}
              key={item.id}
              onClick={() => setSessionId(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</span>
            </button>
          ))}
        </aside>
        <article className="chat-panel">
          <div className="messages">
            {messages.length === 0 && !chat.isPending ? (
              <div className="chat-welcome">
                <div className="ai-orb">
                  <Bot />
                </div>
                <h2>O que vamos colocar em movimento hoje?</h2>
                <p>
                  Receba uma resposta prática, contextualizada e pronta para virar
                  execução.
                </p>
                <div className="starter-grid">
                  {starters.map((starter) => (
                    <button key={starter} onClick={() => send(starter)}>
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => <Message key={message.id} message={message} />)
            )}
            {chat.isPending && (
              <div className="message assistant">
                <div className="avatar">
                  <Bot />
                </div>
                <div className="bubble typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            {chat.error && <div className="notice error">{chat.error.message}</div>}
            <div ref={bottom} />
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Peça um plano, roteiro, campanha, análise ou revisão…"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button className="send-button" disabled={!text.trim() || chat.isPending}>
              <Send size={19} />
            </button>
            <span>Enter envia · Shift + Enter quebra a linha</span>
          </form>
        </article>
      </section>
    </>
  );
}

function Message({ message }: { message: AiMessage }) {
  const client = useQueryClient();
  const [feedback, setFeedback] = useState<"positive" | "negative">();
  const [createdAs, setCreatedAs] = useState<string>();
  const [actionTarget, setActionTarget] = useState<SelenitaActionTarget>();
  const [actionTitle, setActionTitle] = useState(assistantTitle(message.body));
  const [scheduledFor, setScheduledFor] = useState("");
  const sendFeedback = useMutation({
    mutationFn: (rating: "positive" | "negative") =>
      apiClient("/ai/feedback", {
        method: "POST",
        body: {
          messageId: message.id,
          rating,
          note:
            rating === "positive"
              ? "Este estilo de resposta foi útil."
              : "A resposta precisa ser mais específica e acionável.",
        },
      }),
    onSuccess: (_, rating) => setFeedback(rating),
  });
  const createAction = useMutation({
    mutationFn: (target: SelenitaActionTarget) => {
      const stamp = Date.now();
      const title = actionTitle.trim().slice(0, 180);
      if (target === "video-edit") {
        return apiClient<{ id: string }>("/video-editor/jobs", {
          method: "POST",
          body: {
            brandId: "lucro-caseiro",
            title,
            brief: message.body.slice(0, 5_000),
            aspectRatio: "9:16",
            targetDurationSeconds: 45,
            destinationChannel: "Instagram Reels",
            sourceCampaignId: null,
            sourceContentId: null,
          },
        });
      }
      if (target === "briefing") {
        return apiClient<{ id: string }>("/documents", {
          method: "POST",
          body: {
            title,
            slug: `briefing-selenita-${stamp}`,
            body: message.body,
            tags: ["selenita", "briefing"],
            source: "ai",
          },
        });
      }
      const kind = actionResourceKind(target);
      return apiClient<{ id: string }>("/resources", {
        method: "POST",
        body: {
          kind,
          slug: `${target}-selenita-${stamp}`,
          title,
          summary: message.body.slice(0, 500),
          status: target === "calendar" ? "planned" : "active",
          scheduledFor:
            target === "calendar" && scheduledFor
              ? new Date(scheduledFor).toISOString()
              : null,
          data: { source: "selenita", fullOutput: message.body },
        },
      });
    },
    onSuccess: (created, target) => {
      const option = actionOptions.find((item) => item.target === target);
      setCreatedAs(option?.label ?? "Ação criada");
      setActionTarget(undefined);
      if (target === "video-edit") {
        window.location.assign(`/video-editor?job=${created.id}`);
        return;
      }
      void client.invalidateQueries({ queryKey: ["marketing-dashboard"] });
      void client.invalidateQueries({ queryKey: ["resources"] });
      void client.invalidateQueries({ queryKey: ["documents"] });
    },
  });
  return (
    <>
      <div className={`message ${message.role}`}>
        <div className="avatar">{message.role === "assistant" ? <Bot /> : <User />}</div>
        <div>
          <div className="bubble">
            {message.body.split("\n").map((line, index) => (
              <p key={`${index}-${line.slice(0, 12)}`}>{line || <br />}</p>
            ))}
          </div>
          {message.role === "assistant" && (
            <div className="message-actions">
              <button
                className="message-primary-action"
                onClick={() => {
                  setActionTitle(assistantTitle(message.body));
                  setActionTarget("campaign");
                }}
              >
                <Sparkles size={15} />
                Transformar em ação
              </button>
              {feedback ? (
                <span>
                  <Check size={14} />
                  Feedback salvo
                </span>
              ) : (
                <>
                  <button
                    onClick={() => sendFeedback.mutate("positive")}
                    aria-label="Resposta útil"
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <button
                    onClick={() => sendFeedback.mutate("negative")}
                    aria-label="Resposta não útil"
                  >
                    <ThumbsDown size={15} />
                  </button>
                </>
              )}
              {createdAs && (
                <span>
                  <Check size={14} />
                  {createdAs}
                </span>
              )}
              {createAction.error && (
                <span className="message-action-error">{createAction.error.message}</span>
              )}
            </div>
          )}
        </div>
      </div>
      {actionTarget && (
        <div className="modal-backdrop" onMouseDown={() => setActionTarget(undefined)}>
          <form
            aria-labelledby="selenita-action-title"
            aria-modal="true"
            className="modal-card selenita-action-modal"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              createAction.mutate(actionTarget);
            }}
          >
            <div className="modal-title">
              <div>
                <p className="eyebrow">Confirmar execução</p>
                <h2 id="selenita-action-title">Transformar resposta em ação</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Fechar"
                onClick={() => setActionTarget(undefined)}
              >
                <X />
              </button>
            </div>
            <div
              className="selenita-action-options"
              role="radiogroup"
              aria-label="Destino"
            >
              {actionOptions.map(({ target, label, description, icon: Icon }) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={actionTarget === target}
                  className={actionTarget === target ? "active" : ""}
                  key={target}
                  onClick={() => setActionTarget(target)}
                >
                  <Icon size={18} />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              ))}
            </div>
            <label>
              Título
              <input
                required
                minLength={2}
                maxLength={180}
                value={actionTitle}
                onChange={(event) => setActionTitle(event.target.value)}
              />
            </label>
            {actionTarget === "calendar" && (
              <label>
                Publicar em
                <input
                  required
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                />
              </label>
            )}
            <div className="selenita-action-preview">
              <strong>Conteúdo que será levado junto</strong>
              <p>{message.body.slice(0, 280)}</p>
            </div>
            <button
              className="button primary"
              disabled={
                createAction.isPending ||
                actionTitle.trim().length < 2 ||
                (actionTarget === "calendar" && !scheduledFor)
              }
            >
              <Check size={17} />
              {createAction.isPending ? "Criando…" : "Confirmar e criar"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function assistantTitle(body: string) {
  const firstLine = body
    .split("\n")
    .map((line) => line.replace(/^#+\s*|^[*-]\s*/g, "").trim())
    .find(Boolean);
  return (firstLine || "Ação proposta pela Selenita").slice(0, 180);
}

function actionResourceKind(target: SelenitaActionTarget) {
  if (target === "campaign") return "campaign";
  if (target === "calendar") return "content";
  return "performance";
}
