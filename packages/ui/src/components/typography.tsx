import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes } from "../theme";

type TypographyVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodyBold"
  | "caption"
  | "captionBold"
  | "label"
  | "money"
  | "moneyLg"
  | "moneyHero";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  serif?: boolean;
}

// Escala tipografica oficial (ADR-0008). Fraunces em display/h1/h2 (a voz da
// marca), Nunito Sans no resto. Nao passe fontSize/fontWeight/fontFamily via
// `style` — escolha a variante certa; o peso vem da familia (faux bold no
// Android quebra a fonte).
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
      fontFamily: fonts.displayBold,
      lineHeight: 42,
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: fontSizes["2xl"],
      fontFamily: fonts.displayBold,
      lineHeight: 34,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: fontSizes.xl,
      fontFamily: fonts.display,
      lineHeight: 28,
      color: theme.colors.text,
    },
    h3: {
      fontSize: fontSizes.lg,
      fontFamily: fonts.bold,
      lineHeight: 24,
      color: theme.colors.text,
    },
    body: {
      fontSize: fontSizes.md,
      fontFamily: fonts.regular,
      lineHeight: 24,
      color: theme.colors.textSecondary,
    },
    bodyBold: {
      fontSize: fontSizes.md,
      fontFamily: fonts.bold,
      lineHeight: 24,
      color: theme.colors.text,
    },
    caption: {
      fontSize: fontSizes.sm,
      fontFamily: fonts.regular,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    captionBold: {
      fontSize: fontSizes.sm,
      fontFamily: fonts.bold,
      lineHeight: 20,
      color: theme.colors.text,
    },
    label: {
      fontSize: fontSizes.xs,
      fontFamily: fonts.bold,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    money: {
      fontSize: fontSizes.xl,
      fontFamily: fonts.extraBold,
      lineHeight: 28,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    moneyLg: {
      fontSize: fontSizes["2xl"],
      fontFamily: fonts.extraBold,
      lineHeight: 34,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    moneyHero: {
      fontSize: fontSizes["4xl"],
      fontFamily: fonts.extraBold,
      lineHeight: 56,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
  };

  const s = styles[variant];

  return (
    <Text
      style={[
        s,
        serif ? { fontFamily: fonts.display } : undefined,
        color ? { color } : undefined,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
