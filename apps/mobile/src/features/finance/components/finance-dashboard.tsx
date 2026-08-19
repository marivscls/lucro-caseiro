import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { getActiveBrand } from "@lucro-caseiro/brands";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import { formatCurrency } from "../../../shared/utils/format";
import {
  Button,
  Chip,
  FilterChipRow,
  fontSizes,
  fonts,
  iconSizes,
  radii,
  spacing,
  Typography,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type DimensionValue,
  type TextStyle,
} from "react-native";

import financeSummaryIllustration from "../../../assets/finance-summary-illustration.png";
import { useBrandIllustration } from "../../../shared/brand-illustrations";
import {
  brandScreenPalette,
  type BrandScreenPalette,
} from "../../../shared/brand-palette";
import { useAuth } from "../../../shared/hooks/use-auth";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useProfile } from "../../subscription/hooks";
import { getExportUrl } from "../api";
import {
  countByType,
  entryBalance,
  financePeriodRange,
  orderReceiptProgress,
  profit as computeProfit,
  profitDeltaPct as computeProfitDeltaPct,
  totalsByType,
  unusualExpenses,
  type FinancePeriod,
} from "../calc";
import { useDeleteFinanceEntry, useFinanceEntries, useFinanceSummary } from "../hooks";
import { CreateFinanceEntry } from "./create-finance-entry";
import { alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { ScreenHeader } from "../../../shared/components/screen-header";
import { SkeletonFinanceDashboard } from "../../../shared/components/skeleton";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../../shared/layout/desktop-density";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useOrdersSummary } from "../../orders/hooks";
import { usePayPurchase, usePurchases } from "../../purchases/hooks";
import { useQuotes } from "../../quotes/hooks";
import { useBusinessCopy } from "../../subscription/business-copy";

const ACTIVE_BRAND_ID = getActiveBrand().id;
const WEB_NOWRAP =
  Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as unknown as TextStyle) : undefined;
const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
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

type FilterType = "all" | FinanceEntryType;
const PERIOD_OPTIONS: ReadonlyArray<{ value: FinancePeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7days", label: "7 dias" },
  { value: "month", label: "Mês" },
];

