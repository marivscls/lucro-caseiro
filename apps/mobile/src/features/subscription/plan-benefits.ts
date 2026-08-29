import type { PaidPlan } from "@lucro-caseiro/contracts";
import type { BusinessExperienceCopy } from "./business-copy";

// Benefícios por plano, exibidos no paywall e no recibo de confirmação de compra.
// Fonte única para não divergir entre as duas telas.
export const TIER_BENEFITS: Record<PaidPlan, readonly string[]> = {
  essential: [
    "Vendas ilimitadas",
    "Clientes e produtos ilimitados",
    "Receitas e embalagens ilimitadas",
    "Catálogo completo e personalizado",
    "Agenda, fiado e financeiro básico",
    "Exporta o resumo do mês em PDF",
    "Fornecedores: até 3 (ilimitado no Profissional)",
    "Sem anúncios",
  ],
  professional: [
    "Tudo do Essencial",
    "Insights completos + exportar PDF/Excel",
    "Fornecedores, compras e gastos fixos ilimitados",
    "Etiquetas personalizadas e orçamentos em PDF",
    "Aniversários, lembretes avançados e suporte prioritário",
  ],
};

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
