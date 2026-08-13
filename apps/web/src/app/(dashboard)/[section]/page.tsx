import {
  CalendarDays,
  Clapperboard,
  FileText,
  Layers3,
  Megaphone,
  MessagesSquare,
  PackageSearch,
  Route,
  Shapes,
  Video,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/features/marketing/page-header";
import { ResourceBoard } from "@/features/marketing/resource-board";
import type { ResourceKind } from "@/shared/types";

const routes: Record<string, ResourceKind> = {
  content: "content",
  audiences: "audience",
  interviews: "interview",
  features: "feature",
  outreach: "outreach",
  campaigns: "campaign",
  results: "performance",
  topics: "topic",
};

const hubs: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      href: string;
      title: string;
      description: string;
      icon: LucideIcon;
    }>;
  }
> = {
  produce: {
    eyebrow: "Da ideia à publicação",
    title: "Produzir",
    description:
      "Escolha a próxima etapa sem perder o fio entre campanha, peça e calendário.",
    items: [
      {
        href: "/content",
        title: "Posts",
        description: "Crie briefings, roteiros e publicações ligados à estratégia.",
        icon: Megaphone,
      },
      {
        href: "/campaigns",
        title: "Campanhas",
        description: "Conecte pesquisa, estratégia, copy, revisão e publicação.",
        icon: Layers3,
      },
      {
        href: "/calendar",
        title: "Calendário",
        description: "Distribua as peças prontas e visualize a cadência semanal.",
        icon: CalendarDays,
      },
      {
        href: "/video-prompts",
        title: "Prompts de vídeo",
        description:
          "Crie prompts completos e consistentes para vídeos com personagem, produto, interface ou cenas sem personagem.",
        icon: Video,
      },
      {
        href: "/video-editor",
        title: "Editor autônomo",
        description:
          "Entregue a gravação bruta para a Selenita cortar, legendar, tratar, revisar e exportar.",
        icon: Clapperboard,
      },
      {
        href: "/video-prompts?focus=influencer#influenciadora-ia",
        title: "Influenciadora com IA",
        description:
          "Defina uma identidade, gere pranchas de rosto e corpo e reutilize a personagem em fotos e vídeos.",
        icon: UserRound,
      },
    ],
  },
  library: {
    eyebrow: "Contexto reutilizável",
    title: "Biblioteca",
    description:
      "Mantenha em um só lugar o conhecimento que orienta a produção e a Selenita.",
    items: [
      {
        href: "/documents",
        title: "Documentos",
        description: "Estratégia, playbooks, pesquisas e briefings vivos.",
        icon: FileText,
      },
      {
        href: "/audiences",
        title: "Públicos",
        description: "Dores, desejos, linguagem e contexto de cada segmento.",
        icon: Users,
      },
      {
        href: "/features",
        title: "Funcionalidades",
        description: "Capacidades do produto ligadas a problema, prova e CTA.",
        icon: PackageSearch,
      },
      {
        href: "/topics",
        title: "Temas",
        description: "Territórios editoriais repetíveis para construir autoridade.",
        icon: Shapes,
      },
      {
        href: "/interviews",
        title: "Entrevistas",
        description: "Voz literal das clientes, objeções e evidências.",
        icon: MessagesSquare,
      },
      {
        href: "/outreach",
        title: "Canais",
        description: "Comunidades, parcerias e caminhos de distribuição.",
        icon: Route,
      },
    ],
  },
};

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const { section } = await params;
  const { edit } = await searchParams;
  const hub = hubs[section];
  if (hub) return <AreaHub {...hub} />;
  const kind = routes[section];
  if (!kind) notFound();
  return (
    <ResourceBoard
      initialEditingId={typeof edit === "string" ? edit : undefined}
      kind={kind}
    />
  );
}

function AreaHub({ eyebrow, title, description, items }: (typeof hubs)[string]) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="area-hub-grid" aria-label={`Ferramentas de ${title}`}>
        {items.map(
          ({ href, title: itemTitle, description: itemDescription, icon: Icon }) => (
            <Link href={href} className="area-hub-card" key={href}>
              <span className="area-hub-icon">
                <Icon size={22} />
              </span>
              <div>
                <h2>{itemTitle}</h2>
                <p>{itemDescription}</p>
              </div>
              <span aria-hidden="true">Abrir →</span>
            </Link>
          ),
        )}
      </section>
    </>
  );
}
