import React from "react";
import { Text, View, type ViewStyle } from "react-native";

import { fonts, fontSizes, radii, spacing } from "../theme";
import {
  useSemanticVariantColors,
  type SemanticVariant,
} from "./semantic-variant";

// Alias de compatibilidade: a taxonomia canonica vive em SemanticVariant.
export type BadgeVariant = SemanticVariant;

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = "neutral", style }: BadgeProps) {
  const variantColors = useSemanticVariantColors();
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
      <Text style={{ fontSize: fontSizes.xs, fontFamily: fonts.bold, color: c.text }}>
        {label}
      </Text>
    </View>
  );
}
