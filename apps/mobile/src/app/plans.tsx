import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile, useLimits } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";

const FREE_LIMITS = {
  "Vendas/mês": "30",
  Clientes: "20",
  Receitas: "5",
  Embalagens: "3",
  Rótulos: "1 template",
  Catálogo: "5 produtos",
  Relatórios: "Básico mensal",
  Exportação: "Não",
};

const PREMIUM_LIMITS = {
  "Vendas/mês": "Ilimitado",
  Clientes: "Ilimitado",
  Receitas: "Ilimitado",
  Embalagens: "Ilimitado",
  Rótulos: "Ilimitado",
  Catálogo: "Ilimitado + visual",
  Relatórios: "Completo + gráficos",
  Exportação: "PDF/Excel",
};

export default function PlansScreen() {
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);
  const isPremium = profile?.plan === "premium";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing["3xl"],
        }}
      >
        {/* Current plan */}
        <Card
          style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isPremium ? theme.colors.premiumBg : theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={isPremium ? "diamond" : "diamond-outline"}
              size={28}
              color={isPremium ? theme.colors.premium : theme.colors.textSecondary}
            />
          </View>
          <Typography variant="h1">{isPremium ? "Premium" : "Plano Gratuito"}</Typography>
          {isPremium && profile?.planExpiresAt && (
            <Typography variant="caption">
              Valido até {new Date(profile.planExpiresAt).toLocaleDateString("pt-BR")}
            </Typography>
          )}
        </Card>

        {/* Usage */}
        {limits && !isPremium && (
          <Card>
            <Typography variant="h3" style={{ marginBottom: spacing.md }}>
              Seu uso atual
            </Typography>
            <View style={{ gap: spacing.sm }}>
              {[
                {
                  label: "Vendas este mês",
                  current: limits.currentSalesThisMonth,
                  max: limits.maxSalesPerMonth,
                },
                {
                  label: "Clientes",
                  current: limits.currentClients,
                  max: limits.maxClients,
                },
                {
                  label: "Receitas",
                  current: limits.currentRecipes,
                  max: limits.maxRecipes,
                },
                {
                  label: "Embalagens",
                  current: limits.currentPackaging,
                  max: limits.maxPackaging,
                },
              ].map((item) => {
                const pct = Math.min((item.current / item.max) * 100, 100);
                const isNear = pct >= 80;
                return (
                  <View key={item.label} style={{ gap: 4 }}>
                    <View
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">{item.label}</Typography>
                      <Typography
                        variant="caption"
                        color={isNear ? theme.colors.alert : theme.colors.textSecondary}
                      >
                        {item.current}/{item.max}
                      </Typography>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 2,
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          width: `${pct}%`,
                          backgroundColor: isNear
                            ? theme.colors.alert
                            : theme.colors.success,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Comparison table */}
        <Card>
          <Typography variant="h3" style={{ marginBottom: spacing.md }}>
            Comparativo
          </Typography>
          <View
            style={{ flexDirection: "row", marginBottom: spacing.sm, gap: spacing.xs }}
          >
            <View style={{ flex: 1 }} />
            <Typography variant="caption" style={{ width: 72, textAlign: "center" }}>
              Free
            </Typography>
            <Typography
              variant="caption"
              color={theme.colors.premium}
              style={{ width: 88, textAlign: "center" }}
            >
              Premium
            </Typography>
          </View>
          {Object.keys(FREE_LIMITS).map((key) => (
            <View
              key={key}
              style={{
                flexDirection: "row",
                paddingVertical: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: theme.colors.surface,
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Typography variant="caption" style={{ flex: 1, flexShrink: 1 }}>
                {key}
              </Typography>
              <Typography variant="caption" style={{ width: 72, textAlign: "center" }}>
                {FREE_LIMITS[key as keyof typeof FREE_LIMITS]}
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.success}
                style={{ width: 88, textAlign: "center" }}
              >
                {PREMIUM_LIMITS[key as keyof typeof PREMIUM_LIMITS]}
              </Typography>
            </View>
          ))}
        </Card>

        {/* CTA */}
        {!isPremium ? (
          <Button
            title="Assinar Premium - R$ 19,90/mês"
            variant="premium"
            size="lg"
            onPress={() => {
              showPaywall("plans");
            }}
          />
        ) : (
          <Button
            title="Cancelar assinatura"
            variant="outline"
            size="lg"
            onPress={() => {
              Alert.alert(
                "Cancelar",
                "Funcionalidade disponível em breve. Entre em contato pelo suporte.",
              );
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
