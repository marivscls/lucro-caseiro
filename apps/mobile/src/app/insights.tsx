import type { Insights } from "@lucro-caseiro/contracts";
import {
  Card,
  EmptyState,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MonthlyBars } from "../features/insights/components/monthly-bars";
import { RankBars, type RankRow } from "../features/insights/components/rank-bars";
import { formatMoney } from "../features/insights/domain";
import { useInsights } from "../features/insights/hooks";

const WINDOWS = [3, 6, 12] as const;

function StatCard({
  label,
  value,
  color,
}: Readonly<{ label: string; value: string; color?: string }>) {
  const { theme } = useTheme();
  return (
    <Card variant="surface" padding="lg" style={{ flex: 1 }}>
      <Typography variant="label" style={{ marginBottom: spacing.xs }}>
        {label}
      </Typography>
      <Typography variant="moneyLg" color={color ?? theme.colors.text}>
        {value}
      </Typography>
    </Card>
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
            accessibilityLabel={`Últimos ${w} meses`}
            style={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: active ? theme.colors.primary : theme.colors.surface,
            }}
          >
            <Typography
              variant="caption"
              color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
            >
              {w} meses
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function InsightsContent({ data }: Readonly<{ data: Insights }>) {
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
          color={theme.colors.success}
        />
        <StatCard label="VENDAS" value={String(data.totalSales)} />
      </View>
      <StatCard label="TICKET MÉDIO" value={formatMoney(averageTicket)} />

      <Card variant="surface" padding="xl">
        <Typography variant="h3" style={{ marginBottom: spacing.lg }}>
          Faturamento por mês
        </Typography>
        <MonthlyBars series={data.monthlyRevenue} />
      </Card>

      {productRows.length > 0 && (
        <Card variant="surface" padding="xl">
          <Typography variant="h3" style={{ marginBottom: spacing.lg }}>
            Mais vendidos
          </Typography>
          <RankBars rows={productRows} color={theme.colors.primary} />
        </Card>
      )}

      {clientRows.length > 0 && (
        <Card variant="surface" padding="xl">
          <Typography variant="h3" style={{ marginBottom: spacing.lg }}>
            Melhores clientes
          </Typography>
          <RankBars rows={clientRows} color={theme.colors.premium} />
        </Card>
      )}
    </>
  );
}

export default function InsightsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [months, setMonths] = useState<number>(6);
  const { data, isLoading } = useInsights(months);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["2xl"] + insets.bottom,
        gap: spacing.xl,
      }}
    >
      <WindowSelector months={months} onChange={setMonths} />

      {data && data.totalSales > 0 ? (
        <InsightsContent data={data} />
      ) : (
        <EmptyState
          title="Ainda sem dados pra mostrar"
          description="Registre algumas vendas e volte aqui para ver seus gráficos e os campeões de venda."
        />
      )}
    </ScrollView>
  );
}
