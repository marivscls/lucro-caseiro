import {
  PressableScale,
  Typography,
  fontSizes,
  fonts,
  radii,
  spacing,
  useBrand,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { PLAN_LABELS, PLAN_PRICING } from "@lucro-caseiro/contracts";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import checkoutProfessionalHero from "../../../assets/checkout-professional-hero.png";
import { getBrandDisplayName } from "../../../shared/brand-name";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";

interface PaywallProps {
  readonly title?: string;
  readonly message?: string;
  readonly currentUsage?: string;
  readonly recommendedTier?: PaidPlan;
  readonly onSubscribe?: (tier: PaidPlan, period: BillingPeriod) => void;
  readonly onRestore?: () => void;
  readonly loading?: boolean;
  readonly onClose?: () => void;
}

interface Benefit {
  readonly icon: AppIconName;
  readonly title: string;
  readonly description: string;
}

const PROFESSIONAL_BENEFITS: readonly Benefit[] = [
  {
    icon: "bar-chart-outline",
    title: "Decida com relatórios completos",
    description: "Acompanhe resultados e exporte relatórios em PDF e Excel.",
  },
  {
    icon: "bag-handle-outline",
    title: "Controle compras e fornecedores",
    description: "Registre compras e acompanhe fornecedores sem limite.",
  },
  {
    icon: "document-text-outline",
    title: "Crie materiais mais profissionais",
    description: "Faça etiquetas, orçamentos em PDF e use mais fotos nos produtos.",
  },
  {
    icon: "calendar-outline",
    title: "Controle uma operação mais completa",
    description: "Organize compras, fornecedores, gastos recorrentes e kits.",
  },
];

const ESSENTIAL_BENEFITS: readonly Benefit[] = [
  {
    icon: "bar-chart-outline",
    title: "Venda sem limites mensais",
    description: "Registre todas as suas vendas e acompanhe o faturamento do negócio.",
  },
  {
    icon: "bag-handle-outline",
    title: "Cadastre tudo que você precisa",
    description: "Tenha clientes, produtos, receitas e embalagens sem limite.",
  },
  {
    icon: "document-text-outline",
    title: "Tenha um catálogo completo e personalizado",
    description: "Apresente todos os produtos com capa, cores e identidade da sua marca.",
  },
  {
    icon: "calendar-outline",
    title: "Cuide da rotina sem anúncios",
    description:
      "Use agenda, fiado, financeiro básico e resumo mensal com tranquilidade.",
  },
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function planBenefits(tier: PaidPlan): readonly Benefit[] {
  return tier === "professional" ? PROFESSIONAL_BENEFITS : ESSENTIAL_BENEFITS;
}

function periodSurface(theme: Theme, selected: boolean, highlighted: boolean) {
  if (selected) {
    return {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceElevated,
    };
  }
  if (highlighted) {
    return {
      borderColor: theme.colors.primaryBg,
      backgroundColor: theme.colors.primaryBg,
    };
  }
  return styles.inactivePeriod;
}

function BenefitRow({
  benefit,
  last,
  compact,
  theme,
}: Readonly<{
  benefit: Benefit;
  last: boolean;
  compact: boolean;
  theme: Theme;
}>) {
  const iconSize = compact ? 54 : 64;
  const rowHeight = compact ? 84 : 96;

  return (
    <View
      style={[
        styles.benefitRow,
        {
          minHeight: rowHeight,
          gap: compact ? spacing.md : spacing.lg,
        },
      ]}
    >
      <View
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: theme.colors.primaryBg,
          backgroundColor: theme.colors.surfaceElevated,
        }}
      >
        <AppIcon
          name={benefit.icon}
          size={compact ? 28 : 34}
          color={theme.colors.primary}
        />
      </View>
      <View
        style={[
          styles.benefitCopy,
          {
            minHeight: rowHeight,
            paddingVertical: compact ? spacing.md : spacing.lg,
            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Typography
          variant="bodyBold"
          color={theme.colors.text}
          style={{
            fontSize: compact ? fontSizes.md : fontSizes.lg,
            lineHeight: compact ? 22 : 24,
            letterSpacing: -0.1,
          }}
        >
          {benefit.title}
        </Typography>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{
            fontSize: compact ? fontSizes.sm : fontSizes.md,
            lineHeight: compact ? 20 : 22,
          }}
        >
          {benefit.description}
        </Typography>
      </View>
    </View>
  );
}

function SubscribeButton({
  compact,
  loading,
  tier,
  theme,
  marginTop = 0,
  onPress,
}: Readonly<{
  compact: boolean;
  loading: boolean;
  tier: PaidPlan;
  theme: Theme;
  marginTop?: number;
  onPress: () => void;
}>) {
  const [highlighted, setHighlighted] = useState(false);

  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: loading }}
      onHoverIn={() => setHighlighted(true)}
      onHoverOut={() => setHighlighted(false)}
      onFocus={() => setHighlighted(true)}
      onBlur={() => setHighlighted(false)}
      scaleTo={0.985}
      style={[
        styles.subscribeButton,
        {
          marginTop,
          minHeight: compact ? 58 : 72,
          backgroundColor: theme.colors.primaryInteractive,
          opacity: loading ? 0.55 : 1,
        },
        highlighted ? theme.shadows.md : theme.shadows.sm,
      ]}
    >
      <AppIcon
        name="diamond"
        size={compact ? 26 : 32}
        color={theme.colors.textOnPrimary}
      />
      <Typography
        variant="h3"
        color={theme.colors.textOnPrimary}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{
          fontSize: compact ? fontSizes.lg : fontSizes.xl,
          textAlign: "center",
        }}
      >
        {loading ? "Abrindo checkout..." : `Desbloquear ${PLAN_LABELS[tier]}`}
      </Typography>
    </PressableScale>
  );
}

