import React from "react";
import { View, type PressableProps, type ViewStyle } from "react-native";

import { PressableScale } from "./pressable-scale";
import { useTheme } from "../theme-context";
import { radii, spacing, type Theme } from "../theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: PressableProps["onPress"];
  variant?: "surface" | "elevated" | "transparent";
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  /**
   * Elevacao opcional via tokens (`theme.shadows`). Padrao: nenhuma — o app
   * e flat; reserve sombra para cards que flutuam sobre o conteudo.
   */
  shadow?: keyof Theme["shadows"];
}

export function Card({
  children,
  onPress,
  variant = "surface",
  style,
  padding = "xl",
  shadow,
}: CardProps) {
  const { theme } = useTheme();

  const bgColors = {
    surface: theme.colors.surface,
    elevated: theme.colors.surfaceElevated,
    transparent: "transparent",
  };

  const cardStyle: ViewStyle = {
    // Container canonico do app (padrao flat da home): por padrao NENHUM card
    // usa sombra. `elevated` = fundo elevado + borda hairline; sombra so
    // entra pelo prop `shadow` (tokens), nunca com valores manuais na tela.
    backgroundColor: bgColors[variant],
    borderRadius: radii.xl,
    padding: spacing[padding],
    ...(variant === "elevated"
      ? { borderWidth: 1, borderColor: theme.colors.border }
      : null),
    ...(shadow ? theme.shadows[shadow] : null),
    ...style,
  };

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={cardStyle}>
        {children}
      </PressableScale>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
