export type GettingStartedStage = "product" | "sale" | "result";

export const GETTING_STARTED_STAGE_TOTAL = 3;

export const GETTING_STARTED_MESSAGES_PT_BR = {
  "onboarding.header": "PRIMEIROS PASSOS",
  "onboarding.skip": "Agora não",
  "onboarding.skipHint": "Fecha o guia e mantém seu progresso atual",
  "onboarding.stepOne": "ETAPA 1 DE 3",
  "onboarding.stepTwo": "ETAPA 2 DE 3",
  "onboarding.stepThree": "ETAPA 3 DE 3",
  "onboarding.progress": "Etapa {{step}} de {{total}}",
  "onboarding.product.title": "Cadastre o que você vende",
  "onboarding.product.description":
    "Comece pelo essencial: dê um nome e defina o preço do seu primeiro produto.",
  "onboarding.product.info":
    "Você poderá adicionar fotos, custos e outros detalhes depois.",
  "onboarding.product.cta": "Cadastrar primeiro produto",
  "onboarding.product.heroAlt": "Caixa de produto com etiqueta de preço",
  "onboarding.sale.title": "Registre sua primeira venda",
  "onboarding.sale.description":
    "Com o item cadastrado, registre uma venda para ver o dinheiro entrar.",
  "onboarding.sale.info": "Escolha o item, confirme e pronto. Leva menos de 1 minuto.",
  "onboarding.sale.cta": "Registrar primeira venda",
  "onboarding.sale.heroAlt": "Recibo de venda com caixa, cartão e confirmação",
  "onboarding.result.title": "Veja o que sua venda rendeu",
  "onboarding.result.description":
    "Pronto: sua primeira venda já está organizada. Confira o resultado para fechar o passo a passo.",
  "onboarding.result.info":
    "No Financeiro, você acompanha vendas, custos e o que realmente sobrou.",
  "onboarding.result.cta": "Ver meu resultado",
  "onboarding.result.heroAlt": "Painel financeiro com gráfico de crescimento",
  "onboarding.cta.loading": "Carregando",
} as const;

export type GettingStartedMessageKey = keyof typeof GETTING_STARTED_MESSAGES_PT_BR;
export type GettingStartedMessageValues = Readonly<Record<string, string | number>>;
export type GettingStartedTranslate = (
  key: GettingStartedMessageKey,
  values?: GettingStartedMessageValues,
) => string;

export function createGettingStartedTranslator(
  messages: Partial<Record<GettingStartedMessageKey, string>> = {},
): GettingStartedTranslate {
  return (key, values = {}) => {
    const template = messages[key] ?? GETTING_STARTED_MESSAGES_PT_BR[key];
    return template.replace(/{{(\w+)}}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
    );
  };
}

export const translateGettingStarted = createGettingStartedTranslator();

const STAGE_MESSAGE_KEYS: Record<
  GettingStartedStage,
  {
    action: GettingStartedMessageKey;
    description: GettingStartedMessageKey;
    heroAlt: GettingStartedMessageKey;
    info: GettingStartedMessageKey;
    title: GettingStartedMessageKey;
  }
> = {
  product: {
    action: "onboarding.product.cta",
    description: "onboarding.product.description",
    heroAlt: "onboarding.product.heroAlt",
    info: "onboarding.product.info",
    title: "onboarding.product.title",
  },
  sale: {
    action: "onboarding.sale.cta",
    description: "onboarding.sale.description",
    heroAlt: "onboarding.sale.heroAlt",
    info: "onboarding.sale.info",
    title: "onboarding.sale.title",
  },
  result: {
    action: "onboarding.result.cta",
    description: "onboarding.result.description",
    heroAlt: "onboarding.result.heroAlt",
    info: "onboarding.result.info",
    title: "onboarding.result.title",
  },
};

export function getGettingStartedGuideCopy(
  stage: GettingStartedStage,
  translate: GettingStartedTranslate = translateGettingStarted,
) {
  const keys = STAGE_MESSAGE_KEYS[stage];
  return {
    action: translate(keys.action),
    description: translate(keys.description),
    heroAlt: translate(keys.heroAlt),
    info: translate(keys.info),
    title: translate(keys.title),
  };
}

export function gettingStartedStageChip(
  step: number,
  translate: GettingStartedTranslate = translateGettingStarted,
): string {
  const keys = [
    "onboarding.stepOne",
    "onboarding.stepTwo",
    "onboarding.stepThree",
  ] as const;
  return translate(keys[Math.min(Math.max(step, 1), keys.length) - 1]);
}

export function gettingStartedProgressLabel(
  step: number,
  total = GETTING_STARTED_STAGE_TOTAL,
  translate: GettingStartedTranslate = translateGettingStarted,
): string {
  return translate("onboarding.progress", { step, total });
}

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

  // Não apresenta um guia novo a quem já chegou ao resultado por conta própria.
  return started || !hasProduct || !hasSale;
}

export function resolveGettingStartedPresentation({
  dismissed = false,
  settled,
  completed,
  started,
  hasProduct,
  hasSale,
}: Readonly<{
  dismissed?: boolean;
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
  const eligible = shouldShowGettingStarted({
    settled,
    completed,
    started,
    hasProduct,
    hasSale,
  });

  return {
    show: eligible && !dismissed,
    showReopen: eligible && dismissed,
    stage: getGettingStartedStage(hasProduct, hasSale),
  };
}
