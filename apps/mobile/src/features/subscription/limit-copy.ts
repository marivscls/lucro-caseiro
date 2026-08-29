import type { PaidPlan } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";

import { getBrandDisplayName } from "../../shared/brand-name";
import type { BusinessExperienceCopy } from "./business-copy";

// Fonte da verdade das copys de limite/Premium (banner + paywall).
// Tom: conquista, não restrição ("seu negócio está crescendo").

export type LimitResource =
  | "sales"
  | "clients"
  | "recipes"
  | "packaging"
  | "products"
  | "suppliers";

interface ResourceCopy {
  /** Nome no plural usado na contagem ("Faltam 5 vendas"). */
  readonly plural: string;
  /** Quando falta exatamente 1 item. */
  readonly lastOne: { readonly title: string; readonly body: string };
  /** Quando o limite foi atingido. */
  readonly atLimit: { readonly title: string; readonly body: string };
}

const LIMIT_COPY: Record<LimitResource, ResourceCopy> = {
  sales: {
    plural: "vendas",
    lastOne: {
      title: "⚠️ Última venda disponível",
      body: "Assine o Essencial para vender sem limites.",
    },
    atLimit: {
      title: "🚀 Limite atingido!",
      body: "Continue registrando vendas com o plano Essencial.",
    },
  },
  products: {
    plural: "produtos",
    lastOne: {
      title: "📦 Falta apenas 1 produto",
      body: "Assine o Essencial e tenha produtos ilimitados.",
    },
    atLimit: {
      title: "📦 Limite de produtos atingido",
      body: "Cadastre quantos produtos quiser com o Essencial.",
    },
  },
  recipes: {
    plural: "receitas",
    lastOne: {
      title: "🧁 Falta apenas 1 receita",
      body: "Assine o Essencial e crie receitas sem limites.",
    },
    atLimit: {
      title: "🧁 Limite de receitas atingido",
      body: "Desbloqueie receitas ilimitadas no Essencial.",
    },
  },
  packaging: {
    plural: "embalagens",
    lastOne: {
      title: "📦 Falta apenas 1 embalagem",
      body: "Assine o Essencial e tenha embalagens ilimitadas.",
    },
    atLimit: {
      title: "📦 Limite de embalagens atingido",
      body: "Crie embalagens sem restrições no Essencial.",
    },
  },
  clients: {
    plural: "clientes",
    lastOne: {
      title: "🤝 Falta apenas 1 cliente",
      body: "Assine o Essencial e cadastre clientes ilimitados.",
    },
    atLimit: {
      title: "🤝 Limite de clientes atingido",
      body: "Organize seus clientes sem limites com o Essencial.",
    },
  },
  suppliers: {
    plural: "fornecedores",
    lastOne: {
      title: "🤝 Falta apenas 1 fornecedor",
      body: "Fornecedores ilimitados fazem parte do plano Profissional.",
    },
    atLimit: {
      title: "🤝 Limite de fornecedores atingido",
      body: "Assine o Profissional para fornecedores ilimitados e controle de compras.",
    },
  },
};

/** Copy do banner conforme quantos itens ainda restam no plano gratuito. */
export function getBannerCopy(
  resource: LimitResource,
  remaining: number,
  experienceCopy?: BusinessExperienceCopy,
): { title: string; body: string } {
  const copy = resourceCopyFor(resource, experienceCopy);
  if (remaining <= 0) return copy.atLimit;
  if (remaining === 1) return copy.lastOne;
  return {
    title: "🚀 Seu negócio está crescendo!",
    body: `Faltam apenas ${remaining} ${copy.plural} para atingir o limite do plano gratuito.`,
  };
}

export function getLimitResourceLabel(
  resource: LimitResource,
  experienceCopy?: BusinessExperienceCopy,
): string {
  return resourceCopyFor(resource, experienceCopy).plural;
}

const ESSENTIAL_FEATURE_COPY: Record<string, { title: string; message: string }> = {
  catalog: {
    title: "📖 Catálogo completo e personalizado",
    message:
      "Mostre todos os produtos e personalize sua vitrine para os clientes. Desbloqueie no Essencial.",
  },
};

