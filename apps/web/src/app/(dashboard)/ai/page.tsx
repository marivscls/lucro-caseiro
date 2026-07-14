"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  FilePlus2,
  Lightbulb,
  MessageSquarePlus,
  Send,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
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
        body: { message, sessionId, context: { source: "web-central" }, mode: "consult" },
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
        eyebrow="Equipe estratégica sob demanda"
        title="Consultoria IA do Lucro Caseiro"
        description="CMO, Growth, Branding, Copy, Vendas e Pesquisa conectados ao seu plano, documentos e aprendizados."
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
                <h2>O que você quer fazer crescer hoje?</h2>
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
  const [feedback, setFeedback] = useState<"positive" | "negative">();
  const [savedAs, setSavedAs] = useState<"document" | "idea">();
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
  const saveOutput = useMutation({
    mutationFn: (target: "document" | "idea") => {
      const stamp = Date.now();
      if (target === "document") {
        return apiClient("/documents", {
          method: "POST",
          body: {
            title: `Material criado pela IA — ${new Date().toLocaleDateString("pt-BR")}`,
            slug: `material-ia-${stamp}`,
            body: message.body,
            tags: ["ia", "marketing"],
            source: "ai",
          },
        });
      }
      return apiClient("/resources", {
        method: "POST",
        body: {
          kind: "content",
          slug: `ideia-ia-${stamp}`,
          title: message.body.split("\n").find(Boolean)?.slice(0, 160) ?? "Ideia da IA",
          summary: message.body.slice(0, 500),
          status: "idea",
          data: { source: "ai", fullOutput: message.body },
        },
      });
    },
    onSuccess: (_, target) => setSavedAs(target),
  });
  return (
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
              onClick={() => saveOutput.mutate("document")}
              aria-label="Salvar como documento"
              title="Salvar como documento"
            >
              <FilePlus2 size={15} />
            </button>
            <button
              onClick={() => saveOutput.mutate("idea")}
              aria-label="Salvar como ideia"
              title="Salvar como ideia"
            >
              <Lightbulb size={15} />
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
            {savedAs && (
              <span>
                <Check size={14} />
                Salvo como {savedAs === "document" ? "documento" : "ideia"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
