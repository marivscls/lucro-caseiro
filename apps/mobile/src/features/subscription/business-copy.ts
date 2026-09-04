import type { BrandCopy } from "@lucro-caseiro/brands";
import { useBrand } from "@lucro-caseiro/ui";

import { useProfile } from "./hooks";
import { useBusinessOnboarding } from "../onboarding/use-business-onboarding";

export type BusinessProfile = "food" | "beauty" | "crafts" | "services" | "other";

export const BUSINESS_PROFILE_OPTIONS: ReadonlyArray<{
  value: BusinessProfile;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "crafts",
    label: "Produzo sob encomenda",
    shortLabel: "Sob encomenda",
    description: "Personalizados, artesanato e itens feitos por pedido.",
  },
  {
    value: "other",
    label: "Vendo produtos em estoque",
    shortLabel: "Produtos em estoque",
    description: "Comércio, pronta entrega, compras e reposição.",
  },
  {
    value: "services",
    label: "Presto serviços",
    shortLabel: "Serviços",
    description: "Atendimentos, consultorias, fotografia e outros serviços.",
  },
  {
    value: "beauty",
    label: "Trabalho com beleza e atendimentos",
    shortLabel: "Beleza e atendimentos",
    description: "Unhas, cílios, sobrancelhas, cabelo e cuidados.",
  },
  {
    value: "food",
    label: "Trabalho com alimentação",
    shortLabel: "Alimentação",
    description: "Marmitas, doces, salgados, bebidas e encomendas.",
  },
];

export interface BusinessExperienceCopy {
  profile: BusinessProfile | "neutral";
  productNoun: string;
  productNounPlural: string;
  formulaNoun: string;
  formulaNounPlural: string;
  materialNoun: string;
  materialNounPlural: string;
  packagingNoun: string;
  packagingNounPlural: string;
  orderNoun: string;
  orderNounPlural: string;
  operationLabel: string;
  quantityLabel: string;
  categoryPresets: readonly string[];
  businessNameExample: string;
  productExample: string;
  materialExample: string;
  categoryExample: string;
  supplierExample: string;
  financeEntryExample: string;
}

const neutralCopy: BusinessExperienceCopy = {
  profile: "neutral",
  productNoun: "produto",
  productNounPlural: "produtos",
  formulaNoun: "ficha de custo",
  formulaNounPlural: "fichas de custo",
  materialNoun: "material",
  materialNounPlural: "materiais",
  packagingNoun: "custo adicional",
  packagingNounPlural: "custos adicionais",
  orderNoun: "pedido",
  orderNounPlural: "pedidos",
  operationLabel: "Custos e operação",
  quantityLabel: "Quantidade final",
  categoryPresets: ["Personalizados", "Serviços", "Presentes", "Outros"],
  businessNameExample: "Meu negócio",
  productExample: "Kit personalizado",
  materialExample: "Material principal",
  categoryExample: "Personalizados, Serviços, Presentes",
  supplierExample: "Fornecedor Central",
  financeEntryExample: "Venda do dia, Compra de materiais",
};

