import React from "react";
import { Text, View, type ViewStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fontSizes, radii, spacing } from "../theme";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "premium"
  | "lavender"
  | "primary";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = "neutral", style }: BadgeProps) {
  const { theme } = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    success: { bg: theme.colors.successBg, text: theme.colors.success },
    warning: { bg: theme.colors.yellowBg, text: theme.colors.yellow },
    danger: { bg: theme.colors.alertBg, text: theme.colors.alert },
    info: { bg: theme.colors.blueBg, text: theme.colors.blue },
    neutral: { bg: theme.colors.surface, text: theme.colors.textSecondary },
    premium: { bg: theme.colors.premiumBg, text: theme.colors.premium },
    lavender: { bg: theme.colors.lavenderBg, text: theme.colors.lavender },
    primary: { bg: theme.colors.surface, text: theme.colors.primary },
  };

  const c = variantColors[variant];

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          borderRadius: radii.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: fontSizes.xs, fontWeight: "600", color: c.text }}>
        {label}
      </Text>
    </View>
  );
}
