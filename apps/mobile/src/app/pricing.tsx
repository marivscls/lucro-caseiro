import { useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@lucro-caseiro/ui";

import { PricingCalculator } from "../features/pricing/components/pricing-calculator";

export default function PricingScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PricingCalculator
        onSave={() => {
          Alert.alert("Calculo salvo!", "Sua precificacao foi salva com sucesso.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        }}
      />
    </SafeAreaView>
  );
}
