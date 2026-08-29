import type { BrandFeatures } from "@lucro-caseiro/brands";
import { type Href } from "expo-router";

import type { AppIconName } from "../components/app-icon";

export type ToolItem = Readonly<{
  title: string;
  description: string;
  icon: AppIconName;
  route: Href;
  feature?: keyof BrandFeatures;
  badge?: string;
}>;

export const DAILY_ITEMS = [
  {
    title: "Financeiro",
    description: "Entradas, saídas e lucro",
    icon: "wallet-outline",
    route: "/finance",
  },
  {
    title: "Fiado",
    description: "Cobranças",
    icon: "cash-outline",
    route: "/fiado",
  },
  {
    title: "Clientes",
    description: "Contatos e aniversários",
    icon: "people-outline",
    route: "/tabs/clients",
  },
] as const satisfies ReadonlyArray<ToolItem>;

export const FEATURED_MANAGEMENT_ITEMS = [
  {
    title: "Precificação",
    description: "Calcule se o preço dá lucro",
    icon: "calculator-outline",
    route: "/pricing",
  },
  {
    title: "Catálogo online",
    description: "Link para compartilhar com clientes",
    icon: "storefront-outline",
    route: "/catalog",
  },
  {
    title: "Gastos fixos",
    description: "Custos mensais",
    icon: "repeat-outline",
    route: "/recurring-expenses",
  },
  {
    title: "Produtos",
    description: "O que você vende",
    icon: "cube-outline",
    route: "/products",
  },
  {
    title: "Embalagens",
    description: "Custos e estoque",
    icon: "bag-handle-outline",
    route: "/packaging",
    feature: "embalagens",
    badge: "Organize",
  },
] as const satisfies ReadonlyArray<ToolItem>;

export const MORE_MANAGEMENT_ITEMS = [
  {
    title: "Insights",
    description: "Gráficos e desempenho",
    icon: "bar-chart-outline",
    route: "/insights",
  },
  {
    title: "Orçamentos",
    description: "Propostas",
    icon: "document-text-outline",
    route: "/quotes",
  },
  {
    title: "Operação",
    description: "Fluxo principal do seu negócio",
    icon: "clipboard-outline",
    route: "/operations",
    feature: "operacaoVertical",
  },
  {
    title: "Operação da Papelaria",
    description: "PDV, caixa, listas, inventário e serviços",
    icon: "storefront-outline",
    route: "/retail",
    feature: "varejoPapelaria",
  },
  {
    title: "Serviços",
    description: "Preços, duração e atendimentos",
    icon: "briefcase-outline",
    route: "/services",
  },
  {
    title: "Insumos",
    description: "Custos, fornecedores e estoque",
    icon: "flask-outline",
    route: "/tabs/materials",
    feature: "materiais",
  },
  {
    title: "Fornecedores",
    description: "De quem você compra",
    icon: "business-outline",
    route: "/suppliers",
  },
  {
    title: "Compras",
    description: "Contas a pagar e gastos",
    icon: "cart-outline",
    route: "/purchases",
  },
  {
    title: "Receitas",
    description: "Suas receitas e ingredientes",
    icon: "document-text-outline",
    route: "/recipes",
    feature: "fichaTecnica",
  },
  {
    title: "Etiquetas",
    description: "Etiquetas prontas para imprimir",
    icon: "pricetag-outline",
    route: "/labels",
  },
] as const satisfies ReadonlyArray<ToolItem>;

export const ACCOUNT_HELP_ITEMS = [
  {
    title: "Central de ajuda",
    description: "Dúvidas e suporte",
    icon: "help-circle-outline",
    route: "/support",
  },
  {
    title: "Configurações",
    description: "Conta e preferências",
    icon: "settings-outline",
    route: "/settings",
  },
] as const satisfies ReadonlyArray<ToolItem>;
