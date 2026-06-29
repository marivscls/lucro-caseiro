import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../../shared/utils/format";
import { Button, spacing, useTheme, type Theme } from "@lucro-caseiro/ui";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { token } = useAuth();
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
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
      if (!isPremium) {
        showPaywall("export");
        return;
      }
      if (!token) return;
      setExporting(format);

      try {
        const monthStr = `${year}-${String(month).padStart(2, "0")}`;
        const url = getExportUrl(format, monthStr);
        const ext = format === "pdf" ? "pdf" : "xlsx";
        const filename = `relatorio-financeiro-${monthStr}.${ext}`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        const result = await FileSystem.downloadAsync(url, fileUri, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (result.status !== 200) throw new Error("Falha ao baixar arquivo");

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
    [token, year, month, isPremium, showPaywall],
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
        <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
          Não foi possível carregar o financeiro. Tente novamente.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.headerIcon}
          >
            <Ionicons name="arrow-back" size={31} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Financeiro
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher mês"
            onPress={() => {
              if (!isPremium) {
                showPaywall("reports");
                return;
              }
              setPickerYear(year);
              setShowMonthPicker(true);
            }}
            hitSlop={12}
            style={styles.calendarButton}
          >
            <Ionicons name="calendar-outline" size={28} color={theme.colors.primary} />
          </Pressable>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} hitSlop={12}>
            <Ionicons name="chevron-back" size={30} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.colors.primary }]}>
            {MONTH_NAMES[month - 1]} {year}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} hitSlop={12}>
            <Ionicons name="chevron-forward" size={30} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Image source={financeHero} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Seu lucro</Text>
            <Text style={styles.heroValue}>{formatCurrency(profit)}</Text>
            {profitDeltaPct !== null && (
              <View style={styles.percentBadge}>
                <Ionicons
                  name={
                    profitDeltaPct >= 0 ? "trending-up-outline" : "trending-down-outline"
                  }
                  size={18}
                  color="#DDF4E7"
                />
                <Text style={styles.percentText}>
                  {profitDeltaPct >= 0 ? "+" : ""}
                  {profitDeltaPct}% vs. {MONTH_NAMES[previousMonth(month)]}{" "}
                  {previousYear(month, year)}
                </Text>
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
            <Text style={styles.sectionTitle}>Exportar</Text>
            {!isPremium && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: theme.colors.premiumBg,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="diamond" size={13} color={theme.colors.premium} />
                <Text
                  style={{
                    color: theme.colors.premium,
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  Premium
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
          <Text style={styles.sectionTitle}>Hoje</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowSearch((visible) => !visible)}
            style={[styles.searchButton, showSearch && styles.searchButtonActive]}
          >
            <Ionicons name="search-outline" size={23} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <FilterPill
            label="Tudo"
            selected={filter === "all"}
            onPress={() => setFilter("all")}
            styles={styles}
          />
          <FilterPill
            label="Entradas"
            selected={filter === "income"}
            onPress={() => setFilter("income")}
            styles={styles}
          />
          <FilterPill
            label="Saídas"
            selected={filter === "expense"}
            onPress={() => setFilter("expense")}
            styles={styles}
          />
        </View>

        {showSearch && (
          <View style={styles.searchField}>
            <Ionicons
              name="search-outline"
              size={25}
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
              <TouchableOpacity onPress={() => setSearchTerm("")} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.entryCount}>{entryCountLabel(filteredEntries.length)}</Text>

        <View style={styles.entryListCard}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isLast={index === filteredEntries.length - 1}
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
            ))
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={financeEmpty}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Nenhum lançamento por aqui</Text>
              <Text style={styles.emptyText}>
                Registre entradas e saídas para acompanhar o lucro do mês.
              </Text>
              <Button title="Registrar lançamento" onPress={openCreateEntry} />
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name="bar-chart-outline" size={27} color="#D6748B" />
            </View>
            <Text style={styles.tipText}>
              Acompanhe seus resultados e tome decisões para fazer seu negócio crescer
              ainda mais!
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openCreateEntry}
            style={styles.addButtonWrap}
          >
            <View style={styles.addCircle}>
              <Ionicons name="add" size={36} color="#FFFFFF" />
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

      <Modal
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
      </Modal>

      <Modal
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
            <View style={styles.detailCard}>
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
                    size={28}
                    color={
                      toneColors(theme, selectedEntry.type === "income" ? "green" : "red")
                        .fg
                    }
                  />
                </View>
                <View style={styles.detailTitleWrap}>
                  <Text style={styles.detailTitle} numberOfLines={2}>
                    {selectedEntry.description}
                  </Text>
                  <Text style={styles.detailSubtitle}>
                    {categoryLabel(selectedEntry.category)} •{" "}
                    {formatEntryDate(selectedEntry.date)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedEntry(null)} hitSlop={12}>
                  <Ionicons name="close" size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailAmountRow}>
                <Text style={styles.detailAmountLabel}>
                  {selectedEntry.type === "income" ? "Entrada" : "Saída"}
                </Text>
                <Text
                  style={[
                    styles.detailAmount,
                    {
                      color: toneColors(
                        theme,
                        selectedEntry.type === "income" ? "green" : "red",
                      ).fg,
                    },
                  ]}
                >
                  {selectedEntry.type === "income" ? "+ " : "- "}
                  {formatCurrency(selectedEntry.amount)}
                </Text>
              </View>

              <View style={styles.detailActions}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.detailSecondaryButton}
                  onPress={() => setSelectedEntry(null)}
                >
                  <Text style={styles.detailSecondaryText}>Fechar</Text>
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
                  <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
                  <Text style={styles.detailDeleteText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Seletor de mês/ano */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <Pressable
          onPress={() => setShowMonthPicker(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Pressable
            style={{
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: 24,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={[styles.monthText, { color: theme.colors.text, fontSize: 18 }]}
              >
                Escolher mês
              </Text>
              <Pressable
                onPress={() => setShowMonthPicker(false)}
                hitSlop={10}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={26} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y - 1)}
                hitSlop={12}
                accessibilityLabel="Ano anterior"
              >
                <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: theme.colors.primary }]}>
                {pickerYear}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerYear((y) => y + 1)}
                hitSlop={12}
                accessibilityLabel="Próximo ano"
              >
                <Ionicons name="chevron-forward" size={28} color={theme.colors.text} />
              </TouchableOpacity>
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
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSel
                        ? theme.colors.primary
                        : theme.colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: isSel ? theme.colors.textOnPrimary : theme.colors.text,
                      }}
                    >
                      {name.slice(0, 3)}
                    </Text>
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
              <Text
                style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 15 }}
              >
                Ir para o mês atual
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
        <Ionicons name={icon} size={37} color={tc.fg} />
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
        <Text
          style={[styles.summaryValue, { color: tc.fg }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Text>
        <Text
          style={styles.summaryDescription}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {description}
        </Text>
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
          <Ionicons name={icon} size={28} color={theme.colors.primary} />
          <Text style={styles.exportLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function FilterPill({
  label,
  selected,
  onPress,
  styles,
}: Readonly<{
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: FinanceStyles;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterPill, selected && styles.filterPillSelected]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
        {label}
      </Text>
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
        <Ionicons name={isIncome ? "add" : "remove"} size={30} color={tc.fg} />
      </View>
      <View style={styles.entryMiddle}>
        <Text style={styles.entryTitle} numberOfLines={1}>
          {entry.description || (isIncome ? "Entrada" : "Saída")}
        </Text>
        <View style={styles.entryMetaRow}>
          <Text style={styles.entryBadge} numberOfLines={1} adjustsFontSizeToFit>
            {entry.category === "sale" ? "Venda" : categoryLabel(entry.category)}
          </Text>
          <Text style={styles.entryDate} numberOfLines={1}>
            {formatEntryDate(entry.date)}
          </Text>
        </View>
      </View>
      <View style={styles.entryRight}>
        <Text
          style={[styles.entryAmount, { color: tc.fg }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {sign} {formatCurrency(entry.amount)}
        </Text>
        <Ionicons name="chevron-forward" size={26} color={theme.colors.textSecondary} />
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

function formatEntryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type FinanceStyles = ReturnType<typeof createStyles>;

/** Cores de entrada (verde) e saída (vermelho/rosa) ajustadas por tema. */
function toneColors(theme: Theme, tone: "green" | "red") {
  const isDark = theme.mode === "dark";
  if (tone === "green") {
    return {
      fg: isDark ? "#6ED0A1" : "#2E7D52",
      iconBg: isDark ? "#173B2A" : "rgba(107, 191, 150, 0.18)",
      cardBg: isDark ? "rgba(38, 120, 78, 0.26)" : "rgba(107, 191, 150, 0.16)",
      cardBorder: isDark ? "rgba(96, 196, 143, 0.32)" : "rgba(107, 191, 150, 0.5)",
    };
  }
  return {
    fg: isDark ? "#E07188" : "#B04559",
    iconBg: isDark ? "#49252D" : "rgba(176, 69, 89, 0.14)",
    cardBg: isDark ? "rgba(120, 42, 55, 0.28)" : "rgba(176, 69, 89, 0.1)",
    cardBorder: isDark ? "rgba(224, 113, 136, 0.45)" : "rgba(176, 69, 89, 0.4)",
  };
}

function createStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  const c = theme.colors;
  const cardBg = c.surfaceElevated;
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(74, 50, 40, 0.1)";
  const subtleFill = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(74, 50, 40, 0.05)";
  const chipBg = isDark ? "rgba(45, 38, 35, 0.82)" : c.surface;
  const badgeBg = isDark ? "rgba(121, 49, 61, 0.55)" : "rgba(196, 112, 126, 0.16)";
  const badgeFg = isDark ? "#EF8DA1" : c.primary;
  const tipIconBg = isDark ? "rgba(118, 54, 66, 0.42)" : "rgba(196, 112, 126, 0.16)";
  const deleteBorder = isDark ? "rgba(255, 123, 138, 0.45)" : "rgba(176, 69, 89, 0.45)";

  return StyleSheet.create({
    addButtonWrap: {
      alignItems: "center",
      gap: 2,
      width: 96,
    },
    addCircle: {
      alignItems: "center",
      backgroundColor: c.primary,
      borderRadius: 30,
      elevation: 10,
      height: 60,
      justifyContent: "center",
      shadowColor: c.primary,
      shadowOpacity: 0.45,
      shadowRadius: 18,
      width: 60,
    },
    addLabel: {
      color: c.text,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
      width: "100%",
    },
    bodyText: {
      fontSize: 16,
    },
    calendarButton: {
      alignItems: "center",
      borderRadius: 15,
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
      gap: 18,
      paddingBottom: 34,
      paddingHorizontal: 22,
      paddingTop: 18,
    },
    disabled: {
      opacity: 0.6,
    },
    detailActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 18,
    },
    detailAmount: {
      fontSize: 30,
      fontWeight: "900",
    },
    detailAmountLabel: {
      color: c.textSecondary,
      fontSize: 16,
      fontWeight: "700",
    },
    detailAmountRow: {
      backgroundColor: subtleFill,
      borderColor: cardBorder,
      borderRadius: 18,
      borderWidth: 1,
      gap: 6,
      marginTop: 18,
      padding: 16,
    },
    detailBackdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    detailCard: {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: 24,
      borderWidth: 1,
      marginHorizontal: 22,
      padding: 18,
    },
    detailDeleteButton: {
      alignItems: "center",
      borderColor: deleteBorder,
      borderRadius: 16,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: 8,
      height: 52,
      justifyContent: "center",
    },
    detailDeleteText: {
      color: c.alert,
      fontSize: 16,
      fontWeight: "900",
    },
    detailHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
    },
    detailIcon: {
      alignItems: "center",
      borderRadius: 26,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    detailOverlay: {
      backgroundColor: "rgba(0,0,0,0.62)",
      flex: 1,
      justifyContent: "center",
    },
    detailSecondaryButton: {
      alignItems: "center",
      backgroundColor: subtleFill,
      borderRadius: 16,
      flex: 1,
      height: 52,
      justifyContent: "center",
    },
    detailSecondaryText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "900",
    },
    detailSubtitle: {
      color: c.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    detailTitle: {
      color: c.text,
      fontSize: 22,
      fontWeight: "900",
    },
    detailTitleWrap: {
      flex: 1,
      gap: 4,
    },
    emptyState: {
      alignItems: "center",
      gap: 7,
      padding: 28,
    },
    emptyImage: {
      height: 118,
      width: 118,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: "center",
    },
    emptyTitle: {
      color: c.text,
      fontSize: 19,
      fontWeight: "800",
    },
    entriesHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    entryAmount: {
      fontSize: 16,
      fontWeight: "900",
    },
    entryBadge: {
      backgroundColor: badgeBg,
      borderRadius: 9,
      color: badgeFg,
      fontSize: 13,
      fontWeight: "800",
      maxWidth: 94,
      overflow: "hidden",
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    entryCount: {
      color: c.textSecondary,
      fontSize: 16,
      marginTop: -8,
    },
    entryDate: {
      color: c.textSecondary,
      fontSize: 15,
    },
    entryDivider: {
      borderBottomColor: cardBorder,
      borderBottomWidth: 1,
    },
    entryIcon: {
      alignItems: "center",
      borderRadius: 26,
      height: 52,
      justifyContent: "center",
      width: 52,
    },
    entryListCard: {
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: 26,
      borderWidth: 1,
      overflow: "hidden",
    },
    entryMetaRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    entryMiddle: {
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    entryRight: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      justifyContent: "flex-end",
      width: 124,
    },
    entryRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      minHeight: 82,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    entryTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: "900",
    },
    exportButton: {
      alignItems: "center",
      borderColor: c.primary,
      borderRadius: 15,
      borderWidth: 1.5,
      flex: 1,
      flexDirection: "row",
      gap: 12,
      height: 55,
      justifyContent: "center",
    },
    exportLabel: {
      color: c.primary,
      fontSize: 18,
      fontWeight: "900",
    },
    exportRow: {
      flexDirection: "row",
      gap: 14,
    },
    filterPill: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: 22,
      borderWidth: 1,
      height: 48,
      justifyContent: "center",
      paddingHorizontal: 22,
    },
    filterPillSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: -8,
    },
    filterText: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },
    filterTextSelected: {
      color: c.textOnPrimary,
      fontWeight: "900",
    },
    footerRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      marginTop: 12,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: 18,
    },
    headerIcon: {
      alignItems: "center",
      height: 44,
      justifyContent: "center",
      width: 30,
    },
    headerTitle: {
      fontSize: 27,
      fontWeight: "900",
    },
    heroCard: {
      backgroundColor: "rgba(44, 35, 32, 0.94)",
      borderRadius: 24,
      borderColor: "rgba(112, 70, 62, 0.85)",
      borderWidth: 1.5,
      height: 178,
      overflow: "hidden",
      padding: 24,
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
    heroLabel: {
      color: "#D0C0B7",
      fontSize: 18,
      fontWeight: "600",
    },
    heroScrim: {
      backgroundColor: "rgba(42, 30, 27, 0.32)",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    heroValue: {
      color: "#6ED0A1",
      fontSize: 54,
      fontWeight: "900",
      marginTop: 10,
    },
    modal: {
      flex: 1,
    },
    modalClose: {
      fontSize: 18,
      fontWeight: "800",
    },
    modalHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 22,
      paddingTop: 10,
    },
    modalTitle: {
      color: c.text,
      fontSize: 24,
      fontWeight: "900",
    },
    monthSelector: {
      alignItems: "center",
      flexDirection: "row",
      gap: 34,
      justifyContent: "center",
      marginVertical: 8,
    },
    monthText: {
      fontSize: 23,
      fontWeight: "900",
    },
    percentBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 10,
      flexDirection: "row",
      gap: 7,
      marginTop: 12,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    percentText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
    },
    pressed: {
      opacity: 0.82,
    },
    searchButton: {
      alignItems: "center",
      backgroundColor: chipBg,
      borderColor: cardBorder,
      borderRadius: 15,
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
      borderRadius: 18,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      height: 56,
      paddingHorizontal: 16,
    },
    searchInput: {
      color: c.text,
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      padding: 0,
    },
    section: {
      gap: 14,
      marginTop: 4,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 24,
      fontWeight: "900",
    },
    summaryCard: {
      alignItems: "center",
      borderRadius: 20,
      borderWidth: 1.5,
      flex: 1,
      flexDirection: "row",
      gap: 11,
      minHeight: 104,
      padding: 14,
    },
    summaryCopy: {
      flex: 1,
      gap: 5,
    },
    summaryDescription: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    summaryIcon: {
      alignItems: "center",
      borderRadius: 28,
      height: 56,
      justifyContent: "center",
      width: 56,
    },
    summaryLabel: {
      color: c.text,
      fontSize: 15,
      fontWeight: "700",
    },
    summaryRow: {
      flexDirection: "row",
      gap: 14,
    },
    summaryValue: {
      fontSize: 23,
      fontWeight: "900",
    },
    tipCard: {
      alignItems: "center",
      backgroundColor: cardBg,
      borderColor: cardBorder,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: 12,
      minHeight: 88,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    tipIcon: {
      alignItems: "center",
      backgroundColor: tipIconBg,
      borderRadius: 22,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    tipText: {
      color: c.textSecondary,
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
  });
}
