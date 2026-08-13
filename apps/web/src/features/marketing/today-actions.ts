import type { DashboardData, MarketingResource } from "../../shared/types";

export type TodayAction = {
  id: string;
  title: string;
  summary: string;
  label: string;
  href: string;
  priority: number;
  updatedAt: string;
};

export function buildTodayActions(
  resources: MarketingResource[],
  now = new Date(),
  videoJobs: DashboardData["videoJobs"] = [],
) {
  const content = resources.filter((item) => item.kind === "content");
  const measuredContentIds = new Set(
    resources
      .filter((item) => item.kind === "performance")
      .map((item) => item.data.sourceContentId)
      .filter((id): id is string => typeof id === "string"),
  );
  const coveredCampaignIds = new Set(
    content
      .map((item) => item.data.sourceCampaignId)
      .filter((id): id is string => typeof id === "string"),
  );
  const actions: TodayAction[] = [];

  for (const item of content) {
    if (item.status === "archived") continue;
    const scheduled = item.scheduledFor ? new Date(item.scheduledFor) : null;
    if (item.status === "ready" && scheduled && scheduled <= now) {
      actions.push(action(item, 0, "Publicar agora", "A data planejada já chegou."));
    } else if (item.status === "ready") {
      actions.push(
        action(
          item,
          2,
          scheduled ? "Revisar publicação" : "Agendar publicação",
          scheduled ? `Programado para ${formatDate(scheduled)}.` : "A peça está pronta.",
        ),
      );
    } else if (["planned", "producing"].includes(item.status)) {
      actions.push(action(item, 3, "Continuar produção", item.summary));
    } else if (item.status === "idea") {
      actions.push(action(item, 4, "Revisar ideia", item.summary));
    } else if (item.status === "published" && !measuredContentIds.has(item.id)) {
      actions.push({
        ...action(item, 5, "Registrar resultado", "Feche o ciclo com o sinal observado."),
        href: "/results",
      });
    }
  }

  for (const campaign of resources) {
    if (
      campaign.kind !== "campaign" ||
      campaign.status === "archived" ||
      coveredCampaignIds.has(campaign.id)
    )
      continue;
    actions.push({
      ...action(
        campaign,
        1,
        "Gerar primeira peça",
        campaign.summary ?? "A campanha ainda não tem post rastreado.",
      ),
      href: `/campaigns?edit=${campaign.id}`,
    });
  }

  for (const job of videoJobs) {
    const needsReview = job.status === "ready_for_review";
    actions.push({
      id: `video-edit:${job.id}:${job.status}`,
      title: job.title,
      summary: needsReview
        ? "O primeiro corte já passou pela autorrevisão da Selenita."
        : job.error || "A Selenita precisa de uma orientação para continuar.",
      label: needsReview ? "Revisar corte" : "Resolver edição",
      href: `/video-editor?job=${job.id}`,
      priority: needsReview ? 0 : 1,
      updatedAt: job.updatedAt,
    });
  }

  return actions.sort(
    (left, right) =>
      left.priority - right.priority ||
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function action(
  item: MarketingResource,
  priority: number,
  label: string,
  summary: string | null,
): TodayAction {
  const section = item.kind === "content" ? "content" : `${item.kind}s`;
  return {
    id: `${item.kind}:${item.id}:${label}`,
    title: item.title,
    summary: summary || "Abra o item para definir a próxima etapa.",
    label,
    href: `/${section}?edit=${item.id}`,
    priority,
    updatedAt: item.updatedAt,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    date,
  );
}
