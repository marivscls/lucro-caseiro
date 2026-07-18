import type { SaleUnit } from "@lucro-caseiro/contracts";
import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

interface SaleUnitToggleProps {
  readonly value: SaleUnit;
  readonly onChange: (value: SaleUnit) => void;
}

const OPTIONS: ReadonlyArray<{
  value: SaleUnit;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "unit", label: "Por unidade", icon: "cube-outline" },
  { value: "kg", label: "Por quilo (kg)", icon: "scale-outline" },
];

/**
 * Alternador de unidade de venda: por unidade ou por quilo (R$/kg).
 * Quando "kg", o preco de venda representa o preco por quilo.
 */
export function SaleUnitToggle({ value, onChange }: SaleUnitToggleProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const isDark = theme.mode === "dark";
  const border = isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)";
  const fieldBg = isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface;

  return (
    <View
      style={{
        gap: spacing.sm,
        width: "100%",
        maxWidth: isDesktop ? 720 : undefined,
      }}
    >
      <Typography variant="bodyBold" color={theme.colors.text}>
        Como você vende?
      </Typography>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: isDesktop ? 48 : 72,
                flexDirection: isDesktop ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: isDesktop ? spacing.xs : spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : border,
                backgroundColor: selected ? theme.colors.primary : fieldBg,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons
                name={option.icon}
                size={22}
                color={selected ? theme.colors.textOnPrimary : theme.colors.primary}
              />
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.textOnPrimary : theme.colors.text}
                numberOfLines={2}
                style={{
                  fontSize: 14,
                  lineHeight: 18,
                  flexShrink: 1,
                  textAlign: "center",
                }}
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
