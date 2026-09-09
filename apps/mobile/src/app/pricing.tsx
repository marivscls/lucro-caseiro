import { useTheme } from "@lucro-caseiro/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PricingHistoryButton,
  PricingHistoryModal,
} from "../features/pricing/components/pricing-history-modal";
import { UnifiedPricingCalculator } from "../features/pricing/components/unified-pricing-calculator";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

export default function SimplePricingScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { recipeCost, name, category, productId } = useLocalSearchParams<{
    productId?: string;
    recipeCost?: string;
    name?: string;
    category?: string;
  }>();
  const parsedRecipeCost = Number(recipeCost);
  const initialIngredientCost =
    recipeCost?.trim() && Number.isFinite(parsedRecipeCost) && parsedRecipeCost >= 0
      ? parsedRecipeCost
      : undefined;
  const [showHistory, setShowHistory] = useState(false);

  function leavePricing() {
    if (router.canGoBack()) router.back();
    else router.replace("/tabs/more");
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Precificação"
        hideBack={isDesktop}
        onBack={leavePricing}
        right={<PricingHistoryButton onPress={() => setShowHistory(true)} />}
      />

      <UnifiedPricingCalculator
        initialProductId={productId}
        key={JSON.stringify([recipeCost, name, category])}
        initialIngredientCost={initialIngredientCost}
        initialProduct={{ name, category }}
        onCreateProduct={(salePrice, costPrice, product) => {
          router.push({
            pathname: "/products",
            params: {
              create: "from-pricing",
              salePrice: String(salePrice),
              costPrice: String(costPrice),
              ...(product?.name ? { name: product.name } : {}),
              ...(product?.category ? { category: product.category } : {}),
            },
          });
        }}
        onSave={() => {
          showAlert({
            title: "Cálculo salvo!",
            message: "Sua precificação foi salva com sucesso.",
            buttons: [{ text: "Ver histórico", onPress: () => setShowHistory(true) }],
          });
        }}
      />

      <PricingHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </SafeAreaView>
  );
}
