import type { GuidanceArea } from "./guidance.domain";

export interface TutorialVideoSpec {
  readonly id:
    | "pricing"
    | "sales_fiado"
    | "agenda"
    | "finance"
    | "catalog"
    | "recipes_materials";
  readonly title: string;
  readonly summary: string;
  readonly durationLabel: string;
  readonly fileName: string;
}

export const TUTORIAL_VIDEOS: readonly TutorialVideoSpec[] = [
  {
    id: "pricing",
    title: "Precificação na prática",
    summary: "Some materiais, seu tempo de trabalho e descubra o preço certo.",
    durationLabel: "34 s",
    fileName: "tutorial-precificacao.mp4",
  },
  {
    id: "sales_fiado",
    title: "Vendas e controle de fiado",
    summary: "Registre vendas, acompanhe quem deve e dê baixa quando receber.",
    durationLabel: "34 s",
    fileName: "tutorial-vendas-fiado.mp4",
  },
  {
    id: "agenda",
    title: "Agenda e encomendas",
    summary: "Anote pedidos com sinal, veja quanto falta cobrar e marque a entrega.",
    durationLabel: "34 s",
    fileName: "tutorial-agenda-encomendas.mp4",
  },
  {
    id: "finance",
    title: "Financeiro e relatórios",
    summary: "Acompanhe entradas, saídas do mês e baixe em PDF ou Excel.",
    durationLabel: "33 s",
    fileName: "tutorial-financeiro.mp4",
  },
  {
    id: "catalog",
    title: "Catálogo para WhatsApp",
    summary: "Escolha os itens da vitrine, veja como cliente e compartilhe o link.",
    durationLabel: "33 s",
    fileName: "tutorial-catalogo-vitrine.mp4",
  },
  {
    id: "recipes_materials",
    title: "Materiais e ficha de custo",
    summary: "Cadastre pacotes fechados e descubra o custo exato por unidade.",
    durationLabel: "34 s",
    fileName: "tutorial-receitas-custos.mp4",
  },
] as const;

const BY_ID: Record<TutorialVideoSpec["id"], TutorialVideoSpec> = {
  pricing: TUTORIAL_VIDEOS[0],
  sales_fiado: TUTORIAL_VIDEOS[1],
  agenda: TUTORIAL_VIDEOS[2],
  finance: TUTORIAL_VIDEOS[3],
  catalog: TUTORIAL_VIDEOS[4],
  recipes_materials: TUTORIAL_VIDEOS[5],
};

const AREA_TO_VIDEO: Partial<Record<GuidanceArea, TutorialVideoSpec>> = {
  pricing: BY_ID.pricing,
  sales: BY_ID.sales_fiado,
  new_sale: BY_ID.sales_fiado,
  fiado: BY_ID.sales_fiado,
  agenda: BY_ID.agenda,
  finance: BY_ID.finance,
  catalog: BY_ID.catalog,
  materials: BY_ID.recipes_materials,
  recipes: BY_ID.recipes_materials,
};

function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input[end - 1] === "/") {
    end -= 1;
  }
  return input.slice(0, end);
}

export function resolveTutorialVideosBaseUrl(
  raw = process.env.EXPO_PUBLIC_TUTORIAL_VIDEOS_URL,
  brandId = process.env.EXPO_PUBLIC_BRAND || "lucro-caseiro",
): string | null {
  if (brandId !== "lucro-caseiro") return null;
  const trimmed = stripTrailingSlashes(raw?.trim() ?? "");
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) return null;
  return trimmed;
}

export function getTutorialVideoUrl(
  video: TutorialVideoSpec,
  rawBaseUrl = process.env.EXPO_PUBLIC_TUTORIAL_VIDEOS_URL,
): string | null {
  const baseUrl = resolveTutorialVideosBaseUrl(rawBaseUrl);
  if (!baseUrl) return null;
  return `${baseUrl}/${video.fileName}`;
}

export function getTutorialVideoForArea(
  area: GuidanceArea,
  rawBaseUrl = process.env.EXPO_PUBLIC_TUTORIAL_VIDEOS_URL,
): { video: TutorialVideoSpec; url: string } | null {
  const video = AREA_TO_VIDEO[area];
  if (!video) return null;
  const url = getTutorialVideoUrl(video, rawBaseUrl);
  if (!url) return null;
  return { video, url };
}
