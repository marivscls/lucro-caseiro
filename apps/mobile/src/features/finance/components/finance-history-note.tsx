import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";

/**
 * Aviso calmo do Financeiro no plano Gratuito: a tela mostra só a semana atual
 * e o botão abre o paywall do histórico (`financeHistory`).
 */
export function FinanceHistoryNote({
  weekLabel,
  onUpgrade,
}: Readonly<{ weekLabel: string; onUpgrade: () => void }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.premiumBg,
        borderColor: theme.colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radii.xl,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
        <AppIcon name="calendar-outline" size={24} color={theme.colors.primaryStrong} />
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="bodyBold">Esta semana: {weekLabel}</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            No plano gratuito você vê a semana atual. Veja meses anteriores no Premium.
          </Typography>
        </View>
      </View>
      <Button
        title="Ver meses anteriores"
        variant="outline"
        accessibilityLabel="Ver meses anteriores no Premium"
        icon={<AppIcon name="lock-closed" size={18} color={theme.colors.primaryStrong} />}
        onPress={onUpgrade}
      />
    </View>
  );
}
