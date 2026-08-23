import {
  Card,
  iconSizes,
  radii,
  spacing,
  Typography,
  useBrand,
  useTheme,
} from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { useFinanceRangeSummary, useFinanceSummary } from "../../features/finance/hooks";
import { ProlaboreGoalForm } from "../../features/goals/components/prolabore-goal-form";
import { useProlaboreStatus } from "../../features/goals/hooks";
import { useInsights } from "../../features/insights/hooks";
import { useProducts } from "../../features/products/hooks";
import { useSales, useTodaySummary } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimits, useProfile } from "../../features/subscription/hooks";
import { getLimitBannerState } from "../../features/subscription/limits";
import { AdBanner } from "../../shared/components/ad-banner";
import { AppIcon, type AppIconName } from "../../shared/components/app-icon";
import { GettingStartedOverlay } from "../../shared/components/getting-started-overlay";
import { SkeletonHome } from "../../shared/components/skeleton";
import { useAuth } from "../../shared/hooks/use-auth";
import { useOnboarding } from "../../shared/hooks/use-onboarding";
import { usePaywall } from "../../shared/hooks/use-paywall";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { formatCurrency } from "../../shared/utils/format";
import {
  advanceGettingStartedStage,
  resolveGettingStartedPresentation,
  type GettingStartedStage,
} from "../../shared/utils/getting-started";
import { PREVIEW_HOME_GETTING_STARTED } from "../../shared/utils/onboarding-preview";

type OverviewPeriod = "today" | "month";

function localDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formattedDate(date = new Date()): string {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date),
  );
}

function monthName(date = new Date()): string {
  return capitalize(new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date));
}

function registeredSalesLabel(count: number): string {
  if (count === 0) return "Nenhuma venda registrada";
  return count === 1 ? "1 venda registrada" : `${count} vendas registradas`;
}

function AvatarCircle({
  name,
  avatarUrl,
}: Readonly<{ name: string; avatarUrl?: string | null }>) {
  const { theme } = useTheme();
  const pastel = avatarPastel(name || "?", theme.mode);

  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: radii.full,
        backgroundColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48 }} />
      ) : (
        <Typography variant="homeAvatar" color={pastel.fg}>
          {name.charAt(0).toUpperCase() || "?"}
        </Typography>
      )}
    </View>
  );
}

const GETTING_STARTED_COPY: Record<
  GettingStartedStage,
  {
    action: string;
    description: string;
    icon: AppIconName;
    title: string;
  }
> = {
  product: {
    action: "Cadastrar",
    description: "Leva menos de 2 minutos",
    icon: "cube-outline",
    title: "Cadastre seu primeiro produto",
  },
  sale: {
    action: "Registrar",
    description: "Leva menos de 1 minuto",
    icon: "receipt-outline",
    title: "Registre sua primeira venda",
  },
  result: {
    action: "Ver resultado",
    description: "Seu resultado já está pronto",
    icon: "trending-up-outline",
    title: "Veja o que sua venda rendeu",
  },
};

function onboardingStepNumber(stage: GettingStartedStage): number {
  if (stage === "sale") return 2;
  if (stage === "result") return 3;
  return 1;
}

