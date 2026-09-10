import { fonts, fontSizes, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import { useSegments } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brandScreenPalette } from "../brand-palette";
import { desktopStretch, desktopWidths, pageGutter } from "../layout/desktop-density";
import { screenCreateBarBottomPadding } from "../layout/floating-tab-bar";
import { useDesktopLayout } from "../layout/use-desktop-layout";

const CREATE_CTA_HEIGHT = 48;

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
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled }}
        style={({ pressed }) => {
          let opacity = 1;
          if (disabled) opacity = 0.5;
          else if (pressed) opacity = 0.88;
          return {
            minHeight: isDesktop ? 44 : CREATE_CTA_HEIGHT,
            height: isDesktop ? 44 : CREATE_CTA_HEIGHT,
            minWidth: isDesktop ? 220 : undefined,
            paddingHorizontal: isDesktop ? spacing.xl : undefined,
            borderRadius: isDesktop ? 12 : 14,
            backgroundColor: palette.rose,
            alignItems: "center",
            justifyContent: "center",
            opacity,
          };
        }}
      >
        <Typography
          color={palette.onRose}
          style={{ fontFamily: fonts.bold, fontSize: fontSizes.sm }}
        >
          {title}
        </Typography>
      </Pressable>
    </View>
  );
}
