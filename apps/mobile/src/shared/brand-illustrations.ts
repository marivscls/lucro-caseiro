import { useBrand } from "@lucro-caseiro/ui";
import type { ImageRequireSource } from "react-native";

import agendaEmpty from "../assets/agenda-empty-v3.png";
import catalogHero from "../assets/catalog-hero-art-trimmed.png";
import clientsEmpty from "../assets/clients-empty.png";
import financeEmpty from "../assets/finance-reference-empty.png";
import labelsEmpty from "../assets/labels-empty.png";
import onboardingSalesEmpty from "../assets/sales-empty.png";
import pricingCostsHero from "../assets/pricing-costs-hero.png";
import pricingEmpty from "../assets/pricing-empty.png";
import embalagensHero from "../assets/embalagens-hero.png";
import etiquetasHero from "../assets/etiquetas/rolo-etiquetas.png";
import pricingResultHero from "../assets/pricing-result-hero.png";
import productsEmpty from "../assets/products-empty.png";
import purchasesEmpty from "../assets/purchases-empty.png";
import quotesEmpty from "../assets/quotes-empty.png";
import recurringExpensesHero from "../assets/recurring-expenses-hero.png";
import salesEmpty from "../assets/sales-empty-v2.png";
import servicesEmpty from "../assets/services-empty-transparent.png";
import suppliersEmpty from "../assets/suppliers-empty.png";
import revendaAgendaEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/agenda-empty.png";
import revendaCatalogHero from "../../../../packages/brands/lucro-revenda/assets/illustrations/catalog-hero.png";
import revendaClientsEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/clients-empty.png";
import revendaFinanceEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/finance-empty.png";
import revendaLabelsEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/labels-empty.png";
import revendaPricingEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/pricing-empty.png";
import revendaProductsEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/products-empty.png";
import revendaPurchasesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/purchases-empty.png";
import revendaQuotesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/quotes-empty.png";
import revendaRecurringExpensesHero from "../../../../packages/brands/lucro-revenda/assets/illustrations/recurring-expenses-hero.png";
import revendaSalesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/sales-empty.png";
import revendaServicesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/services-empty.png";
import revendaSuppliersEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/suppliers-empty.png";

export type BrandIllustrationName =
  | "agendaEmpty"
  | "catalogHero"
  | "embalagensHero"
  | "etiquetasHero"
  | "clientsEmpty"
  | "financeEmpty"
  | "labelsEmpty"
  | "onboardingSales"
  | "pricingCostsHero"
  | "pricingEmpty"
  | "pricingResultHero"
  | "productsEmpty"
  | "purchasesEmpty"
  | "quotesEmpty"
  | "recurringExpensesHero"
  | "salesEmpty"
  | "servicesEmpty"
  | "suppliersEmpty";

const defaultIllustrations: Readonly<Record<BrandIllustrationName, ImageRequireSource>> =
  {
    agendaEmpty: agendaEmpty as ImageRequireSource,
    catalogHero: catalogHero as ImageRequireSource,
    embalagensHero: embalagensHero as ImageRequireSource,
    etiquetasHero: etiquetasHero as ImageRequireSource,
    clientsEmpty: clientsEmpty as ImageRequireSource,
    financeEmpty: financeEmpty as ImageRequireSource,
    labelsEmpty: labelsEmpty as ImageRequireSource,
    onboardingSales: onboardingSalesEmpty as ImageRequireSource,
    pricingCostsHero: pricingCostsHero as ImageRequireSource,
    pricingEmpty: pricingEmpty as ImageRequireSource,
    pricingResultHero: pricingResultHero as ImageRequireSource,
    productsEmpty: productsEmpty as ImageRequireSource,
    purchasesEmpty: purchasesEmpty as ImageRequireSource,
    quotesEmpty: quotesEmpty as ImageRequireSource,
    recurringExpensesHero: recurringExpensesHero as ImageRequireSource,
    salesEmpty: salesEmpty as ImageRequireSource,
    servicesEmpty: servicesEmpty as ImageRequireSource,
    suppliersEmpty: suppliersEmpty as ImageRequireSource,
  };

const revendaIllustrations: typeof defaultIllustrations = {
  agendaEmpty: revendaAgendaEmpty as ImageRequireSource,
  catalogHero: revendaCatalogHero as ImageRequireSource,
  embalagensHero: embalagensHero as ImageRequireSource,
  etiquetasHero: etiquetasHero as ImageRequireSource,
  clientsEmpty: revendaClientsEmpty as ImageRequireSource,
  financeEmpty: revendaFinanceEmpty as ImageRequireSource,
  labelsEmpty: revendaLabelsEmpty as ImageRequireSource,
  onboardingSales: revendaSalesEmpty as ImageRequireSource,
  pricingCostsHero: revendaPricingEmpty as ImageRequireSource,
  pricingEmpty: revendaPricingEmpty as ImageRequireSource,
  pricingResultHero: revendaPurchasesEmpty as ImageRequireSource,
  productsEmpty: revendaProductsEmpty as ImageRequireSource,
  purchasesEmpty: revendaPurchasesEmpty as ImageRequireSource,
  quotesEmpty: revendaQuotesEmpty as ImageRequireSource,
  recurringExpensesHero: revendaRecurringExpensesHero as ImageRequireSource,
  salesEmpty: revendaSalesEmpty as ImageRequireSource,
  servicesEmpty: revendaServicesEmpty as ImageRequireSource,
  suppliersEmpty: revendaSuppliersEmpty as ImageRequireSource,
};

export function useBrandIllustration(name: BrandIllustrationName): ImageRequireSource {
  const brand = useBrand();
  let illustration = defaultIllustrations[name];
  if (brand.id === "lucro-revenda") illustration = revendaIllustrations[name];
  return illustration;
}
