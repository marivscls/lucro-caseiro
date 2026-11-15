import type { PaidPlan } from "@lucro-caseiro/contracts";
import type { BusinessExperienceCopy } from "./business-copy";

// Benefícios do Premium, exibidos na tela de planos, no checkout e na comemoração
// da compra. Fonte única para não divergir entre as telas. Os dois níveis pagos
// valem o mesmo (ver `@lucro-caseiro/contracts`), então a lista é uma só.
const PREMIUM_BENEFITS: readonly string[] = [
  "Clientes e produtos ilimitados",
  "Receitas e embalagens ilimitadas",
  "Fiado, agenda e financeiro completos",
  "Catálogo completo e personalizado",
  "Até 5 fotos por produto",
  "Resultados completos + PDF e Excel",
  "Fornecedores, compras e gastos fixos ilimitados",
  "Etiquetas personalizadas",
  "Suporte prioritário",
  "Sem anúncios",
];

export const TIER_BENEFITS: Record<PaidPlan, readonly string[]> = {
  essential: PREMIUM_BENEFITS,
  professional: PREMIUM_BENEFITS,
};

// Benefício que responde ao recurso que abriu o checkout (posição em
// PREMIUM_BENEFITS; `tierBenefitsFor` mantém a mesma ordem).
const BENEFIT_FOR_RESOURCE: Readonly<Record<string, number>> = {
  clients: 0,
  products: 0,
  recipes: 1,
  packaging: 1,
  fiado: 2,
  orders: 2,
  financeHistory: 2,
  catalog: 3,
  productPhotos: 4,
  reports: 5,
  export: 5,
  quotesPdf: 5,
  suppliers: 6,
  purchases: 6,
  recurring: 6,
  labels: 7,
  prioritySupport: 8,
};

/**
 * Benefícios do plano com o que a pessoa tentou usar em primeiro lugar.
 * Devolve a lista reordenada e se o primeiro item é o do recurso de origem.
 */
export function benefitsLeadingWith(
  benefits: readonly string[],
  resource: string | null | undefined,
): { readonly benefits: readonly string[]; readonly highlighted: boolean } {
  const index = resource ? BENEFIT_FOR_RESOURCE[resource] : undefined;
  if (index === undefined || index >= benefits.length) {
    return { benefits, highlighted: false };
  }
  const lead = benefits[index];
  return {
    benefits: [lead, ...benefits.filter((_, i) => i !== index)],
    highlighted: true,
  };
}

export function tierBenefitsFor(
  tier: PaidPlan,
  copy: BusinessExperienceCopy,
): readonly string[] {
  return TIER_BENEFITS[tier].map((benefit) => {
    if (benefit === "Clientes e produtos ilimitados") {
      return `Clientes e ${copy.productNounPlural} sem limite`;
    }
    if (benefit === "Receitas e embalagens ilimitadas") {
      const formulas = copy.formulaNounPlural.replace(/^./, (letter) =>
        letter.toUpperCase(),
      );
      return `${formulas} e ${copy.packagingNounPlural} sem limite`;
    }
    return benefit;
  });
}
