import { Asset } from "expo-asset";
import type { ImageSourcePropType } from "react-native";

import agendaDeliveries from "../../assets/agenda-deliveries.png";
import manicureLogo from "../../../../packages/brands/lucro-manicure/assets/icon.png";
import papelariaLogo from "../../../../packages/brands/lucro-papelaria/assets/icon.png";
import brandLogo from "../assets/auth-house.png";
import brandLogoLight from "../assets/auth-house-light.png";
import catalogHero from "../assets/catalog-hero-art-trimmed.png";
import checkoutHero from "../assets/checkout-professional-hero.png";
import comprasHero3d from "../assets/compras-hero-3d.png";
import gettingStartedProduct from "../assets/getting-started-product.png";
import gettingStartedProductTip from "../assets/getting-started-product-tip.png";
import gettingStartedResult from "../assets/getting-started-result.png";
import gettingStartedResultTip from "../assets/getting-started-result-tip.png";
import gettingStartedSale from "../assets/getting-started-sale.png";
import gettingStartedSaleTip from "../assets/getting-started-sale-tip.png";
import financeHero from "../assets/finance-reference-hero.png";
import nicheArtesanato from "../assets/onboarding-niche-artesanato.png";
import nicheBeleza from "../assets/onboarding-niche-beleza.png";
import nicheFotografia from "../assets/onboarding-niche-fotografia.png";
import nichePapelaria from "../assets/onboarding-niche-papelaria.png";
import nicheSalgados from "../assets/onboarding-niche-salgados.png";
import embalagensHero from "../assets/embalagens-hero.png";
import etiquetasHero from "../assets/etiquetas/rolo-etiquetas.png";
import pricingCostsHero from "../assets/pricing-costs-hero.png";
import pricingCostsIcon from "../assets/pricing-costs-icon.png";
import pricingEmpty from "../assets/pricing-empty.png";
import pricingResultHero from "../assets/pricing-result-hero.png";
import recipesHowItWorks from "../assets/recipes-how-it-works.png";
import recurringExpensesHero from "../assets/recurring-expenses-hero.png";
import salesEmpty from "../assets/sales-empty.png";
import salesEmptyV2 from "../assets/sales-empty-v2.png";
import successChecklist from "../assets/success-checklist.png";
import successGrowth from "../assets/success-growth.png";
import successModalFrame from "../assets/success-modal-frame.png";
import suppliersHero from "../assets/fornecedores-caixas.png";

const staticImageAssets: readonly ImageSourcePropType[] = [
  brandLogo,
  brandLogoLight,
  manicureLogo,
  papelariaLogo,
  agendaDeliveries,
  catalogHero,
  checkoutHero,
  comprasHero3d,
  gettingStartedProduct,
  gettingStartedProductTip,
  gettingStartedResult,
  gettingStartedResultTip,
  gettingStartedSale,
  gettingStartedSaleTip,
  financeHero,
  nicheArtesanato,
  nicheBeleza,
  nicheFotografia,
  nichePapelaria,
  nicheSalgados,
  embalagensHero,
  etiquetasHero,
  pricingCostsHero,
  pricingCostsIcon,
  pricingEmpty,
  pricingResultHero,
  recipesHowItWorks,
  recurringExpensesHero,
  salesEmpty,
  salesEmptyV2,
  successChecklist,
  successGrowth,
  successModalFrame,
  suppliersHero,
];

type ExpoAssetModule = Parameters<typeof Asset.fromModule>[0];

export async function preloadStaticImageAssets() {
  await Promise.all(
    staticImageAssets.map((source) =>
      Asset.fromModule(source as ExpoAssetModule).downloadAsync(),
    ),
  );
}