function NextStepCard({
  compact,
  onAction,
  stage,
}: Readonly<{
  compact: boolean;
  onAction: () => void;
  stage: GettingStartedStage;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const copy = GETTING_STARTED_COPY[stage];
  const step = onboardingStepNumber(stage);

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={{
        borderColor: colors.border,
        borderRadius: radii.xl,
      }}
    >
      <View
        style={{
          flexDirection: compact ? "column" : "row",
          flexWrap: compact ? "nowrap" : "wrap",
          alignItems: compact ? "stretch" : "center",
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            flex: 1,
            minWidth: compact ? 0 : 260,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name={copy.icon}
              size={iconSizes.lg}
              color={theme.colors.primaryStrong}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="homeEyebrow" color={theme.colors.primaryStrong}>
              PRÓXIMO PASSO · {step} DE 3
            </Typography>
            <Typography variant="homeCardLead" style={{ marginTop: 2 }}>
              {copy.title}
            </Typography>
            <Typography variant="homeDescription" color={theme.colors.textSecondary}>
              {copy.description}
            </Typography>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.action}: ${copy.title}`}
          onPress={onAction}
          style={({ pressed }) => ({
            minHeight: 48,
            paddingHorizontal: spacing.xl,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primaryInteractive,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <Typography variant="homeAction" color={theme.colors.textOnPrimary}>
            {copy.action}
          </Typography>
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: step }}
        style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}
      >
        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={{
              width: item === step ? 56 : 44,
              maxWidth: "30%",
              height: 5,
              borderRadius: radii.full,
              backgroundColor:
                item <= step ? theme.colors.primaryInteractive : theme.colors.surface,
            }}
          />
        ))}
      </View>
    </Card>
  );
}

function PeriodSelector({
  value,
  onChange,
}: Readonly<{ value: OverviewPeriod; onChange: (value: OverviewPeriod) => void }>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();

  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        flexShrink: 0,
        width: 176,
        padding: 3,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
      }}
    >
      {(["today", "month"] as const).map((period) => {
        const selected = value === period;
        let backgroundColor = "transparent";
        let textColor = theme.colors.textSecondary;

        if (selected) {
          backgroundColor = colors.wineFill;
          textColor = colors.onWine;
        }

        return (
          <Pressable
            key={period}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(period)}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 40,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography variant="homeLink" color={textColor}>
              {period === "today" ? "Hoje" : "Mês"}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function FinancialMetric({
  compact,
  icon,
  label,
  value,
  tone,
}: Readonly<{
  compact: boolean;
  icon: AppIconName;
  label: string;
  value: string;
  tone: string;
}>) {
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? spacing.sm : spacing.md,
      }}
    >
      <View
        style={{
          width: compact ? 36 : 44,
          height: compact ? 36 : 44,
          borderRadius: radii.full,
          backgroundColor: "rgba(255,255,255,0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={compact ? iconSizes.sm : iconSizes.md} color={tone} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="homeMetricLabel" color="#F3DDE4">
          {label}
        </Typography>
        <Typography
          variant="homeMetricValue"
          color={colors.onWine}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.1}
          style={compact ? { fontSize: 20, lineHeight: 25 } : undefined}
        >
          {value}
        </Typography>
      </View>
    </View>
  );
}

function FinancialHero({
  compact,
  expenses,
  income,
  onNewSale,
  period,
  salesAmount,
  salesCount,
  viewportWidth,
}: Readonly<{
  compact: boolean;
  expenses: number;
  income: number;
  onNewSale: () => void;
  period: OverviewPeriod;
  salesAmount: number;
  salesCount: number;
  viewportWidth: number;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const background = colors.wineFill;
  const periodText = period === "today" ? "hoje" : "no mês";
  const actionWidth = Math.min(164, Math.max(154, viewportWidth * 0.4));

  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: radii["2xl"],
        padding: compact ? spacing.lg : spacing["2xl"],
        ...theme.shadows.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: compact ? spacing.md : spacing.lg,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="homeFinancialLabel" color="#F3DDE4">
            Vendas {periodText}
          </Typography>
          <Typography
            variant="homeFinancialValue"
            color={colors.onWine}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            maxFontSizeMultiplier={1.1}
            style={{
              marginTop: spacing.xs,
              ...(compact ? { fontSize: 30, lineHeight: 36 } : undefined),
            }}
          >
            {formatCurrency(salesAmount)}
          </Typography>
          <Typography
            variant="homeBody"
            color="#E9C7D1"
            style={{ marginTop: spacing.xs }}
          >
            {registeredSalesLabel(salesCount)}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Registrar venda"
          onPress={onNewSale}
          style={({ pressed }) => ({
            minHeight: compact ? 48 : 52,
            width: compact ? actionWidth : undefined,
            maxWidth: 180,
            paddingHorizontal: compact ? spacing.sm : spacing.xl,
            borderRadius: radii.full,
            backgroundColor: theme.colors.primaryInteractive,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: compact ? 6 : spacing.sm,
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <AppIcon
            name="add"
            size={compact ? iconSizes.sm : iconSizes.md}
            color={theme.colors.textOnPrimary}
          />
          <Typography
            variant="homeAction"
            color={theme.colors.textOnPrimary}
            numberOfLines={1}
            maxFontSizeMultiplier={1.1}
            style={compact ? { fontSize: 13, lineHeight: 18 } : undefined}
          >
            Registrar venda
          </Typography>
        </Pressable>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.16)",
          marginVertical: compact ? spacing.lg : spacing.xl,
        }}
      />
      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <FinancialMetric
          compact={compact}
          icon="arrow-down-circle-outline"
          label="Entradas"
          value={formatCurrency(income)}
          tone={colors.lime}
        />
        <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.18)" }} />
        <FinancialMetric
          compact={compact}
          icon="arrow-up-circle-outline"
          label="Despesas"
          value={formatCurrency(expenses)}
          tone="#E792A6"
        />
      </View>
    </View>
  );
}

function GoalCard({
  compact,
  current,
  goal,
  hasGoal,
  onPress,
  progress,
  viewportWidth,
}: Readonly<{
  compact: boolean;
  current: number;
  goal: number;
  hasGoal: boolean;
  onPress: () => void;
  progress: number;
  viewportWidth: number;
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const valueText = hasGoal
    ? `${formatCurrency(current)} de ${formatCurrency(goal)}`
    : "Meta ainda não definida";
  const baseValueFontSize = Math.min(23, Math.max(20, viewportWidth * 0.054));
  const valueFontSize = Math.max(
    16,
    baseValueFontSize * Math.min(1, 29 / valueText.length),
  );
  const keepValueOnOneLine = !hasGoal || valueText.length <= 36;

  return (
    <Card
      variant="elevated"
      padding={compact ? "lg" : "xl"}
      style={{
        borderColor: colors.border,
        borderRadius: radii.xl,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Typography variant="homeGoalTitle">
          Meta de {monthName().toLowerCase()}
        </Typography>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingHorizontal: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Typography variant="homeLink" color={theme.colors.primaryStrong}>
            {hasGoal ? "Editar meta" : "Definir meta"}
          </Typography>
          <AppIcon
            name="chevron-forward"
            size={iconSizes.sm}
            color={theme.colors.primaryStrong}
          />
        </Pressable>
      </View>

      <Typography
        variant="homeGoalValue"
        color={theme.colors.text}
        numberOfLines={keepValueOnOneLine ? 1 : undefined}
        adjustsFontSizeToFit={keepValueOnOneLine}
        minimumFontScale={0.78}
        maxFontSizeMultiplier={1.1}
        style={{
          marginTop: spacing.sm,
          ...(compact
            ? {
                fontSize: valueFontSize,
                lineHeight: valueFontSize + 6,
                letterSpacing: -0.3,
                fontVariant: ["tabular-nums"] as const,
              }
            : undefined),
        }}
      >
        {valueText}
      </Typography>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(safeProgress) }}
        style={{
          height: 24,
          marginTop: compact ? spacing.md : spacing.lg,
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 6,
            left: 0,
            right: 0,
            height: 12,
            borderRadius: radii.full,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          {safeProgress > 0 ? (
            <View
              style={{
                width: `${safeProgress}%`,
                minWidth: 12,
                height: "100%",
                borderRadius: radii.full,
                backgroundColor: colors.lime,
              }}
            />
          ) : null}
        </View>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: safeProgress }} />
          <View
            style={{
              minWidth: 44,
              height: 24,
              paddingHorizontal: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: colors.lime,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography variant="homeProgressStrong" color={colors.onLime}>
              {Math.round(safeProgress)}%
            </Typography>
          </View>
          <View style={{ flex: 100 - safeProgress }} />
        </View>
      </View>
    </Card>
  );
}

const QUICK_ACTIONS = [
  { icon: "trending-up-outline", label: "Venda", route: "/tabs/new-sale", active: true },
  { icon: "cube-outline", label: "Produto", route: "/products", active: false },
  { icon: "person-add-outline", label: "Cliente", route: "/tabs/clients", active: false },
  { icon: "cash-outline", label: "Despesa", route: "/finance", active: false },
] as const;

function QuickAccess({ compact }: Readonly<{ compact: boolean }>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const router = useRouter();

  return (
    <View style={{ flexDirection: "row", flexWrap: "nowrap", gap: spacing.sm }}>
      {QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: compact ? 92 : 100,
            paddingHorizontal: spacing.sm,
            paddingVertical: compact ? spacing.md : spacing.lg,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: action.active ? theme.colors.primaryBg : colors.white,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.74 : 1,
          })}
        >
          <AppIcon
            name={action.icon}
            size={iconSizes.md}
            color={
              action.active ? theme.colors.primaryStrong : theme.colors.textSecondary
            }
          />
          <Typography
            variant="homeShortcut"
            color={action.active ? theme.colors.primaryStrong : theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            maxFontSizeMultiplier={1.1}
          >
            {action.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

function ContextualProductCard({ onPress }: Readonly<{ onPress: () => void }>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Comece pelo essencial. Cadastrar produto"
      accessibilityHint="Abre o cadastro de produto"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
    >
      <Card
        variant="elevated"
        padding="xl"
        shadow="sm"
        style={{
          borderColor: colors.border,
          borderRadius: radii.xl,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: colors.lime,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name="trending-up-outline"
              size={iconSizes.lg}
              color={colors.onLime}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="homeGoalTitle">Comece pelo essencial</Typography>
            <Typography
              variant="homeBody"
              color={theme.colors.textSecondary}
              style={{ marginTop: 4 }}
            >
              Cadastre um produto para liberar estoque e lucro.
            </Typography>
            <View
              style={{
                minHeight: 44,
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <Typography variant="homeLink" color={colors.rose}>
                Cadastrar produto
              </Typography>
              <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.rose} />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function ErrorCard({ onRetry }: Readonly<{ onRetry: () => void }>) {
  const { theme } = useTheme();

  return (
    <Card variant="elevated" padding="lg">
      <Typography variant="h3">Não foi possível atualizar os números</Typography>
      <Typography variant="body" style={{ marginTop: spacing.xs }}>
        Seus atalhos continuam disponíveis. Tente novamente em instantes.
      </Typography>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          minHeight: 44,
          marginTop: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: theme.colors.primaryStrong,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.68 : 1,
        })}
      >
        <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
          Tentar novamente
        </Typography>
      </Pressable>
    </Card>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  const brand = useBrand();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const compact = !isDesktop && width < 480;
  const today = localDateKey();

  const [period, setPeriod] = useState<OverviewPeriod>("today");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [previewStage, setPreviewStage] = useState<GettingStartedStage>("product");
  const [previewDismissed, setPreviewDismissed] = useState(false);

  const userId = useAuth((state) => state.userId);
  const { data: profile } = useProfile();
  const { data: limits } = useLimits();
  const showPaywall = usePaywall((state) => state.show);

  const todaySalesQuery = useTodaySummary();
  const monthSalesQuery = useInsights(1);
  const dayFinanceQuery = useFinanceRangeSummary(today, today);
  const monthFinanceQuery = useFinanceSummary();
  const goalQuery = useProlaboreStatus();
  const productsQuery = useProducts();
  const salesQuery = useSales();

  const startedUserIds = useOnboarding((state) => state.gettingStartedStartedUserIds);
  const completedUserIds = useOnboarding((state) => state.gettingStartedCompletedUserIds);
  const startGettingStarted = useOnboarding((state) => state.startGettingStarted);
  const completeGettingStarted = useOnboarding((state) => state.completeGettingStarted);

  const hasProduct = (productsQuery.data?.items.length ?? 0) > 0;
  const hasSale = (salesQuery.data?.items.length ?? 0) > 0;
  const onboardingSettled = !productsQuery.isLoading && !salesQuery.isLoading;
  const onboardingStarted = !!userId && startedUserIds.includes(userId);
  const onboardingCompleted = !!userId && completedUserIds.includes(userId);
  const {
    show: showGettingStarted,
    showReopen: showGettingStartedReopen,
    stage: gettingStartedStage,
  } = resolveGettingStartedPresentation({
    preview: PREVIEW_HOME_GETTING_STARTED,
    previewDismissed,
    previewStage,
    settled: onboardingSettled,
    completed: onboardingCompleted,
    started: onboardingStarted,
    hasProduct,
    hasSale,
  });

  const selectedSales = period === "today" ? todaySalesQuery.data : monthSalesQuery.data;
  const selectedFinance =
    period === "today" ? dayFinanceQuery.data : monthFinanceQuery.data;
  const salesAmount =
    period === "today"
      ? (todaySalesQuery.data?.totalAmount ?? 0)
      : (monthSalesQuery.data?.totalRevenue ?? 0);
  const salesCount =
    period === "today"
      ? (todaySalesQuery.data?.totalSales ?? 0)
      : (monthSalesQuery.data?.totalSales ?? 0);
  const periodLoading =
    period === "today"
      ? todaySalesQuery.isLoading || dayFinanceQuery.isLoading
      : monthSalesQuery.isLoading || monthFinanceQuery.isLoading;
  const periodError =
    period === "today"
      ? todaySalesQuery.error || dayFinanceQuery.error
      : monthSalesQuery.error || monthFinanceQuery.error;
  const goal = goalQuery.data?.progress;
  const hasGoal = !!goalQuery.data?.config;
  const firstName = profile?.name?.trim().split(/\s+/)[0] || "Maria";
  const showSalesLimitBanner = getLimitBannerState(limits, profile, "sales") !== null;

  function handleProductRegistration() {
    if (userId) startGettingStarted(userId);
    router.push("/products?from=getting-started&create=getting-started");
  }

  function handleGettingStartedAction() {
    if (PREVIEW_HOME_GETTING_STARTED) {
      const nextStage = advanceGettingStartedStage(previewStage);
      if (nextStage) {
        setPreviewStage(nextStage);
        return;
      }
      setPreviewDismissed(true);
      return;
    }

    if (gettingStartedStage === "product") return handleProductRegistration();

    if (userId && gettingStartedStage !== "result") startGettingStarted(userId);
    if (gettingStartedStage === "sale") {
      router.push("/tabs/new-sale?from=getting-started");
      return;
    }

    if (userId) completeGettingStarted(userId);
    router.push("/finance");
  }

  function retrySelectedPeriod() {
    if (period === "today") {
      void todaySalesQuery.refetch();
      void dayFinanceQuery.refetch();
      return;
    }
    void monthSalesQuery.refetch();
    void monthFinanceQuery.refetch();
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: spacing.lg,
          paddingBottom: isDesktop
            ? spacing["3xl"]
            : floatingTabBarContentPadding(insets.bottom),
          gap: spacing.xl,
          ...pageGutter(isDesktop, width <= 375 ? spacing.lg : spacing.xl),
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="homeTitle"
              color={brand.id === "lucro-caseiro" ? colors.wine : theme.colors.text}
            >
              Olá, {firstName}!
            </Typography>
            <Typography variant="homeBody" style={{ marginTop: 2 }}>
              {formattedDate()}
            </Typography>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Minha conta"
            hitSlop={8}
            onPress={() => router.push("/settings")}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <AvatarCircle
              name={profile?.name ?? firstName}
              avatarUrl={profile?.avatarUrl}
            />
          </Pressable>
        </View>

        <LimitBanner resource="sales" onUpgrade={() => showPaywall("sales")} />

        {PREVIEW_HOME_GETTING_STARTED ? (
          <Modal
            animationType="fade"
            visible={showGettingStarted}
            onRequestClose={() => setPreviewDismissed(true)}
          >
            <GettingStartedOverlay
              stage={previewStage}
              preview={PREVIEW_HOME_GETTING_STARTED}
              onSkip={() => setPreviewDismissed(true)}
              onContinue={handleGettingStartedAction}
            />
          </Modal>
        ) : null}
        {!PREVIEW_HOME_GETTING_STARTED && showGettingStarted ? (
          <NextStepCard
            compact={compact}
            stage={gettingStartedStage}
            onAction={handleGettingStartedAction}
          />
        ) : null}

        {showGettingStartedReopen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reabrir prévia do guia"
            onPress={() => {
              setPreviewStage("product");
              setPreviewDismissed(false);
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}
          >
            <Card variant="elevated" padding="lg">
              <Typography variant="homeEyebrow" color={theme.colors.primaryStrong}>
                PRÉVIA
              </Typography>
              <Typography variant="homeCardLead" style={{ marginTop: 2 }}>
                Reabrir guia da Home
              </Typography>
              <Typography variant="homeDescription" color={theme.colors.textSecondary}>
                Mostra as três etapas sem alterar seus dados
              </Typography>
            </Card>
          </Pressable>
        ) : null}

        <View style={{ gap: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
            }}
          >
            <Typography variant="homeTitle" numberOfLines={1} maxFontSizeMultiplier={1.1}>
              Visão geral
            </Typography>
            <PeriodSelector value={period} onChange={setPeriod} />
          </View>

          {periodError ? <ErrorCard onRetry={retrySelectedPeriod} /> : null}
          {periodLoading && !selectedSales && !selectedFinance ? (
            <SkeletonHome />
          ) : (
            <FinancialHero
              compact={compact}
              expenses={selectedFinance?.totalExpenses ?? 0}
              income={selectedFinance?.totalIncome ?? 0}
              onNewSale={() => router.push("/tabs/new-sale")}
              period={period}
              salesAmount={salesAmount}
              salesCount={salesCount}
              viewportWidth={width}
            />
          )}
        </View>

        {goalQuery.isLoading ? (
          <SkeletonHome />
        ) : (
          <GoalCard
            compact={compact}
            current={goal?.currentRevenue ?? 0}
            goal={goal?.requiredRevenue ?? 0}
            hasGoal={hasGoal}
            onPress={() => setShowGoalForm(true)}
            progress={goal?.progressPct ?? 0}
            viewportWidth={width}
          />
        )}

        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="homeTitle">Acesso rápido</Typography>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/tabs/more")}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingLeft: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography variant="homeLink" color={theme.colors.primaryStrong}>
                Ver todos
              </Typography>
              <AppIcon
                name="chevron-forward"
                size={iconSizes.sm}
                color={theme.colors.primaryStrong}
              />
            </Pressable>
          </View>
          <QuickAccess compact={compact} />
        </View>

        {!hasProduct && onboardingSettled ? (
          <ContextualProductCard onPress={handleProductRegistration} />
        ) : null}

        {!showSalesLimitBanner ? <AdBanner size="banner" /> : null}

        <ProlaboreGoalForm
          config={goalQuery.data?.config ?? null}
          visible={showGoalForm}
          onClose={() => setShowGoalForm(false)}
          onSuccess={() => setShowGoalForm(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
