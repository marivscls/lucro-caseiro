import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React from "react";
import { useDesktopLayout } from "../layout/use-desktop-layout";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";

import { iconSizes, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";

export type FABProps = Readonly<
  {
    icon: AppIconName;
    /** Texto do FAB estendido; sem label vira o círculo clássico de 56px. */
    label?: string;
    /** Variante compacta para a área de ações do ScreenHeader. */
    header?: boolean;
    accessibilityLabel: string;
    style?: StyleProp<ViewStyle>;
  } & Omit<PressableProps, "style" | "children">
>;

/**
 * FAB canônico do app: fundo `primaryInteractive` (AA), sombra
 * `theme.shadows.md`, ícone `iconSizes.md`, 56px de altura. Use no lugar dos
 * botões flutuantes montados à mão em cada tela.
 */
export const FAB = React.forwardRef<View, FABProps>(function FAB(
  { icon, label, header = false, accessibilityLabel, style, ...props },
  ref,
) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const displayLabel = label ?? (isDesktop ? accessibilityLabel : undefined);
  let horizontalPadding = 0;
  if (displayLabel) horizontalPadding = header ? spacing.md : spacing.xl;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          height: header ? 44 : 52,
          minWidth: header ? 44 : 52,
          paddingHorizontal: horizontalPadding,
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
        isDesktop
          ? {
              height: 44,
              width: "auto",
              minWidth: 44,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.md,
              shadowOpacity: 0,
              elevation: 0,
              flexShrink: 0,
            }
          : undefined,
      ]}
      {...props}
    >
      <AppIcon name={icon} size={iconSizes.md} color={theme.colors.textOnPrimary} />
      {displayLabel ? (
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          {displayLabel}
        </Typography>
      ) : null}
    </Pressable>
  );
});
