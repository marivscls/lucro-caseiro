import React from "react";
import { View, type PressableProps, type ViewStyle } from "react-native";

import { PressableScale } from "./pressable-scale";
import { useTheme } from "../theme-context";
import { radii, spacing } from "../theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: PressableProps["onPress"];
  variant?: "surface" | "elevated" | "transparent";
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  onPress,
  variant = "surface",
  style,
  padding = "xl",
}: CardProps) {
  const { theme } = useTheme();

  const bgColors = {
    surface: theme.colors.surface,
    elevated: theme.colors.surfaceElevated,
    transparent: "transparent",
  };

  const cardStyle: ViewStyle = {
    // Container canonico do app (padrao flat da home): NENHUM card usa sombra.
    // `elevated` = fundo elevado + borda hairline; sombra so existe em
    // overlays flutuantes (toast/alerta/modal), nunca em cards de conteudo.
    backgroundColor: bgColors[variant],
    borderRadius: radii.xl,
    padding: spacing[padding],
    ...(variant === "elevated"
      ? { borderWidth: 1, borderColor: theme.colors.border }
      : null),
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
