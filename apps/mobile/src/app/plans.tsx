import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import type { PaidPlan, PlanType } from "@lucro-caseiro/contracts";
import { PLAN_LABELS, PLAN_PRICING } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { activePlan, useLimits, useProfile } from "../features/subscription/hooks";
import { showAlert } from "../shared/components/alert-store";
import { usePaywall } from "../shared/hooks/use-paywall";

const PLAN_FEATURES: Record<PlanType, readonly string[]> = {
  free: [
    "30 vendas por mês",
    "20 clientes e 15 produtos",
    "5 receitas e 3 embalagens",
    "Agenda, fiado e catálogo básico",
  ],
  essential: [
    "Vendas ilimitadas",
    "Clientes e produtos ilimitados",
    "Receitas e embalagens ilimitadas",
    "Agenda, fiado e catálogo online",
    "Sem anúncios",
  ],
  professional: [
    "Tudo do Essencial",
    "Catálogo completo e personalizado",
    "Relatórios completos + exportar PDF/Excel",
    "Fornecedores, compras e gastos fixos",
    "Rótulos personalizados e orçamentos em PDF",
  ],
};

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
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);
  const current = activePlan(profile);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={theme.colors.text}
          style={{ flex: 1, fontSize: 26, fontWeight: "800" }}
        >
          Planos
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingTop: spacing.sm,
          gap: spacing.xl,
          paddingBottom: spacing["3xl"],
        }}
      >
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
                        <Typography variant="bodyBold" style={{ fontSize: 15 }}>
                          {item.label}
                        </Typography>
                        <Typography
                          variant="bodyBold"
                          style={{ fontSize: 15 }}
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
                    <Typography
                      variant="caption"
                      color={theme.colors.textOnPrimary}
                      style={{ fontSize: 11, fontWeight: "800" }}
                    >
                      PLANO ATUAL
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
                      style={{ flex: 1, fontSize: 15 }}
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
            onPress={() => {
              showAlert({
                title: "Cancelar",
                message:
                  "Funcionalidade disponível em breve. Entre em contato pelo suporte.",
              });
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
