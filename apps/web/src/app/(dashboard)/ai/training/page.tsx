"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Beaker,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  History,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient } from "@/shared/lib/api-client";
import type { TrainingData } from "@/shared/types";

type Tab = "instructions" | "knowledge" | "examples" | "evaluations" | "learning";

export default function TrainingPage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("instructions");
  const query = useQuery({
    queryKey: ["ai-training"],
    queryFn: () => apiClient<TrainingData>("/ai/training"),
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ["ai-training"] });
  const publish = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/ai/training/instructions/${id}/publish`, { method: "POST" }),
    onSuccess: refresh,
  });
  const run = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/ai/training/evaluations/${id}/run`, { method: "POST" }),
    onSuccess: refresh,
  });
  const data = query.data;
  return (
    <>
      <PageHeader
        eyebrow="Governança e evolução"
        title="Treinamento da inteligência"
        description="Versione instruções, organize conhecimento, aprove exemplos, execute avaliações e acompanhe cada adaptação automática."
      />
      <section className="guardrail-grid">
        <Guardrail
          className="A"
          title="Automático"
          description="Tags, preferências explícitas, deduplicação, ranking e recuperação."
          active={data?.settings.classAEnabled ?? true}
        />
        <Guardrail
          className="B"
          title="Com gates"
          description="Candidatos de prompt e estratégia passam por shadow, avaliação e rollback."
          active={data?.settings.classBEnabled ?? true}
        />
        <Guardrail
          className="C"
          title="Protegido"
          description="Missão, ética, permissões, fatos financeiros e ações externas não se autoalteram."
          active={data?.settings.classCEnabled ?? false}
          protected
        />
      </section>
      <div className="training-tabs">
        {(
          ["instructions", "knowledge", "examples", "evaluations", "learning"] as Tab[]
        ).map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {tabLabel(item)}
          </button>
        ))}
      </div>
      <section className="training-panel">
        {tab === "instructions" && (
          <>
            <TrainingHeading
              icon={BrainCircuit}
              title="Versões do sistema"
              description="Apenas uma instrução fica publicada por vez. Toda versão anterior pode ser restaurada."
              action={<CreateInstruction onDone={refresh} />}
            />
            <div className="stack-list">
              {data?.instructions.map((item) => (
                <article key={item.id}>
                  <div>
                    <span className={`status ${item.isActive ? "active" : "archived"}`}>
                      {item.isActive ? "Publicada" : `Versão ${item.version}`}
                    </span>
                    <h3>Instrução v{item.version}</h3>
                    <p>{item.note ?? item.body.slice(0, 180)}</p>
                  </div>
                  {!item.isActive && (
                    <button
                      className="button ghost"
                      onClick={() => publish.mutate(item.id)}
                    >
                      Publicar versão
                    </button>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "knowledge" && (
          <>
            <TrainingHeading
              icon={BookOpen}
              title="Base de conhecimento"
              description="Fontes canônicas aparecem primeiro e dão contexto factual à IA."
              action={<CreateKnowledge onDone={refresh} />}
            />
            <div className="knowledge-grid">
              {data?.knowledge.map((item) => (
                <article key={item.id}>
                  <span className="status active">
                    {item.canonical ? "Canônico" : item.sourceType}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <footer>{item.tags.join(" · ")}</footer>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "examples" && (
          <>
            <TrainingHeading
              icon={CheckCircle2}
              title="Exemplos aprovados"
              description="Ensine tom e estrutura com pares de pedido e resposta considerados bons."
              action={<CreateExample onDone={refresh} />}
            />
            <div className="stack-list">
              {data?.examples.map((item) => (
                <article key={item.id}>
                  <div>
                    <h3>{item.input}</h3>
                    <p>{item.output}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "evaluations" && (
          <>
            <TrainingHeading
              icon={FlaskConical}
              title="Avaliações repetíveis"
              description="Compare versões usando os mesmos casos antes de publicar mudanças importantes."
              action={<CreateEvaluation onDone={refresh} />}
            />
            <div className="stack-list">
              {data?.evaluations.map((item) => (
                <article key={item.id}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.prompt}</p>
                    {item.lastScore !== null && (
                      <strong className="score">Última nota: {item.lastScore}%</strong>
                    )}
                  </div>
                  <button className="button ghost" onClick={() => run.mutate(item.id)}>
                    <Beaker size={16} />
                    Executar
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "learning" && (
          <>
            <TrainingHeading
              icon={History}
              title="Trilha de aprendizado automático"
              description="Toda adaptação registra classe, motivo, estado e possibilidade de auditoria."
            />
            <div className="stack-list">
              {data?.learning.map((item) => (
                <article key={item.id}>
                  <span
                    className={`learning-class class-${item.learningClass.toLowerCase()}`}
                  >
                    {item.learningClass}
                  </span>
                  <div>
                    <h3>{item.action}</h3>
                    <p>{item.reason}</p>
                    <small>
                      {item.status} · {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function Guardrail({
  className,
  title,
  description,
  active,
  protected: isProtected,
}: {
  className: string;
  title: string;
  description: string;
  active: boolean;
  protected?: boolean;
}) {
  return (
    <article className={`guardrail ${isProtected ? "protected" : ""}`}>
      <span>{className}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <em>{guardrailState(Boolean(isProtected), active)}</em>
    </article>
  );
}
function TrainingHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof BrainCircuit;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="training-heading">
      <div className="title-icon">
        <Icon />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
function tabLabel(tab: Tab) {
  return (
    {
      instructions: "Instruções",
      knowledge: "Conhecimento",
      examples: "Exemplos",
      evaluations: "Avaliações",
      learning: "Aprendizado",
    } as Record<Tab, string>
  )[tab];
}
function guardrailState(isProtected: boolean, active: boolean) {
  if (isProtected) return <ShieldCheck size={18} />;
  return <span>{active ? "Ligado" : "Desligado"}</span>;
}

function CreateInstruction({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/ai/training/instructions", {
        method: "POST",
        body: { body, note: "Versão criada na central" },
      }),
    onSuccess: () => {
      setOpen(false);
      setBody("");
      onDone();
    },
  });
  return (
    <InlineCreator open={open} setOpen={setOpen} label="Nova versão">
      <label>
        Instrução completa
        <textarea
          rows={12}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <button
        className="button primary"
        disabled={body.length < 100}
        onClick={() => mutation.mutate()}
      >
        Criar versão
      </button>
    </InlineCreator>
  );
}
function CreateKnowledge({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/ai/training/knowledge", {
        method: "POST",
        body: { title, body, sourceType: "manual", tags: [], canonical: false },
      }),
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      setBody("");
      onDone();
    },
  });
  return (
    <InlineCreator open={open} setOpen={setOpen} label="Adicionar fonte">
      <label>
        Título
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Conteúdo
        <textarea
          rows={7}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <button className="button primary" onClick={() => mutation.mutate()}>
        Salvar fonte
      </button>
    </InlineCreator>
  );
}
function CreateExample({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/ai/training/examples", {
        method: "POST",
        body: { input, output, tags: [] },
      }),
    onSuccess: () => {
      setOpen(false);
      setInput("");
      setOutput("");
      onDone();
    },
  });
  return (
    <InlineCreator open={open} setOpen={setOpen} label="Novo exemplo">
      <label>
        Pedido
        <input value={input} onChange={(event) => setInput(event.target.value)} />
      </label>
      <label>
        Resposta ideal
        <textarea
          rows={7}
          value={output}
          onChange={(event) => setOutput(event.target.value)}
        />
      </label>
      <button className="button primary" onClick={() => mutation.mutate()}>
        Aprovar exemplo
      </button>
    </InlineCreator>
  );
}
function CreateEvaluation({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [expected, setExpected] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      apiClient("/ai/training/evaluations", {
        method: "POST",
        body: { title, prompt, expected, tags: [] },
      }),
    onSuccess: () => {
      setOpen(false);
      onDone();
    },
  });
  return (
    <InlineCreator open={open} setOpen={setOpen} label="Novo caso">
      <label>
        Título
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Pedido
        <textarea
          rows={4}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      <label>
        Critérios esperados
        <textarea
          rows={4}
          value={expected}
          onChange={(event) => setExpected(event.target.value)}
        />
      </label>
      <button className="button primary" onClick={() => mutation.mutate()}>
        Salvar avaliação
      </button>
    </InlineCreator>
  );
}
function InlineCreator({
  open,
  setOpen,
  label,
  children,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {!open && (
        <button className="button secondary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          {label}
        </button>
      )}
      {open && (
        <div className="inline-creator">
          {children}
          <button className="button ghost" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      )}
    </>
  );
}
