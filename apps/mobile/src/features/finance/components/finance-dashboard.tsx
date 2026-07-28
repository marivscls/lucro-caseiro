import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import { formatCurrency } from "../../../shared/utils/format";
import {
  Button,
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
import React, { useCallback, useMemo, useState } from "react";
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
} from "react-native";

import financeEmpty from "../../../assets/finance-reference-empty.png";
import financeHero from "../../../assets/finance-reference-hero.png";
import { useAuth } from "../../../shared/hooks/use-auth";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useProfile } from "../../subscription/hooks";
import { getExportUrl } from "../api";
import {
  countByType,
  financePeriodRange,
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
  const experienceCopy = useBusinessCopy();
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const compactLayout = viewportWidth < 700;
  const nativeCompactLayout = compactLayout && Platform.OS !== "web";
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

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

        if (Platform.OS === "web") {
          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
          headers: { Authorization: `Bearer ${token}` },
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
        style={{ paddingTop: spacing.md }}
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
            <AppIcon
              name="calendar-outline"
              size={iconSizes.md}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        }
      />

      <ScrollView
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
              theme={theme}
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
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={styles.customPeriodLabel}
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

        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroLabelRow}>
              <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                Lucro do período
              </Typography>
              <AppIcon
                name="information-circle-outline"
                size={iconSizes.xs}
                color={theme.colors.textSecondary}
              />
            </View>
            <Typography
              variant="moneyHero"
              color={profit >= 0 ? theme.colors.success : theme.colors.alert}
              style={styles.heroValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatCurrency(profit)}
            </Typography>
            {!hasNoMovements && profitDeltaPct !== null ? (
              <View style={styles.percentBadge}>
                <AppIcon
                  name={
                    profitDeltaPct >= 0 ? "trending-up-outline" : "trending-down-outline"
                  }
                  size={iconSizes.sm}
                  color={profitDeltaPct >= 0 ? theme.colors.success : theme.colors.alert}
                />
                <Typography
                  variant="captionBold"
                  color={profitDeltaPct >= 0 ? theme.colors.success : theme.colors.alert}
                >
                  {profitDeltaPct >= 0 ? "+" : ""}
                  {profitDeltaPct}% vs. {MONTH_NAMES[previousMonth(month)]}{" "}
                  {previousYear(month, year)}
                </Typography>
              </View>
            ) : null}
            {!hasNoMovements && profitDeltaPct === null ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Resultado dos lançamentos deste período
              </Typography>
            ) : null}
          </View>
          <Image
            source={financeHero}
            style={[
              styles.heroImage,
              nativeCompactLayout && styles.heroImageNativeCompact,
            ]}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        <View style={[styles.summaryRow, compactLayout && styles.summaryRowCompact]}>
          <SummaryCard
            label="Entradas"
            value={formatCurrency(income)}
            description={entryCountLabel(incomeCount)}
            tone="green"
            theme={theme}
            styles={styles}
          />
          <SummaryCard
            label="Saídas"
            value={formatCurrency(expenses)}
            description={entryCountLabel(expenseCount)}
            tone="red"
            theme={theme}
            styles={styles}
          />
        </View>

        <View style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <Typography
                variant="h3"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[styles.flowTitle, compactLayout && styles.flowTitleCompact]}
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
                color={profit >= 0 ? theme.colors.success : theme.colors.alert}
              >
                {profit >= 0 ? "Saldo positivo" : "Saldo negativo"}
              </Typography>
              <AppIcon
                name={profit >= 0 ? "trending-up-outline" : "trending-down-outline"}
                size={iconSizes.sm}
                color={profit >= 0 ? theme.colors.success : theme.colors.alert}
              />
            </View>
          </View>

          <FlowBar
            label="Entradas"
            value={formatCurrency(income)}
            width={incomeBarWidth}
            color={theme.colors.success}
            styles={styles}
          />
          <FlowBar
            label="Saídas"
            value={formatCurrency(expenses)}
            width={expenseBarWidth}
            color={theme.colors.alert}
            styles={styles}
          />
        </View>

        {negativeBalance > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver saídas do período"
            onPress={() => setFilter("expense")}
            style={({ pressed }) => [styles.balanceAlert, pressed && styles.pressed]}
          >
            <View style={styles.balanceAlertIcon}>
              <AppIcon
                name="alert-circle-outline"
                size={iconSizes.md}
                color={theme.colors.alert}
              />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Typography variant="bodyBold" color={theme.colors.alert}>
                As saídas superam as entradas
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Revise {formatCurrency(negativeBalance)} no período para entender o saldo.
              </Typography>
            </View>
            <View style={styles.balanceAlertAction}>
              <Typography variant="captionBold" color={theme.colors.alert}>
                Ver saídas
              </Typography>
              <AppIcon
                name="chevron-forward"
                size={iconSizes.sm}
                color={theme.colors.alert}
              />
            </View>
          </Pressable>
        ) : null}

        {overduePurchases.length > 0 ||
        dueSoonPurchases.length > 0 ||
        expiringQuotes.length > 0 ||
        unusual.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="h2">Precisa de atenção</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
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
                style={{
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: `${theme.colors.premium}66`,
                  backgroundColor: theme.colors.premiumBg,
                  padding: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <AppIcon
                  name="time-outline"
                  size={iconSizes.md}
                  color={theme.colors.premium}
                />
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">
                    {dueSoonPurchases.length} conta
                    {dueSoonPurchases.length === 1 ? "" : "s"} vence
                    {dueSoonPurchases.length === 1 ? "" : "m"} em até 7 dias
                  </Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Abra Compras para conferir e pagar.
                  </Typography>
                </View>
                <AppIcon
                  name="chevron-forward"
                  size={iconSizes.sm}
                  color={theme.colors.premium}
                />
              </Pressable>
            ) : null}

            {expiringQuotes.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/quotes")}
                style={{
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <AppIcon
                  name="document-text-outline"
                  size={iconSizes.md}
                  color={theme.colors.primaryStrong}
                />
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">
                    {expiringQuotes.length} orçamento
                    {expiringQuotes.length === 1 ? "" : "s"} perto do vencimento
                  </Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Revise a validade e faça o próximo contato.
                  </Typography>
                </View>
                <AppIcon
                  name="chevron-forward"
                  size={iconSizes.sm}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            ) : null}

            {unusual.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFilter("expense");
                  setSearchTerm(unusual[0].description);
                }}
                style={{
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: `${theme.colors.premium}66`,
                  backgroundColor: theme.colors.premiumBg,
                  padding: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <AppIcon
                  name="analytics-outline"
                  size={iconSizes.md}
                  color={theme.colors.premium}
                />
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">
                    Despesa acima do padrão: {formatCurrency(unusual[0].amount)}
                  </Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {unusual[0].description} está pelo menos 2× acima da mediana do
                    período.
                  </Typography>
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {ordersSummary && ordersSummary.totalOrders > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/tabs/agenda")}
            style={({ pressed }) => ({
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
              padding: spacing.lg,
              gap: spacing.md,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <AppIcon
                  name="time-outline"
                  size={iconSizes.md}
                  color={theme.colors.primaryStrong}
                />
                <Typography variant="h3">Recebimentos de encomendas</Typography>
              </View>
              <AppIcon
                name="chevron-forward"
                size={iconSizes.md}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Recebido
                </Typography>
                <Typography variant="bodyBold" color={theme.colors.success}>
                  {formatCurrency(ordersSummary.received)}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  A receber
                </Typography>
                <Typography variant="bodyBold" color={theme.colors.premium}>
                  {formatCurrency(ordersSummary.toReceive)}
                </Typography>
              </View>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <View style={styles.exportHeader}>
            <Typography variant="h2">Exportar</Typography>
            {!canExportFull && (
              <View style={styles.professionalBadge}>
                <AppIcon
                  name="diamond"
                  size={iconSizes.xs}
                  color={theme.colors.premium}
                />
                <Typography variant="captionBold" color={theme.colors.premium}>
                  Profissional
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
              theme={theme}
              styles={styles}
            />
            <ExportButton
              icon="document-attach-outline"
              label="Excel"
              loading={exporting === "xlsx"}
              disabled={exporting !== null}
              onPress={() => void handleExport("xlsx")}
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.entriesHeader}>
          <Typography variant="h2">Lançamentos</Typography>
          <View style={styles.entriesActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buscar lançamento"
              onPress={() => setShowSearch((visible) => !visible)}
              style={[styles.searchButton, showSearch && styles.searchButtonActive]}
            >
              <AppIcon
                name="search-outline"
                size={iconSizes.md}
                color={theme.colors.text}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Novo lançamento"
              onPress={openCreateEntry}
              style={({ pressed }) => [styles.newEntryButton, pressed && styles.pressed]}
            >
              <AppIcon
                name="add"
                size={iconSizes.sm}
                color={theme.colors.primaryStrong}
              />
              <Typography variant="captionBold" color={theme.colors.primaryStrong}>
                Novo lançamento
              </Typography>
            </Pressable>
          </View>
        </View>

        <View style={[styles.filterRow, styles.entryFilterRow]}>
          <FilterPill
            label="Tudo"
            selected={filter === "all"}
            onPress={() => setFilter("all")}
            theme={theme}
            styles={styles}
          />
          <FilterPill
            label="Entradas"
            selected={filter === "income"}
            onPress={() => setFilter("income")}
            theme={theme}
            styles={styles}
          />
          <FilterPill
            label="Saídas"
            selected={filter === "expense"}
            onPress={() => setFilter("expense")}
            theme={theme}
            styles={styles}
          />
        </View>

        {showSearch && (
          <View
            style={[
              styles.searchField,
              isDesktop && { alignSelf: "flex-start", maxWidth: 480, width: "100%" },
            ]}
          >
            <AppIcon
              name="search-outline"
              size={iconSizes.md}
              color={theme.colors.textSecondary}
            />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar lançamento..."
              placeholderTextColor={theme.colors.textSecondary}
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
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        )}

        {filteredEntries.length > 0 ? (
          <Typography variant="body" style={styles.entryCount}>
            {entryCountLabel(filteredEntries.length)}
          </Typography>
        ) : null}

        {filteredEntries.length > 0 ? (
          <View style={styles.entryGroups}>
            {groupEntriesByDate(filteredEntries).map((group) => (
              <View key={group.date} style={styles.entryGroup}>
                <Typography variant="caption" style={styles.entryGroupLabel}>
                  {formatEntryGroupLabel(group.date)}
                </Typography>
                <View style={styles.entryListCard}>
                  {group.entries.map((entry, index) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      isLast={index === group.entries.length - 1}
                      theme={theme}
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
                    theme,
                    selectedEntry.type === "income" ? "green" : "red",
                  ).iconBg,
                },
              ]}
            >
              <AppIcon
                name={selectedEntry.type === "income" ? "add" : "remove"}
                size={iconSizes.lg}
                color={
                  toneColors(theme, selectedEntry.type === "income" ? "green" : "red").fg
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
                  toneColors(theme, selectedEntry.type === "income" ? "green" : "red").fg
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
  theme,
  styles,
}: Readonly<{
  label: string;
  value: string;
  description: string;
  tone: "green" | "red";
  theme: Theme;
  styles: FinanceStyles;
}>) {
  const tc = toneColors(theme, tone);

  return (
    <View
      style={[
        styles.summaryCard,
        { borderColor: tc.cardBorder, backgroundColor: tc.cardBg },
      ]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: `${tc.fg}1F` }]}>
        <AppIcon
          name={tone === "green" ? "arrow-down" : "arrow-up"}
          size={iconSizes.xl}
          color={tc.fg}
          strokeWidth={2}
        />
      </View>
      <View style={styles.summaryCopy}>
        <Typography
          variant="bodyBold"
          color={theme.colors.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.summaryLabel}
        >
          {label}
        </Typography>
        <Typography
          variant="money"
          color={tc.fg}
          numberOfLines={1}
          style={styles.summaryValue}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.summaryDescription}
        >
          {description}
        </Typography>
      </View>
      <View style={styles.summaryMenu}>
        <AppIcon
          name="ellipsis-vertical"
          size={iconSizes.sm}
          color={theme.colors.textSecondary}
        />
      </View>
    </View>
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
        <Typography variant="captionBold">{value}</Typography>
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
  theme,
  styles,
}: Readonly<{
  icon: AppIconName;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
  theme: Theme;
  styles: FinanceStyles;
}>) {
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
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <>
          <AppIcon name={icon} size={iconSizes.md} color={theme.colors.textSecondary} />
          <Typography variant="bodyBold" color={theme.colors.text}>
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
  theme,
  styles,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
  filled?: boolean;
  compact?: boolean;
  theme: Theme;
  styles: FinanceStyles;
}>) {
  let textColor: string | undefined;
  if (selected) {
    textColor = filled ? theme.colors.textOnPrimary : theme.colors.primaryStrong;
  }

  return (
    <Pressable
      accessibilityRole="button"
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
        numberOfLines={1}
        adjustsFontSizeToFit={compact}
        minimumFontScale={0.8}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function EntryRow({
  entry,
  isLast,
  onPress,
  theme,
  styles,
}: Readonly<{
  entry: FinanceEntry;
  isLast: boolean;
  onPress?: () => void;
  theme: Theme;
  styles: FinanceStyles;
}>) {
  const experienceCopy = useBusinessCopy();
  const isIncome = entry.type === "income";
  const tc = toneColors(theme, isIncome ? "green" : "red");
  const sign = isIncome ? "+" : "-";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.entryRow, !isLast && styles.entryDivider]}
    >
      <View style={[styles.entryIcon, { backgroundColor: tc.iconBg }]}>
        <AppIcon name={isIncome ? "add" : "remove"} size={iconSizes.sm} color={tc.fg} />
      </View>
      <View style={styles.entryMiddle}>
        <Typography variant="bodyBold" numberOfLines={2}>
          {entryDisplayDescription(entry, isIncome)}
        </Typography>
        <View style={styles.entryMetaRow}>
          <Typography
            variant="captionBold"
            style={styles.entryBadge}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {entry.category === "sale"
              ? "Venda"
              : categoryLabel(
                  entry.category,
                  experienceCopy.materialNoun,
                  experienceCopy.packagingNoun,
                )}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {formatEntryDate(entry.date)}
          </Typography>
        </View>
      </View>
      <View style={styles.entryRight}>
        <Typography
          variant="bodyBold"
          color={tc.fg}
          style={styles.entryAmount}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {sign} {formatCurrency(entry.amount)}
        </Typography>
        <AppIcon
          name="chevron-forward"
          size={iconSizes.sm}
          color={theme.colors.textSecondary}
        />
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

type FinanceStyles = ReturnType<typeof createStyles>;

/** Cores de entrada (verde) e saída (vermelho/rosa), derivadas dos tokens do tema. */
function toneColors(theme: Theme, tone: "green" | "red") {
  const c = theme.colors;
  if (tone === "green") {
    return {
      fg: c.success,
      iconBg: c.successBg,
      cardBg: c.successBg,
      cardBorder: `${c.success}66`,
    };
  }
  return {
    fg: c.alert,
    iconBg: c.alertBg,
    cardBg: c.alertBg,
    cardBorder: `${c.alert}66`,
  };
}

function createStyles(theme: Theme) {
  const c = theme.colors;
  const cardBg = c.surfaceElevated;
  const cardBorder = c.border;
  const subtleFill = c.surface;
  const chipBg = c.surface;
  const badgeBg = c.surface;
  const badgeFg = c.textSecondary;
  const deleteBorder = `${c.alert}73`;

  return StyleSheet.create({
    balanceAlert: {
      alignItems: "center",
      backgroundColor: c.alertBg,
      borderColor: `${c.alert}66`,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
    },
    balanceAlertAction: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    balanceAlertIcon: {
      alignItems: "center",
      backgroundColor: `${c.alert}1F`,
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      width: "auto",
    },
    contentDesktop: {
      alignSelf: "stretch",
      maxWidth: desktopWidths.data,
      paddingHorizontal: 0,
      width: "100%",
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
      flexShrink: 1,
      minWidth: 0,
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
      gap: spacing.md,
      justifyContent: "space-between",
      marginTop: spacing.md,
    },
    entriesActions: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    entryFilterRow: {
      marginTop: -spacing.sm,
    },
    entryBadge: {
      backgroundColor: badgeBg,
      borderRadius: radii.sm,
      color: badgeFg,
      fontSize: fontSizes.xs,
      fontFamily: fonts.extraBold,
      maxWidth: 94,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    entryAmount: {
      textAlign: "right",
    },
    entryGroup: {
      gap: spacing.sm,
    },
    entryGroupLabel: {
      marginLeft: spacing.xs,
      textTransform: "capitalize",
    },
    entryGroups: {
      gap: spacing.lg,
    },
    entryCount: {
      marginTop: -spacing.sm,
    },
    entryDivider: {
      borderBottomColor: cardBorder,
      borderBottomWidth: 1,
    },
    entryIcon: {
      alignItems: "center",
      borderRadius: radii.xl,
      flexShrink: 0,
      height: 42,
      justifyContent: "center",
      width: 42,
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
      gap: spacing.sm,
    },
    entryMiddle: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    entryRight: {
      alignItems: "flex-end",
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.xs,
    },
    entryRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 84,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    exportButton: {
      alignItems: "center",
      borderColor: cardBorder,
      borderRadius: radii.lg,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 48,
      justifyContent: "center",
    },
    exportRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    exportHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
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
      backgroundColor: c.primaryBg,
      borderColor: c.primary,
    },
    filterPillSelectedFilled: {
      backgroundColor: c.primary,
      borderColor: c.primary,
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
      gap: spacing.xl,
      minHeight: 240,
      padding: spacing["2xl"],
    },
    flowFill: {
      borderRadius: radii.full,
      height: "100%",
      minWidth: 4,
    },
    flowHeader: {
      alignItems: "flex-start",
      flexDirection: "row",
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
      fontSize: 19,
      lineHeight: 24,
    },
    flowLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    flowRow: {
      gap: spacing.sm,
    },
    flowTrack: {
      backgroundColor: c.surface,
      borderRadius: radii.full,
      height: 9,
      overflow: "hidden",
    },
    heroCard: {
      backgroundColor: cardBg,
      borderRadius: radii["2xl"],
      borderColor: `${c.success}73`,
      borderWidth: 1,
      minHeight: 236,
      overflow: "hidden",
      padding: spacing["4xl"],
    },
    heroContent: {
      flex: 1,
      justifyContent: "center",
      maxWidth: "58%",
      zIndex: 1,
    },
    heroImage: {
      bottom: -spacing.xl,
      height: "96%",
      position: "absolute",
      right: -spacing.sm,
      width: "48%",
    },
    heroImageNativeCompact: {
      bottom: -spacing.lg,
      height: "128%",
      right: -spacing["2xl"],
      width: "70%",
    },
    heroLabelRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    heroValue: {
      fontSize: 56,
      lineHeight: 64,
      marginVertical: spacing.md,
    },
    newEntryButton: {
      alignItems: "center",
      backgroundColor: c.primaryBg,
      borderColor: `${c.primary}73`,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      height: 42,
      justifyContent: "center",
      paddingHorizontal: spacing.md,
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
      flexDirection: "row",
      gap: spacing.lg,
    },
    percentBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: subtleFill,
      borderColor: cardBorder,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
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
    professionalBadge: {
      alignItems: "center",
      backgroundColor: c.premiumBg,
      borderRadius: radii.sm,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pressed: {
      opacity: 0.82,
    },
    searchButton: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: radii.lg,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    searchButtonActive: {
      borderColor: c.primary,
    },
    searchField: {
      alignItems: "center",
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      height: 56,
      paddingHorizontal: spacing.lg,
    },
    searchInput: {
      color: c.text,
      flex: 1,
      fontSize: fontSizes.md,
      fontFamily: fonts.bold,
      padding: 0,
    },
    section: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    summaryCard: {
      alignItems: "center",
      borderRadius: radii.xl,
      borderWidth: 0,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 188,
      overflow: "hidden",
      paddingBottom: spacing["2xl"],
      paddingLeft: spacing["2xl"],
      paddingRight: spacing.xl,
      paddingTop: spacing["2xl"],
    },
    summaryCopy: {
      flex: 1,
      gap: spacing.sm,
      zIndex: 1,
    },
    summaryDescription: {
      fontSize: 16,
      lineHeight: 22,
    },
    summaryIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      flexShrink: 0,
      height: 64,
      justifyContent: "center",
      width: 64,
    },
    summaryLabel: {
      fontSize: 18,
      lineHeight: 24,
    },
    summaryMenu: {
      alignSelf: "flex-start",
      zIndex: 2,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    summaryRowCompact: {
      flexDirection: "column",
    },
    summaryValue: {
      fontSize: 28,
      lineHeight: 34,
    },
  });
}
