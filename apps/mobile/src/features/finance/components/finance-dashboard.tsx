import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../../shared/utils/format";
import {
  Button,
  darkTheme,
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
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import financeEmpty from "../../../assets/finance-empty.png";
import financeHero from "../../../assets/finance-hero.png";
import { useAuth } from "../../../shared/hooks/use-auth";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useProfile } from "../../subscription/hooks";
import { getExportUrl } from "../api";
import {
  countByType,
  profit as computeProfit,
  profitDeltaPct as computeProfitDeltaPct,
} from "../calc";
import { useDeleteFinanceEntry, useFinanceEntries, useFinanceSummary } from "../hooks";
import { CreateFinanceEntry } from "./create-finance-entry";
import { alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { ScreenHeader } from "../../../shared/components/screen-header";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  ResponsiveModal,
  ResponsiveOverlayModal,
} from "../../../shared/components/responsive-modal-surface";

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

interface FinanceDashboardProps {
  onEntryPress?: (id: string) => void;
  onAddPress?: () => void;
}

export function FinanceDashboard({
  onEntryPress,
  onAddPress,
}: Readonly<FinanceDashboardProps>) {
  const { theme } = useTheme();
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  const { data: summary, isLoading, error } = useFinanceSummary({ month, year });
  const { data: prevSummary } = useFinanceSummary({
    month: previousMonth(month) + 1,
    year: previousYear(month, year),
  });
  const { data: entries } = useFinanceEntries({ type: undefined });
  const deleteEntry = useDeleteFinanceEntry();

  const income = summary?.totalIncome ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const profit = computeProfit(income, expenses);
  const prevProfit = computeProfit(
    prevSummary?.totalIncome ?? 0,
    prevSummary?.totalExpenses ?? 0,
  );
  // So compara quando ha base: lucro anterior diferente de zero.
  const profitDeltaPct = computeProfitDeltaPct(profit, prevProfit);
  const allEntries = entries?.items ?? [];
  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allEntries.filter((entry) => {
      const matchesType = filter === "all" || entry.type === filter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        entry.description.toLowerCase().includes(normalizedSearch) ||
        categoryLabel(entry.category).toLowerCase().includes(normalizedSearch);

      return matchesType && matchesSearch;
    });
  }, [allEntries, filter, searchTerm]);
  const { incomeCount, expenseCount } = countByType(allEntries);

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { padding: spacing.xl }]}>
        <Typography variant="body">
          Não foi possível carregar o financeiro. Tente novamente.
        </Typography>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {!isDesktop && (
          <ScreenHeader
            title="Financeiro"
            style={{ paddingHorizontal: 0 }}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Escolher mês"
                onPress={handleOpenMonthPicker}
                hitSlop={12}
                style={styles.calendarButton}
              >
                <Ionicons
                  name="calendar-outline"
                  size={iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            }
          />
        )}

        <View style={[styles.monthSelector, isDesktop && styles.desktopMonthSelector]}>
          <View style={styles.monthNavigation}>
            <Pressable onPress={handlePrevMonth} hitSlop={12} accessibilityRole="button">
              <Ionicons
                name="chevron-back"
                size={iconSizes.lg}
                color={theme.colors.text}
              />
            </Pressable>
            <Typography variant="h2" color={theme.colors.text}>
              {MONTH_NAMES[month - 1]} {year}
            </Typography>
            <Pressable onPress={handleNextMonth} hitSlop={12} accessibilityRole="button">
              <Ionicons
                name="chevron-forward"
                size={iconSizes.lg}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
          {isDesktop && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escolher mês"
              onPress={handleOpenMonthPicker}
              style={({ pressed }) => [
                styles.desktopCalendarButton,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Typography variant="bodyBold" color={theme.colors.text}>
                Escolher mês
              </Typography>
            </Pressable>
          )}
        </View>

        <View style={styles.heroCard}>
          <Image source={financeHero} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroScrim} />
          <View style={styles.heroContent}>
            {/* Textos sobre o scrim escuro da foto: usam os tokens do tema
                escuro em ambos os modos (o fundo e sempre escuro). */}
            <Typography variant="h3" color={darkTheme.colors.textSecondary}>
              Seu lucro
            </Typography>
            <Typography
              variant="moneyHero"
              color={darkTheme.colors.success}
              style={styles.heroValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatCurrency(profit)}
            </Typography>
            {profitDeltaPct !== null && (
              <View style={styles.percentBadge}>
                <Ionicons
                  name={
                    profitDeltaPct >= 0 ? "trending-up-outline" : "trending-down-outline"
                  }
                  size={iconSizes.sm}
                  color={darkTheme.colors.success}
                />
                <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                  {profitDeltaPct >= 0 ? "+" : ""}
                  {profitDeltaPct}% vs. {MONTH_NAMES[previousMonth(month)]}{" "}
                  {previousYear(month, year)}
                </Typography>
              </View>
            )}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            icon="arrow-down-circle-outline"
            label="Entradas"
            value={formatCurrency(income)}
            description={entryCountLabel(incomeCount)}
            tone="green"
            theme={theme}
            styles={styles}
          />
          <SummaryCard
            icon="arrow-up-circle-outline"
            label="Saídas"
            value={formatCurrency(expenses)}
            description={entryCountLabel(expenseCount)}
            tone="red"
            theme={theme}
            styles={styles}
          />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography variant="h2">Exportar</Typography>
            {!canExportFull && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  backgroundColor: theme.colors.premiumBg,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.sm,
                }}
              >
                <Ionicons
                  name="diamond"
                  size={iconSizes.xs}
                  color={theme.colors.premium}
                />
                <Text
                  style={{
                    color: theme.colors.premium,
                    fontFamily: fonts.extraBold,
                    fontSize: fontSizes.xs,
                  }}
                >
                  {canExportBasic ? "Excel no Profissional" : "Profissional"}
                </Text>
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
          <Typography variant="h2">Hoje</Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSearch((visible) => !visible)}
            style={[styles.searchButton, showSearch && styles.searchButtonActive]}
          >
            <Ionicons
              name="search-outline"
              size={iconSizes.md}
              color={theme.colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
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
          <View style={styles.searchField}>
            <Ionicons
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
                hitSlop={10}
                accessibilityRole="button"
              >
                <Ionicons
                  name="close-circle"
                  size={iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        )}

        <Typography variant="body" style={styles.entryCount}>
          {entryCountLabel(filteredEntries.length)}
        </Typography>

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
              <Typography variant="h3">Nenhum lançamento por aqui</Typography>
              <Typography variant="caption" style={styles.emptyText}>
                Registre entradas e saídas para acompanhar o lucro do mês.
              </Typography>
              <Button title="Registrar lançamento" onPress={openCreateEntry} />
            </View>
          </View>
        )}

        <View style={styles.footerRow}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons
                name="bar-chart-outline"
                size={iconSizes.md}
                color={theme.colors.textSecondary}
              />
            </View>
            <Typography variant="caption" style={styles.tipText}>
              Acompanhe seus resultados e tome decisões para fazer seu negócio crescer
              ainda mais!
            </Typography>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateEntry}
            style={styles.addButtonWrap}
          >
            <View style={styles.addCircle}>
              <Ionicons
                name="add"
                size={iconSizes.lg}
                color={theme.colors.textOnPrimary}
              />
            </View>
            <Text style={styles.addLabel} numberOfLines={1} adjustsFontSizeToFit>
              Novo
            </Text>
            <Text style={styles.addLabel} numberOfLines={1} adjustsFontSizeToFit>
              lançamento
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ResponsiveModal
        desktopMaxWidth={840}
        visible={showCreateEntry}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCreateEntry(false)}
      >
        <SafeAreaView
          style={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <CreateFinanceEntry
            onClose={() => setShowCreateEntry(false)}
            onSuccess={() => setShowCreateEntry(false)}
          />
        </SafeAreaView>
      </ResponsiveModal>

      <ResponsiveOverlayModal
        visible={selectedEntry !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <View style={styles.detailOverlay}>
          <Pressable
            style={styles.detailBackdrop}
            onPress={() => setSelectedEntry(null)}
          />
          {selectedEntry && (
            <View style={[styles.detailCard, isDesktop && styles.detailCardDesktop]}>
              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.detailIcon,
                    {
                      backgroundColor: toneColors(
                        theme,
                        selectedEntry.type === "income" ? "green" : "red",
                      ).iconBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedEntry.type === "income" ? "add" : "remove"}
                    size={iconSizes.lg}
                    color={
                      toneColors(theme, selectedEntry.type === "income" ? "green" : "red")
                        .fg
                    }
                  />
                </View>
                <View style={styles.detailTitleWrap}>
                  <Typography variant="h2" numberOfLines={2}>
                    {selectedEntry.description}
                  </Typography>
                  <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                    {categoryLabel(selectedEntry.category)} •{" "}
                    {formatEntryDate(selectedEntry.date)}
                  </Typography>
                </View>
                <Pressable
                  onPress={() => setSelectedEntry(null)}
                  hitSlop={12}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="close"
                    size={iconSizes.md}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>

              <View style={styles.detailAmountRow}>
                <Typography variant="bodyBold" color={theme.colors.textSecondary}>
                  {selectedEntry.type === "income" ? "Entrada" : "Saída"}
                </Typography>
                <Typography
                  variant="moneyLg"
                  color={
                    toneColors(theme, selectedEntry.type === "income" ? "green" : "red")
                      .fg
                  }
                >
                  {selectedEntry.type === "income" ? "+ " : "- "}
                  {formatCurrency(selectedEntry.amount)}
                </Typography>
              </View>

              <View style={styles.detailActions}>
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
                  <Ionicons
                    name="trash-outline"
                    size={iconSizes.sm}
                    color={theme.colors.alert}
                  />
                  <Typography variant="bodyBold" color={theme.colors.alert}>
                    Excluir
                  </Typography>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ResponsiveOverlayModal>

      {/* Seletor de mês/ano */}
      <ResponsiveOverlayModal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable
          onPress={() => setShowMonthPicker(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Pressable
            style={[
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: radii["2xl"],
                padding: spacing.lg,
                gap: spacing.md,
              },
              isDesktop
                ? { width: "100%", maxWidth: 560, alignSelf: "center" }
                : undefined,
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h3">Escolher mês</Typography>
              <Pressable
                onPress={() => setShowMonthPicker(false)}
                hitSlop={10}
                accessibilityLabel="Fechar"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={iconSizes.md}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

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
                <Ionicons
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
                <Ionicons
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
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>
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
  icon,
  label,
  value,
  description,
  tone,
  theme,
  styles,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
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
      <View style={[styles.summaryIcon, { backgroundColor: tc.fg + "1F" }]}>
        <Ionicons name={icon} size={iconSizes.xl} color={tc.fg} />
      </View>
      <View style={styles.summaryCopy}>
        <Typography variant="bodyBold" numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Typography>
        <Typography
          variant="money"
          color={tc.fg}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {description}
        </Typography>
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
  icon: keyof typeof Ionicons.glyphMap;
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
          <Ionicons name={icon} size={iconSizes.md} color={theme.colors.textSecondary} />
          <Typography variant="h3" color={theme.colors.text}>
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
  theme,
  styles,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: Theme;
  styles: FinanceStyles;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterPill, selected && styles.filterPillSelected]}
    >
      <Typography
        variant="bodyBold"
        color={selected ? theme.colors.primaryStrong : undefined}
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
        <Ionicons name={isIncome ? "add" : "remove"} size={iconSizes.sm} color={tc.fg} />
      </View>
      <View style={styles.entryMiddle}>
        <Typography variant="bodyBold" numberOfLines={2}>
          {entryDisplayDescription(entry, isIncome)}
        </Typography>
        <View style={styles.entryMetaRow}>
          <Text style={styles.entryBadge} numberOfLines={1} adjustsFontSizeToFit>
            {entry.category === "sale" ? "Venda" : categoryLabel(entry.category)}
          </Text>
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
        <Ionicons
          name="chevron-forward"
          size={iconSizes.sm}
          color={theme.colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    material: "Material",
    packaging: "Embalagem",
    transport: "Transporte",
    fee: "Taxa",
    utility: "Utilidade",
    other: "Outro",
    sale: "Venda",
  };
  return labels[category] ?? category;
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
  const tipIconBg = c.surface;
  const deleteBorder = `${c.alert}73`;

  return StyleSheet.create({
    addButtonWrap: {
      alignItems: "center",
      gap: spacing.xs,
      width: 96,
    },
    addCircle: {
      alignItems: "center",
      backgroundColor: c.primaryInteractive,
      borderRadius: radii.full,
      height: 60,
      justifyContent: "center",
      width: 60,
      ...theme.shadows.md,
    },
    addLabel: {
      color: c.text,
      fontSize: fontSizes.xs,
      fontFamily: fonts.extraBold,
      textAlign: "center",
      width: "100%",
    },
    calendarButton: {
      alignItems: "center",
      borderRadius: radii.lg,
      borderColor: cardBorder,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      marginLeft: "auto",
      width: 48,
    },
    centered: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    content: {
      gap: spacing.xl,
      paddingBottom: spacing["3xl"],
      paddingHorizontal: spacing["2xl"],
      paddingTop: spacing.xl,
    },
    disabled: {
      opacity: 0.6,
    },
    detailActions: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    desktopCalendarButton: {
      alignItems: "center",
      backgroundColor: c.surfaceElevated,
      borderColor: cardBorder,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.lg,
    },
    desktopMonthSelector: {
      justifyContent: "space-between",
      marginVertical: spacing.xs,
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
    detailBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    detailCard: {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii["2xl"],
      borderWidth: 1,
      marginHorizontal: spacing["2xl"],
      padding: spacing.xl,
    },
    detailCardDesktop: {
      alignSelf: "center",
      marginHorizontal: 0,
      maxWidth: 560,
      width: "100%",
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
    detailHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
    },
    detailIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    detailOverlay: {
      backgroundColor: c.overlay,
      flex: 1,
      justifyContent: "center",
    },
    detailSecondaryButton: {
      alignItems: "center",
      backgroundColor: subtleFill,
      borderRadius: radii.lg,
      flex: 1,
      height: 52,
      justifyContent: "center",
    },
    detailTitleWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    emptyState: {
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing["3xl"],
    },
    emptyImage: {
      height: 118,
      width: 118,
    },
    emptyText: {
      textAlign: "center",
    },
    entriesHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
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
      borderRadius: radii.xl,
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
      borderWidth: 1.5,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      height: 56,
      justifyContent: "center",
    },
    exportRow: {
      flexDirection: "row",
      gap: spacing.lg,
    },
    filterPill: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: radii.full,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      paddingHorizontal: spacing["2xl"],
    },
    filterPillSelected: {
      backgroundColor: c.primaryBg,
      borderColor: c.primary,
    },
    filterRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: -spacing.sm,
    },
    footerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      marginTop: spacing.md,
    },
    heroCard: {
      // Sempre escuro: a foto + scrim ficam por cima em ambos os temas.
      backgroundColor: darkTheme.colors.surfaceElevated,
      borderRadius: radii["2xl"],
      borderColor: darkTheme.colors.border,
      borderWidth: 1.5,
      minHeight: 178,
      overflow: "hidden",
      padding: spacing["2xl"],
    },
    heroContent: {
      flex: 1,
      justifyContent: "center",
    },
    heroImage: {
      bottom: 0,
      height: "118%",
      opacity: 0.56,
      position: "absolute",
      right: -44,
      width: "72%",
    },
    heroScrim: {
      // Scrim constante sobre a foto (nao segue o tema).
      backgroundColor: "rgba(42, 30, 27, 0.32)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    heroValue: {
      marginTop: spacing.md,
    },
    modal: {
      flex: 1,
    },
    monthSelector: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing["3xl"],
      justifyContent: "center",
      marginVertical: spacing.sm,
    },
    monthNavigation: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing["3xl"],
    },
    percentBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      // Selo sobre o scrim da foto: vidro claro constante.
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
      gap: spacing.lg,
      marginTop: spacing.xs,
    },
    summaryCard: {
      alignItems: "center",
      borderRadius: radii.xl,
      borderWidth: 1.5,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 104,
      padding: spacing.lg,
    },
    summaryCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    summaryIcon: {
      alignItems: "center",
      borderRadius: radii.full,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.lg,
    },
    tipCard: {
      alignItems: "center",
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: radii.xl,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 88,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    tipIcon: {
      alignItems: "center",
      backgroundColor: tipIconBg,
      borderRadius: radii.full,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    tipText: {
      flex: 1,
    },
  });
}
