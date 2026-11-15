import type { PaidPlan } from "@lucro-caseiro/contracts";
import type { BusinessExperienceCopy } from "./business-copy";

// Benefícios por plano, exibidos no paywall e no recibo de confirmação de compra.
// Fonte única para não divergir entre as duas telas.
export const TIER_BENEFITS: Record<PaidPlan, readonly string[]> = {
  essential: [
    "Clientes e produtos ilimitados",
    "Receitas e embalagens ilimitadas",
    "Catálogo completo e personalizado",
    "Até 5 fotos por produto",
    "Agenda, fiado e financeiro básico",
    // O teto de 3 fornecedores é o mesmo do Gratuito: não é vantagem do
    // Essencial. Fornecedores ilimitados aparecem na lista do Profissional.
    "Sem anúncios",
  ],
  professional: [
    "Tudo do Essencial",
    "Resultados completos + exportar PDF/Excel",
    "Fornecedores, compras e gastos fixos ilimitados",
    "Etiquetas personalizadas",
    "Suporte prioritário",
  ],
};

// Benefício que responde ao recurso que abriu o checkout (posição em
// TIER_BENEFITS; `tierBenefitsFor` mantém a mesma ordem).
const BENEFIT_FOR_RESOURCE: Record<PaidPlan, Readonly<Record<string, number>>> = {
  essential: {
    clients: 0,
    products: 0,
    recipes: 1,
    packaging: 1,
    catalog: 2,
    productPhotos: 3,
  },
  professional: {
    reports: 1,
    export: 1,
    suppliers: 2,
    purchases: 2,
    recurring: 2,
    labels: 3,
    prioritySupport: 4,
  },
};

/**
 * Benefícios do plano com o que a pessoa tentou usar em primeiro lugar.
 * Devolve a lista reordenada e se o primeiro item é o do recurso de origem.
 */
export function benefitsLeadingWith(
  tier: PaidPlan,
  benefits: readonly string[],
  resource: string | null | undefined,
): { readonly benefits: readonly string[]; readonly highlighted: boolean } {
  const index = resource ? BENEFIT_FOR_RESOURCE[tier][resource] : undefined;
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