function dateDistanceInDays(date: string, now: Date): number {
  const target = new Date(`${date.slice(0, 10)}T12:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

interface FinanceDashboardProps {
  onEntryPress?: (id: string) => void;
  onAddPress?: () => void;
}

export function FinanceDashboard({
  onEntryPress,
  onAddPress,
}: Readonly<FinanceDashboardProps>) {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);
  const financeEmpty = useBrandIllustration("financeEmpty");
  const experienceCopy = useBusinessCopy();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const compactLayout = viewportWidth < 700;
  const narrowLayout = viewportWidth < 520;
  const stackSummaryCards = viewportWidth < 380;
  const mobileHeroHeight = Math.min(220, Math.max(196, Math.round(viewportWidth * 0.55)));
  const mobileHeroImageWidth = Math.min(
    176,
    Math.max(0, viewportWidth - 40) * (stackSummaryCards ? 0.34 : 0.36),
  );
  const mobileHeroImageHeight = mobileHeroImageWidth * (1103 / 1426);
  const mobileHeroTextWidth = Math.max(0, viewportWidth - 80 - mobileHeroImageWidth);
  const isDesktop = useDesktopLayout();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { token } = useAuth();
  const { data: profile } = useProfile();
  const isPremium = profile
    ? hasActiveFeature(profile.plan, profile.planExpiresAt, "advancedReports")
    : false;
  const canExportBasic = profile
    ? hasActiveFeature(profile.plan, profile.planExpiresAt, "exportBasic")
    : false;
  const canExportFull = profile
    ? hasActiveFeature(profile.plan, profile.planExpiresAt, "export")
    : false;
  const showPaywall = usePaywall((s) => s.show);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [period, setPeriod] = useState<FinancePeriod>("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const scrollViewRef = useRef<ScrollView>(null);
  const entriesSectionYRef = useRef(0);

  const {
    data: summary,
    isLoading,
    error,
    refetch: refetchSummary,
  } = useFinanceSummary({ month, year });
  const { data: prevSummary } = useFinanceSummary({
    month: previousMonth(month) + 1,
    year: previousYear(month, year),
  });
  const periodRange = financePeriodRange(period, month, year, now);
  const { data: entries } = useFinanceEntries({
    limit: 100,
    startDate: periodRange.startDate,
    endDate: periodRange.endDate,
  });
  const { data: ordersSummary } = useOrdersSummary(periodRange);
  const { data: pendingPurchasesData } = usePurchases({ status: "pending" });
  const { data: quotesData } = useQuotes();
  const payPurchase = usePayPurchase();
  const deleteEntry = useDeleteFinanceEntry();
  const pendingPurchases = pendingPurchasesData?.items ?? [];

  const monthlyIncome = summary?.totalIncome ?? 0;
  const monthlyExpenses = summary?.totalExpenses ?? 0;
  const allEntries = entries?.items ?? [];
  const periodTotals = totalsByType(allEntries);
  const income = period === "month" ? monthlyIncome : periodTotals.income;
  const expenses = period === "month" ? monthlyExpenses : periodTotals.expenses;
  const profit = computeProfit(income, expenses);
  const prevProfit = computeProfit(
    prevSummary?.totalIncome ?? 0,
    prevSummary?.totalExpenses ?? 0,
  );
  // So compara quando ha base: lucro anterior diferente de zero.
  const profitDeltaPct =
    period === "month" ? computeProfitDeltaPct(profit, prevProfit) : null;
  const hasNoMovements = income === 0 && expenses === 0;
  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allEntries.filter((entry) => {
      const matchesType = filter === "all" || entry.type === filter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        entry.description.toLowerCase().includes(normalizedSearch) ||
        categoryLabel(
          entry.category,
          experienceCopy.materialNoun,
          experienceCopy.packagingNoun,
        )
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [allEntries, experienceCopy, filter, searchTerm]);
  const { incomeCount, expenseCount } = countByType(allEntries);
  const flowMaximum = Math.max(income, expenses, 1);
  const incomeBarWidth = `${Math.round((income / flowMaximum) * 100)}%` as DimensionValue;
  const expenseBarWidth =
    `${Math.round((expenses / flowMaximum) * 100)}%` as DimensionValue;
  const negativeBalance = Math.max(expenses - income, 0);
  const unusual = unusualExpenses(allEntries);
  const receivedProgress = orderReceiptProgress(
    ordersSummary?.received ?? 0,
    ordersSummary?.toReceive ?? 0,
  );
  const overduePurchases = pendingPurchases.filter(
    (purchase) =>
      purchase.dueDate !== null && dateDistanceInDays(purchase.dueDate, now) < 0,
  );
  const dueSoonPurchases = pendingPurchases.filter(
    (purchase) =>
      purchase.dueDate !== null &&
      dateDistanceInDays(purchase.dueDate, now) >= 0 &&
      dateDistanceInDays(purchase.dueDate, now) <= 7,
  );
  const expiringQuotes = (quotesData?.items ?? []).filter(
    (quote) =>
      quote.validUntil !== null &&
      ["draft", "sent", "pending"].includes(quote.status) &&
      dateDistanceInDays(quote.validUntil, now) >= 0 &&
      dateDistanceInDays(quote.validUntil, now) <= 7,
  );

  function confirmPayPurchase(id: string, description: string) {
    showAlert({
      title: "Marcar conta como paga?",
      message: description,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como paga",
          onPress: () => {
            payPurchase.mutate(id, {
              onError: () => alertError("Não foi possível marcar a conta como paga."),
            });
          },
        },
      ],
    });
  }

  const handleExport = useCallback(
    async (format: "pdf" | "xlsx") => {
      if (format === "pdf" && !canExportBasic) {
        showPaywall("export", "essential");
        return;
      }
      if (format === "xlsx" && !canExportFull) {
        showPaywall("export", "professional");
        return;
      }
      if (!token) return;
      setExporting(format);

      try {
        const monthStr = `${year}-${String(month).padStart(2, "0")}`;
        const url = getExportUrl(format, monthStr);
        const ext = format === "pdf" ? "pdf" : "xlsx";
        const filename = `relatorio-financeiro-${monthStr}.${ext}`;
        const headers = {
          Authorization: `Bearer ${token}`,
          "x-brand": ACTIVE_BRAND_ID,
        };

        if (Platform.OS === "web") {
          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error("Falha ao baixar arquivo");

          const objectUrl = URL.createObjectURL(await response.blob());
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
          return;
        }

        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        const result = await FileSystem.downloadAsync(url, fileUri, {
          headers,
        });

        if (result.status !== 200) throw new Error("Falha ao baixar arquivo");

        const Sharing = await import("expo-sharing");
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType:
              format === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Exportar relatório financeiro",
          });
        } else {
          showAlert({ title: "Sucesso", message: "Arquivo salvo com sucesso." });
        }
      } catch {
        alertError("Não foi possível exportar o relatório. Tente novamente.");
      } finally {
        setExporting(null);
      }
    },
    [token, year, month, canExportBasic, canExportFull, showPaywall],
  );

  function handlePrevMonth() {
    if (!isPremium) {
      showPaywall("reports");
      return;
    }
    if (month === 1) {
      setMonth(12);
      setYear((currentYear) => currentYear - 1);
      return;
    }
    setMonth((currentMonth) => currentMonth - 1);
  }

  function handleNextMonth() {
    if (!isPremium) {
      showPaywall("reports");
      return;
    }
    if (month === 12) {
      setMonth(1);
      setYear((currentYear) => currentYear + 1);
      return;
    }
    setMonth((currentMonth) => currentMonth + 1);
  }

  function handleOpenMonthPicker() {
    if (!isPremium) {
      showPaywall("reports");
      return;
    }
    setPeriod("month");
    setPickerYear(year);
    setShowMonthPicker(true);
  }

  function openCreateEntry() {
    if (onAddPress) {
      onAddPress();
      return;
    }
    setShowCreateEntry(true);
  }

  function showEntries(entryFilter: FinanceEntryType, search = "") {
    setFilter(entryFilter);
    setSearchTerm(search);
    scrollViewRef.current?.scrollTo({
      y: Math.max(entriesSectionYRef.current - spacing.md, 0),
      animated: true,
    });
  }

  if (isLoading) {
    return (
      <View style={{ padding: spacing.xl }}>
        <SkeletonFinanceDashboard />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.centered,
          {
            padding: spacing.xl,
            gap: spacing.md,
            ...pageGutter(isDesktop),
            ...desktopStretch(isDesktop, desktopWidths.data),
            alignItems: isDesktop ? "flex-start" : "center",
            justifyContent: isDesktop ? "flex-start" : "center",
          },
        ]}
      >
        <Typography variant="h3">Não foi possível carregar o financeiro</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Verifique sua conexão e tente novamente.
        </Typography>
        <Button
          title="Tentar novamente"
          variant="secondary"
          onPress={() => void refetchSummary()}
        />
      </View>
    );
  }

  return (
    <>
      <ScreenHeader
        title="Financeiro"
        subtitle="Acompanhe seu lucro e fluxo financeiro"
        fallbackRoute="/tabs"
        hideBack={isDesktop}
        style={styles.financeHeader}
        titleStyle={styles.financeHeaderTitle}
        subtitleStyle={styles.financeHeaderSubtitle}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher mês"
            onPress={handleOpenMonthPicker}
            hitSlop={10}
            style={{
              alignItems: "center",
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            <AppIcon name="calendar-outline" size={iconSizes.lg} color={colors.wine} />
          </Pressable>
        }
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          compactLayout && styles.contentCompact,
          isDesktop && styles.contentDesktop,
          pageGutter(isDesktop),
          desktopStretch(isDesktop, desktopWidths.data),
        ]}
      >
        <View
          style={[
            styles.filterRow,
            styles.periodFilterRow,
            compactLayout && styles.periodFilterRowCompact,
          ]}
        >
          {PERIOD_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={period === option.value}
              onPress={() => setPeriod(option.value)}
              filled
              compact
              styles={styles}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher período personalizado"
            onPress={handleOpenMonthPicker}
            style={({ pressed }) => [styles.customPeriodPill, pressed && styles.pressed]}
          >
            <Typography
              variant="captionBold"
              style={[
                styles.customPeriodLabel,
                stackSummaryCards && styles.customPeriodLabelTight,
                WEB_NOWRAP,
              ]}
            >
              Personalizado
            </Typography>
            <AppIcon name="chevron-down" size={iconSizes.xs} color={theme.colors.text} />
          </Pressable>
        </View>

        {period === "month" ? (
          <View style={styles.monthSelector}>
            <Pressable
              onPress={handlePrevMonth}
              accessibilityLabel="Mês anterior"
              hitSlop={12}
              accessibilityRole="button"
              style={styles.monthArrow}
            >
              <AppIcon
                name="chevron-back"
                size={iconSizes.lg}
                color={theme.colors.text}
              />
            </Pressable>
            <View style={styles.monthTitle}>
              <AppIcon
                name="calendar-outline"
                size={iconSizes.md}
                color={theme.colors.textSecondary}
              />
              <Typography variant="h2" color={theme.colors.text}>
                {MONTH_NAMES[month - 1]} {year}
              </Typography>
            </View>
            <Pressable
              onPress={handleNextMonth}
              accessibilityLabel="Próximo mês"
              hitSlop={12}
              accessibilityRole="button"
              style={styles.monthArrow}
            >
              <AppIcon
                name="chevron-forward"
                size={iconSizes.lg}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
        ) : null}

        <View
          style={[
            styles.heroCardBase,
            narrowLayout ? styles.heroCardNarrow : styles.heroCard,
            narrowLayout && { height: mobileHeroHeight },
          ]}
        >
          <View
            style={[
              styles.heroContent,
              narrowLayout && styles.heroContentNarrow,
              narrowLayout && { maxWidth: mobileHeroTextWidth },
            ]}
          >
            <View style={styles.heroLabelRow}>
              <Typography
                variant="bodyBold"
                color={colors.onWine}
                style={narrowLayout && styles.heroLabelNarrow}
              >
                Lucro do período
              </Typography>
              <AppIcon
                name="information-circle-outline"
                size={iconSizes.xs}
                color={colors.onWine}
              />
            </View>
            <Typography
              variant="moneyHero"
              color={colors.onWine}
              style={[
                styles.heroValue,
                compactLayout && styles.heroValueCompact,
                narrowLayout && styles.heroValueNarrow,
                stackSummaryCards && styles.heroValueTight,
                WEB_NOWRAP,
              ]}
            >
              {formatHeroCurrency(profit)}
            </Typography>
            {!hasNoMovements && profitDeltaPct !== null ? (
              <View
                style={[styles.percentBadge, narrowLayout && styles.percentBadgeNarrow]}
              >
                <AppIcon
                  name={
                    profitDeltaPct >= 0 ? "trending-up-outline" : "trending-down-outline"
                  }
                  size={narrowLayout ? iconSizes.xs : iconSizes.sm}
                  color={colors.onLime}
                />
                <Typography
                  variant="captionBold"
                  color={colors.onLime}
                  style={[
                    styles.percentBadgeText,
                    stackSummaryCards && styles.percentBadgeTextTight,
                    WEB_NOWRAP,
                  ]}
                >
                  {profitDeltaPct >= 0 ? "+" : ""}
                  {profitDeltaPct}% vs. {MONTH_NAMES[previousMonth(month)]}{" "}
                  {previousYear(month, year)}
                </Typography>
              </View>
            ) : null}
            {!hasNoMovements && profitDeltaPct === null ? (
              <Typography variant="caption" color={colors.onWine}>
                Resultado dos lançamentos deste período
              </Typography>
            ) : null}
          </View>
          <Image
            source={financeSummaryIllustration}
            style={[
              narrowLayout ? styles.heroImageNarrow : styles.heroImage,
              compactLayout && !narrowLayout && styles.heroImageCompact,
              narrowLayout && {
                height: mobileHeroImageHeight,
                top: (mobileHeroHeight - mobileHeroImageHeight) / 2,
                width: mobileHeroImageWidth,
              },
            ]}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            label="Entradas"
            value={formatCurrency(income)}
            description={entryCountLabel(incomeCount)}
            tone="green"
            onPress={() => showEntries("income")}
            compact={compactLayout}
            stacked={stackSummaryCards}
            styles={styles}
          />
          <SummaryCard
            label="Saídas"
            value={formatCurrency(expenses)}
            description={entryCountLabel(expenseCount)}
            tone="red"
            onPress={() => showEntries("expense")}
            compact={compactLayout}
            stacked={stackSummaryCards}
            styles={styles}
          />
        </View>

        <View style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <Typography
                variant="h3"
                style={[
                  styles.flowTitle,
                  compactLayout && styles.flowTitleCompact,
                  stackSummaryCards && styles.flowTitleTight,
                  WEB_NOWRAP,
                ]}
              >
                Entradas x saídas
              </Typography>
              <Typography
                variant="caption"
                color={theme.colors.textSecondary}
                numberOfLines={compactLayout ? 2 : 1}
              >
                Comparação do período selecionado
              </Typography>
            </View>
            <View style={styles.flowStatus}>
              <Typography
                variant="bodyBold"
                color={profit >= 0 ? colors.wine : colors.rose}
                style={compactLayout && styles.flowStatusTextCompact}
              >
                {profit >= 0 ? "Saldo positivo" : "Saldo negativo"}
              </Typography>
              <AppIcon
                name={profit >= 0 ? "trending-up-outline" : "trending-down-outline"}
                size={iconSizes.sm}
                color={profit >= 0 ? colors.wine : colors.rose}
              />
            </View>
          </View>

          <FlowBar
            label="Entradas"
            value={formatCurrency(income)}
            width={incomeBarWidth}
            color={colors.wineFill}
            styles={styles}
          />
          <FlowBar
            label="Saídas"
            value={formatCurrency(expenses)}
            width={expenseBarWidth}
            color={colors.rose}
            styles={styles}
          />
        </View>

        {negativeBalance > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver saídas do período"
            onPress={() => showEntries("expense")}
            style={({ pressed }) => [styles.balanceAlert, pressed && styles.pressed]}
          >
            <View style={styles.balanceAlertIcon}>
              <AppIcon
                name="alert-circle-outline"
                size={iconSizes.md}
                color={colors.rose}
              />
            </View>
            <View style={styles.balanceAlertCopy}>
              <Typography variant="bodyBold" color={colors.rose}>
                As saídas superam as entradas
              </Typography>
              <Typography variant="caption" color={colors.warmGray}>
                Revise {formatCurrency(negativeBalance)} no período para entender o saldo.
              </Typography>
            </View>
            <View style={styles.balanceAlertAction}>
              <Typography variant="captionBold" color={colors.rose}>
                Ver saídas
              </Typography>
              <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.rose} />
            </View>
          </Pressable>
        ) : null}

        {overduePurchases.length > 0 ||
        dueSoonPurchases.length > 0 ||
        expiringQuotes.length > 0 ||
        unusual.length > 0 ? (
          <View style={styles.attentionSection}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="h2" color={colors.ink} style={styles.attentionTitle}>
                Precisa de atenção
              </Typography>
              <Typography variant="caption" color={colors.warmGray}>
                Pendências calculadas com os dados do seu negócio.
              </Typography>
            </View>

            {overduePurchases.slice(0, 3).map((purchase) => (
              <View
                key={purchase.id}
                style={{
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: `${theme.colors.alert}66`,
                  backgroundColor: theme.colors.alertBg,
                  padding: spacing.lg,
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: spacing.md,
                  }}
                >
                  <AppIcon
                    name="alert-circle-outline"
                    size={iconSizes.md}
                    color={theme.colors.alert}
                  />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Typography variant="bodyBold" color={theme.colors.alert}>
                      Conta vencida · {formatCurrency(purchase.amount)}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {purchase.description} · venceu em {purchase.dueDate}
                    </Typography>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => confirmPayPurchase(purchase.id, purchase.description)}
                  style={{
                    minHeight: 44,
                    alignSelf: "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: theme.colors.alert,
                  }}
                >
                  <Typography variant="captionBold" color={theme.colors.alert}>
                    Marcar como paga
                  </Typography>
                </Pressable>
              </View>
            ))}

            {dueSoonPurchases.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/purchases")}
                style={({ pressed }) => [styles.attentionItem, pressed && styles.pressed]}
              >
                <View style={styles.attentionIcon}>
                  <AppIcon name="time-outline" size={iconSizes.md} color={colors.wine} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold" color={colors.ink}>
                    {dueSoonPurchases.length} conta
                    {dueSoonPurchases.length === 1 ? "" : "s"} vence
                    {dueSoonPurchases.length === 1 ? "" : "m"} em até 7 dias
                  </Typography>
                </View>
                <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.wine} />
              </Pressable>
            ) : null}

            {expiringQuotes.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/quotes")}
                style={({ pressed }) => [styles.attentionItem, pressed && styles.pressed]}
              >
                <View style={styles.attentionIcon}>
                  <AppIcon
                    name="document-text-outline"
                    size={iconSizes.md}
                    color={colors.wine}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold" color={colors.ink}>
                    {expiringQuotes.length} orçamento
                    {expiringQuotes.length === 1 ? "" : "s"} perto do vencimento
                  </Typography>
                </View>
                <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.wine} />
              </Pressable>
            ) : null}

            {unusual.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  showEntries("expense", unusual[0].description);
                }}
                style={({ pressed }) => [styles.attentionItem, pressed && styles.pressed]}
              >
                <View style={styles.attentionIcon}>
                  <AppIcon
                    name="analytics-outline"
                    size={iconSizes.md}
                    color={colors.wine}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold" color={colors.ink}>
                    Despesa acima do padrão: {formatCurrency(unusual[0].amount)}
                  </Typography>
                </View>
                <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.wine} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {ordersSummary && ordersSummary.totalOrders > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver recebimentos de encomendas"
            onPress={() => router.push("/tabs/agenda")}
            style={({ pressed }) => [styles.receivablesCard, pressed && styles.pressed]}
          >
            <View style={styles.receivablesHeader}>
              <View style={styles.receivablesTitleRow}>
                <View style={styles.receivablesIcon}>
                  <AppIcon
                    name="bag-handle-outline"
                    size={iconSizes.md}
                    color={colors.wine}
                  />
                </View>
                <Typography
                  variant="h3"
                  color={colors.ink}
                  style={[
                    styles.receivablesTitle,
                    narrowLayout && styles.receivablesTitleNarrow,
                  ]}
                  numberOfLines={2}
                >
                  Recebimentos de encomendas
                </Typography>
              </View>
              <AppIcon name="chevron-forward" size={iconSizes.md} color={colors.wine} />
            </View>
            <View style={styles.receivablesColumns}>
              <View style={styles.receivablesColumn}>
                <Typography variant="body" color={colors.warmGray}>
                  Recebido
                </Typography>
                <Typography
                  variant="moneyLg"
                  color={colors.wine}
                  style={[
                    styles.receivablesValue,
                    compactLayout && styles.receivablesValueCompact,
                    WEB_NOWRAP,
                  ]}
                >
                  {formatCurrency(ordersSummary.received)}
                </Typography>
              </View>
              <View style={styles.receivablesColumn}>
                <Typography variant="body" color={colors.warmGray}>
                  A receber
                </Typography>
                <Typography
                  variant="moneyLg"
                  color={colors.wine}
                  style={[
                    styles.receivablesValue,
                    compactLayout && styles.receivablesValueCompact,
                    WEB_NOWRAP,
                  ]}
                >
                  {formatCurrency(ordersSummary.toReceive)}
                </Typography>
              </View>
            </View>
            <View style={styles.receivablesProgressRow}>
              <View style={styles.receivablesTrack}>
                <View
                  style={[
                    styles.receivablesFill,
                    { width: `${receivedProgress}%` as DimensionValue },
                  ]}
                />
              </View>
              <Typography
                variant="bodyBold"
                color={colors.warmGray}
                style={styles.receivablesProgressLabel}
              >
                {receivedProgress}% recebido
              </Typography>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.exportCard}>
          <View style={styles.exportHeader}>
            <Typography variant="h3" color={colors.ink}>
              Exportar relatório
            </Typography>
            {!canExportFull && (
              <View style={styles.professionalBadge}>
                <AppIcon
                  name="diamond"
                  size={iconSizes.xs}
                  color={theme.colors.premium}
                />
                <Typography variant="captionBold" color={theme.colors.premium}>
                  {canExportBasic ? "Excel no Profissional" : "Premium"}
                </Typography>
              </View>
            )}
          </View>
          <View style={styles.exportRow}>
            <ExportButton
              icon="document-text-outline"
              label="PDF"
              loading={exporting === "pdf"}
              disabled={exporting !== null}
              onPress={() => void handleExport("pdf")}
              styles={styles}
            />
            <ExportButton
              icon="document-attach-outline"
              label="Excel"
              loading={exporting === "xlsx"}
              disabled={exporting !== null}
              onPress={() => void handleExport("xlsx")}
              styles={styles}
            />
          </View>
        </View>

        <View
          onLayout={(event) => {
            entriesSectionYRef.current = event.nativeEvent.layout.y;
          }}
          style={styles.entriesSection}
        >
          <View style={styles.entriesHeader}>
            <Typography
              variant="h2"
              color={colors.ink}
              style={[styles.entriesTitle, compactLayout && styles.entriesTitleCompact]}
            >
              Lançamentos
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Novo lançamento"
              onPress={openCreateEntry}
              style={({ pressed }) => [styles.newEntryButton, pressed && styles.pressed]}
            >
              <AppIcon name="add" size={iconSizes.sm} color={colors.onWine} />
              <Typography variant="captionBold" color={colors.onWine} style={WEB_NOWRAP}>
                Novo
              </Typography>
            </Pressable>
          </View>

          <View style={styles.searchField}>
            <AppIcon name="search-outline" size={iconSizes.md} color={colors.warmGray} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar lançamento"
              placeholderTextColor={colors.warmGray}
              style={styles.searchInput}
            />
            {searchTerm.length > 0 && (
              <Pressable
                onPress={() => setSearchTerm("")}
                accessibilityLabel="Limpar busca"
                hitSlop={10}
                accessibilityRole="button"
              >
                <AppIcon
                  name="close-circle"
                  size={iconSizes.md}
                  color={colors.warmGray}
                />
              </Pressable>
            )}
          </View>

          <FilterChipRow>
            <Chip
              label="Tudo"
              count={allEntries.length}
              selected={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <Chip
              label="Entradas"
              count={incomeCount}
              selected={filter === "income"}
              onPress={() => setFilter("income")}
            />
            <Chip
              label="Saídas"
              count={expenseCount}
              selected={filter === "expense"}
              onPress={() => setFilter("expense")}
            />
          </FilterChipRow>

          {filteredEntries.length > 0 ? (
            <Typography
              variant="caption"
              color={colors.warmGray}
              style={styles.entryCount}
            >
              {entryCountLabel(filteredEntries.length)}
            </Typography>
          ) : null}

          {filteredEntries.length > 0 ? (
            <View style={styles.entryGroups}>
              {groupEntriesByDate(filteredEntries).map((group) => (
                <View key={group.date} style={styles.entryGroupCard}>
                  <View style={styles.entryGroupHeader}>
                    <Typography
                      variant="captionBold"
                      color={colors.ink}
                      style={styles.entryGroupLabel}
                    >
                      {formatEntryGroupLabel(group.date)}
                    </Typography>
                    <Typography
                      variant="captionBold"
                      color={entryBalance(group.entries) >= 0 ? colors.wine : colors.rose}
                      style={[styles.entryGroupBalance, WEB_NOWRAP]}
                    >
                      {formatSignedCurrency(entryBalance(group.entries))}
                    </Typography>
                  </View>
                  <View>
                    {group.entries.map((entry, index) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        isLast={index === group.entries.length - 1}
                        narrow={viewportWidth < 390}
                        styles={styles}
                        onPress={() => {
                          if (onEntryPress) {
                            onEntryPress(entry.id);
                            return;
                          }
                          setSelectedEntry(entry);
                        }}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.entryListCard}>
              <View style={styles.emptyState}>
                <Image
                  source={financeEmpty}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Typography variant="h3" style={styles.emptyTitle}>
                  Nenhum lançamento por aqui
                </Typography>
                <Typography variant="caption" style={styles.emptyText}>
                  Registre entradas e saídas para acompanhar o lucro do mês.
                </Typography>
                <Button
                  title="Registrar lançamento"
                  onPress={openCreateEntry}
                  style={styles.emptyButton}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <CreateFinanceEntry
        visible={showCreateEntry}
        onClose={() => setShowCreateEntry(false)}
        onSuccess={() => setShowCreateEntry(false)}
      />

      {selectedEntry && (
        <StandardModal
          visible
          onClose={() => setSelectedEntry(null)}
          title={selectedEntry.description}
          subtitle={`${categoryLabel(
            selectedEntry.category,
            experienceCopy.materialNoun,
            experienceCopy.packagingNoun,
          )} • ${formatEntryDate(selectedEntry.date)}`}
          footer={
            <>
              <Pressable
                accessibilityRole="button"
                style={styles.detailSecondaryButton}
                onPress={() => setSelectedEntry(null)}
              >
                <Typography variant="bodyBold">Fechar</Typography>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={deleteEntry.isPending}
                style={[
                  styles.detailDeleteButton,
                  deleteEntry.isPending && styles.disabled,
                ]}
                onPress={() => {
                  showAlert({
                    title: "Excluir lançamento",
                    message: "Deseja remover este lançamento do financeiro?",
                    buttons: [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () => {
                          void deleteEntry
                            .mutateAsync(selectedEntry.id)
                            .then(() => setSelectedEntry(null))
                            .catch(() =>
                              showAlert({
                                title: "Erro",
                                message:
                                  "Não foi possível excluir o lançamento. Tente novamente.",
                              }),
                            );
                        },
                      },
                    ],
                  });
                }}
              >
                <AppIcon
                  name="trash-outline"
                  size={iconSizes.sm}
                  color={theme.colors.alert}
                />
                <Typography variant="bodyBold" color={theme.colors.alert}>
                  Excluir
                </Typography>
              </Pressable>
            </>
          }
        >
          <View style={{ flexShrink: 1, gap: spacing.lg }}>
            <View
              style={[
                styles.detailIcon,
                {
                  alignSelf: "center",
                  backgroundColor: toneColors(
                    selectedEntry.type === "income" ? "green" : "red",
                    colors,
                  ).iconBg,
                },
              ]}
            >
              <AppIcon
                name={selectedEntry.type === "income" ? "add" : "remove"}
                size={iconSizes.lg}
                color={
                  toneColors(selectedEntry.type === "income" ? "green" : "red", colors).fg
                }
              />
            </View>
            <View style={[styles.detailAmountRow, { marginTop: 0 }]}>
              <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                {selectedEntry.type === "income" ? "Entrada" : "Saída"}
              </Typography>
              <Typography
                variant="moneyLg"
                color={
                  toneColors(selectedEntry.type === "income" ? "green" : "red", colors).fg
                }
              >
                {selectedEntry.type === "income" ? "+ " : "- "}
                {formatCurrency(selectedEntry.amount)}
              </Typography>
            </View>
          </View>
        </StandardModal>
      )}

      {/* Seletor de mês/ano */}
      <StandardModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        title="Escolher mês"
      >
        <View style={{ flexShrink: 1, gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              onPress={() => setPickerYear((y) => y - 1)}
              hitSlop={12}
              accessibilityLabel="Ano anterior"
              accessibilityRole="button"
            >
              <AppIcon
                name="chevron-back"
                size={iconSizes.md}
                color={theme.colors.text}
              />
            </Pressable>
            <Typography variant="h2" color={theme.colors.text}>
              {pickerYear}
            </Typography>
            <Pressable
              onPress={() => setPickerYear((y) => y + 1)}
              hitSlop={12}
              accessibilityLabel="Próximo ano"
              accessibilityRole="button"
            >
              <AppIcon
                name="chevron-forward"
                size={iconSizes.md}
                color={theme.colors.text}
              />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1;
              const isSel = m === month && pickerYear === year;
              return (
                <Pressable
                  key={name}
                  onPress={() => {
                    setMonth(m);
                    setYear(pickerYear);
                    setShowMonthPicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  style={{
                    width: "30%",
                    flexGrow: 1,
                    minHeight: 48,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSel
                      ? theme.colors.primaryBg
                      : theme.colors.surface,
                  }}
                >
                  <Typography
                    variant="bodyBold"
                    color={isSel ? theme.colors.primaryStrong : theme.colors.text}
                  >
                    {name.slice(0, 3)}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              setMonth(now.getMonth() + 1);
              setYear(now.getFullYear());
              setShowMonthPicker(false);
            }}
            accessibilityRole="button"
            style={{ alignItems: "center", paddingVertical: spacing.sm }}
          >
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Ir para o mês atual
            </Typography>
          </Pressable>
        </View>
      </StandardModal>
    </>
  );
}

/** Contagem humana, sem "0 lançamentos". */
function entryCountLabel(count: number): string {
  if (count === 0) return "Nenhum lançamento";
  if (count === 1) return "1 lançamento";
  return `${count} lançamentos`;
}

function previousMonth(month: number) {
  return month === 1 ? 11 : month - 2;
}

function previousYear(month: number, year: number) {
  return month === 1 ? year - 1 : year;
}

function SummaryCard({
  label,
  value,
  description,
  tone,
  onPress,
  compact,
  stacked,
  styles,
}: Readonly<{
  label: string;
  value: string;
  description: string;
  tone: "green" | "red";
  onPress: () => void;
  compact: boolean;
  stacked: boolean;
  styles: FinanceStyles;
}>) {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);
  const tc = toneColors(tone, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${label.toLowerCase()} do período`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        compact && styles.summaryCardCompact,
        stacked && styles.summaryCardNarrow,
        { borderColor: tc.cardBorder, backgroundColor: tc.cardBg },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          compact && styles.summaryIconCompact,
          { backgroundColor: tc.iconBg },
        ]}
      >
        <AppIcon
          name={tone === "green" ? "arrow-down" : "arrow-up"}
          size={compact ? iconSizes.lg : iconSizes.xl}
          color={tc.fg}
          strokeWidth={2}
        />
      </View>
      <View style={[styles.summaryCopy, stacked && styles.summaryCopyNarrow]}>
        <Typography
          variant="bodyBold"
          color={colors.ink}
          style={[styles.summaryLabel, compact && styles.summaryLabelCompact]}
        >
          {label}
        </Typography>
        <Typography
          variant="money"
          color={tc.fg}
          style={[styles.summaryValue, compact && styles.summaryValueCompact, WEB_NOWRAP]}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={colors.warmGray}
          style={[
            styles.summaryDescription,
            compact && styles.summaryDescriptionCompact,
            WEB_NOWRAP,
          ]}
        >
          {description}
        </Typography>
      </View>
      <View
        style={[
          styles.summaryMenu,
          compact && styles.summaryMenuCompact,
          stacked && styles.summaryMenuNarrow,
        ]}
      >
        <AppIcon
          name="chevron-forward"
          size={compact ? iconSizes.xs : iconSizes.sm}
          color={colors.warmGray}
        />
      </View>
    </Pressable>
  );
}

