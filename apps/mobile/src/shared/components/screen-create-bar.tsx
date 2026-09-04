import { fonts, fontSizes, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import { useSegments } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brandScreenPalette } from "../brand-palette";
import { desktopStretch, desktopWidths, pageGutter } from "../layout/desktop-density";
import { screenCreateBarBottomPadding } from "../layout/floating-tab-bar";
import { useDesktopLayout } from "../layout/use-desktop-layout";

const CREATE_CTA_HEIGHT = 56;

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
        alignSelf: "center",
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
            minHeight: CREATE_CTA_HEIGHT,
            height: CREATE_CTA_HEIGHT,
            borderRadius: 16,
            backgroundColor: palette.rose,
            alignItems: "center",
            justifyContent: "center",
            opacity,
          };
        }}
      >
        <Typography
          color={palette.onWine}
          style={{ fontFamily: fonts.bold, fontSize: fontSizes.md }}
        >
          {title}
        </Typography>
      </Pressable>
    </View>
  );
}
