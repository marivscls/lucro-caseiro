import { Button, spacing, useTheme } from "@lucro-caseiro/ui";
import { useSegments } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brandScreenPalette } from "../brand-palette";
import { desktopStretch, desktopWidths, pageGutter } from "../layout/desktop-density";
import { screenCreateBarBottomPadding } from "../layout/floating-tab-bar";
import { useDesktopLayout } from "../layout/use-desktop-layout";

export function ScreenCreateBar({
  title,
  onPress,
  disabled = false,
  accessibilityLabel,
}: Readonly<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isTabScreen = segments[0] === "tabs";
  const paddingBottom = screenCreateBarBottomPadding({
    isDesktop,
    isTabScreen,
    bottomInset: insets.bottom,
  });

  return (
    <View
      style={{
        ...pageGutter(isDesktop, spacing.lg),
        ...desktopStretch(isDesktop, desktopWidths.data),
        width: "100%",
        paddingTop: spacing.sm,
        paddingBottom,
        backgroundColor: palette.background,
        alignSelf: isDesktop ? "stretch" : "center",
        alignItems: isDesktop ? "flex-end" : "stretch",
        borderTopWidth: isDesktop ? 1 : 0,
        borderTopColor: theme.colors.border,
      }}
    >
      <Button
        title={title}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled }}
        size="md"
        fitTitle={false}
        titleLines={2}
        style={{
          minWidth: isDesktop ? 220 : undefined,
          paddingHorizontal: spacing.lg,
        }}
      />
    </View>
  );
}
