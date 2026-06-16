import { Button, Card, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProfile, useLimits } from "../features/subscription/hooks";
import { showAlert } from "../shared/components/alert-store";
import { usePaywall } from "../shared/hooks/use-paywall";

const FREE_LIMITS = {
  "Vendas/mês": "200/mês",
  Clientes: "20",
  Produtos: "20",
  Receitas: "5",
  Embalagens: "3",
  Rótulos: "1 template",
  "Catálogo público": "5 produtos",
  Relatórios: "Básico mensal",
  Exportação: "Não",
};

const PREMIUM_LIMITS = {
  "Vendas/mês": "Ilimitado",
  Clientes: "Ilimitado",
  Produtos: "Ilimitado",
  Receitas: "Ilimitado",
  Embalagens: "Ilimitado",
  Rótulos: "Ilimitado",
  "Catálogo público": "Ilimitado + visual",
  Relatórios: "Completo + gráficos",
  Exportação: "PDF/Excel",
};

const PREMIUM_BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: "infinite", text: "Vendas, clientes e receitas ilimitados" },
  { icon: "bar-chart", text: "Relatórios completos com gráficos" },
  { icon: "download-outline", text: "Exportação em PDF e Excel" },
];

export default function PlansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);
  const isPremium = profile?.plan === "premium";

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
            <Typography variant="body" color={theme.colors.textSecondary}>
              Válido até {new Date(profile.planExpiresAt).toLocaleDateString("pt-BR")}
            </Typography>
          )}
        </Card>

        {/* Usage */}
        {limits && !isPremium && (
          <Card>
            <Typography variant="h3" style={{ marginBottom: spacing.md }}>
              Seu uso atual
            </Typography>
            <View style={{ gap: spacing.md }}>
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
                  label: "Produtos",
                  current: limits.currentProducts,
                  max: limits.maxProducts,
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
              ]
                .filter((item) => Number.isFinite(item.max))
                .map((item) => {
                  const pct = Math.min((item.current / item.max) * 100, 100);
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
                          {item.current}/{item.max}
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

        {/* Comparison table */}
        <Card>
          <Typography variant="h3" style={{ marginBottom: spacing.md }}>
            Comparativo
          </Typography>
          <View
            style={{ flexDirection: "row", marginBottom: spacing.sm, gap: spacing.sm }}
          >
            <View style={{ flex: 1.3 }} />
            <Typography
              variant="bodyBold"
              style={{ flex: 1, textAlign: "center", fontSize: 15 }}
            >
              Free
            </Typography>
            <Typography
              variant="bodyBold"
              color={theme.colors.premium}
              style={{ flex: 1, textAlign: "center", fontSize: 15 }}
            >
              Premium
            </Typography>
          </View>
          {Object.keys(FREE_LIMITS).map((key) => (
            <View
              key={key}
              style={{
                flexDirection: "row",
                paddingVertical: spacing.md,
                borderTopWidth: 1,
                borderTopColor: theme.colors.surface,
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Typography
                variant="bodyBold"
                color={theme.colors.text}
                style={{ flex: 1.3, fontSize: 15 }}
              >
                {key}
              </Typography>
              <Typography
                variant="body"
                color={theme.colors.textSecondary}
                style={{ flex: 1, textAlign: "center", fontSize: 14 }}
              >
                {FREE_LIMITS[key as keyof typeof FREE_LIMITS]}
              </Typography>
              <Typography
                variant="bodyBold"
                color={theme.colors.success}
                style={{ flex: 1, textAlign: "center", fontSize: 14 }}
              >
                {PREMIUM_LIMITS[key as keyof typeof PREMIUM_LIMITS]}
              </Typography>
            </View>
          ))}
        </Card>

        {/* Benefits + CTA */}
        {!isPremium ? (
          <View style={{ gap: spacing.lg }}>
            <Card style={{ gap: spacing.md, backgroundColor: theme.colors.premiumBg }}>
              <Typography variant="h3" color={theme.colors.premium}>
                Vantagens do Premium
              </Typography>
              {PREMIUM_BENEFITS.map((b) => (
                <View
                  key={b.text}
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
                >
                  <Ionicons name={b.icon} size={22} color={theme.colors.premium} />
                  <Typography
                    variant="body"
                    color={theme.colors.text}
                    style={{ flex: 1, fontSize: 15 }}
                  >
                    {b.text}
                  </Typography>
                </View>
              ))}
            </Card>
            <Button
              title="Assinar Premium - R$ 19,90/mês"
              variant="premium"
              size="lg"
              onPress={() => {
                showPaywall("plans");
              }}
            />
          </View>
        ) : (
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
