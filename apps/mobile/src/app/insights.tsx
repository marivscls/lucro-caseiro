import type { Insights } from "@lucro-caseiro/contracts";
import {
  Card,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MonthlyBars } from "../features/insights/components/monthly-bars";
import { RankBars, type RankRow } from "../features/insights/components/rank-bars";
import { formatMoney } from "../features/insights/domain";
import { useInsights } from "../features/insights/hooks";
import { useProfile } from "../features/subscription/hooks";
import { Illustration } from "../shared/components/illustrations";
import { usePaywall } from "../shared/hooks/use-paywall";

const WINDOWS = [3, 6, 12] as const;

function StatCard({
  label,
  value,
  icon,
  tint,
  iconColor,
  valueColor,
}: Readonly<{
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  iconColor: string;
  valueColor?: string;
}>) {
  const { theme } = useTheme();
  return (
    <Card variant="surface" padding="lg" style={{ flex: 1, gap: spacing.sm }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.full,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Typography variant="label">{label}</Typography>
      <Typography
        variant="moneyLg"
        color={valueColor ?? theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={{ fontSize: 26 }}
      >
        {value}
      </Typography>
    </Card>
  );
}

function SectionTitle({
  icon,
  title,
  tint,
  iconColor,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tint: string;
  iconColor: string;
}>) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radii.full,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Typography variant="h3">{title}</Typography>
    </View>
  );
}

function WindowSelector({
  months,
  onChange,
}: Readonly<{ months: number; onChange: (m: number) => void }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      {WINDOWS.map((w) => {
        const active = months === w;
        return (
          <Pressable
            key={w}
            onPress={() => onChange(w)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Últimos ${w} meses`}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 42,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: spacing.lg,
              borderRadius: radii.full,
              backgroundColor: active ? theme.colors.primary : theme.colors.surface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              variant="bodyBold"
              color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
              style={{ fontSize: 14 }}
            >
              {w} meses
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function ReportsPremiumTeaser({ onUpgrade }: Readonly<{ onUpgrade: () => void }>) {
  const { theme } = useTheme();
  return (
    <Card variant="surface" padding="xl" onPress={onUpgrade} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Ionicons name="bar-chart" size={22} color={theme.colors.premium} />
        <Typography variant="h3" color={theme.colors.premium}>
          Relatórios completos
        </Typography>
      </View>
      <Typography variant="body" color={theme.colors.textSecondary}>
        Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores
        clientes.
      </Typography>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Ionicons name="diamond-outline" size={18} color={theme.colors.premium} />
        <Typography variant="bodyBold" color={theme.colors.premium}>
          Desbloquear no Premium
        </Typography>
      </View>
    </Card>
  );
}

function InsightsContent({
  data,
  isPremium,
  onUpgrade,
}: Readonly<{ data: Insights; isPremium: boolean; onUpgrade: () => void }>) {
  const { theme } = useTheme();
  const averageTicket = data.totalSales > 0 ? data.totalRevenue / data.totalSales : 0;

  const productRows: RankRow[] = data.topProducts.map((p) => ({
    key: p.productId,
    label: p.name,
    caption: `${p.quantity} un.`,
    value: p.quantity,
  }));

  const clientRows: RankRow[] = data.topClients.map((c) => ({
    key: c.clientId,
    label: c.name,
    caption: formatMoney(c.totalSpent),
    value: c.totalSpent,
  }));

  return (
    <>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <StatCard
          label="FATURAMENTO"
          value={formatMoney(data.totalRevenue)}
          icon="cash-outline"
          tint={theme.colors.successBg}
          iconColor={theme.colors.success}
          valueColor={theme.colors.success}
        />
        <StatCard
          label="VENDAS"
          value={String(data.totalSales)}
          icon="receipt-outline"
          tint={`${theme.colors.primary}26`}
          iconColor={theme.colors.primary}
        />
      </View>
      <StatCard
        label="TICKET MÉDIO"
        value={formatMoney(averageTicket)}
        icon="pricetag-outline"
        tint={theme.colors.blueBg}
        iconColor={theme.colors.blue}
      />

      {isPremium ? (
        <>
          <Card variant="surface" padding="xl">
            <SectionTitle
              icon="bar-chart-outline"
              title="Faturamento por mês"
              tint={`${theme.colors.primary}26`}
              iconColor={theme.colors.primary}
            />
            <MonthlyBars series={data.monthlyRevenue} />
          </Card>

          {productRows.length > 0 && (
            <Card variant="surface" padding="xl">
              <SectionTitle
                icon="flame-outline"
                title="Mais vendidos"
                tint={`${theme.colors.primary}26`}
                iconColor={theme.colors.primary}
              />
              <RankBars rows={productRows} color={theme.colors.primary} />
            </Card>
          )}

          {clientRows.length > 0 && (
            <Card variant="surface" padding="xl">
              <SectionTitle
                icon="trophy-outline"
                title="Melhores clientes"
                tint={theme.colors.premiumBg}
                iconColor={theme.colors.premium}
              />
              <RankBars rows={clientRows} color={theme.colors.premium} />
            </Card>
          )}
        </>
      ) : (
        <ReportsPremiumTeaser onUpgrade={onUpgrade} />
      )}
    </>
  );
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [months, setMonths] = useState<number>(6);
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  const showPaywall = usePaywall((s) => s.show);
  // Free vê só o mês atual ("básico mensal"); Premium escolhe a janela.
  const { data, isLoading } = useInsights(isPremium ? months : 1);

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
          Insights
        </Typography>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing["2xl"] + insets.bottom,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {isPremium && <WindowSelector months={months} onChange={setMonths} />}

          {data && data.totalSales > 0 ? (
            <InsightsContent
              data={data}
              isPremium={isPremium}
              onUpgrade={() => showPaywall("reports")}
            />
          ) : (
            <EmptyState
              icon={<Illustration name="chart" />}
              title="Ainda sem dados pra mostrar"
              description="Registre algumas vendas e volte aqui para ver seus gráficos e os campeões de venda."
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
