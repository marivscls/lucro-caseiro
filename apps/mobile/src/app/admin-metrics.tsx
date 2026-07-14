import type {
  ProductAnalyticsDashboard,
  RetentionMetric,
} from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import {
  Button,
  Card,
  EmptyState,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAdminAnalyticsDashboard } from "../features/analytics/hooks";
import { ApiError } from "../shared/utils/api-client";

function formatPercent(value: number | null): string {
  return value == null
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function MetricCard({
  label,
  value,
  caption,
  icon,
}: Readonly<{
  label: string;
  value: string | number;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
}>) {
  const { theme } = useTheme();
  return (
    <Card variant="elevated" padding="lg" style={{ flex: 1, gap: spacing.sm }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radii.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.primaryBg,
        }}
      >
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Typography variant="moneyLg" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Typography>
      <Typography variant="label">{label}</Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {caption}
      </Typography>
    </Card>
  );
}

function ActivityTable({
  data,
}: Readonly<{ data: ProductAnalyticsDashboard["active"] }>) {
  const { theme } = useTheme();
  const rows = [
    { label: "Hoje", installations: data.installations.day1, users: data.users.day1 },
    { label: "7 dias", installations: data.installations.day7, users: data.users.day7 },
    {
      label: "30 dias",
      installations: data.installations.day30,
      users: data.users.day30,
    },
  ];

  return (
    <Card variant="elevated" style={{ gap: spacing.md }}>
      <Typography variant="h3">Atividade recente</Typography>
      <View style={{ flexDirection: "row" }}>
        <Typography variant="caption" style={{ flex: 1 }} />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ width: 92, textAlign: "right" }}
        >
          Instalações
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ width: 72, textAlign: "right" }}
        >
          Contas
        </Typography>
      </View>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Typography variant="bodyBold" style={{ flex: 1 }}>
            {row.label}
          </Typography>
          <Typography variant="body" style={{ width: 92, textAlign: "right" }}>
            {row.installations}
          </Typography>
          <Typography variant="body" style={{ width: 72, textAlign: "right" }}>
            {row.users}
          </Typography>
        </View>
      ))}
    </Card>
  );
}

function RetentionRow({
  label,
  metric,
}: Readonly<{ label: string; metric: RetentionMetric }>) {
  const { theme } = useTheme();
  const percent = metric.percent ?? 0;
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${formatPercent(metric.percent)}, ${metric.retained} de ${metric.eligible}`}
      style={{ gap: spacing.sm }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Typography variant="bodyBold">{label}</Typography>
        <Typography variant="bodyBold" color={theme.colors.primary}>
          {formatPercent(metric.percent)}
        </Typography>
      </View>
      <View
        style={{
          height: 10,
          borderRadius: radii.full,
          overflow: "hidden",
          backgroundColor: theme.colors.primaryBg,
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${Math.min(100, Math.max(0, percent))}%`,
            borderRadius: radii.full,
            backgroundColor: theme.colors.primary,
          }}
        />
      </View>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {metric.retained} retornaram de {metric.eligible} instalações elegíveis
      </Typography>
    </View>
  );
}

function Dashboard({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  const linkedPercent = data.installations.total
    ? (data.installations.linkedToUser / data.installations.total) * 100
    : null;

  return (
    <View style={{ gap: spacing.lg }}>
      <View>
        <Typography variant="h1">Métricas do produto</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Instalação, ativação e retorno dos usuários.
        </Typography>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <MetricCard
          label="INSTALAÇÕES"
          value={data.installations.total}
          caption={`${data.installations.last7Days} nos últimos 7 dias`}
          icon="phone-portrait-outline"
        />
        <MetricCard
          label="CADASTROS"
          value={data.signups.total}
          caption={`${data.signups.last30Days} nos últimos 30 dias`}
          icon="person-add-outline"
        />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <MetricCard
          label="ATIVAÇÃO EM 7 DIAS"
          value={formatPercent(data.activation.rateWithin7DaysPercent)}
          caption={`${data.activation.activatedWithin7Days} de ${data.activation.eligibleWithin7Days} elegíveis`}
          icon="sparkles-outline"
        />
        <MetricCard
          label="VÍNCULO COM CONTA"
          value={formatPercent(linkedPercent)}
          caption={`${data.installations.linkedToUser} instalações identificadas`}
          icon="link-outline"
        />
      </View>

      <ActivityTable data={data.active} />

      <Card variant="elevated" style={{ gap: spacing.xl }}>
        <View style={{ gap: spacing.xs }}>
          <Typography variant="h3">Retenção por instalação</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Percentual que voltou exatamente após o primeiro uso.
          </Typography>
        </View>
        <RetentionRow label="D1 · dia seguinte" metric={data.retention.day1} />
        <RetentionRow label="D7 · uma semana" metric={data.retention.day7} />
        <RetentionRow label="D30 · um mês" metric={data.retention.day30} />
      </Card>

      <Card variant="surface" style={{ gap: spacing.sm }}>
        <Typography variant="bodyBold">Como a ativação é calculada</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          A primeira precificação, venda ou encomenda concluída conta como ativação. As
          taxas só usam grupos que já tiveram tempo suficiente para completar cada janela.
        </Typography>
      </Card>

      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ textAlign: "center" }}
      >
        Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
      </Typography>
    </View>
  );
}

export default function AdminMetricsScreen() {
  const { theme } = useTheme();
  const dashboard = useAdminAnalyticsDashboard();
  const forbidden = dashboard.error instanceof ApiError && dashboard.error.status === 403;
  const errorIcon = forbidden ? "lock-closed-outline" : "cloud-offline-outline";
  const errorTitle = forbidden ? "Acesso restrito" : "Não foi possível carregar";
  const errorDescription = forbidden
    ? "Esta conta não está autorizada a consultar as métricas internas."
    : "Confira sua conexão e tente novamente.";

  let content: React.ReactNode;
  if (dashboard.isLoading) {
    content = (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  } else if (dashboard.error || !dashboard.data) {
    content = (
      <EmptyState
        icon={<Ionicons name={errorIcon} size={52} color={theme.colors.textSecondary} />}
        title={errorTitle}
        description={errorDescription}
        action={
          <Button title="Tentar novamente" onPress={() => void dashboard.refetch()} />
        }
      />
    );
  } else {
    content = (
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing["4xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => void dashboard.refetch()}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Dashboard data={dashboard.data} />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["bottom"]}
    >
      <Stack.Screen options={{ title: "Métricas", headerBackTitle: "Voltar" }} />
      {content}
    </SafeAreaView>
  );
}