function FlowBar({
  label,
  value,
  width,
  color,
  styles,
}: Readonly<{
  label: string;
  value: string;
  width: DimensionValue;
  color: string;
  styles: FinanceStyles;
}>) {
  return (
    <View style={styles.flowRow}>
      <View style={styles.flowLabelRow}>
        <Typography variant="captionBold">{label}</Typography>
        <Typography variant="captionBold" style={[styles.flowValue, WEB_NOWRAP]}>
          {value}
        </Typography>
      </View>
      <View style={styles.flowTrack}>
        <View style={[styles.flowFill, { backgroundColor: color, width }]} />
      </View>
    </View>
  );
}

function ExportButton({
  icon,
  label,
  loading,
  disabled,
  onPress,
  styles,
}: Readonly<{
  icon: AppIconName;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  styles: FinanceStyles;
}>) {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.exportButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.rose} />
      ) : (
        <>
          <AppIcon name={icon} size={iconSizes.md} color={colors.wine} />
          <Typography variant="bodyBold" color={colors.ink}>
            {label}
          </Typography>
        </>
      )}
    </Pressable>
  );
}

function FilterPill({
  label,
  selected,
  onPress,
  filled = false,
  compact = false,
  styles,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
  filled?: boolean;
  compact?: boolean;
  styles: FinanceStyles;
}>) {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);
  let textColor: string | undefined;
  if (selected) {
    textColor = filled ? colors.onWine : colors.wine;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.filterPill,
        compact && styles.periodPill,
        selected &&
          (filled ? styles.filterPillSelectedFilled : styles.filterPillSelected),
      ]}
    >
      <Typography
        variant="captionBold"
        color={textColor}
        style={[compact && styles.periodPillLabel, compact && WEB_NOWRAP]}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function EntryRow({
  entry,
  isLast,
  narrow = false,
  onPress,
  styles,
}: Readonly<{
  entry: FinanceEntry;
  isLast: boolean;
  narrow?: boolean;
  onPress?: () => void;
  styles: FinanceStyles;
}>) {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);
  const experienceCopy = useBusinessCopy();
  const isIncome = entry.type === "income";
  const tc = toneColors(isIncome ? "green" : "red", colors);
  const sign = isIncome ? "+" : "-";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.entryRow, narrow && styles.entryRowNarrow]}
    >
      <View style={[styles.entryIcon, { backgroundColor: tc.iconBg }]}>
        <AppIcon name={isIncome ? "add" : "remove"} size={iconSizes.sm} color={tc.fg} />
      </View>
      <View
        style={[
          styles.entryRowBody,
          narrow && styles.entryRowBodyNarrow,
          !isLast && styles.entryDivider,
        ]}
      >
        <View style={styles.entryMiddle}>
          <Typography variant="bodyBold" color={colors.ink} numberOfLines={2}>
            {entryDisplayDescription(entry, isIncome)}
          </Typography>
          <View style={styles.entryMetaRow}>
            <Typography variant="captionBold" style={styles.entryBadge}>
              {entry.category === "sale"
                ? "Venda"
                : categoryLabel(
                    entry.category,
                    experienceCopy.materialNoun,
                    experienceCopy.packagingNoun,
                  )}
            </Typography>
            <Typography variant="caption" color={colors.warmGray} numberOfLines={1}>
              {formatEntryDate(entry.date)}
            </Typography>
          </View>
        </View>
        <View style={[styles.entryRight, narrow && styles.entryRightNarrow]}>
          <Typography
            variant="bodyBold"
            color={tc.fg}
            style={[styles.entryAmount, WEB_NOWRAP]}
          >
            {sign} {formatCurrency(entry.amount)}
          </Typography>
          <AppIcon name="chevron-forward" size={iconSizes.sm} color={colors.warmGray} />
        </View>
      </View>
    </Pressable>
  );
}

