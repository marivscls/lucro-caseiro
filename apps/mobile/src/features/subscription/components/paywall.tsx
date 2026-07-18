import {
  Button,
  Card,
  Typography,
  useTheme,
  spacing,
  radii,
  fonts,
  type Theme,
} from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan } from "@lucro-caseiro/contracts";
import { PLAN_LABELS, PLAN_PRICING } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showAlert } from "../../../shared/components/alert-store";
import { TIER_BENEFITS } from "../plan-benefits";

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

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function cardBorder(theme: Theme): string {
  return theme.colors.border;
}

function TierCard({
  tier,
  selected,
  onPress,
  theme,
}: Readonly<{
  tier: PaidPlan;
  selected: boolean;
  onPress: () => void;
  theme: Theme;
}>) {
  const price = PLAN_PRICING[tier].monthly;
  const isPro = tier === "professional";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 2,
        borderColor: selected ? theme.colors.primary : cardBorder(theme),
        backgroundColor: selected ? theme.colors.primaryBg : theme.colors.surfaceElevated,
        alignItems: "center",
        gap: 2,
      }}
    >
      <View
        style={{
          backgroundColor: isPro ? theme.colors.premiumBg : theme.colors.surface,
          borderWidth: isPro ? 0 : 1,
          borderColor: cardBorder(theme),
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radii.full,
          marginBottom: spacing.xs,
        }}
      >
        <Typography
          variant="caption"
          color={isPro ? theme.colors.premium : theme.colors.textSecondary}
          style={{ fontSize: 12, fontFamily: fonts.extraBold }}
        >
          {isPro ? "COMPLETO" : "MAIS ESCOLHIDO"}
        </Typography>
      </View>
      <Typography variant="bodyBold" color={theme.colors.text}>
        {PLAN_LABELS[tier]}
      </Typography>
      <Typography
        variant="moneyLg"
        color={theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatBRL(price)}
      </Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        por mês
      </Typography>
    </Pressable>
  );
}

function PeriodCard({
  label,
  price,
  period,
  note,
  badge,
  selected,
  onPress,
  theme,
}: Readonly<{
  label: string;
  price: string;
  period: string;
  note: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  theme: Theme;
}>) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flex: 1,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 2,
        borderColor: selected ? theme.colors.primary : cardBorder(theme),
        backgroundColor: selected ? theme.colors.primaryBg : theme.colors.surfaceElevated,
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      {badge ? (
        <View
          style={{
            backgroundColor: theme.colors.premiumBg,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radii.full,
            marginBottom: 2,
          }}
        >
          <Typography
            variant="caption"
            color={theme.colors.premium}
            style={{ fontSize: 12, fontFamily: fonts.extraBold }}
          >
            {badge}
          </Typography>
        </View>
      ) : null}
      <Typography variant="bodyBold" color={theme.colors.textSecondary}>
        {label}
      </Typography>
      <Typography
        variant="moneyLg"
        color={theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {price}
      </Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {period}
      </Typography>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginTop: spacing.xs,
        }}
      >
        <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{ fontSize: 13 }}
        >
          {note}
        </Typography>
      </View>
    </Pressable>
  );
}

function BenefitItem({ text, theme }: Readonly<{ text: string; theme: Theme }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
      <Typography
        variant="caption"
        color={theme.colors.text}
        numberOfLines={2}
        style={{ flex: 1 }}
      >
        {text}
      </Typography>
    </View>
  );
}

