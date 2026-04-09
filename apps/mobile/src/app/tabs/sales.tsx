import type { Sale } from "@lucro-caseiro/contracts";
import { useRouter } from "expo-router";
import {
  Button,
  EmptyState,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SaleCard } from "../../features/sales/components/sale-card";
import { SaleDetail } from "../../features/sales/components/sale-detail";
import { useSale, useSales } from "../../features/sales/hooks";

type FilterTab = "all" | "paid" | "pending" | "cancelled";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "paid", label: "Concluidas" },
  { key: "cancelled", label: "Canceladas" },
];

type SaleGroup = { title: string; data: Sale[] };

function groupSalesByDate(items: Sale[]): SaleGroup[] {
  const groups: SaleGroup[] = [];
  const map = new Map<string, Sale[]>();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  for (const item of items) {
    const dateStr = item.soldAt.slice(0, 10);
    let label: string;
    if (dateStr === todayStr) {
      label = "Hoje";
    } else if (dateStr === yesterdayStr) {
      label = "Ontem";
    } else {
      const d = new Date(dateStr + "T12:00:00");
      label = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    }
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label)!.push(item);
  }

  for (const [title, data] of map.entries()) {
    groups.push({ title, data });
  }

  return groups;
}

type SalesContentProps = {
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly hasItems: boolean;
  readonly activeFilter: FilterTab;
  readonly groups: SaleGroup[];
  readonly primaryColor: string;
  readonly onSalePress: (id: string) => void;
  readonly onNewSalePress: () => void;
};

function SalesContent({
  isLoading,
  error,
  hasItems,
  activeFilter,
  groups,
  primaryColor,
  onSalePress,
  onNewSalePress,
}: SalesContentProps) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }
  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Nao foi possivel carregar suas vendas. Tente novamente."
      />
    );
  }
  if (!hasItems) {
    const emptyDescription =
      activeFilter === "all"
        ? "Que tal registrar uma nova venda mensal para manter suas contas em dia?"
        : "Nenhuma venda com esse filtro";
    return (
      <EmptyState
        title="Tudo calmo por aqui"
        description={emptyDescription}
        action={<Button title="Nova Venda" onPress={onNewSalePress} />}
      />
    );
  }
  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.title}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing["3xl"],
      }}
      renderItem={({ item: group }) => (
        <View style={{ marginTop: spacing.xl }}>
          <Typography variant="h2" style={{ marginBottom: spacing.md }}>
            {group.title}
          </Typography>
          <View style={{ gap: spacing.md }}>
            {group.data.map((sale) => (
              <SaleCard key={sale.id} sale={sale} onPress={() => onSalePress(sale.id)} />
            ))}
          </View>
        </View>
      )}
    />
  );
}

export default function SalesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const statusParam = activeFilter === "all" ? undefined : activeFilter;
  const { data, isLoading, error, refetch } = useSales({ status: statusParam });
  const { data: selectedSale } = useSale(selectedSaleId ?? "");

  function handleStatusUpdated() {
    setSelectedSaleId(null);
    void refetch();
  }

  const filteredItems = data?.items?.filter((sale) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchProduct = sale.items?.some((i) =>
      i.productName?.toLowerCase().includes(q),
    );
    const matchClient = sale.clientName?.toLowerCase().includes(q);
    return matchProduct || matchClient;
  });

  const groups = filteredItems ? groupSalesByDate(filteredItems) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Typography variant="h1">Vendas</Typography>
      </View>

      {/* Filter pills */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          gap: spacing.sm,
        }}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
              }}
            >
              <Typography
                variant="caption"
                color={isActive ? theme.colors.textOnPrimary : theme.colors.textSecondary}
              >
                {tab.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
        <Input
          placeholder="Buscar por produto ou cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
          }
        />
      </View>

      <SalesContent
        isLoading={isLoading}
        error={error}
        hasItems={!!filteredItems?.length}
        activeFilter={activeFilter}
        groups={groups}
        primaryColor={theme.colors.primary}
        onSalePress={setSelectedSaleId}
        onNewSalePress={() => router.push("/tabs/new-sale")}
      />

      {/* Sale detail modal */}
      <Modal
        visible={!!selectedSaleId && !!selectedSale}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedSaleId(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setSelectedSaleId(null)}>
              <Typography variant="body" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          {selectedSale && (
            <SaleDetail sale={selectedSale} onStatusUpdated={handleStatusUpdated} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