// Paywalls de feature (não-contagem): recursos do plano Profissional.
const FEATURE_COPY: Record<string, { title: string; message: string }> = {
  reports: {
    title: "📊 Insights completos",
    message:
      "Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores clientes. Desbloqueie no Profissional.",
  },
  advancedPricing: {
    title: "Precificação completa",
    message:
      "Revise mão de obra, rateios, taxas e cada premissa do preço no plano Profissional.",
  },
  export: {
    title: "📄 Exportar PDF e Excel",
    message: "Baixe seus insights pra contabilidade e MEI. Recurso do Profissional.",
  },
  labels: {
    title: "🏷️ Etiquetas personalizadas",
    message: "Crie etiquetas com a cara do seu negócio no plano Profissional.",
  },
  productPhotos: {
    title: "📸 Mais fotos do produto",
    message:
      "Mostre seu produto de vários ângulos com várias fotos. Desbloqueie no Profissional.",
  },
  recurring: {
    title: "🔁 Gastos fixos no automático",
    message:
      "Cadastre aluguel, internet e outros custos mensais e deixe o app lançar sozinho no seu caixa. Desbloqueie no Profissional.",
  },
  purchases: {
    title: "Compras de fornecedores",
    message:
      "Registre compras, acompanhe contas a pagar e lance as saídas no caixa com o Profissional.",
  },
  compositeProducts: {
    title: "Produtos compostos e kits",
    message: "Monte kits e produtos formados por outros itens no plano Profissional.",
  },
  birthdays: {
    title: "🎂 Aniversários dos clientes",
    message:
      "Veja quem faz aniversário no mês e parabenize na hora certa pra fidelizar. Desbloqueie no Profissional.",
  },
  notifications: {
    title: "Notificações profissionais",
    message:
      "Ative lembretes diários, aniversários de clientes e o resumo semanal no Profissional.",
  },
  prioritySupport: {
    title: "Suporte prioritário",
    message: "Fale com a equipe com prioridade no plano Profissional.",
  },
};

/** Título + mensagem do paywall conforme o recurso/feature de origem. */
export function getPaywallCopy(
  resource: string | null,
  experienceCopy?: BusinessExperienceCopy,
): {
  title: string;
  message: string;
} {
  if (resource && resource in LIMIT_COPY) {
    const copy = resourceCopyFor(resource as LimitResource, experienceCopy);
    return { title: copy.atLimit.title, message: copy.atLimit.body };
  }
  if (resource && resource in FEATURE_COPY) {
    return FEATURE_COPY[resource];
  }
  if (resource && resource in ESSENTIAL_FEATURE_COPY) {
    return ESSENTIAL_FEATURE_COPY[resource];
  }
  return {
    title: "🚀 Seu negócio está crescendo!",
    message: `Desbloqueie todos os recursos do ${getBrandDisplayName(getActiveBrand())}.`,
  };
}

function resourceCopyFor(
  resource: LimitResource,
  experienceCopy?: BusinessExperienceCopy,
): ResourceCopy {
  if (!experienceCopy) return LIMIT_COPY[resource];

  if (resource === "products") {
    return {
      plural: experienceCopy.productNounPlural,
      lastOne: {
        title: `📦 Falta apenas 1 ${experienceCopy.productNoun}`,
        body: `Assine o Essencial e tenha ${experienceCopy.productNounPlural} sem limite.`,
      },
      atLimit: {
        title: `📦 Limite de ${experienceCopy.productNounPlural} atingido`,
        body: `Cadastre ${experienceCopy.productNounPlural} sem limite com o Essencial.`,
      },
    };
  }

  if (resource === "recipes") {
    return {
      plural: experienceCopy.formulaNounPlural,
      lastOne: {
        title: `📋 Falta apenas 1 ${experienceCopy.formulaNoun}`,
        body: `Assine o Essencial e crie ${experienceCopy.formulaNounPlural} sem limite.`,
      },
      atLimit: {
        title: `📋 Limite de ${experienceCopy.formulaNounPlural} atingido`,
        body: `Desbloqueie ${experienceCopy.formulaNounPlural} sem limite no Essencial.`,
      },
    };
  }

  if (resource === "packaging") {
    return {
      plural: experienceCopy.packagingNounPlural,
      lastOne: {
        title: "📦 Falta apenas 1 custo adicional",
        body: `Assine o Essencial e tenha ${experienceCopy.packagingNounPlural} sem limite.`,
      },
      atLimit: {
        title: "📦 Limite de custos adicionais atingido",
        body: `Cadastre ${experienceCopy.packagingNounPlural} sem limite no Essencial.`,
      },
    };
  }

  return LIMIT_COPY[resource];
}

/** Tier mínimo do paywall quando o caller não informou um explicitamente. */
export function getPaywallRecommendedTier(resource: string | null): PaidPlan {
  if (resource && resource in ESSENTIAL_FEATURE_COPY) return "essential";
  if (resource && resource in FEATURE_COPY) return "professional";
  if (resource === "suppliers") return "professional";
  return "essential";
}
