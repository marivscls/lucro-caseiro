import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PricingCalculator } from "../features/pricing/components/pricing-calculator";
import {
  PricingHistoryButton,
  PricingHistoryModal,
} from "../features/pricing/components/pricing-history-modal";
import { PricingModeSwitch } from "../features/pricing/components/pricing-mode-switch";
import { useProfile } from "../features/subscription/hooks";
import { showAlert } from "../shared/components/alert-store";
import { AppIcon } from "../shared/components/app-icon";
import { ScreenHeader } from "../shared/components/screen-header";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

export default function CompletePricingScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(false);
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const showPaywall = usePaywall((state) => state.show);
  const canUseCompletePricing =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "advancedPricing");

  function leavePricing() {
    if (router.canGoBack()) router.back();
    else router.replace("/tabs/more");
  }

  let content: React.ReactNode;
  if (loadingProfile) {
    content = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  } else if (canUseCompletePricing) {
    content = (
      <PricingCalculator
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
            buttons: [{ text: "OK", onPress: leavePricing }],
          });
        }}
      />
    );
  } else {
    content = (
      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card style={{ width: "100%", maxWidth: 560, gap: spacing.lg }}>
          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <AppIcon name="lock-closed-outline" size={32} color={theme.colors.primary} />
            <Typography variant="caption" color={theme.colors.primaryStrong}>
              RECURSO PROFISSIONAL
            </Typography>
            <Typography variant="h2" style={{ textAlign: "center" }}>
              Mais controle sobre cada premissa do preço
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              Detalhe rendimento, mão de obra, rateios e taxas. A precificação Simples
              continua disponível para calcular seu preço sem contas por fora.
            </Typography>
          </View>
          <Button
            title="Desbloquear no Profissional"
            onPress={() => showPaywall("advancedPricing")}
            size="lg"
          />
        </Card>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="Precificação completa"
        hideBack={isDesktop}
        onBack={leavePricing}
        right={
          canUseCompletePricing ? (
            <PricingHistoryButton onPress={() => setShowHistory(true)} />
          ) : undefined
        }
      />

      <PricingModeSwitch mode="complete" />

      {content}

      <PricingHistoryModal visible={showHistory} onClose={() => setShowHistory(false)} />
    </SafeAreaView>
  );
}
