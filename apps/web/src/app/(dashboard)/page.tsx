"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  FileText,
  Flame,
  Megaphone,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/features/marketing/page-header";
import { apiClient } from "@/shared/lib/api-client";
import type { DashboardData, MarketingResource } from "@/shared/types";

export default function TodayPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["marketing-dashboard"],
    queryFn: () => apiClient<DashboardData>("/dashboard"),
  });
  const seed = useMutation({
    mutationFn: () => apiClient<{ imported: number }>("/seed", { method: "POST" }),
    onSuccess: () => void client.invalidateQueries(),
  });
  const resources = query.data?.resources ?? [];
  const ideas = resources
    .filter((item) => item.kind === "content" && item.status !== "published")
    .slice(0, 4);
  const outreach = resources.filter((item) => item.kind === "outreach").slice(0, 3);
  const hasData = resources.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Seu centro de comando"
        title="O que merece atenção hoje?"
        description="Uma visão curta para transformar estratégia em ação — sem perder ideias, contexto ou aprendizado."
        action={
          <button
            className="button secondary"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
          >
            <RefreshCw size={17} className={seed.isPending ? "spin" : ""} />
            {hasData ? "Sincronizar base inicial" : "Importar estratégia completa"}
          </button>
        }
      />
      {query.error && <div className="notice error">{query.error.message}</div>}
      {seed.isSuccess && (
        <div className="notice success">
          Base inicial sincronizada: {seed.data.imported} itens estruturados.
        </div>
      )}
      <section className="metric-grid">
        <Metric
          icon={Megaphone}
          value={resources.filter((item) => item.kind === "content").length}
          label="ideias e posts"
          color="amber"
        />
        <Metric
          icon={CalendarCheck2}
          value={
            resources.filter((item) => item.kind === "content" && item.scheduledFor)
              .length
          }
          label="agendados"
          color="green"
        />
        <Metric
          icon={FileText}
          value={query.data?.documents.length ?? 0}
          label="documentos"
          color="blue"
        />
        <Metric
          icon={Sparkles}
          value={query.data?.learning.length ?? 0}
          label="aprendizados da IA"
          color="rose"
        />
      </section>
      <section className="dashboard-layout">
        <div className="dashboard-column dashboard-main">
          <div className="panel next-panel">
            <PanelHeading icon={Flame} title="Próximas peças" link="/content" />
            {ideas.length ? (
              <div className="task-list">
                {ideas.map((item) => (
                  <TaskRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyInline text="Importe a estratégia inicial para receber 4 semanas de ideias." />
            )}
          </div>
          <div className="panel outreach-panel">
            <PanelHeading icon={Megaphone} title="Onde chegar" link="/outreach" />
            {outreach.map((item) => (
              <div className="mini-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="dashboard-column dashboard-rail">
          <div className="panel ai-panel">
            <div className="ai-orb">
              <Bot />
            </div>
            <div className="ai-panel-copy">
              <p className="eyebrow">Consultoria IA</p>
              <h2>Transforme uma dúvida em plano de ação.</h2>
              <p>
                Peça uma semana de posts, um roteiro, uma campanha ou a revisão de uma ideia.
              </p>
              <Link className="button light" href="/ai">
                Conversar com a IA <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <div className="panel documents-panel">
            <PanelHeading icon={FileText} title="Documentos recentes" link="/documents" />
            {query.data?.documents.slice(0, 3).map((item) => (
              <div className="mini-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
            {!query.data?.documents.length && (
              <EmptyInline text="Centralize aqui briefings, campanhas e pesquisas." />
            )}
          </div>
        </aside>
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Megaphone;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <article className="metric">
      <span className={`metric-icon ${color}`}>
        <Icon size={20} />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
function PanelHeading({
  icon: Icon,
  title,
  link,
}: {
  icon: typeof Megaphone;
  title: string;
  link: string;
}) {
  return (
    <div className="panel-heading">
      <h2>
        <Icon size={19} />
        {title}
      </h2>
      <Link href={link}>
        Ver tudo <ArrowRight size={15} />
      </Link>
    </div>
  );
}
function TaskRow({ item }: { item: MarketingResource }) {
  return (
    <div className="task-row">
      <div>
        <span className={`status ${item.status}`}>
          {item.status === "idea" ? "Ideia" : item.status}
        </span>
      </div>
      <div>
        <strong>{item.title}</strong>
        <p>{item.summary}</p>
      </div>
      <span className="channel">
        {typeof item.data.format === "string" ? item.data.format : "Post"}
      </span>
    </div>
  );
}
function EmptyInline({ text }: { text: string }) {
  return <p className="empty-inline">{text}</p>;
}
