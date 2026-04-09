import React from "react";
import { Pressable, View, type PressableProps, type ViewStyle } from "react-native";

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
    backgroundColor: bgColors[variant],
    borderRadius: radii.xl,
    padding: spacing[padding],
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}
