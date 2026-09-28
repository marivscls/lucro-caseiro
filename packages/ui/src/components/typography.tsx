import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "../theme-context";
import {
  desktopTypography,
  fonts,
  fontSizes,
  homeTypography,
  moneyTypography,
} from "../theme";

type TypographyVariant =
  | "display"
  | "screenTitle"
  | "wordmark"
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
  | "moneyHero"
  | "homeTitle"
  | "homeBody"
  | "homeAvatar"
  | "homeEyebrow"
  | "homeCardLead"
  | "homeDescription"
  | "homeAction"
  | "homeLink"
  | "homeFinancialLabel"
  | "homeFinancialValue"
  | "homeMetricLabel"
  | "homeMetricValue"
  | "homeGoalTitle"
  | "homeGoalValue"
  | "homeProgress"
  | "homeProgressStrong"
  | "homeShortcut"
  | "homeNavigation"
  | "homeNavigationActive"
  | "desktopPageTitle"
  | "desktopPageSubtitle"
  | "desktopSection"
  | "desktopCardTitle"
  | "desktopBody"
  | "desktopBodyStrong"
  | "desktopMeta"
  | "desktopFieldLabel"
  | "desktopMetricLabel"
  | "desktopMetric"
  | "desktopTotal";

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

// Escala tipografica oficial (ADR-0008). Manrope em toda a interface.
// Nao passe fontSize/fontWeight/fontFamily via `style` — escolha a variante
// certa; o peso vem da familia (faux bold no Android quebra a fonte).
export function Typography({
  variant = "body",
  color,
  style,
  children,
  ...props
}: TypographyProps) {
  const { theme } = useTheme();

  const styles: Record<TypographyVariant, TextStyle> = {
    display: {
      fontSize: fontSizes["3xl"],
      fontFamily: fonts.bold,
      lineHeight: 34,
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    // Nome da marca no lockup com o logo: caixa normal e peso alto leem como marca.
    wordmark: {
      fontSize: 20,
      fontFamily: fonts.brand,
      lineHeight: 24,
      color: theme.colors.primaryStrong,
      letterSpacing: -0.4,
    },
    screenTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      lineHeight: 24,
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    h1: {
      fontSize: fontSizes["2xl"],
      fontFamily: fonts.bold,
      lineHeight: 30,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: fontSizes.xl,
      fontFamily: fonts.bold,
      lineHeight: 26,
      color: theme.colors.text,
    },
    h3: {
      fontSize: fontSizes.lg,
      fontFamily: fonts.bold,
      lineHeight: 22,
      color: theme.colors.text,
    },
    // Público inclui pessoas mais velhas: texto corrido em 16 e legendas em 14.
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
      ...moneyTypography.money,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    moneyLg: {
      ...moneyTypography.moneyLg,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    moneyHero: {
      ...moneyTypography.moneyHero,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    homeTitle: {
      ...homeTypography.title,
      color: theme.colors.text,
    },
    homeBody: {
      ...homeTypography.body,
      color: theme.colors.textSecondary,
    },
    homeAvatar: {
      ...homeTypography.avatar,
      color: theme.colors.text,
    },
    homeEyebrow: {
      ...homeTypography.eyebrow,
      color: theme.colors.text,
    },
    homeCardLead: {
      ...homeTypography.cardLead,
      color: theme.colors.text,
    },
    homeDescription: {
      ...homeTypography.description,
      color: theme.colors.textSecondary,
    },
    homeAction: {
      ...homeTypography.action,
      color: theme.colors.text,
    },
    homeLink: {
      ...homeTypography.link,
      color: theme.colors.text,
    },
    homeFinancialLabel: {
      ...homeTypography.financialLabel,
      color: theme.colors.text,
    },
    homeFinancialValue: {
      ...homeTypography.financialValue,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    homeMetricLabel: {
      ...homeTypography.metricLabel,
      color: theme.colors.textSecondary,
    },
    homeMetricValue: {
      ...homeTypography.metricValue,
      color: theme.colors.success,
      fontVariant: ["tabular-nums"],
    },
    homeGoalTitle: {
      ...homeTypography.goalTitle,
      color: theme.colors.text,
    },
    homeGoalValue: {
      ...homeTypography.goalValue,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    homeProgress: {
      ...homeTypography.progress,
      color: theme.colors.text,
    },
    homeProgressStrong: {
      ...homeTypography.progressStrong,
      color: theme.colors.text,
    },
    homeShortcut: {
      ...homeTypography.shortcut,
      color: theme.colors.text,
    },
    homeNavigation: {
      ...homeTypography.navigation,
      color: theme.colors.text,
    },
    homeNavigationActive: {
      ...homeTypography.navigationActive,
      color: theme.colors.text,
    },
    // Escala do desktop (web >= 1024px): use apenas quando useDesktopLayout().
    desktopPageTitle: { ...desktopTypography.pageTitle, color: theme.colors.text },
    desktopPageSubtitle: {
      ...desktopTypography.pageSubtitle,
      color: theme.colors.textSecondary,
    },
    desktopSection: { ...desktopTypography.section, color: theme.colors.text },
    desktopCardTitle: { ...desktopTypography.cardTitle, color: theme.colors.text },
    desktopBody: { ...desktopTypography.body, color: theme.colors.textSecondary },
    desktopBodyStrong: { ...desktopTypography.bodyStrong, color: theme.colors.text },
    desktopMeta: { ...desktopTypography.meta, color: theme.colors.textSecondary },
    desktopFieldLabel: { ...desktopTypography.fieldLabel, color: theme.colors.text },
    desktopMetricLabel: {
      ...desktopTypography.metricLabel,
      color: theme.colors.textSecondary,
    },
    desktopMetric: {
      ...desktopTypography.metric,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
    desktopTotal: {
      ...desktopTypography.total,
      color: theme.colors.text,
      fontVariant: ["tabular-nums"],
    },
  };

  const s = styles[variant];

  return (
    <Text style={[s, color ? { color } : undefined, style]} {...props}>
      {children}
    </Text>
  );
}
