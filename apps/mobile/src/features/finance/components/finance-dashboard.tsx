import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../../shared/utils/format";
import { spacing, useTheme } from "@lucro-caseiro/ui";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import financeHero from "../../../assets/finance-hero.png";
import { useAuth } from "../../../shared/hooks/use-auth";
import { getExportUrl } from "../api";
import { useDeleteFinanceEntry, useFinanceEntries, useFinanceSummary } from "../hooks";
import { CreateFinanceEntry } from "./create-finance-entry";

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
  const { token } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FinanceEntry | null>(null);

  const { data: summary, isLoading, error } = useFinanceSummary({ month, year });
  const { data: entries } = useFinanceEntries({ type: undefined });
  const deleteEntry = useDeleteFinanceEntry();

  const income = summary?.totalIncome ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const profit = income - expenses;
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
  const incomeCount = allEntries.filter((entry) => entry.type === "income").length;
  const expenseCount = allEntries.filter((entry) => entry.type === "expense").length;

  const handleExport = useCallback(
    async (format: "pdf" | "xlsx") => {
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
          Alert.alert("Sucesso", "Arquivo salvo com sucesso.");
        }
      } catch {
        Alert.alert("Erro", "Não foi possível exportar o relatório. Tente novamente.");
      } finally {
        setExporting(null);
      }
    },
    [token, year, month],
  );

  function handlePrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((currentYear) => currentYear - 1);
      return;
    }
    setMonth((currentMonth) => currentMonth - 1);
  }

  function handleNextMonth() {
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
            onPress={() => {
              setMonth(now.getMonth() + 1);
              setYear(now.getFullYear());
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
            <View style={styles.percentBadge}>
              <Ionicons name="trending-up-outline" size={18} color="#DDF4E7" />
              <Text style={styles.percentText}>
                0% vs. {MONTH_NAMES[previousMonth(month)]} {previousYear(month, year)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            icon="arrow-down-circle-outline"
            label="Entradas"
            value={formatCurrency(income)}
            description={`${incomeCount} lançamento${incomeCount === 1 ? "" : "s"}`}
            tone="green"
          />
          <SummaryCard
            icon="arrow-up-circle-outline"
            label="Saídas"
            value={formatCurrency(expenses)}
            description={`${expenseCount} lançamento${expenseCount === 1 ? "" : "s"}`}
            tone="red"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exportar</Text>
          <View style={styles.exportRow}>
            <ExportButton
              icon="document-text-outline"
              label="PDF"
              loading={exporting === "pdf"}
              disabled={exporting !== null}
              onPress={() => void handleExport("pdf")}
            />
            <ExportButton
              icon="document-attach-outline"
              label="Excel"
              loading={exporting === "xlsx"}
              disabled={exporting !== null}
              onPress={() => void handleExport("xlsx")}
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
            <Ionicons name="search-outline" size={23} color="#F4E6E1" />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <FilterPill
            label="Tudo"
            selected={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterPill
            label="Entradas"
            selected={filter === "income"}
            onPress={() => setFilter("income")}
          />
          <FilterPill
            label="Saídas"
            selected={filter === "expense"}
            onPress={() => setFilter("expense")}
          />
        </View>

        {showSearch && (
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={25} color="#CDBBB4" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar lançamento..."
              placeholderTextColor="#8F7D77"
              style={styles.searchInput}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color="#D6748B" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.entryCount}>
          {filteredEntries.length} lançamento{filteredEntries.length === 1 ? "" : "s"}
        </Text>

        <View style={styles.entryListCard}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry, index) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                isLast={index === filteredEntries.length - 1}
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
              <Ionicons name="wallet-outline" size={36} color="#D6748B" />
              <Text style={styles.emptyTitle}>Nenhum lançamento encontrado</Text>
              <Text style={styles.emptyText}>
                Use os filtros ou registre um novo lançamento.
              </Text>
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
                      backgroundColor:
                        selectedEntry.type === "income" ? "#173B2A" : "#49252D",
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedEntry.type === "income" ? "add" : "remove"}
                    size={28}
                    color={selectedEntry.type === "income" ? "#6ED0A1" : "#E07188"}
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
                  <Ionicons name="close" size={28} color="#E6D4CC" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailAmountRow}>
                <Text style={styles.detailAmountLabel}>
                  {selectedEntry.type === "income" ? "Entrada" : "Saída"}
                </Text>
                <Text
                  style={[
                    styles.detailAmount,
                    { color: selectedEntry.type === "income" ? "#6ED0A1" : "#E07188" },
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
                    Alert.alert(
                      "Excluir lançamento",
                      "Deseja remover este lançamento do financeiro?",
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Excluir",
                          style: "destructive",
                          onPress: () => {
                            void deleteEntry
                              .mutateAsync(selectedEntry.id)
                              .then(() => setSelectedEntry(null))
                              .catch(() =>
                                Alert.alert(
                                  "Erro",
                                  "Não foi possível excluir o lançamento. Tente novamente.",
                                ),
                              );
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF7B8A" />
                  <Text style={styles.detailDeleteText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
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
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  description: string;
  tone: "green" | "red";
}>) {
  const color = tone === "green" ? "#6ED0A1" : "#E07188";
  const background =
    tone === "green" ? "rgba(38, 120, 78, 0.26)" : "rgba(120, 42, 55, 0.28)";
  const border =
    tone === "green" ? "rgba(96, 196, 143, 0.32)" : "rgba(224, 113, 136, 0.45)";

  return (
    <View
      style={[styles.summaryCard, { borderColor: border, backgroundColor: background }]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: color + "1F" }]}>
        <Ionicons name={icon} size={37} color={color} />
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryLabel} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
        <Text
          style={[styles.summaryValue, { color }]}
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
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
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
        <ActivityIndicator color="#D6748B" />
      ) : (
        <>
          <Ionicons name={icon} size={28} color="#D6748B" />
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
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
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
}: Readonly<{ entry: FinanceEntry; isLast: boolean; onPress?: () => void }>) {
  const isIncome = entry.type === "income";
  const color = isIncome ? "#6ED0A1" : "#E07188";
  const sign = isIncome ? "+" : "-";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.entryRow, !isLast && styles.entryDivider]}
    >
      <View
        style={[styles.entryIcon, { backgroundColor: isIncome ? "#173B2A" : "#49252D" }]}
      >
        <Ionicons name={isIncome ? "add" : "remove"} size={30} color={color} />
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
          style={[styles.entryAmount, { color }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.78}
        >
          {sign} {formatCurrency(entry.amount)}
        </Text>
        <Ionicons name="chevron-forward" size={26} color="#E6D4CC" />
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

const styles = StyleSheet.create({
  addButtonWrap: {
    alignItems: "center",
    gap: 2,
    width: 96,
  },
  addCircle: {
    alignItems: "center",
    backgroundColor: "#CF6F88",
    borderRadius: 30,
    elevation: 10,
    height: 60,
    justifyContent: "center",
    shadowColor: "#CF6F88",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    width: 60,
  },
  addLabel: {
    color: "#F6E9E5",
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
    borderColor: "rgba(255,255,255,0.10)",
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
    color: "#D6C2BA",
    fontSize: 16,
    fontWeight: "700",
  },
  detailAmountRow: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(44, 35, 32, 0.98)",
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 22,
    padding: 18,
  },
  detailDeleteButton: {
    alignItems: "center",
    borderColor: "rgba(255, 123, 138, 0.45)",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 52,
    justifyContent: "center",
  },
  detailDeleteText: {
    color: "#FF7B8A",
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
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    flex: 1,
    height: 52,
    justifyContent: "center",
  },
  detailSecondaryText: {
    color: "#F6EAE6",
    fontSize: 16,
    fontWeight: "900",
  },
  detailSubtitle: {
    color: "#CDBBB4",
    fontSize: 15,
    fontWeight: "700",
  },
  detailTitle: {
    color: "#F6EAE6",
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
  emptyText: {
    color: "#C5ADA6",
    fontSize: 15,
    textAlign: "center",
  },
  emptyTitle: {
    color: "#F3E7E3",
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
    backgroundColor: "rgba(121, 49, 61, 0.55)",
    borderRadius: 9,
    color: "#EF8DA1",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 94,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  entryCount: {
    color: "#CDBBB4",
    fontSize: 16,
    marginTop: -8,
  },
  entryDate: {
    color: "#C7B4AD",
    fontSize: 15,
  },
  entryDivider: {
    borderBottomColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(44, 35, 32, 0.82)",
    borderColor: "rgba(255,255,255,0.08)",
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
    color: "#F7ECE8",
    fontSize: 18,
    fontWeight: "900",
  },
  exportButton: {
    alignItems: "center",
    borderColor: "#D6748B",
    borderRadius: 15,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: "row",
    gap: 12,
    height: 55,
    justifyContent: "center",
  },
  exportLabel: {
    color: "#D6748B",
    fontSize: 18,
    fontWeight: "900",
  },
  exportRow: {
    flexDirection: "row",
    gap: 14,
  },
  filterPill: {
    alignItems: "center",
    backgroundColor: "rgba(45, 38, 35, 0.82)",
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  filterPillSelected: {
    backgroundColor: "#CF6F88",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: -8,
  },
  filterText: {
    color: "#D6C3BB",
    fontSize: 16,
    fontWeight: "700",
  },
  filterTextSelected: {
    color: "#FFFFFF",
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
    color: "#F6EAE6",
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
    backgroundColor: "rgba(45, 38, 35, 0.82)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 15,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  searchButtonActive: {
    borderColor: "#D6748B",
  },
  searchField: {
    alignItems: "center",
    backgroundColor: "rgba(44, 35, 32, 0.88)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 56,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: "#F6EAE6",
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
    color: "#F8EEE9",
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
    color: "#D2C0B9",
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
    color: "#F3E6E1",
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
    backgroundColor: "rgba(44, 35, 32, 0.88)",
    borderColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(118, 54, 66, 0.42)",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  tipText: {
    color: "#D6C2BA",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
