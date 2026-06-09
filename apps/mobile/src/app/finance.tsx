import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@lucro-caseiro/ui";

import { FinanceDashboard } from "../features/finance/components/finance-dashboard";

export default function FinanceScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <FinanceDashboard />
    </SafeAreaView>
  );
}