export function Paywall({
  recommendedTier = "professional",
  onSubscribe,
  onRestore,
  loading = false,
  onClose,
}: PaywallProps) {
  const { theme } = useTheme();
  const brandName = getBrandDisplayName(useBrand());
  const { width } = useWindowDimensions();
  const compact = width < 520;
  const tier = recommendedTier;
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [highlightedPeriod, setHighlightedPeriod] = useState<BillingPeriod | null>(null);
  const [closeHighlighted, setCloseHighlighted] = useState(false);
  const [highlightedFooterAction, setHighlightedFooterAction] = useState<
    "restore" | "dismiss" | null
  >(null);

  const pricing = PLAN_PRICING[tier];
  const displayedMonthlyPrice =
    period === "annual" ? pricing.annual / 12 : pricing.monthly;
  const annualSavings = pricing.monthly * 12 - pricing.annual;
  const benefits = planBenefits(tier);

  function handleSubscribe() {
    if (onSubscribe) {
      onSubscribe(tier, period);
      return;
    }
    showAlert({
      title: "Em breve",
      message: "Assinatura será disponibilizada em breve.",
    });
  }

  function handleRestore() {
    if (onRestore) {
      onRestore();
      return;
    }
    showAlert({
      title: "Em breve",
      message: "Restauração será disponibilizada em breve.",
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: compact ? spacing.lg : spacing["3xl"],
            paddingBottom: compact ? spacing["3xl"] : spacing["5xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: compact ? 520 : 760 }]}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <View
                style={[
                  styles.brandMark,
                  {
                    width: compact ? 46 : 58,
                    height: compact ? 46 : 58,
                    backgroundColor: theme.colors.premiumBg,
                    borderColor: theme.colors.premium,
                  },
                ]}
              >
                <AppIcon
                  name="diamond"
                  size={compact ? 25 : 32}
                  color={theme.colors.premium}
                />
              </View>
              <Typography
                variant="h2"
                color={theme.colors.text}
                style={{ fontSize: compact ? fontSizes.xl : fontSizes["2xl"] }}
              >
                {brandName}
              </Typography>
            </View>

            {onClose ? (
              <PressableScale
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Fechar checkout"
                hitSlop={8}
                onHoverIn={() => setCloseHighlighted(true)}
                onHoverOut={() => setCloseHighlighted(false)}
                onFocus={() => setCloseHighlighted(true)}
                onBlur={() => setCloseHighlighted(false)}
                scaleTo={0.96}
                style={[
                  styles.closeButton,
                  {
                    width: compact ? 46 : 58,
                    height: compact ? 46 : 58,
                    backgroundColor: closeHighlighted
                      ? theme.colors.surfaceElevated
                      : theme.colors.surface,
                  },
                  closeHighlighted ? theme.shadows.sm : undefined,
                ]}
              >
                <AppIcon
                  name="close"
                  size={compact ? 24 : 30}
                  color={theme.colors.text}
                />
              </PressableScale>
            ) : null}
          </View>

          <Image
            source={checkoutProfessionalHero}
            resizeMode="contain"
            accessibilityLabel="Catálogo, resultados, encomendas e materiais profissionais"
            style={[
              styles.heroImage,
              {
                height: compact ? 224 : 330,
                marginTop: compact ? spacing.md : spacing.xl,
              },
            ]}
          />

          <View
            style={[styles.intro, { marginTop: compact ? spacing.lg : spacing["2xl"] }]}
          >
            <Typography
              variant="h1"
              color={theme.colors.text}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={[
                styles.title,
                {
                  fontSize: compact ? fontSizes["2xl"] : fontSizes["4xl"],
                  lineHeight: compact ? 34 : 54,
                },
              ]}
            >
              Mais controle para o seu negócio
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={[
                styles.subtitle,
                {
                  fontSize: compact ? fontSizes.md : fontSizes.xl,
                  lineHeight: compact ? 24 : 32,
                },
              ]}
            >
              Organize vendas, acompanhe resultados e trabalhe com mais profissionalismo.
            </Typography>
          </View>

          <View
            style={[
              styles.benefits,
              { marginTop: compact ? spacing.xl : spacing["3xl"] },
            ]}
          >
            {benefits.map((benefit, index) => (
              <BenefitRow
                key={benefit.title}
                benefit={benefit}
                last={index === benefits.length - 1}
                compact={compact}
                theme={theme}
              />
            ))}
          </View>

          <View
            style={[
              styles.periodSwitch,
              {
                marginTop: compact ? spacing["2xl"] : spacing["3xl"],
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <PressableScale
              onPress={() => setPeriod("monthly")}
              accessibilityRole="button"
              accessibilityLabel="Selecionar cobrança mensal"
              accessibilityState={{ selected: period === "monthly" }}
              onHoverIn={() => setHighlightedPeriod("monthly")}
              onHoverOut={() => setHighlightedPeriod(null)}
              onFocus={() => setHighlightedPeriod("monthly")}
              onBlur={() => setHighlightedPeriod(null)}
              scaleTo={0.99}
              style={[
                styles.periodButton,
                periodSurface(
                  theme,
                  period === "monthly",
                  highlightedPeriod === "monthly",
                ),
              ]}
            >
              <Typography
                variant="bodyBold"
                color={
                  period === "monthly"
                    ? theme.colors.primaryStrong
                    : theme.colors.textSecondary
                }
              >
                Mensal
              </Typography>
            </PressableScale>

            <PressableScale
              onPress={() => setPeriod("annual")}
              accessibilityRole="button"
              accessibilityLabel="Selecionar cobrança anual, com dois meses grátis"
              accessibilityState={{ selected: period === "annual" }}
              onHoverIn={() => setHighlightedPeriod("annual")}
              onHoverOut={() => setHighlightedPeriod(null)}
              onFocus={() => setHighlightedPeriod("annual")}
              onBlur={() => setHighlightedPeriod(null)}
              scaleTo={0.99}
              style={[
                styles.periodButton,
                periodSurface(theme, period === "annual", highlightedPeriod === "annual"),
              ]}
            >
              <Typography
                variant="bodyBold"
                color={
                  period === "annual"
                    ? theme.colors.primaryStrong
                    : theme.colors.textSecondary
                }
              >
                Anual
              </Typography>
              <View
                style={[styles.freeBadge, { backgroundColor: theme.colors.primaryBg }]}
              >
                <Typography
                  variant="caption"
                  color={theme.colors.primaryStrong}
                  style={{ fontSize: compact ? 12 : fontSizes.sm }}
                >
                  2 meses grátis
                </Typography>
              </View>
            </PressableScale>
          </View>

          <View
            style={[
              styles.priceBlock,
              { marginTop: compact ? spacing.xl : spacing["2xl"] },
            ]}
          >
            <View style={styles.priceLine}>
              <Typography
                variant="h2"
                color={theme.colors.text}
                style={{
                  fontSize: compact ? fontSizes.xl : fontSizes["3xl"],
                  lineHeight: compact ? 34 : 44,
                }}
              >
                R$
              </Typography>
              <Typography
                variant="moneyLg"
                color={theme.colors.text}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontSize: compact ? 58 : 82,
                  lineHeight: compact ? 66 : 90,
                  fontFamily: fonts.extraBold,
                }}
              >
                {formatBRL(displayedMonthlyPrice)}
              </Typography>
              <Typography
                variant="body"
                color={theme.colors.text}
                style={{ fontSize: compact ? fontSizes.md : fontSizes.xl }}
              >
                /mês
              </Typography>
            </View>

            {period === "annual" ? (
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{
                  textAlign: "center",
                  fontSize: compact ? fontSizes.md : fontSizes.xl,
                }}
              >
                R$ {formatBRL(pricing.annual)} cobrados anualmente
              </Typography>
            ) : null}

            {period === "annual" ? (
              <View style={styles.savings}>
                <AppIcon
                  name="checkmark-circle"
                  size={compact ? 18 : 22}
                  color={theme.colors.success}
                />
                <Typography
                  variant="body"
                  color={theme.colors.success}
                  style={{ fontSize: compact ? fontSizes.md : fontSizes.xl }}
                >
                  Economize R$ {formatBRL(annualSavings)}
                </Typography>
              </View>
            ) : null}
          </View>

          <View style={[styles.footer, { marginTop: compact ? spacing.lg : spacing.xl }]}>
            <PressableScale
              onPress={handleRestore}
              accessibilityRole="button"
              onHoverIn={() => setHighlightedFooterAction("restore")}
              onHoverOut={() => setHighlightedFooterAction(null)}
              onFocus={() => setHighlightedFooterAction("restore")}
              onBlur={() => setHighlightedFooterAction(null)}
              scaleTo={0.98}
              style={[
                styles.footerAction,
                {
                  backgroundColor:
                    highlightedFooterAction === "restore"
                      ? theme.colors.primaryBg
                      : "transparent",
                },
              ]}
            >
              <AppIcon
                name="refresh"
                size={compact ? 18 : 22}
                color={theme.colors.primaryStrong}
              />
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ fontSize: compact ? fontSizes.sm : fontSizes.md }}
              >
                Restaurar compra
              </Typography>
            </PressableScale>

            {onClose ? (
              <>
                <View
                  style={[styles.footerDivider, { backgroundColor: theme.colors.border }]}
                />
                <PressableScale
                  onPress={onClose}
                  accessibilityRole="button"
                  onHoverIn={() => setHighlightedFooterAction("dismiss")}
                  onHoverOut={() => setHighlightedFooterAction(null)}
                  onFocus={() => setHighlightedFooterAction("dismiss")}
                  onBlur={() => setHighlightedFooterAction(null)}
                  scaleTo={0.98}
                  style={[
                    styles.footerAction,
                    {
                      backgroundColor:
                        highlightedFooterAction === "dismiss"
                          ? theme.colors.primaryBg
                          : "transparent",
                    },
                  ]}
                >
                  <Typography
                    variant="body"
                    color={theme.colors.textSecondary}
                    style={{ fontSize: compact ? fontSizes.sm : fontSizes.md }}
                  >
                    Agora não
                  </Typography>
                </PressableScale>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
      <View
        style={[
          styles.stickyAction,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[styles.stickyActionContent, !compact && styles.stickyActionContentWide]}
        >
          <View style={styles.stickyPrice}>
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={{ fontSize: fontSizes.lg }}
            >
              R$ {formatBRL(displayedMonthlyPrice)}/mês
            </Typography>
            {period === "annual" ? (
              <Typography
                variant="caption"
                color={theme.colors.textSecondary}
                style={{ fontSize: fontSizes.sm }}
              >
                no anual
              </Typography>
            ) : null}
          </View>
          <View style={[styles.stickyButton, !compact && styles.stickyButtonWide]}>
            <SubscribeButton
              compact
              loading={loading}
              tier={tier}
              theme={theme}
              onPress={handleSubscribe}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  content: {
    width: "100%",
  },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  brandMark: {
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    alignSelf: "center",
  },
  intro: {
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    textAlign: "center",
    fontFamily: fonts.extraBold,
  },
  subtitle: {
    textAlign: "center",
  },
  benefits: {
    width: "100%",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 2,
  },
  periodSwitch: {
    width: "100%",
    minHeight: 62,
    padding: 2,
    flexDirection: "row",
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  periodButton: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  inactivePeriod: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  freeBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priceBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  priceLine: {
    width: "100%",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: spacing.sm,
  },
  savings: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  subscribeButton: {
    width: "100%",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  stickyAction: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  stickyActionContent: {
    width: "100%",
    maxWidth: 760,
    gap: spacing.xs,
  },
  stickyActionContentWide: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  stickyPrice: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: spacing.sm,
  },
  stickyButton: {
    width: "100%",
  },
  stickyButtonWide: {
    flex: 1,
    maxWidth: 480,
  },
  footer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerAction: {
    minHeight: 44,
    flex: 1,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  footerDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
});