function categoryLabel(
  category: string,
  materialNoun = "material",
  packagingNoun = "embalagem",
) {
  const labels: Record<string, string> = {
    material: capitalize(materialNoun),
    packaging: capitalize(packagingNoun),
    transport: "Transporte",
    fee: "Taxa",
    utility: "Utilidade",
    other: "Outro",
    sale: "Venda",
  };
  return labels[category] ?? category;
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

function entryDisplayDescription(entry: FinanceEntry, isIncome: boolean): string {
  const cleaned = entry.description
    .replace(/^Compra:\s*/i, "")
    .replace(/^\[[^\]]+\]\s*/, "")
    .trim();
  return cleaned || (isIncome ? "Entrada" : "Saída");
}

function groupEntriesByDate(entries: FinanceEntry[]) {
  const groups = new Map<string, FinanceEntry[]>();
  for (const entry of entries) {
    const date = entry.date.slice(0, 10);
    const group = groups.get(date);
    if (group) group.push(entry);
    else groups.set(date, [entry]);
  }
  return Array.from(groups, ([date, groupedEntries]) => ({
    date,
    entries: groupedEntries,
  }));
}

function formatEntryGroupLabel(date: string): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const localKey = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  if (date === localKey(today)) return "Hoje";
  if (date === localKey(yesterday)) return "Ontem";
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function formatEntryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatHeroCurrency(value: number): string {
  const formatted = formatCurrency(value);
  return formatted.startsWith("-") ? `- ${formatted.slice(1)}` : formatted;
}

