import {
  PressableScale,
  Typography,
  fontSizes,
  radii,
  spacing,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { PLAN_LABELS } from "@lucro-caseiro/contracts";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import checkoutProfessionalHero from "../../../assets/checkout-professional-hero.png";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { getPaywallCopy } from "../limit-copy";
import { TIER_BENEFITS, benefitsLeadingWith, tierBenefitsFor } from "../plan-benefits";
import { annualSavings, formatMoney, planPriceDisplay } from "../plan-pricing";
import type { BusinessExperienceCopy } from "../business-copy";

interface PaywallProps {
  readonly title?: string;
  readonly message?: string;
  readonly currentUsage?: string;
  readonly experienceCopy?: BusinessExperienceCopy;
  readonly recommendedTier?: PaidPlan;
  /** Recurso que abriu o checkout: o benefício dele vem primeiro, destacado. */
  readonly resource?: string | null;
  readonly onSubscribe?: (tier: PaidPlan, period: BillingPeriod) => void;
  readonly onRestore?: () => void;
  readonly loading?: boolean;
  readonly onClose?: () => void;
  /** Abre a tela de planos para comparar Essencial e Profissional. */
  readonly onSeePlans?: () => void;
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
  highlighted,
  compact,
  theme,
}: Readonly<{
  benefit: string;
  highlighted: boolean;
  compact: boolean;
  theme: Theme;
}>) {
  return (
    <View
      style={[
        styles.benefitRow,
        highlighted
          ? {
              backgroundColor: theme.colors.primaryBg,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.xs,
            }
          : null,
      ]}
    >
      <AppIcon
        name="checkmark"
        size={compact ? 20 : 22}
        color={theme.colors.primaryStrong}
      />
      <Typography
        variant={highlighted ? "bodyBold" : "body"}
        color={theme.colors.text}
        style={{ flex: 1, fontSize: fontSizes.md, lineHeight: 22 }}
      >
        {benefit}
      </Typography>
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
  title,
  message,
  currentUsage,
  experienceCopy,
  recommendedTier = "professional",
  resource,
  onSubscribe,
  onRestore,
  loading = false,
  onClose,
  onSeePlans,
}: PaywallProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 520;
  const tier = recommendedTier;
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [highlightedPeriod, setHighlightedPeriod] = useState<BillingPeriod | null>(null);
  const [closeHighlighted, setCloseHighlighted] = useState(false);
  const [highlightedFooterAction, setHighlightedFooterAction] = useState<
    "restore" | "plans" | "dismiss" | null
  >(null);

  const price = planPriceDisplay(tier, period);
  const savings = formatMoney(annualSavings(tier));
  const { benefits, highlighted: leadHighlighted } = benefitsLeadingWith(
    tier,
    experienceCopy ? tierBenefitsFor(tier, experienceCopy) : TIER_BENEFITS[tier],
    resource,
  );
  const defaultCopy = getPaywallCopy(null, experienceCopy);

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

  const footerActions: readonly {
    key: "restore" | "plans" | "dismiss";
    label: string;
    onPress: () => void;
  }[] = [
    { key: "restore", label: "Restaurar compra", onPress: handleRestore },
    ...(onSeePlans
      ? [{ key: "plans" as const, label: "Comparar planos", onPress: onSeePlans }]
      : []),
    ...(onClose
      ? [{ key: "dismiss" as const, label: "Agora não", onPress: onClose }]
      : []),
  ];

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
                    width: 48,
                    height: 48,
                    backgroundColor: closeHighlighted
                      ? theme.colors.surfaceElevated
                      : theme.colors.surface,
                  },
                  closeHighlighted ? theme.shadows.sm : undefined,
                ]}
              >
                <AppIcon name="close" size={24} color={theme.colors.text} />
              </PressableScale>
            ) : null}
          </View>

          <Image
            source={checkoutProfessionalHero}
            resizeMode="contain"
            accessibilityLabel="Catálogo, resultados, encomendas e materiais profissionais"
            style={[styles.heroImage, { height: compact ? 180 : 250 }]}
          />

          <View style={[styles.intro, { marginTop: compact ? spacing.lg : spacing.xl }]}>
            {/* O título é a promessa: maior que a explicação embaixo dele. */}
            <Typography
              variant="h1"
              accessibilityRole="header"
              color={theme.colors.text}
              style={[
                styles.title,
                {
                  fontSize: compact ? fontSizes["2xl"] : fontSizes["3xl"],
                  lineHeight: compact ? 30 : 34,
                },
              ]}
            >
              {title ?? defaultCopy.title}
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={[styles.subtitle, { fontSize: fontSizes.md, lineHeight: 24 }]}
            >
              {message ?? defaultCopy.message}
            </Typography>
            {currentUsage ? (
              <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                {currentUsage}
              </Typography>
            ) : null}
          </View>

          <View
            style={[
              styles.benefits,
              { marginTop: compact ? spacing.xl : spacing["2xl"] },
            ]}
          >
            <Typography variant="bodyBold" style={{ marginBottom: spacing.xs }}>
              {`Incluído no ${PLAN_LABELS[tier]}`}
            </Typography>
            {benefits.map((benefit, index) => (
              <BenefitRow
                key={benefit}
                benefit={benefit}
                highlighted={leadHighlighted && index === 0}
                compact={compact}
                theme={theme}
              />
            ))}
          </View>

          <View
            style={[
              styles.periodSwitch,
              {
                marginTop: compact ? spacing.xl : spacing["2xl"],
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
              accessibilityLabel="Selecionar cobrança anual, a mais vantajosa"
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
                  style={{ fontSize: fontSizes.sm }}
                >
                  Mais vantajoso
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
            {/* Destaque no valor por mês (comparável); logo abaixo, sem letra
                miúda, o que é cobrado e quando. */}
            <View style={styles.priceLine}>
              <Typography variant="moneyHero" color={theme.colors.text}>
                {price.perMonth}
              </Typography>
              <Typography variant="body" color={theme.colors.text}>
                /mês
              </Typography>
            </View>
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={{ textAlign: "center" }}
            >
              {`${price.charge.replace(/^./, (letter) => letter.toUpperCase())}.`}
            </Typography>

            {period === "annual" ? (
              <View style={styles.savings}>
                <AppIcon name="checkmark-circle" size={20} color={theme.colors.success} />
                <Typography variant="body" color={theme.colors.success}>
                  {`Economize ${savings} no ano`}
                </Typography>
              </View>
            ) : null}
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              Sem fidelidade: cancele quando quiser.
            </Typography>
          </View>

          <View style={[styles.footer, { marginTop: compact ? spacing.lg : spacing.xl }]}>
            {footerActions.map((action, index) => (
              <React.Fragment key={action.key}>
                {index > 0 ? (
                  <View
                    style={[
                      styles.footerDivider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                ) : null}
                <PressableScale
                  onPress={action.onPress}
                  accessibilityRole="button"
                  onHoverIn={() => setHighlightedFooterAction(action.key)}
                  onHoverOut={() => setHighlightedFooterAction(null)}
                  onFocus={() => setHighlightedFooterAction(action.key)}
                  onBlur={() => setHighlightedFooterAction(null)}
                  scaleTo={0.98}
                  style={[
                    styles.footerAction,
                    {
                      backgroundColor:
                        highlightedFooterAction === action.key
                          ? theme.colors.primaryBg
                          : "transparent",
                    },
                  ]}
                >
                  <Typography
                    variant="body"
                    color={
                      action.key === "plans"
                        ? theme.colors.primaryStrong
                        : theme.colors.textSecondary
                    }
                    style={{ textAlign: "center" }}
                  >
                    {action.label}
                  </Typography>
                </PressableScale>
              </React.Fragment>
            ))}
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
              style={{ fontSize: fontSizes.xl }}
            >
              {`${price.perMonth}/mês`}
            </Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              {price.charge}
            </Typography>
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
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
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
  },
  subtitle: {
    textAlign: "center",
  },
  benefits: {
    width: "100%",
  },
  benefitRow: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "center",
    columnGap: spacing.sm,
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
