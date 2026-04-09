import { Badge, Button, EmptyState, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";

interface FinanceEntry {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  date: string;
}

type FilterType = "all" | "income" | "expense";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCategoryVariant(category: string) {
  const map: Record<string, "neutral" | "success" | "warning" | "danger"> = {
    material: "neutral",
    embalagem: "warning",
    transporte: "neutral",
    taxa: "danger",
    utilidade: "success",
    outro: "neutral",
  };
  return map[category] ?? "neutral";
}

interface FinanceEntryListProps {
  entries?: FinanceEntry[];
  onEntryPress?: (id: string) => void;
  onAddPress?: () => void;
  showFilter?: boolean;
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "income", label: "Entradas" },
  { key: "expense", label: "Saidas" },
];

export function FinanceEntryList({
  entries,
  onEntryPress,
  onAddPress,
  showFilter = true,
}: Readonly<FinanceEntryListProps>) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? entries : entries?.filter((e) => e.type === filter);

  if (!entries?.length) {
    return (
      <EmptyState
        title="Nenhum lancamento"
        description="Registre suas entradas e saidas para acompanhar seu financeiro"
        action={
          onAddPress ? <Button title="Novo lancamento" onPress={onAddPress} /> : undefined
        }
      />
    );
  }

  return (
    <View style={{ flex: 1, gap: 12 }}>
      {showFilter && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  filter === opt.key ? theme.colors.success : theme.colors.surface,
              }}
            >
              <Typography
                variant="caption"
                color={
                  filter === opt.key
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary
                }
              >
                {opt.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onEntryPress?.(item.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surface,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  item.type === "income" ? theme.colors.successBg : theme.colors.alertBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h3"
                color={item.type === "income" ? theme.colors.success : theme.colors.alert}
              >
                {item.type === "income" ? "+" : "-"}
              </Typography>
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Typography variant="body">{item.description}</Typography>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Badge
                  label={item.category}
                  variant={getCategoryVariant(item.category)}
                />
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {formatDate(item.date)}
                </Typography>
              </View>
            </View>

            <Typography
              variant="h3"
              color={item.type === "income" ? theme.colors.success : theme.colors.alert}
            >
              {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
            </Typography>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <Typography variant="caption">
            {filtered?.length ?? 0} lancamento{(filtered?.length ?? 0) !== 1 ? "s" : ""}
          </Typography>
        }
      />
    </View>
  );
}
