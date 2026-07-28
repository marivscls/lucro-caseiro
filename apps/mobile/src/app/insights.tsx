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
import { Image, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import insightsEmpty from "../assets/insights-empty.png";
import { MonthlyBars } from "../features/insights/components/monthly-bars";
import { RankBars, type RankRow } from "../features/insights/components/rank-bars";
import {
  answerInsightQuestion,
  buildActionableInsights,
  formatMoney,
  monthOverMonthDelta,
  type InsightActionTarget,
  type InsightQuestionId,
} from "../features/insights/domain";
import { useInsights } from "../features/insights/hooks";
import { useAllProducts } from "../features/products/hooks";
import { useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ScreenHeader } from "../shared/components/screen-header";
import { Skeleton, SkeletonCard, SkeletonSummaryStrip } from "../shared/components/skeleton";
import { desktopStretch, desktopWidths, pageGutter } from "../shared/layout/desktop-density";
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
  const actionable = buildActionableInsights(data, products);
  const [selectedQuestion, setSelectedQuestion] = useState<InsightQuestionId | null>(
    null,
  );

  function openAction(target: InsightActionTarget) {
    if (target === "finance") router.push("/finance");
    else if (target === "products") router.push("/products");
    else if (target === "clients") router.push("/tabs/clients");
    else router.push("/tabs/new-sale");
  }

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
          {actionable.length > 0 ? (
            <Card variant="surface" padding="xl">
              <SectionTitle
                icon="sparkles-outline"
                title="O que fazer agora"
                tint={theme.colors.primaryBg}
                iconColor={theme.colors.primaryStrong}
              />
              <View style={{ gap: spacing.sm }}>
                {actionable.map((action) => (
                  <Pressable
                    key={action.id}
                    onPress={() => openAction(action.target)}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      minHeight: 64,
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
                    <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
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
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}
          <Card variant="surface" padding="xl">
            <SectionTitle
              icon="help-circle-outline"
              title="Perguntas rápidas"
              tint={theme.colors.surface}
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
                  onPress={() => setSelectedQuestion(question.id)}
                  accessibilityRole="button"
                  style={{
                    minHeight: 44,
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
          style={{ flex: 1, ...pageGutter(isDesktop), ...desktopStretch(isDesktop, desktopWidths.data), paddingVertical: spacing.xl, gap: spacing.lg }}
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
            gap: spacing.xl,
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
      ) : null}
    </SafeAreaView>
  );
}
