import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan, PlanType } from "@lucro-caseiro/contracts";
import {
  PLAN_LABELS,
  PLAN_PRICING,
  isPaidPlan,
  normalizePlan,
} from "@lucro-caseiro/contracts";
import { AppIcon } from "../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { activePlan, useProfile, useLimits } from "../features/subscription/hooks";
import { tierBenefitsFor } from "../features/subscription/plan-benefits";
import { businessCopyFor } from "../features/subscription/business-copy";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { useStripeCheckout } from "../features/subscription/use-stripe";
import { useSubscription } from "../features/subscription/use-subscription";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import {
  desktopAction,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { openSubscriptionManagement } from "../shared/utils/subscription-management";

/** Dias até `expiresAt` (negativo se já passou). */
function daysUntil(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface ExpiryWarning {
  readonly title: string;
  readonly message: string;
}

/**
 * Aviso de expiração derivado de `expiresAt` (sem backend novo — item 2.4 do PRD).
 * Cobre a assinatura vencendo nos próximos 5 dias ou já vencida há menos de 30 dias
 * (janela em que o downgrade silencioso ainda confunde quem paga).
 */
function expiryWarning(planLabel: string, expiresAt: string): ExpiryWarning | null {
  const days = daysUntil(expiresAt);
  if (days >= 0 && days <= 5) {
    let dayLabel = `em ${days} dias`;
    if (days === 0) dayLabel = "hoje";
    else if (days === 1) dayLabel = "em 1 dia";
    return {
      title: `Sua assinatura vence ${dayLabel}`,
      message: `Renove para continuar aproveitando o plano ${planLabel} sem interrupção.`,
    };
  }
  if (days < 0 && days >= -30) {
    const daysAgo = Math.abs(days);
    const dayLabel = daysAgo === 1 ? "há 1 dia" : `há ${daysAgo} dias`;
    return {
      title: `Sua assinatura venceu ${dayLabel}`,
      message: `Renove para manter os benefícios do plano ${planLabel}.`,
    };
  }
  return null;
}

const RANK: Record<PlanType, number> = { free: 0, essential: 1, professional: 2 };

function moneyLabel(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function priceLabel(plan: PaidPlan, period: BillingPeriod): string {
  return moneyLabel(PLAN_PRICING[plan][period]);
}

export default function PlansScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType);
  const planFeatures: Record<PaidPlan, readonly string[]> = {
    essential: tierBenefitsFor("essential", experienceCopy),
    professional: tierBenefitsFor("professional", experienceCopy),
  };
  const { data: limits, isLoading: limitsLoading } = useLimits();
  const { checkout, loading: stripeLoading } = useStripeCheckout();
  const { subscribe, restore, loading: subscriptionLoading } = useSubscription();
  const checkoutLoading = stripeLoading || subscriptionLoading;
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const current = activePlan(profile);
  const [choice, setChoice] = useState<PaidPlan | null>(null);
  const defaultPlan = isPaidPlan(current) ? current : "essential";
  const selectedPlan = current === "professional" ? current : (choice ?? defaultPlan);
  const isUpgrade = RANK[selectedPlan] > RANK[current];
  const displayPeriod = isUpgrade ? period : "monthly";
  const pricing = PLAN_PRICING[selectedPlan];

  function continueToPayment() {
    if (checkoutLoading || !isUpgrade) return;
    if (Platform.OS === "android") {
      void subscribe(selectedPlan, period);
    } else {
      void checkout(selectedPlan, period);
    }
  }
  const rawPlan = profile ? normalizePlan(profile.plan) : "free";
  const warning =
    profile && isPaidPlan(rawPlan) && profile.planExpiresAt
      ? expiryWarning(PLAN_LABELS[rawPlan], profile.planExpiresAt)
      : null;
  let visiblePlans: readonly PaidPlan[] = ["essential", "professional"];
  if (current === "professional") visiblePlans = ["professional"];

  if (profileLoading || (current === "free" && limitsLoading)) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Planos" hideBack={isDesktop} />
        <ScrollView
          accessibilityLabel="Carregando planos"
          accessibilityState={{ busy: true }}
          contentContainerStyle={[
            { ...pageGutter(isDesktop), paddingVertical: spacing.xl, gap: spacing.xl },
            desktopStretch(isDesktop, desktopWidths.wide),
          ]}
        >
          <SkeletonCard lines={2} />
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: spacing.xl }}>
            {["essential", "professional"].map((plan) => (
              <Card key={plan} style={{ flex: 1, gap: spacing.lg }}>
                <Skeleton width="50%" height={24} />
                <Skeleton width="60%" height={40} />
                <SkeletonCard lines={5} />
                <Skeleton height={48} />
              </Card>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <ScreenHeader title="Planos" hideBack={isDesktop} />

      <ScrollView
        contentContainerStyle={[
          {
            ...pageGutter(isDesktop),
            paddingTop: spacing.xl,
            paddingBottom: spacing["3xl"],
            gap: spacing.xl,
          },
          desktopStretch(isDesktop, desktopWidths.wide),
        ]}
      >
        {warning && (
          <Card
            style={{
              backgroundColor: theme.colors.alertBg,
              borderWidth: 1,
              borderColor: theme.colors.alert,
              gap: spacing.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon name="warning-outline" size={22} color={theme.colors.alert} />
              <Typography variant="h3" color={theme.colors.alert} style={{ flex: 1 }}>
                {warning.title}
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.text}>
              {warning.message}
            </Typography>
          </Card>
        )}

        <View style={{ gap: spacing.sm }}>
          <Typography variant="h1" accessibilityRole="header">
            {current === "free" ? "Escolha seu plano" : "Sua assinatura"}
          </Typography>
          <Typography variant="body">
            {current === "free"
              ? "Vendas ilimitadas e sem anúncios nos dois planos."
              : "Consulte os benefícios e gerencie seu plano."}
          </Typography>
        </View>

        <Card
          variant="elevated"
          padding="2xl"
          style={{
            borderRadius: radii.md,
            flexDirection: isDesktop ? "row" : "column",
            gap: spacing["3xl"],
          }}
        >
          <View style={{ ...(isDesktop ? { flex: 1 } : {}), gap: spacing["2xl"] }}>
            <View style={{ flexDirection: "row", gap: spacing.lg }}>
              {visiblePlans.map((plan) => {
                const selected = plan === selectedPlan;
                return (
                  <Pressable
                    key={plan}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver plano ${PLAN_LABELS[plan]}`}
                    accessibilityState={{ selected, disabled: checkoutLoading }}
                    disabled={checkoutLoading}
                    onPress={() => setChoice(plan)}
                    style={({ pressed }) => ({
                      flex: 1,
                      minWidth: 0,
                      paddingTop: spacing.md,
                      paddingBottom: spacing.lg,
                      gap: spacing.sm,
                      borderBottomWidth: 2,
                      borderBottomColor: selected
                        ? theme.colors.text
                        : theme.colors.border,
                      opacity: pressed ? 0.65 : 1,
                    })}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: radii.full,
                          borderWidth: selected ? 4 : 1,
                          borderColor: selected
                            ? theme.colors.text
                            : theme.colors.textSecondary,
                        }}
                      />
                      <Typography
                        variant="bodyBold"
                        color={selected ? theme.colors.text : theme.colors.textSecondary}
                      >
                        {PLAN_LABELS[plan]}
                      </Typography>
                    </View>
                    <Typography variant="h2" style={{ fontVariant: ["tabular-nums"] }}>
                      {priceLabel(plan, displayPeriod)}
                    </Typography>
                    <Typography variant="caption">
                      {displayPeriod === "annual" ? "por ano" : "por mês"}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            {isUpgrade && (
              <View style={{ gap: spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    padding: spacing.xs,
                    backgroundColor: theme.colors.surface,
                    borderRadius: radii.sm,
                  }}
                >
                  {(["monthly", "annual"] as const).map((option) => (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={option === "annual" ? "Anual" : "Mensal"}
                      accessibilityState={{
                        selected: period === option,
                        disabled: checkoutLoading,
                      }}
                      disabled={checkoutLoading}
                      onPress={() => setPeriod(option)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: 44,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: radii.sm,
                        backgroundColor:
                          period === option
                            ? theme.colors.surfaceElevated
                            : "transparent",
                        borderWidth: 1,
                        borderColor:
                          period === option ? theme.colors.border : "transparent",
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <Typography
                        variant="bodyBold"
                        color={
                          period === option
                            ? theme.colors.text
                            : theme.colors.textSecondary
                        }
                      >
                        {option === "annual" ? "Anual" : "Mensal"}
                      </Typography>
                    </Pressable>
                  ))}
                </View>
                <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
                  <Typography variant="bodyBold">
                    {period === "annual"
                      ? `${moneyLabel(pricing.annual)} cobrados uma vez por ano.`
                      : `${moneyLabel(pricing.monthly)} cobrados a cada mês.`}
                  </Typography>
                  <Typography variant="caption">
                    {period === "annual"
                      ? `Equivale a ${moneyLabel(pricing.annual / 12)}/mês. Economia de ${moneyLabel(pricing.monthly * 12 - pricing.annual)} no ano.`
                      : "No anual, você paga o equivalente a 10 mensalidades."}
                  </Typography>
                </View>
              </View>
            )}

            {isUpgrade ? (
              <Button
                title={
                  checkoutLoading ? "Abrindo pagamento..." : "Continuar para pagamento"
                }
                size="lg"
                loading={checkoutLoading}
                accessibilityLabel={
                  checkoutLoading ? "Abrindo pagamento..." : "Continuar para pagamento"
                }
                accessibilityState={{ busy: checkoutLoading, disabled: checkoutLoading }}
                onPress={continueToPayment}
                style={{ width: "100%", borderRadius: radii.sm }}
              />
            ) : (
              <View
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: theme.colors.surface,
                  borderRadius: radii.sm,
                }}
              >
                <Typography variant="bodyBold">Plano ativo</Typography>
              </View>
            )}
          </View>

          <View
            style={{ ...(isDesktop ? { flex: 1 } : {}), gap: spacing.sm }}
            accessibilityLiveRegion="polite"
          >
            <Typography variant="h3" accessibilityRole="header">
              {selectedPlan === "professional"
                ? "Tudo do Essencial, mais:"
                : "Incluído no Essencial"}
            </Typography>
            {planFeatures[selectedPlan]
              .filter((feature) => feature !== "Tudo do Essencial")
              .map((feature, index, features) => (
                <View
                  key={feature}
                  style={{
                    paddingVertical: spacing.md,
                    borderBottomWidth: index < features.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Typography variant="body" color={theme.colors.text}>
                    {feature}
                  </Typography>
                </View>
              ))}
          </View>
        </Card>

        {Platform.OS === "android" && (
          <Button
            title="Restaurar compra"
            variant="text"
            disabled={checkoutLoading}
            onPress={() => void restore()}
            style={desktopAction(isDesktop, 200)}
          />
        )}

        {/* Uso atual (só no plano gratuito) */}
        {limits && current === "free" && (
          <View style={{ paddingTop: spacing.sm, gap: spacing.sm }}>
            <View style={{ gap: spacing.xs, marginBottom: spacing.xl }}>
              <Typography variant="h3">Seu uso atual</Typography>
              <Typography variant="body">Limites do plano gratuito</Typography>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
              {[
                {
                  label: "Vendas este mês",
                  cur: limits.currentSalesThisMonth,
                  max: limits.maxSalesPerMonth,
                },
                { label: "Clientes", cur: limits.currentClients, max: limits.maxClients },
                {
                  label: "Produtos",
                  cur: limits.currentProducts,
                  max: limits.maxProducts,
                },
                {
                  label: "Receitas",
                  cur: limits.currentRecipes,
                  max: limits.maxRecipes,
                },
                {
                  label: "Embalagens",
                  cur: limits.currentPackaging,
                  max: limits.maxPackaging,
                },
              ]
                .filter(
                  (item): item is typeof item & { max: number } =>
                    typeof item.max === "number" &&
                    Number.isFinite(item.max) &&
                    item.max > 0,
                )
                .map((item) => {
                  const pct = Math.max(0, Math.min((item.cur / item.max) * 100, 100));
                  const isNear = pct >= 80;
                  return (
                    <View
                      key={item.label}
                      style={{
                        gap: spacing.sm,
                        flexGrow: 1,
                        flexBasis: isDesktop ? "16%" : "44%",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                      >
                        <Typography variant="caption" style={{ flex: 1 }}>
                          {item.label}
                        </Typography>
                        <Typography
                          variant="captionBold"
                          style={{ fontVariant: ["tabular-nums"] }}
                          color={isNear ? theme.colors.alert : theme.colors.textSecondary}
                        >
                          {item.cur}/{item.max}
                        </Typography>
                      </View>
                      <View
                        accessibilityRole="progressbar"
                        accessibilityLabel={item.label}
                        accessibilityValue={{ min: 0, max: item.max, now: item.cur }}
                        style={{
                          height: 4,
                          backgroundColor: theme.colors.border,
                          borderRadius: radii.full,
                        }}
                      >
                        <View
                          style={{
                            height: 4,
                            width: `${pct}%`,
                            backgroundColor: isNear
                              ? theme.colors.alert
                              : theme.colors.primary,
                            borderRadius: radii.full,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {current !== "free" && (
          <Button
            title="Cancelar assinatura"
            variant="outline"
            size="lg"
            onPress={() => void openSubscriptionManagement()}
            style={desktopAction(isDesktop, 240)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
