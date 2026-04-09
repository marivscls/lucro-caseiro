import { Button, Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBirthdays } from "../../features/clients/hooks";
import { useFinanceSummary } from "../../features/finance/hooks";
import { useTodaySummary } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useProfile } from "../../features/subscription/hooks";
import { usePaywall } from "../../shared/hooks/use-paywall";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getMonthName(): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[new Date().getMonth()] ?? "";
}

function getFormattedDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = getMonthName().toLowerCase();
  const year = now.getFullYear();
  const weekdays = [
    "Domingo",
    "Segunda-feira",
    "Terca-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sabado",
  ];
  const weekday = weekdays[now.getDay()];
  return `${weekday}, ${day} de ${month} ${year}`;
}

function AvatarCircle({ name, color }: Readonly<{ name: string; color: string }>) {
  const { theme } = useTheme();
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
        {initial}
      </Typography>
    </View>
  );
}

function _RecentOrderItem({
  name,
  amount,
}: Readonly<{
  name: string;
  amount: number;
}>) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radii.md,
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption">{name.charAt(0).toUpperCase()}</Typography>
        </View>
        <Typography variant="bodyBold">{name}</Typography>
      </View>
      <Typography variant="bodyBold" color={theme.colors.success}>
        R$ {amount.toFixed(2).replace(".", ",")}
      </Typography>
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((s) => s.show);
  const { data: todaySummary, isLoading: loadingSales } = useTodaySummary();
  const { data: financeSummary, isLoading: loadingFinance } = useFinanceSummary();
  const { data: birthdays } = useBirthdays();

  const monthName = getMonthName();
  const isLoading = loadingSales || loadingFinance;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["5xl"],
          gap: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: spacing.md,
          }}
        >
          <View>
            <Typography variant="h1" serif>
              Hoje
            </Typography>
            <Typography variant="caption" style={{ marginTop: spacing.xs }}>
              {getFormattedDate()}
            </Typography>
          </View>
          <AvatarCircle name={profile?.name ?? ""} color={theme.colors.primary} />
        </View>

        <LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />

        {/* Quick action buttons */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Venda"
              variant="primary"
              size="md"
              onPress={() => router.push("/tabs/new-sale")}
              style={{ borderRadius: radii.xl }}
              icon={
                <Ionicons
                  name="cart-outline"
                  size={18}
                  color={theme.colors.textOnPrimary}
                />
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Cliente"
              variant="secondary"
              size="md"
              onPress={() => router.push("/tabs/clients")}
              style={{ borderRadius: radii.xl }}
              icon={
                <Ionicons name="person-add-outline" size={18} color={theme.colors.text} />
              }
            />
          </View>
        </View>

        {/* Quick access - horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}
        >
          {[
            {
              icon: "wallet-outline" as const,
              label: "Financeiro",
              route: "/finance" as const,
            },
            {
              icon: "cube-outline" as const,
              label: "Produtos",
              route: "/products" as const,
            },
            {
              icon: "document-text-outline" as const,
              label: "Receitas",
              route: "/recipes" as const,
            },
            {
              icon: "calculator-outline" as const,
              label: "Precificacao",
              route: "/pricing" as const,
            },
            {
              icon: "gift-outline" as const,
              label: "Embalagens",
              route: "/packaging" as const,
            },
            {
              icon: "pricetag-outline" as const,
              label: "Rotulos",
              route: "/labels" as const,
            },
            {
              icon: "diamond-outline" as const,
              label: "Planos",
              route: "/plans" as const,
            },
            {
              icon: "settings-outline" as const,
              label: "Config",
              route: "/settings" as const,
            },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route)}
              style={{ alignItems: "center", width: 80, gap: spacing.sm }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: radii.xl,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={28} color={theme.colors.primary} />
              </View>
              <Typography
                variant="caption"
                style={{ textAlign: "center" }}
                numberOfLines={1}
              >
                {item.label}
              </Typography>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["2xl"] }}
          />
        ) : (
          <>
            {/* Vendas de Hoje card */}
            <Card variant="surface" padding="xl">
              <Typography variant="label" style={{ marginBottom: spacing.sm }}>
                VENDAS DE HOJE
              </Typography>
              <Typography variant="moneyHero">
                {formatCurrency(todaySummary?.totalAmount ?? 0)}
              </Typography>
              <Typography variant="caption" style={{ marginTop: spacing.xs }}>
                {todaySummary?.totalSales ?? 0} venda(s) registrada(s)
              </Typography>
            </Card>

            {/* Monthly financial card */}
            <Card variant="surface" padding="xl">
              <Typography variant="h2" serif style={{ marginBottom: spacing.lg }}>
                {monthName}
              </Typography>

              <View style={{ gap: spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body">Entradas</Typography>
                  <Typography variant="bodyBold" color={theme.colors.success}>
                    + {formatCurrency(financeSummary?.totalIncome ?? 0)}
                  </Typography>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body">Saidas</Typography>
                  <Typography variant="bodyBold" color={theme.colors.alert}>
                    - {formatCurrency(financeSummary?.totalExpenses ?? 0)}
                  </Typography>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.surfaceElevated,
                    marginVertical: spacing.xs,
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body">Lucro</Typography>
                  <Typography
                    variant="moneyLg"
                    color={
                      (financeSummary?.profit ?? 0) >= 0
                        ? theme.colors.success
                        : theme.colors.alert
                    }
                  >
                    {formatCurrency(financeSummary?.profit ?? 0)}
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Birthdays */}
            {birthdays && birthdays.length > 0 && (
              <Card
                variant="surface"
                padding="xl"
                style={{ borderLeftWidth: 3, borderLeftColor: theme.colors.premium }}
              >
                <Typography
                  variant="h3"
                  color={theme.colors.premium}
                  style={{ marginBottom: spacing.sm }}
                >
                  Aniversariantes do mes
                </Typography>
                {birthdays.map((client) => (
                  <Typography
                    key={client.id}
                    variant="body"
                    color={theme.colors.text}
                    style={{ marginTop: spacing.xs }}
                  >
                    {client.name} — {client.birthday}
                  </Typography>
                ))}
              </Card>
            )}

            {/* Recent orders placeholder */}
            <View>
              <Typography variant="h2" serif style={{ marginBottom: spacing.lg }}>
                Pedidos Recentes
              </Typography>
              <Card variant="surface" padding="lg">
                <View
                  style={{
                    paddingVertical: spacing["2xl"],
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body">Nenhum pedido recente</Typography>
                </View>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
