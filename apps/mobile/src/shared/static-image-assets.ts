import { Asset } from "expo-asset";
import type { ImageSourcePropType } from "react-native";

import agendaDeliveries from "../../assets/agenda-deliveries.png";
import manicureLogo from "../../../../packages/brands/lucro-manicure/assets/icon.png";
import papelariaLogo from "../../../../packages/brands/lucro-papelaria/assets/icon.png";
import agendaEmpty from "../assets/agenda-empty-v3.png";
import brandLogo from "../assets/auth-house.png";
import catalogHero from "../assets/catalog-hero.png";
import checkoutHero from "../assets/checkout-professional-hero.png";
import clientsEmpty from "../assets/clients-empty.png";
import fiadoHero from "../assets/fiado-hero.png";
import financeEmpty from "../assets/finance-reference-empty.png";
import financeHero from "../assets/finance-reference-hero.png";
import insightsEmpty from "../assets/insights-empty.png";
import labelsEmpty from "../assets/labels-empty.png";
import materialsEmpty from "../assets/materials-empty.png";
import nicheArtesanato from "../assets/onboarding-niche-artesanato.png";
import nicheBeleza from "../assets/onboarding-niche-beleza.png";
import nicheFotografia from "../assets/onboarding-niche-fotografia.png";
import nichePapelaria from "../assets/onboarding-niche-papelaria.png";
import nicheSalgados from "../assets/onboarding-niche-salgados.png";
import packagingEmpty from "../assets/packaging-empty.png";
import pricingCostsHero from "../assets/pricing-costs-hero.png";
import pricingCostsIcon from "../assets/pricing-costs-icon.png";
import pricingEmpty from "../assets/pricing-empty.png";
import pricingResultHero from "../assets/pricing-result-hero.png";
import productsEmpty from "../assets/products-empty.png";
import purchasesEmpty from "../assets/purchases-empty.png";
import quotesEmpty from "../assets/quotes-empty.png";
import recipesEmpty from "../assets/recipes-empty.png";
import recipesHowItWorks from "../assets/recipes-how-it-works.png";
import recurringExpensesHero from "../assets/recurring-expenses-hero.png";
import salesEmpty from "../assets/sales-empty.png";
import salesEmptyV2 from "../assets/sales-empty-v2.png";
import successChecklist from "../assets/success-checklist.png";
import successGrowth from "../assets/success-growth.png";
import successModalFrame from "../assets/success-modal-frame.png";
import suppliersEmpty from "../assets/suppliers-empty.png";

const staticImageAssets: readonly ImageSourcePropType[] = [
  brandLogo,
  manicureLogo,
  papelariaLogo,
  agendaDeliveries,
  agendaEmpty,
  catalogHero,
  checkoutHero,
  clientsEmpty,
  fiadoHero,
  financeEmpty,
  financeHero,
  insightsEmpty,
  labelsEmpty,
  materialsEmpty,
  nicheArtesanato,
  nicheBeleza,
  nicheFotografia,
  nichePapelaria,
  nicheSalgados,
  packagingEmpty,
  pricingCostsHero,
  pricingCostsIcon,
  pricingEmpty,
  pricingResultHero,
  productsEmpty,
  purchasesEmpty,
  quotesEmpty,
  recipesEmpty,
  recipesHowItWorks,
  recurringExpensesHero,
  salesEmpty,
  salesEmptyV2,
  successChecklist,
  successGrowth,
  successModalFrame,
  suppliersEmpty,
];

type ExpoAssetModule = Parameters<typeof Asset.fromModule>[0];

export async function preloadStaticImageAssets() {
  await Promise.all(
    staticImageAssets.map((source) =>
      Asset.fromModule(source as ExpoAssetModule).downloadAsync(),
    ),
  );
}
