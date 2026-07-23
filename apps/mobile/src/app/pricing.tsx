import { useTheme } from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PricingHistoryButton,
  PricingHistoryModal,
} from "../features/pricing/components/pricing-history-modal";
import { PricingModeSwitch } from "../features/pricing/components/pricing-mode-switch";
import { SimplePricingCalculator } from "../features/pricing/components/simple-pricing-calculator";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

export default function SimplePricingScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
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

      <PricingModeSwitch mode="simple" />

      <SimplePricingCalculator
        onCreateProduct={(salePrice) => {
          router.push({
            pathname: "/products",
            params: { create: "from-pricing", salePrice: String(salePrice) },
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
