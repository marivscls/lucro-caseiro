import type { BillingPeriod } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

/**
 * Mensal/Anual da tela de planos. Fica acima dos planos e vale para todos, para
 * que os preços lado a lado estejam sempre no mesmo período.
 */
export function PeriodToggle({
  period,
  disabled,
  desktop = false,
  onChange,
}: Readonly<{
  period: BillingPeriod;
  disabled: boolean;
  desktop?: boolean;
  onChange: (period: BillingPeriod) => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        gap: 4,
        backgroundColor: theme.colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {(["monthly", "annual"] as const).map((option) => {
        const selected = period === option;
        const label = option === "annual" ? "Anual" : "Mensal";
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
              columnGap: spacing.sm,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.sm,
              backgroundColor: selected ? theme.colors.surfaceElevated : "transparent",
              borderWidth: 1,
              borderColor: selected ? theme.colors.primaryStrong : "transparent",
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <Typography
              variant={desktop ? "desktopBodyStrong" : "bodyBold"}
              color={selected ? theme.colors.text : theme.colors.textSecondary}
            >
              {label}
            </Typography>
            {option === "annual" ? (
              <Typography
                variant={desktop ? "desktopBodyStrong" : "bodyBold"}
                color={theme.colors.success}
              >
                2 meses grátis
              </Typography>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
