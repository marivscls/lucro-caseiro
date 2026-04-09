import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../../../shared/hooks/use-auth";
import { getExportUrl } from "../api";
import { useFinanceEntries, useFinanceSummary } from "../hooks";
import { FinanceEntryList } from "./finance-entry-list";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
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

  const { data: summary, isLoading } = useFinanceSummary({ month, year });
  const { data: entries } = useFinanceEntries({ type: undefined });

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

        if (result.status !== 200) {
          throw new Error("Falha ao baixar arquivo");
        }

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType:
              format === "pdf"
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Exportar relatorio financeiro",
          });
        } else {
          Alert.alert("Sucesso", "Arquivo salvo com sucesso.");
        }
      } catch {
        Alert.alert("Erro", "Nao foi possivel exportar o relatorio. Tente novamente.");
      } finally {
        setExporting(null);
      }
    },
    [token, year, month],
  );

  function handlePrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const income = summary?.totalIncome ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const profit = income - expenses;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        gap: spacing.lg,
      }}
    >
      {/* Serif title */}
      <Typography variant="h1">Financeiro</Typography>

      {/* Month selector */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: spacing.lg,
        }}
      >
        <TouchableOpacity onPress={handlePrevMonth} hitSlop={12}>
          <Typography variant="body" color={theme.colors.textSecondary}>
            {"<"}
          </Typography>
        </TouchableOpacity>

        <Typography variant="bodyBold">
          {MONTH_NAMES[month - 1]} {year}
        </Typography>

        <TouchableOpacity onPress={handleNextMonth} hitSlop={12}>
          <Typography variant="body" color={theme.colors.textSecondary}>
            {">"}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Profit hero card */}
      <Card
        style={{
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: theme.colors.successBg,
          paddingVertical: spacing["3xl"],
        }}
      >
        <Typography variant="caption">Seu lucro</Typography>
        <Typography variant="moneyHero" color={theme.colors.success}>
          {formatCurrency(profit)}
        </Typography>
      </Card>

      {/* Income and Expense summary */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Card
          style={{
            flex: 1,
            gap: spacing.xs,
            backgroundColor: theme.colors.successBg,
          }}
        >
          <Typography variant="caption">Entradas</Typography>
          <Typography variant="money" color={theme.colors.success}>
            {formatCurrency(income)}
          </Typography>
        </Card>

        <Card
          style={{
            flex: 1,
            gap: spacing.xs,
            backgroundColor: theme.colors.alertBg,
          }}
        >
          <Typography variant="caption">Saidas</Typography>
          <Typography variant="money" color={theme.colors.alert}>
            {formatCurrency(expenses)}
          </Typography>
        </Card>
      </View>

      {/* Export buttons */}
      <Typography variant="h2">Exportar</Typography>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Button
          title="PDF"
          variant="outline"
          size="sm"
          loading={exporting === "pdf"}
          disabled={exporting !== null}
          onPress={() => {
            void handleExport("pdf");
          }}
          style={{ flex: 1 }}
        />
        <Button
          title="Excel"
          variant="outline"
          size="sm"
          loading={exporting === "xlsx"}
          disabled={exporting !== null}
          onPress={() => {
            void handleExport("xlsx");
          }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Transactions grouped by date */}
      <Typography variant="h2">Hoje</Typography>

      <FinanceEntryList
        entries={entries?.items ?? []}
        onEntryPress={onEntryPress}
        onAddPress={onAddPress}
      />
    </ScrollView>
  );
}
