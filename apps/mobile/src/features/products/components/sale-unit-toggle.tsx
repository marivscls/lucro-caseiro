import type { SaleUnit } from "@lucro-caseiro/contracts";
import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

interface SaleUnitToggleProps {
  readonly value: SaleUnit;
  readonly onChange: (value: SaleUnit) => void;
}

const OPTIONS: ReadonlyArray<{ value: SaleUnit; label: string }> = [
  { value: "unit", label: "Por unidade" },
  { value: "kg", label: "Por quilo (kg)" },
];

/**
 * Alternador de unidade de venda: por unidade ou por quilo (R$/kg).
 * Quando "kg", o preco de venda representa o preco por quilo.
 */
export function SaleUnitToggle({ value, onChange }: SaleUnitToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Typography variant="caption">Como você vende?</Typography>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.colors.surface,
          borderRadius: radii.lg,
          padding: spacing.xs,
          gap: spacing.xs,
        }}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.md,
                backgroundColor: selected ? theme.colors.primary : "transparent",
              }}
            >
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.textOnPrimary : theme.colors.text}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
