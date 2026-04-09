import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fontSizes } from "../theme";

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyBold"
  | "caption"
  | "label"
  | "money"
  | "moneyLg"
  | "moneyHero";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  serif?: boolean;
}

export function Typography({
  variant = "body",
  color,
  serif,
  style,
  children,
  ...props
}: TypographyProps) {
  const { theme } = useTheme();

  const styles: Record<TypographyVariant, TextStyle> = {
    display: {
      fontSize: fontSizes["3xl"],
      fontWeight: "700",
      fontFamily: "serif",
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: fontSizes["2xl"],
      fontWeight: "700",
      fontFamily: "serif",
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: fontSizes.xl,
      fontWeight: "600",
      fontFamily: "serif",
      color: theme.colors.text,
    },
    h3: {
      fontSize: fontSizes.lg,
      fontWeight: "600",
      color: theme.colors.text,
    },
    body: {
      fontSize: fontSizes.md,
      fontWeight: "400",
      color: theme.colors.textSecondary,
    },
    bodyBold: {
      fontSize: fontSizes.md,
      fontWeight: "600",
      color: theme.colors.text,
    },
    caption: {
      fontSize: fontSizes.sm,
      fontWeight: "400",
      color: theme.colors.textSecondary,
    },
    label: {
      fontSize: fontSizes.xs,
      fontWeight: "500",
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    money: {
      fontSize: fontSizes.xl,
      fontWeight: "700",
      color: theme.colors.success,
    },
    moneyLg: {
      fontSize: fontSizes["2xl"],
      fontWeight: "700",
      color: theme.colors.success,
    },
    moneyHero: {
      fontSize: fontSizes["4xl"],
      fontWeight: "800",
      color: theme.colors.success,
    },
  };

  const s = styles[variant];

  return (
    <Text
      style={[
        s,
        serif ? { fontFamily: "serif" } : undefined,
        color ? { color } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
