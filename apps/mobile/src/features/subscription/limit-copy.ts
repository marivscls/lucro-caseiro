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
      body: "Desbloqueie o Premium para continuar sem limites.",
    },
    atLimit: {
      title: "🚀 Limite atingido!",
      body: "Continue registrando vendas com o Premium.",
    },
  },
  products: {
    plural: "produtos",
    lastOne: {
      title: "📦 Falta apenas 1 produto",
      body: "Desbloqueie produtos ilimitados.",
    },
    atLimit: {
      title: "📦 Limite de produtos atingido",
      body: "Cadastre quantos produtos quiser com o Premium.",
    },
  },
  recipes: {
    plural: "receitas",
    lastOne: {
      title: "🧁 Falta apenas 1 receita",
      body: "Continue criando receitas sem limites.",
    },
    atLimit: {
      title: "🧁 Limite de receitas atingido",
      body: "Desbloqueie receitas ilimitadas.",
    },
  },
  packaging: {
    plural: "embalagens",
    lastOne: {
      title: "📦 Falta apenas 1 embalagem",
      body: "Desbloqueie embalagens ilimitadas.",
    },
    atLimit: {
      title: "📦 Limite de embalagens atingido",
      body: "Crie embalagens sem restrições.",
    },
  },
  clients: {
    plural: "clientes",
    lastOne: {
      title: "🤝 Falta apenas 1 cliente",
      body: "Cadastre clientes ilimitados.",
    },
    atLimit: {
      title: "🤝 Limite de clientes atingido",
      body: "Continue organizando seus clientes sem limites.",
    },
  },
  suppliers: {
    plural: "fornecedores",
    lastOne: {
      title: "🤝 Falta apenas 1 fornecedor",
      body: "Cadastre fornecedores ilimitados.",
    },
    atLimit: {
      title: "🤝 Limite de fornecedores atingido",
      body: "Organize todos os seus fornecedores sem limites.",
    },
  },
};

/** Copy do banner conforme quantos itens ainda restam no plano gratuito. */
export function getBannerCopy(
  resource: LimitResource,
  remaining: number,
): { title: string; body: string } {
  const copy = LIMIT_COPY[resource];
  if (remaining <= 0) return copy.atLimit;
  if (remaining === 1) return copy.lastOne;
  return {
    title: "🚀 Seu negócio está crescendo!",
    body: `Faltam apenas ${remaining} ${copy.plural} para atingir o limite do plano gratuito.`,
  };
}

// Paywalls de feature (não-contagem): exportação, relatórios, catálogo, rótulos.
const FEATURE_COPY: Record<string, { title: string; message: string }> = {
  reports: {
    title: "📊 Relatórios completos",
    message:
      "Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores clientes. Desbloqueie no Premium.",
  },
  export: {
    title: "📄 Exportar PDF e Excel",
    message: "Baixe seus relatórios pra contabilidade e MEI — recurso Premium.",
  },
  catalog: {
    title: "📖 Catálogo profissional",
    message:
      "Mostre todos os produtos e personalize sua vitrine pros clientes. Desbloqueie no Premium.",
  },
  labels: {
    title: "🏷️ Rótulos ilimitados",
    message: "Crie quantos templates de rótulo quiser com o Premium.",
  },
  productPhotos: {
    title: "📸 Mais fotos do produto",
    message:
      "Mostre seu produto de vários ângulos com até 3 fotos. Desbloqueie no Premium.",
  },
  birthdays: {
    title: "🎂 Aniversários dos clientes",
    message:
      "Veja quem faz aniversário no mês e parabenize na hora certa pra fidelizar. Desbloqueie no Premium.",
  },
};

/** Título + mensagem do paywall conforme o recurso/feature de origem. */
export function getPaywallCopy(resource: string | null): {
  title: string;
  message: string;
} {
  if (resource && resource in LIMIT_COPY) {
    const copy = LIMIT_COPY[resource as LimitResource];
    return { title: copy.atLimit.title, message: copy.atLimit.body };
  }
  if (resource && resource in FEATURE_COPY) {
    return FEATURE_COPY[resource];
  }
  return {
    title: "🚀 Seu negócio está crescendo!",
    message: "Desbloqueie todos os recursos do Lucro Caseiro.",
  };
}
