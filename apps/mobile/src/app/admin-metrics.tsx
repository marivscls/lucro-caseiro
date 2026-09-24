import type {
  ProductAnalyticsDashboard,
  RetentionMetric,
} from "@lucro-caseiro/contracts";
import { AppIcon } from "../shared/components/app-icon";
import type { AppIconName } from "../shared/components/app-icon";
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
import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAdminAnalyticsDashboard } from "../features/analytics/hooks";
import { ListCard, ListCardItem } from "../shared/components/list-card";
import { ScreenHeader } from "../shared/components/screen-header";
import {
  Skeleton,
  SkeletonSummaryStrip,
  SkeletonList,
} from "../shared/components/skeleton";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import {
  DesktopGrid,
  DesktopStatRow,
  desktopCardStyle,
  desktopPageContent,
} from "../shared/layout/desktop-page";
import { ApiError } from "../shared/utils/api-client";

type DashboardSection = "overview" | "usage" | "funnel" | "retention";

const SECTIONS: { key: DashboardSection; label: string }[] = [
  { key: "overview", label: "Visão geral" },
  { key: "usage", label: "Telas e funções" },
  { key: "funnel", label: "Funil" },
  { key: "retention", label: "Retenção" },
];

const SCREEN_LABELS: Record<string, string> = {
  login: "Login",
  register: "Cadastro",
  auth_callback: "Retorno do login",
  // Chave de evento fixa, não uma credencial.
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  reset_password: "Redefinir senha",
  onboarding: "Primeiros passos",
  home: "Início",
  sales: "Vendas",
  new_sale: "Nova venda",
  agenda: "Agenda",
  clients: "Clientes",
  more: "Mais",
  admin_metrics: "Métricas",
  catalog: "Catálogo",
  fiado: "Fiado",
  finance: "Financeiro",
  insights: "Insights",
  labels: "Etiquetas",
  materials: "Insumos",
  packaging: "Embalagens",
  plans: "Planos",
  pricing: "Precificação",
  products: "Produtos",
  purchases: "Compras",
  quotes: "Orçamentos",
  recipes: "Receitas",
  recurring_expenses: "Gastos recorrentes",
  settings: "Configurações",
  suppliers: "Fornecedores",
  support: "Suporte",
};

const ACTION_LABELS: Record<string, string> = {
  signup_completed: "Cadastro concluído",
  pricing_started: "Precificação iniciada",
  pricing_completed: "Precificação concluída",
  product_created: "Produto criado",
  product_created_from_pricing: "Produto criado da precificação",
  sale_completed: "Venda concluída",
  order_created: "Encomenda criada",
  catalog_published: "Catálogo publicado",
  catalog_shared: "Catálogo compartilhado",
  quote_created: "Orçamento criado",
  quote_pdf_exported: "PDF de orçamento exportado",
  finance_entry_created: "Lançamento financeiro criado",
  plan_limit_reached: "Limite de plano atingido",
  paid_feature_requested: "Recurso pago solicitado",
  subscription_started: "Assinatura iniciada",
  subscription_completed: "Assinatura concluída",
  subscription_cancelled: "Assinatura cancelada",
  business_profile_completed: "Perfil do negócio respondido",
  business_profile_skipped: "Perfil do negócio pulado",
  plan_chosen: "Plano escolhido",
  purchase_result: "Resultado da compra",
  ad_impression: "Anúncio exibido",
  app_crashed: "Erro que derrubou a tela",
};

const FUNNEL_LABELS: Record<string, string> = {
  installation: "Instalação",
  signup: "Conta criada ou login",
  pricing: "Precificação",
  product: "Produto",
  catalog_or_sale: "Catálogo ou venda",
};

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
  icon: AppIconName;
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
        <AppIcon name={icon} size={20} color={theme.colors.primary} />
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

function OverviewSection({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const linkedPercent = data.installations.total
    ? (data.installations.linkedToUser / data.installations.total) * 100
    : null;

  return (
    <View style={{ gap: spacing.lg }}>
      {isDesktop ? null : (
        <>
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
              icon="checkmark-circle-outline"
            />
            <MetricCard
              label="VÍNCULO COM CONTA"
              value={formatPercent(linkedPercent)}
              caption={`${data.installations.linkedToUser} instalações identificadas`}
              icon="link-outline"
            />
          </View>
        </>
      )}

      <DesktopGrid minColumnWidth={400} maxColumns={2}>
        <ActivityTable data={data.active} />

        <Card variant="elevated" style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h3">Origem das instalações</Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Últimos 30 dias, pela campanha do link que abriu o app pela primeira vez.
            </Typography>
          </View>
          {data.acquisition.length === 0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Ainda não há instalações nos últimos 30 dias.
            </Typography>
          ) : null}
          {data.acquisition.map((item) => (
            <View
              key={`${item.source ?? "-"}:${item.content ?? "-"}`}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
            >
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">
                  {item.source ?? "Sem origem identificada"}
                </Typography>
                {item.content ? (
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {item.content}
                  </Typography>
                ) : null}
              </View>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {item.installations} · {item.linkedToUser} com conta
              </Typography>
            </View>
          ))}
        </Card>

        <Card variant="elevated" style={{ gap: spacing.md }}>
          <Typography variant="h3">Versões em uso</Typography>
          {data.versionAdoption.length === 0 ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              Ainda não há versões registradas nos últimos 30 dias.
            </Typography>
          ) : null}
          {data.versionAdoption.map((item) => (
            <View key={item.appVersion} style={{ flexDirection: "row" }}>
              <Typography variant="bodyBold" style={{ flex: 1 }}>
                Versão {item.appVersion}
              </Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {item.installations} · {formatPercent(item.percent)}
              </Typography>
            </View>
          ))}
        </Card>

        <Card variant="surface" style={{ gap: spacing.sm }}>
          <Typography variant="bodyBold">Como a ativação é calculada</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            A primeira precificação, venda ou encomenda concluída conta como ativação. As
            taxas só usam grupos que já tiveram tempo suficiente para completar cada
            janela.
          </Typography>
        </Card>
      </DesktopGrid>
    </View>
  );
}

