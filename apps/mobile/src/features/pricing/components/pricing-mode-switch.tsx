import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

type PricingMode = "simple" | "complete";

export function PricingModeSwitch({ mode }: Readonly<{ mode: PricingMode }>) {
  const { theme } = useTheme();
  const router = useRouter();

  const options: {
    key: PricingMode;
    label: string;
    route: "/pricing" | "/pricing-complete";
  }[] = [
    { key: "simple", label: "Simples", route: "/pricing" },
    { key: "complete", label: "Completa", route: "/pricing-complete" },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        gap: spacing.xs,
        marginHorizontal: spacing.xl,
        marginBottom: spacing.sm,
        padding: spacing.xs,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.surface,
      }}
    >
      {options.map((option) => {
        const active = mode === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) router.replace(option.route);
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.md,
              backgroundColor: active ? theme.colors.primaryInteractive : "transparent",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Typography
              variant="bodyBold"
              color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