function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign} ${formatCurrency(Math.abs(value))}`;
}

type FinanceStyles = ReturnType<typeof createStyles>;

/** Tons financeiros da referência: vinho para entradas, rosa queimado para saídas. */
function toneColors(tone: "green" | "red", colors: BrandScreenPalette) {
  if (tone === "green") {
    return {
      fg: colors.wine,
      iconBg: `${colors.lime}73`,
      cardBg: colors.softRose,
      cardBorder: colors.border,
    };
  }
  return {
    fg: colors.rose,
    iconBg: colors.softRose,
    cardBg: colors.softRose,
    cardBorder: colors.border,
  };
}

function createStyles(theme: Theme) {
  const c = theme.colors;
  const colors = brandScreenPalette(theme);
  const cardBg = colors.white;
  const cardBorder = colors.border;
  const subtleFill = colors.surface;
  const chipBg = colors.white;
  const badgeBg = colors.surface;
  const badgeFg = colors.warmGray;
  const deleteBorder = `${c.alert}73`;

  return StyleSheet.create({
    attentionIcon: {
      alignItems: "center",
      backgroundColor: colors.softRose,
      borderRadius: radii.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    attentionItem: {
      alignItems: "center",
      backgroundColor: colors.white,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 64,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    attentionSection: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    attentionTitle: {
      fontFamily: fonts.extraBold,
      fontSize: 24,
      lineHeight: 30,
    },
    balanceAlert: {
      alignItems: "center",
      backgroundColor: colors.softRose,
      borderColor: `${colors.rose}66`,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    balanceAlertAction: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      marginLeft: "auto",
    },
    balanceAlertCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    balanceAlertIcon: {
      alignItems: "center",
      backgroundColor: colors.softRose,
      borderRadius: radii.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    centered: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    content: {
      gap: spacing.xl,
      paddingBottom: 136,
      paddingHorizontal: spacing["3xl"],
      paddingTop: spacing["3xl"],
      width: "100%",
    },
    contentCompact: {
      alignSelf: "stretch",
      paddingHorizontal: 16,
      paddingTop: spacing.md,
      width: "auto",
    },
    contentDesktop: {
      alignSelf: "stretch",
      maxWidth: desktopWidths.data,
      paddingHorizontal: 0,
      width: "100%",
    },
    financeHeader: {
      paddingBottom: spacing.md,
      paddingTop: spacing.lg,
    },
    financeHeaderSubtitle: {
      fontSize: 11,
      lineHeight: 17,
      marginTop: 2,
    },
    financeHeaderTitle: {
      color: colors.ink,
      fontFamily: fonts.extraBold,
      fontSize: 27,
      lineHeight: 33,
    },
    customPeriodPill: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: "row",
      flexGrow: 0,
      flexShrink: 0,
      gap: spacing.xs,
      height: 44,
      justifyContent: "center",
      minWidth: 0,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      width: "33.5%",
    },
    customPeriodLabel: {
      fontSize: 11,
      flexShrink: 1,
      lineHeight: 16,
      minWidth: 0,
    },
    customPeriodLabelTight: {
      fontSize: 10,
    },
    disabled: {
      opacity: 0.6,
    },
    detailAmountRow: {
      backgroundColor: subtleFill,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      gap: spacing.sm,
      marginTop: spacing.xl,
      padding: spacing.lg,
    },
    detailDeleteButton: {
      alignItems: "center",
      borderColor: deleteBorder,
      borderRadius: radii.lg,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 52,
      justifyContent: "center",
    },
    detailIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    detailSecondaryButton: {
      alignItems: "center",
      backgroundColor: subtleFill,
      borderRadius: radii.lg,
      flex: 1,
      height: 52,
      justifyContent: "center",
    },
    emptyState: {
      alignItems: "center",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 300,
      padding: spacing.xl,
    },
    emptyButton: {
      marginTop: spacing.sm,
      minWidth: 200,
    },
    emptyImage: {
      height: 120,
      width: 150,
    },
    emptyTitle: {
      fontSize: 22,
      lineHeight: 28,
    },
    emptyText: {
      textAlign: "center",
    },
    entriesHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
      minWidth: 0,
    },
    entriesSection: {
      gap: 12,
      marginTop: spacing.md,
    },
    entriesTitle: {
      flexShrink: 1,
      fontFamily: fonts.extraBold,
      fontSize: 24,
      lineHeight: 30,
    },
    entriesTitleCompact: {
      fontSize: 21,
      lineHeight: 27,
    },
    entryBadge: {
      backgroundColor: badgeBg,
      borderRadius: radii.sm,
      color: badgeFg,
      fontSize: fontSizes.xs,
      fontFamily: fonts.extraBold,
      maxWidth: 120,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    entryAmount: {
      flexShrink: 0,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
      lineHeight: 22,
      minWidth: 92,
      textAlign: "right",
    },
    entryGroup: {
      gap: spacing.sm,
    },
    entryGroupCard: {
      backgroundColor: colors.white,
      borderColor: colors.border,
      borderRadius: radii.xl,
      borderWidth: 1,
      elevation: 1,
      shadowColor: colors.wineFill,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    entryGroupHeader: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
    },
    entryGroupBalance: {
      flexShrink: 0,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
      lineHeight: 22,
      textAlign: "right",
    },
    entryGroupLabel: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      minWidth: 0,
      textTransform: "uppercase",
    },
    entryGroups: {
      gap: 12,
    },
    entryCount: {
      fontSize: 13,
      lineHeight: 18,
    },
    entryDivider: {
      borderBottomColor: cardBorder,
      borderBottomWidth: 1,
    },
    entryIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      flexShrink: 0,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    entryListCard: {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii["2xl"],
      borderWidth: 1,
      overflow: "hidden",
    },
    entryMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    entryMiddle: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    entryRight: {
      alignItems: "center",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.xs,
    },
    entryRightNarrow: {
      alignSelf: "flex-end",
    },
    entryRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: spacing.lg,
    },
    entryRowNarrow: {
      alignItems: "flex-start",
    },
    entryRowBody: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 84,
      minWidth: 0,
      paddingVertical: 14,
    },
    entryRowBodyNarrow: {
      alignItems: "stretch",
      flexDirection: "column",
      gap: spacing.sm,
    },
    exportButton: {
      alignItems: "center",
      backgroundColor: colors.white,
      borderColor: cardBorder,
      borderRadius: radii.lg,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 56,
      justifyContent: "center",
    },
    exportRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    exportHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    exportCard: {
      backgroundColor: colors.white,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.xl,
    },
    filterPill: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: radii.full,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      minWidth: 80,
      paddingHorizontal: spacing.lg,
    },
    filterPillSelected: {
      backgroundColor: colors.softRose,
      borderColor: colors.rose,
    },
    filterPillSelectedFilled: {
      backgroundColor: colors.rose,
      borderColor: colors.rose,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.md,
      flexWrap: "wrap",
    },
    flowCard: {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      gap: spacing["2xl"],
      minHeight: 220,
      paddingHorizontal: spacing["2xl"],
      paddingVertical: spacing["3xl"],
    },
    flowFill: {
      borderRadius: radii.full,
      height: "100%",
      minWidth: 4,
    },
    flowHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    flowStatus: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    flowTitle: {
      fontFamily: fonts.bold,
      fontSize: 22,
      lineHeight: 28,
    },
    flowTitleCompact: {
      fontSize: 16,
      lineHeight: 21,
    },
    flowTitleTight: {
      fontSize: 15,
      lineHeight: 20,
    },
    flowStatusTextCompact: {
      fontSize: 14,
      lineHeight: 20,
    },
    flowLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    flowValue: {
      flexShrink: 0,
      fontVariant: ["tabular-nums"],
      minWidth: 112,
      textAlign: "right",
    },
    flowRow: {
      gap: spacing.sm,
    },
    flowTrack: {
      backgroundColor: colors.surface,
      borderRadius: radii.full,
      height: 9,
      overflow: "hidden",
    },
    heroCard: {
      minHeight: 300,
      padding: spacing["3xl"],
    },
    heroCardBase: {
      backgroundColor: colors.wineFill,
      borderRadius: radii["2xl"],
      overflow: "hidden",
    },
    heroCardNarrow: {
      padding: 20,
    },
    heroContent: {
      flex: 1,
      justifyContent: "center",
      maxWidth: "58%",
      zIndex: 1,
    },
    heroContentNarrow: {
      justifyContent: "center",
      maxWidth: "100%",
    },
    heroImage: {
      bottom: spacing.sm,
      height: "88%",
      position: "absolute",
      right: spacing.sm,
      width: "48%",
    },
    heroImageCompact: {
      height: "80%",
      right: spacing.xs,
      width: "44%",
    },
    heroImageNarrow: {
      aspectRatio: 1426 / 1103,
      maxHeight: 155,
      maxWidth: 190,
      position: "absolute",
      right: 12,
    },
    heroLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    heroLabelNarrow: {
      fontSize: 14,
      lineHeight: 20,
    },
    heroValue: {
      flexShrink: 0,
      fontSize: 52,
      fontVariant: ["tabular-nums"],
      lineHeight: 60,
      marginVertical: spacing.md,
    },
    heroValueCompact: {
      fontSize: 44,
      lineHeight: 52,
    },
    heroValueNarrow: {
      fontSize: 34,
      lineHeight: 42,
      marginBottom: 6,
      marginTop: 8,
    },
    heroValueTight: {
      fontSize: 28,
      lineHeight: 34,
    },
    newEntryButton: {
      alignItems: "center",
      backgroundColor: colors.rose,
      borderRadius: radii.lg,
      elevation: 3,
      flexDirection: "row",
      gap: spacing.xs,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      shadowColor: colors.wineFill,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
    },
    modal: {
      flex: 1,
    },
    monthSelector: {
      alignItems: "center",
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      height: 66,
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
    },
    monthArrow: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    monthTitle: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.lg,
      justifyContent: "center",
    },
    percentBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.lime,
      borderColor: colors.lime,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    percentBadgeText: {
      flexShrink: 0,
    },
    percentBadgeTextTight: {
      fontSize: 10,
      lineHeight: 14,
    },
    percentBadgeNarrow: {
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    periodFilterRow: {
      alignSelf: "stretch",
      flexWrap: "nowrap",
      gap: spacing.sm,
      marginTop: spacing["2xl"],
      maxWidth: 440,
    },
    periodFilterRowCompact: {
      marginTop: 0,
    },
    periodPill: {
      flexGrow: 0,
      flexShrink: 0,
      height: 44,
      minWidth: 0,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      width: "17.5%",
    },
    periodPillLabel: {
      fontSize: 13,
      lineHeight: 18,
    },
    professionalBadge: {
      alignItems: "center",
      backgroundColor: c.premiumBg,
      borderRadius: radii.sm,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    receivablesCard: {
      backgroundColor: colors.white,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      gap: spacing.xl,
      padding: spacing.xl,
    },
    receivablesColumn: {
      flex: 1,
      gap: spacing.sm,
      minWidth: 0,
    },
    receivablesColumns: {
      flexDirection: "row",
      gap: spacing.xl,
    },
    receivablesFill: {
      backgroundColor: colors.lime,
      borderRadius: radii.full,
      height: "100%",
    },
    receivablesHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    receivablesIcon: {
      alignItems: "center",
      backgroundColor: colors.softRose,
      borderRadius: radii.full,
      flexShrink: 0,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    receivablesProgressLabel: {
      flexShrink: 0,
      textAlign: "right",
    },
    receivablesProgressRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.lg,
    },
    receivablesTitle: {
      flex: 1,
    },
    receivablesTitleNarrow: {
      fontSize: 16,
      lineHeight: 22,
    },
    receivablesTitleRow: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minWidth: 0,
    },
    receivablesTrack: {
      backgroundColor: colors.surface,
      borderRadius: radii.full,
      flex: 1,
      height: 10,
      overflow: "hidden",
    },
    receivablesValue: {
      flexShrink: 0,
      fontVariant: ["tabular-nums"],
    },
    receivablesValueCompact: {
      fontSize: 21,
      lineHeight: 28,
    },
    pressed: {
      opacity: 0.82,
    },
    searchField: {
      alignItems: "center",
      backgroundColor: colors.white,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      height: 48,
      paddingHorizontal: spacing.lg,
      width: "100%",
    },
    searchInput: {
      color: colors.ink,
      flex: 1,
      fontSize: fontSizes.md,
      fontFamily: fonts.regular,
      minWidth: 0,
      padding: 0,
    },
    section: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    summaryCard: {
      alignItems: "center",
      borderRadius: radii.xl,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 148,
      overflow: "hidden",
      padding: spacing.xl,
    },
    summaryCardCompact: {
      gap: 6,
      minHeight: 140,
      padding: 10,
    },
    summaryCardNarrow: {
      alignItems: "flex-start",
      flexDirection: "column",
      gap: spacing.sm,
      minHeight: 172,
      padding: 14,
    },
    summaryCopy: {
      flex: 1,
      gap: spacing.sm,
      minWidth: 0,
      zIndex: 1,
    },
    summaryCopyNarrow: {
      alignSelf: "stretch",
      flex: undefined,
    },
    summaryDescription: {
      fontSize: 16,
      lineHeight: 22,
    },
    summaryDescriptionCompact: {
      fontSize: 13,
      lineHeight: 18,
    },
    summaryIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      flexShrink: 0,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    summaryIconCompact: {
      height: 40,
      width: 40,
    },
    summaryLabel: {
      fontSize: 18,
      lineHeight: 24,
    },
    summaryLabelCompact: {
      fontSize: 15,
      lineHeight: 20,
    },
    summaryMenu: { alignSelf: "center", zIndex: 2 },
    summaryMenuCompact: {
      position: "absolute",
      right: 10,
      top: 10,
    },
    summaryMenuNarrow: {
      position: "absolute",
      right: 14,
      top: 14,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    summaryValue: {
      fontSize: 24,
      fontVariant: ["tabular-nums"],
      lineHeight: 30,
    },
    summaryValueCompact: {
      fontSize: 17,
      lineHeight: 23,
    },
  });
}
