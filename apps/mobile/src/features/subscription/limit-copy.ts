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
): { title: string; body: string } {
  const copy = LIMIT_COPY[resource];
  if (remaining <= 0) return copy.atLimit;
  if (remaining === 1) return copy.lastOne;
  return {
    title: "🚀 Seu negócio está crescendo!",
    body: `Faltam apenas ${remaining} ${copy.plural} para atingir o limite do plano gratuito.`,
  };
}

// Paywalls de feature (não-contagem): recursos do plano Profissional.
const FEATURE_COPY: Record<string, { title: string; message: string }> = {
  reports: {
    title: "📊 Relatórios completos",
    message:
      "Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores clientes. Desbloqueie no Profissional.",
  },
  export: {
    title: "📄 Exportar PDF e Excel",
    message: "Baixe seus relatórios pra contabilidade e MEI. Recurso do Profissional.",
  },
  catalog: {
    title: "📖 Catálogo profissional",
    message:
      "Mostre todos os produtos e personalize sua vitrine pros clientes. Desbloqueie no Profissional.",
  },
  labels: {
    title: "🏷️ Rótulos personalizados",
    message: "Crie rótulos com a cara do seu negócio no plano Profissional.",
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
  birthdays: {
    title: "🎂 Aniversários dos clientes",
    message:
      "Veja quem faz aniversário no mês e parabenize na hora certa pra fidelizar. Desbloqueie no Profissional.",
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
