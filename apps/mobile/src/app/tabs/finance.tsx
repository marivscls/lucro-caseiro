import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@lucro-caseiro/ui";

import { FinanceDashboard } from "../../features/finance/components/finance-dashboard";

export default function FinanceTab() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <FinanceDashboard />
    </SafeAreaView>
  );
}
