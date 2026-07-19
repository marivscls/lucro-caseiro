import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { iconSizes, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";

export type FABProps = Readonly<
  {
    icon: AppIconName;
    /** Texto do FAB estendido; sem label vira o círculo clássico de 56px. */
    label?: string;
    accessibilityLabel: string;
    style?: StyleProp<ViewStyle>;
  } & Omit<PressableProps, "style" | "children">
>;

/**
 * FAB canônico do app: fundo `primaryInteractive` (AA), sombra
 * `theme.shadows.md`, ícone `iconSizes.md`, 56px de altura. Use no lugar dos
 * botões flutuantes montados à mão em cada tela.
 */
export function FAB({ icon, label, accessibilityLabel, style, ...props }: FABProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          height: 56,
          minWidth: 56,
          paddingHorizontal: label ? spacing.xl : 0,
          borderRadius: radii.full,
          backgroundColor: theme.colors.primaryInteractive,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        },
        theme.shadows.md,
        style,
      ]}
      {...props}
    >
      <AppIcon name={icon} size={iconSizes.md} color={theme.colors.textOnPrimary} />
      {label ? (
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          {label}
        </Typography>
      ) : null}
    </Pressable>
  );
}
