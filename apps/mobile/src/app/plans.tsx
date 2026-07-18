import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import type { PaidPlan, PlanType } from "@lucro-caseiro/contracts";
import {
  PLAN_LABELS,
  PLAN_PRICING,
  isPaidPlan,
  normalizePlan,
} from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { activePlan, useProfile, useLimits } from "../features/subscription/hooks";
import { TIER_BENEFITS } from "../features/subscription/plan-benefits";
import { showAlert } from "../shared/components/alert-store";
import { ScreenHeader } from "../shared/components/screen-header";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopAction, desktopContained } from "../shared/layout/desktop-density";

// Mesmo package do apps/mobile/app.json (expo.android.package).
const ANDROID_PACKAGE = "br.com.orionseven.lucrocaseiro";

const PLAN_FEATURES: Record<PlanType, readonly string[]> = {
  free: [
    "30 vendas por mês",
    "20 clientes e 15 produtos",
    "5 receitas e 3 embalagens",
    "Agenda, fiado e catálogo básico",
  ],
  essential: TIER_BENEFITS.essential,
  professional: TIER_BENEFITS.professional,
};

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

function openStoreSubscriptionManagement() {
  const url =
    Platform.OS === "android"
      ? `https://play.google.com/store/account/subscriptions?package=${ANDROID_PACKAGE}`
      : "https://apps.apple.com/account/subscriptions";

  Linking.openURL(url).catch(() => {
    showAlert({
      title: "Cancelar assinatura",
      message:
        "Não foi possível abrir a loja. Entre em contato pelo suporte para cancelar sua assinatura.",
    });
  });
}

const PLAN_ORDER: PlanType[] = ["free", "essential", "professional"];
const RANK: Record<PlanType, number> = { free: 0, essential: 1, professional: 2 };

function priceLabel(plan: PlanType): string {
  if (plan === "free") return "Grátis";
  return `R$ ${PLAN_PRICING[plan].monthly.toFixed(2).replace(".", ",")}`;
}

function annualLabel(plan: PaidPlan): string {
  return `ou R$ ${PLAN_PRICING[plan].annual.toFixed(2).replace(".", ",")}/ano (2 meses grátis)`;
}

