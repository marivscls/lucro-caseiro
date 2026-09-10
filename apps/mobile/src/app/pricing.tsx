import { useTheme } from "@lucro-caseiro/ui";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { BackHandler } from "react-native";
import type { PricingStep } from "../features/pricing/use-pricing-draft";
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
  const [step, setStep] = useState<PricingStep>(1);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (saving) return true;
        if (showHistory || step === 1) return false;
        setStep((current) => (current - 1) as PricingStep);
        return true;
      });
      return () => subscription.remove();
    }, [saving, showHistory, step]),
  );

  function leavePricing() {
    if (saving) return;
    if (step > 1) {
      setStep((current) => (current - 1) as PricingStep);
      return;
    }
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
        step={step}
        onStepChange={setStep}
        onBusyChange={setSaving}
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