const profileCopies: Record<BusinessProfile, BusinessExperienceCopy> = {
  food: {
    ...neutralCopy,
    profile: "food",
    formulaNoun: "receita",
    formulaNounPlural: "receitas",
    materialNoun: "insumo",
    materialNounPlural: "insumos",
    packagingNoun: "embalagem",
    packagingNounPlural: "embalagens",
    orderNoun: "encomenda",
    orderNounPlural: "encomendas",
    operationLabel: "Produção",
    quantityLabel: "Rendimento",
    categoryPresets: ["Doces", "Salgados", "Bolos", "Bebidas", "Outros"],
    businessNameExample: "Cozinha da Ana",
    productExample: "Marmita executiva",
    materialExample: "Farinha de trigo",
    categoryExample: "Doces, Salgados, Bolos",
    supplierExample: "Distribuidora Central",
    financeEntryExample: "Venda de marmitas, Compra de ingredientes",
  },
  crafts: {
    ...neutralCopy,
    profile: "crafts",
    formulaNoun: "ficha técnica",
    formulaNounPlural: "fichas técnicas",
    packagingNoun: "embalagem ou acabamento",
    packagingNounPlural: "embalagens e acabamentos",
    orderNoun: "encomenda",
    orderNounPlural: "encomendas",
    operationLabel: "Produção",
    quantityLabel: "Quantidade produzida",
    categoryPresets: ["Personalizados", "Presentes", "Decoração", "Outros"],
    businessNameExample: "Ateliê da Ana",
    productExample: "Vela aromática",
    materialExample: "Cera vegetal",
    categoryExample: "Personalizados, Presentes, Decoração",
    supplierExample: "Casa do Artesão",
    financeEntryExample: "Venda de kit personalizado, Compra de materiais",
  },
  other: {
    ...neutralCopy,
    profile: "other",
    formulaNoun: "composição de custo",
    formulaNounPlural: "composições de custo",
    materialNoun: "item de custo",
    materialNounPlural: "itens de custo",
    packagingNoun: "embalagem",
    packagingNounPlural: "embalagens",
    operationLabel: "Estoque e compras",
    quantityLabel: "Unidades",
    categoryPresets: ["Novidades", "Utilidades", "Presentes", "Outros"],
    businessNameExample: "Loja da Ana",
    productExample: "Caneca térmica",
    materialExample: "Caixa para envio",
    categoryExample: "Novidades, Utilidades, Presentes",
    financeEntryExample: "Venda de produtos, Compra de mercadorias",
  },
  services: {
    ...neutralCopy,
    profile: "services",
    productNoun: "serviço",
    productNounPlural: "serviços",
    formulaNoun: "ficha do serviço",
    formulaNounPlural: "fichas de serviço",
    materialNoun: "material utilizado",
    materialNounPlural: "materiais utilizados",
    packagingNoun: "adicional",
    packagingNounPlural: "adicionais",
    orderNoun: "atendimento",
    orderNounPlural: "atendimentos",
    operationLabel: "Serviços e agenda",
    quantityLabel: "Duração ou atendimentos",
    categoryPresets: ["Atendimentos", "Consultorias", "Pacotes", "Outros"],
    businessNameExample: "Studio da Ana",
    productExample: "Sessão fotográfica",
    materialExample: "Material de trabalho",
    categoryExample: "Atendimentos, Consultorias, Pacotes",
    supplierExample: "Fornecedor de materiais",
    financeEntryExample: "Recebimento de serviço, Compra de materiais",
  },
  beauty: {
    ...neutralCopy,
    profile: "beauty",
    productNoun: "serviço",
    productNounPlural: "serviços",
    formulaNoun: "ficha do serviço",
    formulaNounPlural: "fichas de serviço",
    materialNoun: "material utilizado",
    materialNounPlural: "materiais utilizados",
    packagingNoun: "adicional",
    packagingNounPlural: "adicionais",
    orderNoun: "atendimento",
    orderNounPlural: "atendimentos",
    operationLabel: "Serviços e agenda",
    quantityLabel: "Duração ou atendimentos",
    categoryPresets: ["Unhas", "Cílios", "Sobrancelhas", "Pacotes", "Outros"],
    businessNameExample: "Studio da Ana",
    productExample: "Manutenção de unhas",
    materialExample: "Algodão",
    categoryExample: "Unhas, Cílios, Sobrancelhas",
    supplierExample: "Distribuidora de beleza",
    financeEntryExample: "Recebimento de atendimento, Compra de materiais",
  },
};

function withBrandProductNouns(
  copy: BusinessExperienceCopy,
  brandCopy?: BrandCopy,
): BusinessExperienceCopy {
  if (!brandCopy) return copy;
  return {
    ...copy,
    productNoun: brandCopy.productNoun,
    productNounPlural: brandCopy.productNounPlural,
  };
}

export function businessCopyFor(
  businessType?: string | null,
  brandCopy?: BrandCopy,
): BusinessExperienceCopy {
  const profile = businessType as BusinessProfile;
  const copy = profileCopies[profile] ?? neutralCopy;
  return withBrandProductNouns(copy, brandCopy);
}

export function useBusinessCopy(): BusinessExperienceCopy {
  const brand = useBrand();
  const { data: profile } = useProfile();
  const { record } = useBusinessOnboarding();
  const copy = businessCopyFor(
    profile?.businessType,
    brand.id === "lucro-caseiro" ? undefined : brand.copy,
  );
  if (brand.id !== "lucro-caseiro") return copy;
  return personalizedBusinessCopy(copy, record?.answers?.segment);
}

export function personalizedBusinessCopy(
  copy: BusinessExperienceCopy,
  segment?: string,
): BusinessExperienceCopy {
  if (segment === "services")
    return {
      ...copy,
      productNoun: "serviço",
      productNounPlural: "serviços",
      orderNoun: "atendimento",
      orderNounPlural: "atendimentos",
    };
  if (segment === "craft")
    return { ...copy, productNoun: "peça", productNounPlural: "peças" };
  if (segment === "sweets")
    return {
      ...copy,
      productExample: "Brigadeiro gourmet",
      businessNameExample: "Doces da Ana",
      categoryPresets: ["Bolos", "Doces", "Sobremesas", "Outros"],
    };
  return copy;
}
