import type { PaidPlan } from "@lucro-caseiro/contracts";

// Benefícios por plano, exibidos no paywall e no recibo de confirmação de compra.
// Fonte única para não divergir entre as duas telas.
export const TIER_BENEFITS: Record<PaidPlan, readonly string[]> = {
  essential: [
    "Vendas ilimitadas",
    "Clientes e produtos ilimitados",
    "Receitas e embalagens ilimitadas",
    "Agenda, fiado e catálogo online",
    "Exporta o resumo do mês em PDF",
    "Fornecedores: até 3 (ilimitado no Profissional)",
    "Sem anúncios",
  ],
  professional: [
    "Tudo do Essencial",
    "Catálogo completo e personalizado",
    "Relatórios completos + exportar PDF/Excel",
    "Fornecedores, compras e gastos fixos ilimitados",
    "Rótulos personalizados e orçamentos em PDF",
  ],
};