function UsageSection({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <DesktopGrid minColumnWidth={400} maxColumns={2}>
        <ListCard
          variant="elevated"
          title="Telas com mais tempo ativo"
          subtitle="Últimos 30 dias; o tempo para quando o app fica em segundo plano."
        >
          {data.screenUsage.length === 0 ? (
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ paddingTop: spacing.md }}
            >
              Ainda não há visitas registradas nesta versão.
            </Typography>
          ) : null}
          {data.screenUsage.map((item, index) => (
            <ListCardItem
              key={item.screen}
              first={index === 0}
              style={{ gap: spacing.xs, paddingVertical: spacing.md }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Typography variant="bodyBold">
                  {index + 1}. {SCREEN_LABELS[item.screen] ?? item.screen}
                </Typography>
                <Typography variant="bodyBold" color={theme.colors.primary}>
                  {item.activeMinutes.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  min
                </Typography>
              </View>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {item.visits} visitas · {item.people} pessoas · média de{" "}
                {item.averageActiveSeconds.toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
                s
              </Typography>
            </ListCardItem>
          ))}
        </ListCard>

        <ListCard
          variant="elevated"
          title="Funcionalidades mais usadas"
          subtitle="Ações confirmadas pelo app nos últimos 30 dias."
        >
          {data.featureUsage.map((item, index) => (
            <ListCardItem
              key={item.action}
              first={index === 0}
              style={{ paddingVertical: spacing.md }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Typography variant="bodyBold" style={{ flex: 1 }}>
                  {ACTION_LABELS[item.action] ?? item.action}
                </Typography>
                <View style={{ alignItems: "flex-end" }}>
                  <Typography variant="bodyBold" color={theme.colors.primary}>
                    {item.events}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {item.people} pessoas
                  </Typography>
                </View>
              </View>
            </ListCardItem>
          ))}
        </ListCard>
      </DesktopGrid>
    </View>
  );
}

function FunnelSection({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  return (
    <Card variant="elevated" style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h3">Funil principal</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Instalação → conta → precificação → produto → venda, sempre nessa ordem.
        </Typography>
      </View>
      {data.funnel.map((item, index) => (
        <View key={item.stage} style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: radii.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.primaryBg,
            }}
          >
            <Typography variant="bodyBold" color={theme.colors.primary}>
              {index + 1}
            </Typography>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Typography variant="bodyBold">
              {FUNNEL_LABELS[item.stage] ?? item.stage}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {item.installations} instalações
            </Typography>
          </View>
          {item.previousStagePercent == null ? null : (
            <Typography variant="bodyBold" color={theme.colors.primary}>
              {formatPercent(item.previousStagePercent)}
            </Typography>
          )}
        </View>
      ))}
    </Card>
  );
}

function RetentionSection({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <DesktopGrid minColumnWidth={400} maxColumns={2}>
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

        <Card variant="elevated" style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h3">Retenção por comportamento</Typography>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Retorno no D7 de quem usou uma função importante na primeira semana.
            </Typography>
          </View>
          {data.behaviorRetention.map((item) => (
            <RetentionRow
              key={item.behavior}
              label={
                item.behavior === "pricing_completed"
                  ? "Fez uma precificação"
                  : "Compartilhou o catálogo"
              }
              metric={item}
            />
          ))}
        </Card>
      </DesktopGrid>
    </View>
  );
}

/** Abas das seções no desktop: controle segmentado com a largura do texto. */
function DesktopSectionTabs({
  section,
  onChange,
}: Readonly<{ section: DashboardSection; onChange: (next: DashboardSection) => void }>) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        desktopCardStyle(theme, { padding: 4 }),
        { flexDirection: "row", alignSelf: "flex-start", gap: 4 },
      ]}
    >
      {SECTIONS.map((item) => {
        const selected = section === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.key)}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.md,
              justifyContent: "center",
              backgroundColor: selected ? theme.colors.primaryInteractive : "transparent",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Typography
              variant="desktopBodyStrong"
              color={selected ? theme.colors.textOnPrimary : theme.colors.text}
            >
              {item.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function Dashboard({ data }: Readonly<{ data: ProductAnalyticsDashboard }>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [section, setSection] = useState<DashboardSection>("overview");
  let sectionContent: React.ReactNode = <OverviewSection data={data} />;
  if (section === "usage") sectionContent = <UsageSection data={data} />;
  if (section === "funnel") sectionContent = <FunnelSection data={data} />;
  if (section === "retention") sectionContent = <RetentionSection data={data} />;

  if (isDesktop) {
    const linkedPercent = data.installations.total
      ? (data.installations.linkedToUser / data.installations.total) * 100
      : null;
    return (
      <View style={{ gap: spacing["2xl"] }}>
        <DesktopStatRow
          items={[
            {
              label: "Instalações",
              value: String(data.installations.total),
              hint: `${data.installations.last7Days} nos últimos 7 dias`,
            },
            {
              label: "Cadastros",
              value: String(data.signups.total),
              hint: `${data.signups.last30Days} nos últimos 30 dias`,
            },
            {
              label: "Ativação em 7 dias",
              value: formatPercent(data.activation.rateWithin7DaysPercent),
              hint: `${data.activation.activatedWithin7Days} de ${data.activation.eligibleWithin7Days} elegíveis`,
            },
            {
              label: "Vínculo com conta",
              value: formatPercent(linkedPercent),
              hint: `${data.installations.linkedToUser} instalações identificadas`,
            },
          ]}
        />
        <DesktopSectionTabs section={section} onChange={setSection} />
        {sectionContent}
        <Typography variant="desktopMeta">
          Atualizado em {new Date(data.generatedAt).toLocaleString("pt-BR")}
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Instalação, uso, conversão e retorno dos usuários.
        </Typography>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {SECTIONS.map((item) => {
          const selected = section === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setSection(item.key)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                maxWidth: "100%",
                minHeight: 44,
                justifyContent: "center",
                borderRadius: radii.full,
                backgroundColor: selected
                  ? theme.colors.primary
                  : theme.colors.surfaceElevated,
              }}
            >
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.textOnPrimary : theme.colors.text}
              >
                {item.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {sectionContent}
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
  const isDesktop = useDesktopLayout();
  const dashboard = useAdminAnalyticsDashboard();
  const forbidden = dashboard.error instanceof ApiError && dashboard.error.status === 403;
  const errorIcon = forbidden ? "lock-closed-outline" : "cloud-offline-outline";
  const errorTitle = forbidden ? "Acesso restrito" : "Não foi possível carregar";
  const errorDescription = forbidden
    ? "Esta conta não está autorizada a consultar as métricas internas."
    : "Confira sua conexão e tente novamente.";

  if (isDesktop) {
    let desktopContent: React.ReactNode;
    if (dashboard.isLoading)
      desktopContent = (
        <View style={{ gap: spacing.lg }}>
          <SkeletonSummaryStrip tiles={4} />
          <SkeletonList rows={4} variant="amount" />
        </View>
      );
    else if (dashboard.error || !dashboard.data)
      desktopContent = (
        <View
          style={{
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: theme.colors.border,
            borderRadius: radii.lg,
            paddingVertical: spacing["3xl"],
            paddingHorizontal: spacing["2xl"],
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xl,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={errorIcon} size={26} color={theme.colors.primaryStrong} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="desktopCardTitle">{errorTitle}</Typography>
            <Typography variant="desktopBody">{errorDescription}</Typography>
          </View>
          <Button
            title="Tentar novamente"
            variant="secondary"
            onPress={() => void dashboard.refetch()}
            style={{ minWidth: 160, minHeight: 48 }}
          />
        </View>
      );
    else desktopContent = <Dashboard data={dashboard.data} />;

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[desktopPageContent(true), { gap: 0 }]}
        >
          <ScreenHeader
            title="Métricas do produto"
            subtitle="Instalação, uso, conversão e retorno dos usuários."
            hideBack
          />
          {desktopContent}
        </ScrollView>
      </SafeAreaView>
    );
  }

  let content: React.ReactNode;
  if (dashboard.isLoading) {
    content = (
      <View
        style={{
          flex: 1,
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
          paddingVertical: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Skeleton width="45%" height={18} />
        <SkeletonSummaryStrip tiles={3} />
        <SkeletonList rows={4} variant="amount" />
      </View>
    );
  } else if (dashboard.error || !dashboard.data) {
    content = (
      <EmptyState
        icon={<AppIcon name={errorIcon} size={52} color={theme.colors.textSecondary} />}
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
        contentContainerStyle={{
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
          paddingTop: spacing.xl,
          paddingBottom: spacing["4xl"],
        }}
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
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Métricas do produto" hideBack={isDesktop} />
      {content}
    </SafeAreaView>
  );
}
