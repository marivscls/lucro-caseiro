import { Typography, fonts, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { AppIcon } from "./app-icon";

/**
 * Selo "Premium" com cadeado ao lado de uma opção que o plano atual não
 * libera. Ícone sempre acompanhado de texto (acessibilidade).
 */
export function PremiumLockTag({ label = "Premium" }: Readonly<{ label?: string }>) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={`Recurso do ${label}`}
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
    >
      <AppIcon name="lock-closed" size={16} color={theme.colors.premium} />
      <Typography
        variant="captionBold"
        color={theme.colors.premium}
        style={{ fontFamily: fonts.bold }}
      >
        {label}
      </Typography>
    </View>
  );
}
