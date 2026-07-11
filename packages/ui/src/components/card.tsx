import React from "react";
import { View, type PressableProps, type ViewStyle } from "react-native";

import { PressableScale } from "./pressable-scale";
import { useTheme } from "../theme-context";
import { elevation, radii, spacing } from "../theme";

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
    // Scar: elevation (Android) + fundo translucido vira "caixa branca" — o
    // fundo do variant elevated (surfaceElevated) e sempre opaco de proposito.
    backgroundColor: bgColors[variant],
    borderRadius: radii.xl,
    padding: spacing[padding],
    ...(variant === "elevated" ? elevation.card : null),
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
