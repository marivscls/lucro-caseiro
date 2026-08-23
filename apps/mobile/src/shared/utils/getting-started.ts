export type GettingStartedStage = "product" | "sale" | "result";

export const GETTING_STARTED_GUIDE_HEADER = "PRIMEIROS PASSOS";
export const GETTING_STARTED_GUIDE_SKIP = "Agora não";
export const GETTING_STARTED_GUIDE_PREVIEW_HINT =
  "Modo de prévia: avance sem alterar seus dados.";
export const GETTING_STARTED_STAGE_TOTAL = 3;

export function gettingStartedStageChip(
  step: number,
  total = GETTING_STARTED_STAGE_TOTAL,
): string {
  return `ETAPA ${step} DE ${total}`;
}

export const GETTING_STARTED_GUIDE_COPY: Record<
  GettingStartedStage,
  {
    action: string;
    description: string;
    tip: string;
    title: string;
  }
> = {
  product: {
    title: "Cadastre o que você vende",
    description:
      "Comece pelo essencial: dê um nome e defina o preço do seu primeiro produto.",
    tip: "Você poderá adicionar fotos, custos e outros detalhes depois.",
    action: "Cadastrar primeiro produto",
  },
  sale: {
    title: "Registre sua primeira venda",
    description: "Com o item cadastrado, registre uma venda para ver o dinheiro entrar.",
    tip: "Escolha o item, confirme e pronto. Leva menos de 1 minuto.",
    action: "Registrar primeira venda",
  },
  result: {
    title: "Veja o que sua venda rendeu",
    description:
      "O resultado já aparece na Home: quanto entrou, quanto saiu e o que sobrou.",
    tip: "Depois disso, a Home vira o painel do seu dia a dia.",
    action: "Ver meu resultado",
  },
};

export function advanceGettingStartedStage(
  stage: GettingStartedStage,
): GettingStartedStage | null {
  if (stage === "product") return "sale";
  if (stage === "sale") return "result";
  return null;
}

export function getGettingStartedStage(
  hasProduct: boolean,
  hasSale: boolean,
): GettingStartedStage {
  if (!hasProduct) return "product";
  if (!hasSale) return "sale";
  return "result";
}

export function shouldShowGettingStarted({
  settled,
  completed,
  started,
  hasProduct,
  hasSale,
}: Readonly<{
  settled: boolean;
  completed: boolean;
  started: boolean;
  hasProduct: boolean;
  hasSale: boolean;
}>): boolean {
  if (!settled || completed) return false;

  // Nao apresenta um guia novo a quem ja chegou ao resultado por conta propria.
  return started || !hasProduct || !hasSale;
}

export function resolveGettingStartedPresentation({
  preview = false,
  previewDismissed = false,
  previewStage = "product",
  settled,
  completed,
  started,
  hasProduct,
  hasSale,
}: Readonly<{
  preview?: boolean;
  previewDismissed?: boolean;
  previewStage?: GettingStartedStage;
  settled: boolean;
  completed: boolean;
  started: boolean;
  hasProduct: boolean;
  hasSale: boolean;
}>): {
  show: boolean;
  showReopen: boolean;
  stage: GettingStartedStage;
} {
  if (preview) {
    return {
      show: !previewDismissed,
      showReopen: previewDismissed,
      stage: previewStage,
    };
  }

  return {
    show: shouldShowGettingStarted({
      settled,
      completed,
      started,
      hasProduct,
      hasSale,
    }),
    showReopen: false,
    stage: getGettingStartedStage(hasProduct, hasSale),
  };
}
