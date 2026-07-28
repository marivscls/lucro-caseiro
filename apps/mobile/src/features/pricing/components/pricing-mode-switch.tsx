import { Typography, iconSizes, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";

import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { pageGutter } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

type PricingMode = "simple" | "complete";

export function PricingModeSwitch({ mode }: Readonly<{ mode: PricingMode }>) {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useDesktopLayout();

  const options: {
    key: PricingMode;
    icon?: AppIconName;
    label: string;
    route: "/pricing" | "/pricing-complete";
  }[] = [
    {
      key: "simple",
      label: "Simples",
      route: "/pricing",
    },
    {
      key: "complete",
      icon: "crown-outline",
      label: "Avançado",
      route: "/pricing-complete",
    },
  ];

  return (
    <View
      style={{
        ...pageGutter(isDesktop),
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        alignItems: isDesktop ? "flex-start" : "center",
      }}
    >
      <View
        accessibilityRole="tablist"
        style={[
          {
            width: "100%",
            flexDirection: "row",
            gap: spacing.xs,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            backgroundColor: theme.colors.surface,
          },
          isDesktop
            ? { maxWidth: 420, alignSelf: "flex-start" }
            : undefined,
        ]}
      >
        {options.map((option) => {
          const active = mode === option.key;
          const foreground = active
            ? theme.colors.primaryStrong
            : theme.colors.textSecondary;

          return (
            <Pressable
              key={option.key}
              accessibilityRole="tab"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
              hitSlop={2}
              onPress={() => {
                if (!active) router.replace(option.route);
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                minWidth: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.md,
                backgroundColor: active ? theme.colors.primaryBg : "transparent",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.xs,
                  maxWidth: "100%",
                  paddingHorizontal: spacing.sm,
                }}
              >
                {option.icon ? (
                  <AppIcon
                    name={option.icon}
                    size={iconSizes.sm}
                    color={foreground}
                    strokeWidth={2}
                  />
                ) : null}
                <Typography
                  variant="captionBold"
                  color={foreground}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={{ flexShrink: 1 }}
                >
                  {option.label}
                </Typography>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
