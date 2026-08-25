import { useBrand } from "@lucro-caseiro/ui";
import type { ImageRequireSource } from "react-native";

import catalogHero from "../assets/catalog-hero-art-trimmed.png";
import onboardingSalesEmpty from "../assets/sales-empty.png";
import pricingCostsHero from "../assets/pricing-costs-hero.png";
import pricingEmpty from "../assets/pricing-empty.png";
import embalagensHero from "../assets/embalagens-hero.png";
import etiquetasHero from "../assets/etiquetas/rolo-etiquetas.png";
import pricingResultHero from "../assets/pricing-result-hero.png";
import recurringExpensesHero from "../assets/recurring-expenses-hero.png";
import salesEmpty from "../assets/sales-empty-v2.png";
import revendaCatalogHero from "../../../../packages/brands/lucro-revenda/assets/illustrations/catalog-hero.png";
import revendaPricingEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/pricing-empty.png";
import revendaPurchasesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/purchases-empty.png";
import revendaRecurringExpensesHero from "../../../../packages/brands/lucro-revenda/assets/illustrations/recurring-expenses-hero.png";
import revendaSalesEmpty from "../../../../packages/brands/lucro-revenda/assets/illustrations/sales-empty.png";

export type BrandIllustrationName =
  | "catalogHero"
  | "embalagensHero"
  | "etiquetasHero"
  | "onboardingSales"
  | "pricingCostsHero"
  | "pricingEmpty"
  | "pricingResultHero"
  | "recurringExpensesHero"
  | "salesEmpty";

const defaultIllustrations: Readonly<Record<BrandIllustrationName, ImageRequireSource>> =
  {
    catalogHero: catalogHero as ImageRequireSource,
    embalagensHero: embalagensHero as ImageRequireSource,
    etiquetasHero: etiquetasHero as ImageRequireSource,
    onboardingSales: onboardingSalesEmpty as ImageRequireSource,
    pricingCostsHero: pricingCostsHero as ImageRequireSource,
    pricingEmpty: pricingEmpty as ImageRequireSource,
    pricingResultHero: pricingResultHero as ImageRequireSource,
    recurringExpensesHero: recurringExpensesHero as ImageRequireSource,
    salesEmpty: salesEmpty as ImageRequireSource,
  };

const revendaIllustrations: typeof defaultIllustrations = {
  catalogHero: revendaCatalogHero as ImageRequireSource,
  embalagensHero: embalagensHero as ImageRequireSource,
  etiquetasHero: etiquetasHero as ImageRequireSource,
  onboardingSales: revendaSalesEmpty as ImageRequireSource,
  pricingCostsHero: revendaPricingEmpty as ImageRequireSource,
  pricingEmpty: revendaPricingEmpty as ImageRequireSource,
  pricingResultHero: revendaPurchasesEmpty as ImageRequireSource,
  recurringExpensesHero: revendaRecurringExpensesHero as ImageRequireSource,
  salesEmpty: revendaSalesEmpty as ImageRequireSource,
};

export function useBrandIllustration(name: BrandIllustrationName): ImageRequireSource {
  const brand = useBrand();
  let illustration = defaultIllustrations[name];
  if (brand.id === "lucro-revenda") illustration = revendaIllustrations[name];
  return illustration;
}
