import type { Insights, Product } from "@lucro-caseiro/contracts";
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
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  MonthlyBars,
  StatPanel,
  monthWithYear,
} from "../features/insights/components/monthly-bars";
import { RankBars, type RankRow } from "../features/insights/components/rank-bars";
import {
  answerInsightQuestion,
  buildActionableInsights,
  formatMoney,
  formatMoneyShort,
  monthOverMonthDelta,
  type InsightActionTarget,
  type InsightQuestionId,
} from "../features/insights/domain";
import { useInsights } from "../features/insights/hooks";
import { displayProductName } from "../features/products/display";
import { useAllProducts } from "../features/products/hooks";
import { useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ScreenHeader } from "../shared/components/screen-header";
import {
  Skeleton,
  SkeletonCard,
  SkeletonSummaryStrip,
} from "../shared/components/skeleton";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";

function MiniStatCard({
  label,
  value,
  icon,
  tint,
  iconColor,
  valueColor,
}: Readonly<{
  label: string;
  value: string;
  icon: AppIconName;
  tint: string;
  iconColor: string;
  valueColor?: string;
}>) {
  return (
    <Card
      variant="surface"
      padding="sm"
      style={{ flex: 1, alignItems: "center", gap: spacing.xs, minHeight: 96 }}
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
      <View style={{ alignItems: "center", gap: 1 }}>
        <Typography
          variant="label"
          numberOfLines={2}
          style={{ fontSize: 11, textAlign: "center", lineHeight: 13 }}
        >
          {label}
        </Typography>
        <Typography
          variant="money"
          color={valueColor ?? "text"}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          style={{ textAlign: "center" }}
        >
          {value}
        </Typography>
      </View>
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
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radii.full,
          backgroundColor: tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={16} color={iconColor} />
      </View>
      <Typography variant="h3" style={{ fontSize: 17 }}>
        {title}
      </Typography>
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
          Insights completos
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
  products,
  isPremium,
  onUpgrade,
  months,
  onMonthsChange,
}: Readonly<{
  data: Insights;
  products: Product[];
  isPremium: boolean;
  onUpgrade: () => void;
  months: number;
  onMonthsChange: (months: number) => void;
}>) {
  const { theme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const averageTicket = data.totalSales > 0 ? data.totalRevenue / data.totalSales : 0;
  const momDelta = isPremium ? monthOverMonthDelta(data.monthlyRevenue) : null;
  const variationUp = momDelta !== null && momDelta >= 0;
  let variationValue = formatMoney(data.totalRevenue);
  if (momDelta !== null) {
    const sign = variationUp ? "+" : "-";
    variationValue = `${sign}${Math.abs(momDelta).toFixed(0)}%`;
  }
  let variationIcon: AppIconName = "cash-outline";
  if (momDelta !== null) {
    variationIcon = variationUp ? "trending-up-outline" : "trending-down-outline";
  }
  const variationColor =
    momDelta === null || variationUp ? theme.colors.success : theme.colors.alert;
  const variationTint = `${variationColor}24`;

  const productRows: RankRow[] = data.topProducts.map((p) => ({
    key: p.productId,
    label: displayProductName(p.name),
    caption: `${p.quantity} un.`,
    value: p.quantity,
  }));

  const clientRows: RankRow[] = data.topClients.map((c) => ({
    key: c.clientId,
    label: c.name,
    caption: formatMoney(c.totalSpent),
    value: c.totalSpent,
  }));
  const actionable = buildActionableInsights(data, products);
  const [selectedQuestion, setSelectedQuestion] = useState<InsightQuestionId | null>(
    null,
  );

  // Stats do gráfico
  const nonEmpty = data.monthlyRevenue.filter((m) => m.revenue > 0);
  const total = data.monthlyRevenue.reduce((acc, m) => acc + m.revenue, 0);
  const average = nonEmpty.length > 0 ? total / nonEmpty.length : 0;
  const best = data.monthlyRevenue.reduce(
    (acc, m) => (m.revenue > acc.revenue ? m : acc),
    data.monthlyRevenue[0] ?? { month: "", revenue: 0 },
  );

  function openAction(target: InsightActionTarget) {
    if (target === "finance") router.push("/finance");
    else if (target === "products") router.push("/products");
    else if (target === "clients") router.push("/tabs/clients");
    else router.push("/tabs/new-sale");
  }

  // Rankings: empilhados no mobile (< 700px), lado a lado no desktop
  const rankingsRow = width >= 700;

  return (
    <>
      {/* 1. Gráfico principal */}
      {isPremium && (
        <MonthlyBars
          series={data.monthlyRevenue}
          windowMonths={months}
          onWindowChange={onMonthsChange}
        />
      )}

      {/* 2. Stats do gráfico — separados, fora do card */}
      {isPremium && (
        <View
          style={{
            flexDirection: "row",
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.xl,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          <StatPanel
            icon="trophy-outline"
            label="Maior faturamento"
            value={formatMoneyShort(best.revenue)}
            caption={best.month ? monthWithYear(best.month) : "Sem vendas"}
            tint={theme.colors.primary}
            theme={theme}
          />
          <View
            style={{
              width: 1,
              marginVertical: spacing.md,
              backgroundColor: theme.colors.border,
            }}
          />
          <StatPanel
            icon="trending-up-outline"
            label="Média mensal"
            value={formatMoneyShort(average)}
            caption={`Últimos ${months} meses`}
            tint={theme.colors.success}
            theme={theme}
          />
        </View>
      )}

      {/* 3. Mini stats — grid compacto */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <MiniStatCard
          label={momDelta !== null ? "Variação" : "Faturamento"}
          value={variationValue}
          icon={variationIcon}
          tint={variationTint}
          iconColor={variationColor}
          valueColor={variationColor}
        />
        <MiniStatCard
          label="Vendas"
          value={String(data.totalSales)}
          icon="receipt-outline"
          tint={`${theme.colors.textSecondary}14`}
          iconColor={theme.colors.textSecondary}
        />
        <MiniStatCard
          label="Ticket médio"
          value={formatMoney(averageTicket)}
          icon="pricetag-outline"
          tint={`${theme.colors.blue}20`}
          iconColor={theme.colors.blue}
        />
      </View>

      {/* 4. Ações prioritárias — o que fazer agora */}
      {isPremium ? (
        <>
          {actionable.length > 0 && (
            <Card variant="surface" padding="lg">
              <SectionTitle
                icon="sparkles-outline"
                title="O que fazer agora"
                tint={theme.colors.primaryBg}
                iconColor={theme.colors.primaryStrong}
              />
              <View style={{ gap: spacing.md }}>
                {actionable.map((action) => (
                  <Pressable
                    key={action.id}
                    onPress={() => openAction(action.target)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surfaceElevated,
                      padding: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      opacity: pressed ? 0.78 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radii.full,
                        backgroundColor:
                          action.tone === "attention"
                            ? `${theme.colors.alert}18`
                            : `${theme.colors.primary}18`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AppIcon
                        name={
                          action.tone === "attention" ? "warning-outline" : "bulb-outline"
                        }
                        size={18}
                        color={
                          action.tone === "attention"
                            ? theme.colors.alert
                            : theme.colors.primary
                        }
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography
                        variant="label"
                        color={
                          action.tone === "attention"
                            ? theme.colors.alert
                            : theme.colors.primaryStrong
                        }
                      >
                        {action.tone === "attention" ? "ATENÇÃO" : "OPORTUNIDADE"}
                      </Typography>
                      <Typography variant="bodyBold">{action.title}</Typography>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        {action.description}
                      </Typography>
                    </View>
                    <AppIcon
                      name="chevron-forward"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          {/* 5. Rankings — empilhados no mobile, lado a lado no desktop */}
          <View
            style={{
              flexDirection: rankingsRow ? "row" : "column",
              gap: rankingsRow ? spacing.lg : spacing.md,
            }}
          >
            {productRows.length > 0 && (
              <View style={{ flex: rankingsRow ? 1 : undefined, minWidth: 0 }}>
                <Card variant="surface" padding="lg">
                  <SectionTitle
                    icon="flame-outline"
                    title="Mais vendidos"
                    tint={`${theme.colors.textSecondary}14`}
                    iconColor={theme.colors.textSecondary}
                  />
                  <RankBars rows={productRows} color={theme.colors.primary} />
                </Card>
              </View>
            )}

            {clientRows.length > 0 && (
              <View style={{ flex: rankingsRow ? 1 : undefined, minWidth: 0 }}>
                <Card variant="surface" padding="lg">
                  <SectionTitle
                    icon="trophy-outline"
                    title="Melhores clientes"
                    tint={`${theme.colors.textSecondary}14`}
                    iconColor={theme.colors.textSecondary}
                  />
                  <RankBars rows={clientRows} color={theme.colors.success} />
                </Card>
              </View>
            )}
          </View>

          {/* 6. Perguntas rápidas — bônus no final */}
          <Card variant="surface" padding="lg">
            <SectionTitle
              icon="help-circle-outline"
              title="Perguntas rápidas"
              tint={`${theme.colors.textSecondary}14`}
              iconColor={theme.colors.textSecondary}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Respostas calculadas somente com estoque, custos e vendas cadastrados.
            </Typography>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginTop: spacing.md,
              }}
            >
              {[
                { id: "restock" as const, label: "O que devo repor?" },
                { id: "margin" as const, label: "Onde estou perdendo margem?" },
              ].map((question) => (
                <Pressable
                  key={question.id}
                  onPress={() =>
                    setSelectedQuestion(
                      selectedQuestion === question.id ? null : question.id,
                    )
                  }
                  accessibilityRole="button"
                  style={{
                    minHeight: 40,
                    justifyContent: "center",
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor:
                      selectedQuestion === question.id
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      selectedQuestion === question.id
                        ? theme.colors.primaryBg
                        : theme.colors.surfaceElevated,
                  }}
                >
                  <Typography variant="captionBold">{question.label}</Typography>
                </Pressable>
              ))}
            </View>
            {selectedQuestion ? (
              <View
                style={{
                  marginTop: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.md,
                }}
              >
                <Typography variant="body">
                  {answerInsightQuestion(selectedQuestion, data, products)}
                </Typography>
              </View>
            ) : null}
          </Card>
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
  const insightsQuery = useInsights(isPremium ? months : 1, !!profile);
  const { data, isLoading, error } = insightsQuery;
  const { data: products = [] } = useAllProducts();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader title="Insights" fallbackRoute="/tabs" hideBack={isDesktop} />

      {loadingProfile || isLoading ? (
        <View
          style={{
            flex: 1,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.data),
            paddingVertical: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Skeleton width="55%" height={22} />
          <SkeletonSummaryStrip tiles={2} />
          <SkeletonCard lines={4} />
          <Skeleton height={160} borderRadius={radii.lg} />
        </View>
      ) : null}
      {!loadingProfile && !isLoading && error ? (
        <EmptyState
          title="Não foi possível carregar os Insights"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button
              title="Tentar novamente"
              onPress={() => void insightsQuery.refetch()}
            />
          }
        />
      ) : null}
      {!loadingProfile && !isLoading && !error ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.data),
            paddingTop: spacing.xl,
            paddingBottom: spacing["2xl"] + insets.bottom,
            gap: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {data && data.totalSales > 0 ? (
            <InsightsContent
              data={data}
              products={products}
              isPremium={isPremium}
              onUpgrade={() => showPaywall("reports")}
              months={months}
              onMonthsChange={setMonths}
            />
          ) : (
            <EmptyState
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
      ) : null}
    </SafeAreaView>
  );
}
