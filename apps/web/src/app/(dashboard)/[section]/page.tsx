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
      primary?: boolean;
    }>;
  }
> = {
  produce: {
    eyebrow: "Campanha e anúncio",
    title: "Produzir",
    description:
      "Comece pela campanha. O resto fica guardado para quando você realmente precisar.",
    items: [
      {
        href: "/campaigns",
        title: "Campanhas e ads",
        description: "Oferta, ângulos, roteiros e peças de tráfego pago.",
        icon: Layers3,
        primary: true,
      },
      {
        href: "/content",
        title: "Peças",
        description: "O que saiu da campanha: roteiro, post ou criativo para publicar.",
        icon: Megaphone,
        primary: true,
      },
      {
        href: "/calendar",
        title: "Calendário",
        description: "Quando cada peça entra no ar.",
        icon: CalendarDays,
        primary: true,
      },
      {
        href: "/video-prompts",
        title: "Prompts de vídeo",
        description: "Quando for gerar vídeo com IA.",
        icon: Video,
      },
      {
        href: "/video-editor",
        title: "Editor autônomo",
        description: "Quando tiver gravação bruta para a Selenita cortar.",
        icon: Clapperboard,
      },
      {
        href: "/video-prompts?focus=influencer#influenciadora-ia",
        title: "Influenciadora com IA",
        description: "Personagem visual, só se a campanha pedir.",
        icon: UserRound,
      },
    ],
  },
  library: {
    eyebrow: "Contexto da marca",
    title: "Biblioteca",
    description: "O essencial para a Selenita escrever ads certos. Cadastros finos ficam em Mais.",
    items: [
      {
        href: "/documents",
        title: "Documentos",
        description: "Estratégia, provas e o que a Selenita deve lembrar.",
        icon: FileText,
        primary: true,
      },
      {
        href: "/audiences",
        title: "Públicos",
        description: "Dores, desejos e linguagem de cada segmento.",
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
        description: "Territórios editoriais repetíveis.",
        icon: Shapes,
      },
      {
        href: "/interviews",
        title: "Entrevistas",
        description: "Voz literal das clientes.",
        icon: MessagesSquare,
      },
      {
        href: "/outreach",
        title: "Canais",
        description: "Comunidades e parcerias.",
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
  const primary = items.filter((item) => item.primary);
  const more = items.filter((item) => !item.primary);
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="area-hub-grid" aria-label={`Ferramentas de ${title}`}>
        {primary.map((item) => (
          <HubCard key={item.href} {...item} />
        ))}
      </section>
      {more.length > 0 && (
        <details className="area-hub-more">
          <summary>Mais ferramentas ({more.length})</summary>
          <section className="area-hub-grid" aria-label={`Ferramentas avançadas de ${title}`}>
            {more.map((item) => (
              <HubCard key={item.href} {...item} />
            ))}
          </section>
        </details>
      )}
    </>
  );
}

function HubCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="area-hub-card">
      <span className="area-hub-icon">
        <Icon size={22} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span aria-hidden="true">Abrir →</span>
    </Link>
  );
}