export function Paywall({
  title = "Limite atingido",
  message,
  currentUsage,
  recommendedTier = "essential",
  onSubscribe,
  onRestore,
  loading = false,
  onClose,
}: PaywallProps) {
  const { theme } = useTheme();
  const [tier, setTier] = useState<PaidPlan>(recommendedTier);
  // Anual pré-selecionado: âncora de venda (item 2.3 do PRD) — o plano anual é o
  // que mais interessa ao negócio (menos cancelamento, receita adiantada).
  const [period, setPeriod] = useState<BillingPeriod>("annual");

  const pricing = PLAN_PRICING[tier];
  const annualMonthlyEquivalent = pricing.annual / 12;
  const annualSavings = pricing.monthly * 12 - pricing.annual;

  function handleSubscribe() {
    if (onSubscribe) onSubscribe(tier, period);
    else
      showAlert({
        title: "Em breve",
        message: "Assinatura será disponibilizada em breve.",
      });
  }

  function handleRestore() {
    if (onRestore) onRestore();
    else
      showAlert({
        title: "Em breve",
        message: "Restauração será disponibilizada em breve.",
      });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.full,
              backgroundColor: theme.colors.premiumBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="diamond" size={18} color={theme.colors.premium} />
          </View>
          <Typography variant="bodyBold" color={theme.colors.text}>
            Lucro Caseiro
          </Typography>
        </View>

        {/* Hero */}
        <Card
          style={{
            backgroundColor: theme.colors.premiumBg,
            borderWidth: 1,
            borderColor: theme.colors.premium,
            alignItems: "center",
            gap: spacing.sm,
            paddingVertical: spacing.xl,
          }}
        >
          <Typography
            variant="h1"
            color={theme.colors.text}
            style={{ textAlign: "center" }}
          >
            {title}
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center", maxWidth: 320 }}
          >
            {message ??
              "Continue crescendo sem limites e leve seu negócio ainda mais longe."}
          </Typography>
          {currentUsage ? (
            <Typography
              variant="caption"
              color={theme.colors.premium}
              style={{ textAlign: "center" }}
            >
              {currentUsage}
            </Typography>
          ) : null}
        </Card>

        {/* Escolha do plano */}
        <Typography variant="h3" color={theme.colors.text}>
          Escolha seu plano
        </Typography>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <TierCard
            tier="essential"
            selected={tier === "essential"}
            onPress={() => setTier("essential")}
            theme={theme}
          />
          <TierCard
            tier="professional"
            selected={tier === "professional"}
            onPress={() => setTier("professional")}
            theme={theme}
          />
        </View>

        {/* Benefícios do plano selecionado */}
        <Card
          style={{
            borderWidth: 1,
            borderColor: cardBorder(theme),
            backgroundColor: theme.colors.surface,
            gap: spacing.md,
          }}
        >
          <Typography variant="h3" color={theme.colors.text}>
            No {PLAN_LABELS[tier]} você tem
          </Typography>
          {TIER_BENEFITS[tier].map((b) => (
            <BenefitItem key={b} text={b} theme={theme} />
          ))}
        </Card>

        {/* Período */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <PeriodCard
            label="Mensal"
            price={formatBRL(pricing.monthly)}
            period="/mês"
            note="Cancele quando quiser"
            selected={period === "monthly"}
            onPress={() => setPeriod("monthly")}
            theme={theme}
          />
          <PeriodCard
            label="Anual"
            price={formatBRL(pricing.annual)}
            period="/ano"
            note={`Equivale a ${formatBRL(annualMonthlyEquivalent)}/mês · economize ${formatBRL(annualSavings)}`}
            badge="Mais vantajoso"
            selected={period === "annual"}
            onPress={() => setPeriod("annual")}
            theme={theme}
          />
        </View>

        {/* Actions */}
        <View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          <Button
            title={`Assinar ${PLAN_LABELS[tier]}`}
            variant="premium"
            size="lg"
            loading={loading}
            onPress={handleSubscribe}
            icon={<Ionicons name="star" size={18} color="#FFFFFF" />}
          />

          <Pressable
            onPress={handleRestore}
            accessibilityRole="button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              paddingVertical: spacing.sm,
            }}
          >
            <Ionicons name="refresh" size={16} color={theme.colors.primaryStrong} />
            <Typography variant="caption" color={theme.colors.primaryStrong}>
              Restaurar compra anterior
            </Typography>
          </Pressable>

          {onClose ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={{ alignItems: "center", paddingVertical: spacing.sm }}
            >
              <Typography variant="body" color={theme.colors.textSecondary}>
                Agora não
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