export default function PlansScreen() {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);
  const current = activePlan(profile);
  const rawPlan = profile ? normalizePlan(profile.plan) : "free";
  const warning =
    profile && isPaidPlan(rawPlan) && profile.planExpiresAt
      ? expiryWarning(PLAN_LABELS[rawPlan], profile.planExpiresAt)
      : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      {!isDesktop && <ScreenHeader title="Planos" />}

      <ScrollView
        contentContainerStyle={[
          {
            padding: spacing.xl,
            paddingTop: spacing.sm,
            gap: spacing.xl,
            paddingBottom: spacing["3xl"],
          },
          desktopContained(isDesktop, 960),
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
              <Ionicons name="warning-outline" size={22} color={theme.colors.alert} />
              <Typography variant="h3" color={theme.colors.alert} style={{ flex: 1 }}>
                {warning.title}
              </Typography>
            </View>
            <Typography variant="body" color={theme.colors.text}>
              {warning.message}
            </Typography>
          </Card>
        )}

        <Card
          style={{
            backgroundColor: theme.colors.premiumBg,
            borderWidth: 1,
            borderColor: theme.colors.premium,
            gap: spacing.sm,
          }}
        >
          <View>
            <Typography variant="h2" color={theme.colors.text}>
              Cresça no seu ritmo
            </Typography>
          </View>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Escolha o plano que acompanha o momento do seu negócio.
          </Typography>
        </Card>

        {/* Uso atual (só no plano gratuito) */}
        {limits && current === "free" && (
          <Card>
            <Typography variant="h3" style={{ marginBottom: spacing.md }}>
              Seu uso atual
            </Typography>
            <View style={{ gap: spacing.md }}>
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
                { label: "Receitas", cur: limits.currentRecipes, max: limits.maxRecipes },
                {
                  label: "Embalagens",
                  cur: limits.currentPackaging,
                  max: limits.maxPackaging,
                },
              ]
                .filter(
                  (item): item is typeof item & { max: number } =>
                    typeof item.max === "number" && Number.isFinite(item.max),
                )
                .map((item) => {
                  const pct = Math.min((item.cur / item.max) * 100, 100);
                  const isNear = pct >= 80;
                  return (
                    <View key={item.label} style={{ gap: 6 }}>
                      <View
                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                      >
                        <Typography variant="bodyBold">{item.label}</Typography>
                        <Typography
                          variant="bodyBold"
                          color={isNear ? theme.colors.alert : theme.colors.textSecondary}
                        >
                          {item.cur}/{item.max}
                        </Typography>
                      </View>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: theme.colors.surface,
                          borderRadius: radii.full,
                        }}
                      >
                        <View
                          style={{
                            height: 8,
                            width: `${pct}%`,
                            backgroundColor: isNear
                              ? theme.colors.alert
                              : theme.colors.success,
                            borderRadius: radii.full,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          </Card>
        )}

        {/* Cards dos planos */}
        {PLAN_ORDER.map((plan) => {
          const isCurrent = plan === current;
          const isUpgrade = RANK[plan] > RANK[current];
          const isPaid = plan !== "free";
          const highlight = plan === "professional";
          return (
            <Card
              key={plan}
              style={{
                gap: spacing.md,
                borderWidth: highlight ? 2 : 1,
                borderColor: highlight ? theme.colors.premium : theme.colors.surface,
                backgroundColor: highlight
                  ? theme.colors.premiumBg
                  : theme.colors.surfaceElevated,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="h2"
                  color={highlight ? theme.colors.premium : theme.colors.text}
                >
                  {PLAN_LABELS[plan]}
                </Typography>
                {isCurrent && (
                  <View
                    style={{
                      backgroundColor: theme.colors.success,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      borderRadius: radii.full,
                    }}
                  >
                    <Typography variant="label" color={theme.colors.textOnPrimary}>
                      PLANO ATUAL
                    </Typography>
                  </View>
                )}
                {highlight && !isCurrent && (
                  <View
                    style={{
                      backgroundColor: theme.colors.surfaceElevated,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      borderRadius: radii.full,
                    }}
                  >
                    <Typography variant="label" color={theme.colors.premium}>
                      MAIS COMPLETO
                    </Typography>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                <Typography variant="moneyLg" color={theme.colors.text}>
                  {priceLabel(plan)}
                </Typography>
                {isPaid && (
                  <Typography
                    variant="body"
                    color={theme.colors.textSecondary}
                    style={{ marginBottom: 4 }}
                  >
                    /mês
                  </Typography>
                )}
              </View>
              {isPaid && (
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {annualLabel(plan as PaidPlan)}
                </Typography>
              )}

              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                {PLAN_FEATURES[plan].map((f) => (
                  <View
                    key={f}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.success}
                    />
                    <Typography
                      variant="body"
                      color={theme.colors.text}
                      style={{ flex: 1 }}
                    >
                      {f}
                    </Typography>
                  </View>
                ))}
              </View>

              {isUpgrade && (
                <Button
                  title={
                    current === "free"
                      ? `Assinar ${PLAN_LABELS[plan]}`
                      : `Fazer upgrade para o ${PLAN_LABELS[plan]}`
                  }
                  variant={highlight ? "premium" : "primary"}
                  size="lg"
                  onPress={() => showPaywall("plans", plan as PaidPlan)}
                  style={desktopAction(isDesktop, 240)}
                />
              )}
            </Card>
          );
        })}

        {current !== "free" && (
          <Button
            title="Cancelar assinatura"
            variant="outline"
            size="lg"
            onPress={openStoreSubscriptionManagement}
            style={desktopAction(isDesktop, 240)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
