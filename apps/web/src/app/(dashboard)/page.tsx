"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bot, CheckCircle2, Library, PenTool, RefreshCw } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/features/marketing/page-header";
import { buildTodayActions, type TodayAction } from "@/features/marketing/today-actions";
import { apiClient } from "@/shared/lib/api-client";
import type { DashboardData } from "@/shared/types";

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
  const actions = buildTodayActions(resources, new Date(), query.data?.videoJobs).slice(0, 8);
  const hasData = resources.length > 0;
  let queue: React.ReactNode = (
    <div className="today-clear">
      <CheckCircle2 />
      <div>
        <h2>Fila em dia</h2>
        <p>Use a Selenita para iniciar uma campanha ou produzir a próxima peça.</p>
      </div>
    </div>
  );
  if (query.isLoading) queue = <p className="empty-inline">Organizando a fila…</p>;
  else if (actions.length)
    queue = (
      <ol>
        {actions.map((item, index) => (
          <ActionRow action={item} index={index + 1} key={item.id} />
        ))}
      </ol>
    );

  return (
    <>
      <PageHeader
        eyebrow="Seu centro de comando"
        title="O que merece atenção hoje?"
        description="Uma fila curta para decidir, produzir, publicar e aprender sem procurar a próxima etapa."
        action={
          <button
            className="button secondary"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
          >
            <RefreshCw size={17} className={seed.isPending ? "spin" : ""} />
            {hasData ? "Sincronizar base" : "Importar estratégia"}
          </button>
        }
      />
      {query.error && <div className="notice error">{query.error.message}</div>}
      {seed.isSuccess && (
        <div className="notice success">
          Base sincronizada: {seed.data.imported} itens estruturados.
        </div>
      )}
      <section className="today-summary" aria-label="Resumo da fila">
        <strong>{actions.length}</strong>
        <div>
          <span>{actions.length === 1 ? "próxima ação" : "próximas ações"}</span>
          <p>A ordem considera prazo, campanhas sem peça e fechamento de resultados.</p>
        </div>
      </section>
      <section className="dashboard-layout">
        <div className="panel today-queue">
          <div className="panel-heading">
            <h2>
              <CheckCircle2 size={19} />
              Próximas decisões
            </h2>
          </div>
          {queue}
        </div>
        <aside className="dashboard-column dashboard-rail">
          <div className="panel ai-panel">
            <div className="ai-orb">
              <Bot />
            </div>
            <div className="ai-panel-copy">
              <p className="eyebrow">Selenita</p>
              <h2>Transforme intenção em trabalho organizado.</h2>
              <p>
                Converse, revise a proposta e confirme a criação de campanha, briefing,
                calendário, resultado ou edição autônoma de vídeo.
              </p>
              <Link className="button light" href="/ai">
                Conversar com a Selenita <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <nav className="panel today-shortcuts" aria-label="Atalhos da Central">
            <Link href="/produce">
              <PenTool size={18} />
              <span>
                <strong>Produzir</strong>
                Posts, campanhas e calendário
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/library">
              <Library size={18} />
              <span>
                <strong>Biblioteca</strong>
                Contexto para toda a Central
              </span>
              <ArrowRight size={16} />
            </Link>
          </nav>
        </aside>
      </section>
    </>
  );
}

function ActionRow({ action, index }: { action: TodayAction; index: number }) {
  return (
    <li>
      <span className="today-action-index">{String(index).padStart(2, "0")}</span>
      <div>
        <span className="today-action-label">{action.label}</span>
        <strong>{action.title}</strong>
        <p>{action.summary}</p>
      </div>
      <Link href={action.href} aria-label={`${action.label}: ${action.title}`}>
        Abrir <ArrowRight size={15} />
      </Link>
    </li>
  );
}
