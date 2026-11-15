import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import type { BillingPeriod, PaidPlan, PlanType } from "@lucro-caseiro/contracts";
import {
  ESSENTIAL_TRIAL_DAYS,
  PLAN_LABELS,
  SOLD_PLAN,
  isPaidPlan,
  normalizePlan,
} from "@lucro-caseiro/contracts";
import { AppIcon } from "../../../shared/components/app-icon";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { activePlan, useProfile, useLimits } from "../hooks";
import { tierBenefitsFor } from "../plan-benefits";
import { annualSavings, formatMoney, planPriceDisplay } from "../plan-pricing";
import { isProfileOnTrial, trialNotice } from "../trial";
import { businessCopyFor } from "../business-copy";
import { ScreenHeader } from "../../../shared/components/screen-header";
import { Skeleton, SkeletonCard } from "../../../shared/components/skeleton";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useStripeCheckout } from "../use-stripe";
import { useAuth } from "../../../shared/hooks/use-auth";
import { useSubscription } from "../use-subscription";
import {
  desktopPageContent,
  DesktopPageHeader,
} from "../../../shared/layout/desktop-page";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { PeriodToggle } from "./period-toggle";
import { PlansDesktop } from "./plans-desktop";
import {
  desktopAction,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../../shared/layout/desktop-density";
import { openSubscriptionManagement } from "../../../shared/utils/subscription-management";

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

/** Linha sob o seletor: o valor cobrado do plano escolhido, por extenso. */
function chargeLine(plan: PaidPlan, period: BillingPeriod): string {
  const { perMonth, charge } = planPriceDisplay(plan, period);
  return period === "annual" ? `${charge}.` : `${perMonth} cobrados a cada mês.`;
}

function chargeHint(plan: PaidPlan, period: BillingPeriod): string {
  return period === "annual"
    ? `Economia de ${formatMoney(annualSavings(plan))} no ano.`
    : `No anual, você economiza ${formatMoney(annualSavings(plan))}.`;
}

/**
 * Modo boas-vindas: a mesma tela de planos, aberta uma vez logo após o cadastro
 * (estilo Kyte). Sem voltar/abas; sempre há uma saída para seguir no app.
 */
export interface PlansWelcome {
  readonly onContinue: () => void;
}

/** Texto da saída do modo boas-vindas, conforme o plano da conta agora. */
export function welcomeContinueLabel(onTrial: boolean, current: PlanType): string {
  if (onTrial) return "Continuar com o teste grátis";
  if (current === "free") return "Continuar no plano Gratuito";
  return "Continuar";
}

export function PlansView({ welcome }: Readonly<{ welcome?: PlansWelcome }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType);
  const benefits = tierBenefitsFor(SOLD_PLAN, experienceCopy);
  const { data: limits, isLoading: limitsLoading } = useLimits();
  const { checkout, loading: stripeLoading } = useStripeCheckout();
  const { subscribe, restore, loading: subscriptionLoading } = useSubscription();
  const checkoutLoading = stripeLoading || subscriptionLoading;
  const [period, setPeriod] = useState<BillingPeriod>("annual");
  // Abre no anual: a pessoa paga o ano de uma vez e o valor por mês fica menor.
  // No teste grátis a pessoa ainda não assinou: para compra ela conta como Gratuito.
  const onTrial = isProfileOnTrial(profile);
  const current = onTrial ? "free" : activePlan(profile);
  // Um plano pago só: quem já paga (Premium ou um nível antigo) tem tudo liberado.
  const selectedPlan = SOLD_PLAN;
  const isUpgrade = !isPaidPlan(current);
  const displayPeriod = isUpgrade ? period : "monthly";

  function continueToPayment() {
    if (checkoutLoading || !isUpgrade) return;
    void trackAnalyticsAction("plan_chosen", useAuth.getState().token, {
      plan: selectedPlan,
      period,
      current,
      provider: Platform.OS === "android" ? "google_play" : "stripe",
    });
    if (Platform.OS === "android") {
      void subscribe(selectedPlan, period);
    } else {
      void checkout(selectedPlan, period);
    }
  }
  const rawPlan = profile ? normalizePlan(profile.plan) : "free";
  const trial = trialNotice(profile);
  let warning: ExpiryWarning | null = null;
  // Nas boas-vindas o próprio título já explica o teste: sem aviso repetido.
  if (trial) warning = welcome ? null : trial;
  else if (profile && isPaidPlan(rawPlan) && profile.planExpiresAt)
    warning = expiryWarning(PLAN_LABELS[rawPlan], profile.planExpiresAt);
  // Aviso calmo durante o teste; alerta quando algo venceu ou vai vencer.
  const warningIsInfo = !!trial && !trial.ended;
  // Durante o teste o uso não tem limite: a seção "Limites do plano gratuito" some.
  const showUsage = current === "free" && !onTrial && !welcome;
  const usageItems = limits
    ? [
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
          label: "Encomendas este mês",
          cur: limits.currentOrdersThisMonth ?? 0,
          max: limits.maxOrdersPerMonth ?? null,
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
      ].filter(
        (item): item is typeof item & { max: number } =>
          typeof item.max === "number" && Number.isFinite(item.max) && item.max > 0,
      )
    : [];
  const premium = PLAN_LABELS[SOLD_PLAN];
  let heading = current === "free" ? `Assine o ${premium}` : "Sua assinatura";
  let subheading =
    current === "free"
      ? "Tudo liberado: sem limites, sem anúncios, com relatórios completos e catálogo personalizado."
      : "Consulte os benefícios e gerencie seu plano.";
  if (welcome && onTrial) {
    heading = "Seu teste grátis começou";
    subheading = `Você tem ${ESSENTIAL_TRIAL_DAYS} dias do ${premium} liberados, sem cartão. Assine agora ou continue testando: nada é cobrado sozinho.`;
  } else if (welcome && current === "free") {
    heading = `Conheça o ${premium}`;
    subheading =
      "Comece grátis e assine quando quiser crescer sem limites. Seus dados ficam sempre salvos.";
  }
  const continueButton = welcome ? (
    <Button
      title={welcomeContinueLabel(onTrial, current)}
      variant="outline"
      size="lg"
      disabled={checkoutLoading}
      onPress={welcome.onContinue}
      style={desktopAction(isDesktop, 320)}
    />
  ) : null;

  if (profileLoading || (showUsage && limitsLoading)) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScreenHeader title="Planos" hideBack={isDesktop || !!welcome} />
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

      {/* Top bar (no desktop, rola junto com a página) */}
      {isDesktop ? null : (
        <ScreenHeader
          title="Planos"
          hideBack={!!welcome}
          right={
            welcome ? (
              <Button
                title="Agora não"
                variant="text"
                disabled={checkoutLoading}
                onPress={welcome.onContinue}
              />
            ) : undefined
          }
        />
      )}

      <ScrollView
        contentContainerStyle={
          isDesktop
            ? [
                desktopPageContent(true),
                // Sem a moldura do app (boas-vindas), a página centraliza sozinha.
                welcome
                  ? {
                      alignSelf: "center" as const,
                      paddingHorizontal: spacing["3xl"],
                      paddingTop: spacing["3xl"],
                    }
                  : null,
              ]
            : [
                {
                  ...pageGutter(isDesktop),
                  paddingTop: spacing.xl,
                  paddingBottom: spacing["3xl"],
                  gap: spacing.xl,
                },
                desktopStretch(isDesktop, desktopWidths.wide),
              ]
        }
      >
        {isDesktop ? (
          <DesktopPageHeader>
            <ScreenHeader title={heading} subtitle={subheading} hideBack />
          </DesktopPageHeader>
        ) : null}
        {warning && (
          <Card
            style={{
              backgroundColor: warningIsInfo
                ? theme.colors.premiumBg
                : theme.colors.alertBg,
              borderWidth: 1,
              borderColor: warningIsInfo ? theme.colors.premium : theme.colors.alert,
              gap: spacing.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon
                name={warningIsInfo ? "time-outline" : "warning-outline"}
                size={22}
                color={warningIsInfo ? theme.colors.premium : theme.colors.alert}
              />
              <Typography
                variant="h3"
                color={warningIsInfo ? theme.colors.text : theme.colors.alert}
                style={{ flex: 1 }}
              >
                {warning.title}
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.text}>
              {warning.message}
            </Typography>
          </Card>
        )}

        {isDesktop ? (
          <PlansDesktop
            cards={[
              {
                plan: SOLD_PLAN,
                label: premium,
                price: planPriceDisplay(SOLD_PLAN, displayPeriod).perMonth,
                periodLabel: "por mês",
                chargeNote: planPriceDisplay(SOLD_PLAN, displayPeriod).charge,
                heading: `Tudo liberado no ${premium}`,
                features: benefits,
                current: isPaidPlan(current),
              },
            ]}
            selectedPlan={selectedPlan}
            isUpgrade={isUpgrade}
            period={period}
            onPeriodChange={setPeriod}
            chargeLine={chargeLine(selectedPlan, period)}
            chargeHint={chargeHint(selectedPlan, period)}
            checkoutLoading={checkoutLoading}
            onContinue={continueToPayment}
            usage={showUsage ? usageItems : null}
            onCancel={
              current === "free" || welcome
                ? null
                : () => void openSubscriptionManagement()
            }
            skip={
              welcome
                ? {
                    label: welcomeContinueLabel(onTrial, current),
                    onPress: welcome.onContinue,
                  }
                : null
            }
          />
        ) : (
          <>
            <View style={{ gap: spacing.sm }}>
              <Typography variant="h1" accessibilityRole="header">
                {heading}
              </Typography>
              <Typography variant="body">{subheading}</Typography>
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
              <View style={{ ...(isDesktop ? { flex: 1 } : {}), gap: spacing.xl }}>
                {isUpgrade ? (
                  <PeriodToggle
                    period={period}
                    disabled={checkoutLoading}
                    onChange={setPeriod}
                  />
                ) : null}
                <View style={{ gap: spacing.xs }}>
                  <Typography variant="bodyBold" color={theme.colors.text}>
                    {premium}
                  </Typography>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "baseline",
                      gap: spacing.sm,
                    }}
                  >
                    <Typography variant="h1" style={{ fontVariant: ["tabular-nums"] }}>
                      {planPriceDisplay(SOLD_PLAN, displayPeriod).perMonth}
                    </Typography>
                    <Typography variant="bodyBold" color={theme.colors.text}>
                      por mês
                    </Typography>
                  </View>
                </View>

                {isUpgrade && (
                  <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
                    <Typography variant="bodyBold">
                      {chargeLine(selectedPlan, period)}
                    </Typography>
                    <Typography variant="body" color={theme.colors.textSecondary}>
                      {chargeHint(selectedPlan, period)}
                    </Typography>
                  </View>
                )}

                {isUpgrade ? (
                  <Button
                    title={
                      checkoutLoading
                        ? "Abrindo pagamento..."
                        : "Continuar para pagamento"
                    }
                    size="lg"
                    loading={checkoutLoading}
                    accessibilityLabel={
                      checkoutLoading
                        ? "Abrindo pagamento..."
                        : "Continuar para pagamento"
                    }
                    accessibilityState={{
                      busy: checkoutLoading,
                      disabled: checkoutLoading,
                    }}
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
                  {`Tudo liberado no ${premium}`}
                </Typography>
                {benefits.map((feature) => (
                  <View
                    key={feature}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: spacing.sm,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <AppIcon
                      name="checkmark"
                      size={20}
                      color={theme.colors.success}
                      style={{ marginTop: 2 }}
                    />
                    <Typography
                      variant="body"
                      color={theme.colors.text}
                      style={{ flex: 1 }}
                    >
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
            {limits && showUsage && (
              <View style={{ paddingTop: spacing.sm, gap: spacing.sm }}>
                <View style={{ gap: spacing.xs, marginBottom: spacing.xl }}>
                  <Typography variant="h3">Seu uso atual</Typography>
                  <Typography variant="body">Limites do plano gratuito</Typography>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
                  {usageItems.map((item) => {
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
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="caption" style={{ flex: 1 }}>
                            {item.label}
                          </Typography>
                          <Typography
                            variant="captionBold"
                            style={{ fontVariant: ["tabular-nums"] }}
                            color={
                              isNear ? theme.colors.alert : theme.colors.textSecondary
                            }
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

            {current !== "free" && !welcome && (
              <Button
                title="Cancelar assinatura"
                variant="outline"
                size="lg"
                onPress={() => void openSubscriptionManagement()}
                style={desktopAction(isDesktop, 240)}
              />
            )}
          </>
        )}
        {/* No desktop a saída fica na lateral, junto do botão de pagamento. */}
        {isDesktop ? null : continueButton}
      </ScrollView>
    </SafeAreaView>
  );
}
