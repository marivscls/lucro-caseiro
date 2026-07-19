import type { Insights } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { AppIcon } from "../shared/components/app-icon";
import type { AppIconName } from "../shared/components/app-icon";
import {
  Button,
  Card,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import insightsEmpty from "../assets/insights-empty.png";
import { MonthlyBars } from "../features/insights/components/monthly-bars";
import { RankBars, type RankRow } from "../features/insights/components/rank-bars";
import { formatMoney, monthOverMonthDelta } from "../features/insights/domain";
import { useInsights } from "../features/insights/hooks";
import { useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

function StatCard({
  label,
  value,
  icon,
  tint,
  iconColor,
  valueColor,
  horizontal,
}: Readonly<{
  label: string;
  value: string;
  icon: AppIconName;
  tint: string;
  iconColor: string;
  valueColor?: string;
  /** Layout compacto (ícone à esquerda) — evita card alto/vazio em largura cheia. */
  horizontal?: boolean;
}>) {
  const { theme } = useTheme();
  const iconCircle = (
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
      <AppIcon name={icon} size={22} color={iconColor} />
    </View>
  );
  const texts = (
    <>
      <Typography variant="label">{label}</Typography>
      <Typography
        variant="moneyLg"
        color={valueColor ?? theme.colors.text}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Typography>
    </>
  );

  if (horizontal) {
    return (
      <Card
        variant="surface"
        padding="lg"
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
      >
        {iconCircle}
        <View style={{ flex: 1, gap: 2 }}>{texts}</View>
      </Card>
    );
  }

  return (
    <Card variant="surface" padding="lg" style={{ flex: 1, gap: spacing.sm }}>
      {iconCircle}
      {texts}
    </Card>
  );
}

function SectionTitle({
  icon,
  title,
  tint,
  iconColor,
}: Readonly<{
  icon: AppIconName;
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
        <AppIcon name={icon} size={18} color={iconColor} />
      </View>
      <Typography variant="h3">{title}</Typography>
    </View>
  );
}

function ReportsPremiumTeaser({ onUpgrade }: Readonly<{ onUpgrade: () => void }>) {
  const { theme } = useTheme();
  return (
    <Card variant="surface" padding="xl" onPress={onUpgrade} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name="bar-chart" size={22} color={theme.colors.premium} />
        <Typography variant="h3" color={theme.colors.premium}>
          Relatórios completos
        </Typography>
      </View>
      <Typography variant="body" color={theme.colors.textSecondary}>
        Veja seu faturamento mês a mês, os produtos mais vendidos e seus melhores
        clientes.
      </Typography>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name="diamond-outline" size={18} color={theme.colors.premium} />
        <Typography variant="bodyBold" color={theme.colors.premium}>
          Desbloquear no Profissional
        </Typography>
      </View>
    </Card>
  );
}

function InsightsContent({
  data,
  isPremium,
  onUpgrade,
  months,
  onMonthsChange,
}: Readonly<{
  data: Insights;
  isPremium: boolean;
  onUpgrade: () => void;
  months: number;
  onMonthsChange: (months: number) => void;
}>) {
  const { theme } = useTheme();
  const averageTicket = data.totalSales > 0 ? data.totalRevenue / data.totalSales : 0;
  // Com o gráfico visível o total do período já aparece nele; o card vira
  // comparação mês a mês (só quando dá pra comparar — mês anterior > 0).
  const momDelta = isPremium ? monthOverMonthDelta(data.monthlyRevenue) : null;

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
      {isPremium && (
        <MonthlyBars
          series={data.monthlyRevenue}
          windowMonths={months}
          onWindowChange={onMonthsChange}
        />
      )}

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {momDelta !== null ? (
          <StatCard
            label="VS. MÊS ANTERIOR"
            value={`${momDelta >= 0 ? "+" : "-"}${Math.abs(momDelta).toFixed(0)}%`}
            icon={momDelta >= 0 ? "trending-up-outline" : "trending-down-outline"}
            tint={momDelta >= 0 ? theme.colors.successBg : `${theme.colors.alert}26`}
            iconColor={momDelta >= 0 ? theme.colors.success : theme.colors.alert}
            valueColor={momDelta >= 0 ? theme.colors.success : theme.colors.alert}
          />
        ) : (
          <StatCard
            label="FATURAMENTO"
            value={formatMoney(data.totalRevenue)}
            icon="cash-outline"
            tint={theme.colors.successBg}
            iconColor={theme.colors.success}
            valueColor={theme.colors.success}
          />
        )}
        <StatCard
          label="VENDAS"
          value={String(data.totalSales)}
          icon="receipt-outline"
          tint={theme.colors.surface}
          iconColor={theme.colors.textSecondary}
        />
      </View>
      <StatCard
        label="TICKET MÉDIO"
        value={formatMoney(averageTicket)}
        icon="pricetag-outline"
        tint={theme.colors.blueBg}
        iconColor={theme.colors.blue}
        horizontal
      />

      {isPremium ? (
        <>
          {productRows.length > 0 && (
            <Card variant="surface" padding="xl">
              <SectionTitle
                icon="flame-outline"
                title="Mais vendidos"
                tint={theme.colors.surface}
                iconColor={theme.colors.textSecondary}
              />
              <RankBars rows={productRows} color={theme.colors.primary} />
            </Card>
          )}

          {clientRows.length > 0 && (
            <Card variant="surface" padding="xl">
              <SectionTitle
                icon="trophy-outline"
                title="Melhores clientes"
                tint={theme.colors.surface}
                iconColor={theme.colors.textSecondary}
              />
              <RankBars rows={clientRows} color={theme.colors.success} />
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
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [months, setMonths] = useState<number>(12);
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "advancedReports");
  const showPaywall = usePaywall((s) => s.show);
  // Free vê só o mês atual ("básico mensal"); Premium escolhe a janela.
  const { data, isLoading } = useInsights(isPremium ? months : 1, !!profile);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {!isDesktop && <ScreenHeader title="Insights" />}

      {loadingProfile || isLoading ? (
        <View style={{ flex: 1, padding: spacing.xl, gap: spacing.lg }}>
          <Skeleton width="55%" height={22} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing["2xl"] + insets.bottom,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {data && data.totalSales > 0 ? (
            <InsightsContent
              data={data}
              isPremium={isPremium}
              onUpgrade={() => showPaywall("reports")}
              months={months}
              onMonthsChange={setMonths}
            />
          ) : (
            <EmptyState
              icon={
                <Image
                  source={insightsEmpty}
                  resizeMode="contain"
                  style={{ width: 146, height: 146 }}
                />
              }
              title="Ainda sem dados pra mostrar"
              description="Registre algumas vendas e volte aqui para ver seus gráficos e os campeões de venda."
              action={
                <Button
                  title="Adicionar venda"
                  icon={
                    <AppIcon
                      name="add-circle-outline"
                      size={20}
                      color={theme.colors.textOnPrimary}
                    />
                  }
                  onPress={() => router.push("/tabs/new-sale")}
                />
              }
              style={{ transform: [{ translateY: spacing["3xl"] }] }}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
