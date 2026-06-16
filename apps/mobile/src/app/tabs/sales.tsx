import type { Sale } from "@lucro-caseiro/contracts";
import { useRouter } from "expo-router";
import {
  Button,
  Chip,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { useQueries } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClient } from "../../features/clients/hooks";
import { fetchProduct } from "../../features/products/api";
import { useProducts } from "../../features/products/hooks";
import { SaleCard } from "../../features/sales/components/sale-card";
import { SaleDetail } from "../../features/sales/components/sale-detail";
import { useSale, useSales, useUpdateSale } from "../../features/sales/hooks";
import { PAYMENT_OPTIONS } from "../../features/sales/payment";
import { useAuth } from "../../shared/hooks/use-auth";
import { useProfile } from "../../features/subscription/hooks";
import { KeyboardAwareScrollView } from "../../shared/components/keyboard-aware-scroll-view";
import { showAlert } from "../../shared/components/alert-store";
import { AnimatedListItem } from "../../shared/components/animated-list-item";
import { alertError } from "../../shared/utils/alerts";

type FilterTab = "all" | "paid" | "pending" | "cancelled";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "paid", label: "Concluídas" },
  { key: "cancelled", label: "Canceladas" },
];

type SaleGroup = { title: string; data: Sale[] };

function addProductPhotosToSale(
  sale: Sale,
  productPhotosById: Map<string, string | null>,
  productPhotosByName: Map<string, string | null>,
): Sale {
  return {
    ...sale,
    items: sale.items.map((item) => ({
      ...item,
      productPhotoUrl:
        item.productPhotoUrl ??
        productPhotosById.get(item.productId) ??
        productPhotosByName.get(item.productName.trim().toLowerCase()) ??
        null,
    })),
  };
}

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

function getSurfaceStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  return {
    backgroundColor:
      theme.mode === "dark" ? "rgba(44, 36, 32, 0.84)" : theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor:
      theme.mode === "dark" ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: theme.mode === "dark" ? 0.22 : 0.06,
    shadowRadius: 18,
    elevation: 3,
  };
}

function getFilterBg(
  selected: boolean,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (selected) return theme.colors.primary;
  if (theme.mode === "dark") return "rgba(44, 36, 32, 0.7)";
  return theme.colors.surface;
}

function getStatusSummaryCopy(activeFilter: FilterTab) {
  if (activeFilter === "cancelled") {
    return {
      icon: "close-outline" as const,
      label: "canceladas",
      totalLabel: "cancelado",
    };
  }
  if (activeFilter === "pending") {
    return {
      icon: "time-outline" as const,
      label: "pendentes",
      totalLabel: "em aberto",
    };
  }
  return {
    icon: "checkmark-outline" as const,
    label: "Concluídas",
    totalLabel: "concluído",
  };
}

function getStatusSummaryAccent(
  activeFilter: FilterTab,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (activeFilter === "cancelled") return theme.colors.alert;
  if (activeFilter === "pending") return theme.colors.yellow;
  return theme.colors.success;
}

function FilterPill({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          height: 44,
          flex: 1,
          minWidth: 0,
          paddingHorizontal: spacing.xs,
          borderRadius: radii.full,
          backgroundColor: getFilterBg(selected, theme),
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.84 : 1,
          shadowColor: selected ? theme.colors.primary : "#000000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: selected ? 0.25 : 0.08,
          shadowRadius: 14,
          elevation: selected ? 3 : 1,
        },
      ]}
    >
      <Typography
        variant="caption"
        color={selected ? theme.colors.textOnPrimary : theme.colors.textSecondary}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function SearchBar({
  value,
  onChangeText,
  onFilterPress,
}: Readonly<{
  value: string;
  onChangeText: (value: string) => void;
  onFilterPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height: 56,
        borderRadius: radii.xl,
        paddingHorizontal: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        ...getSurfaceStyle(theme),
      }}
    >
      <Ionicons name="search-outline" size={23} color={theme.colors.textSecondary} />
      <TextInput
        placeholder="Buscar por produto ou cliente..."
        placeholderTextColor={theme.colors.textSecondary + "90"}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          height: 46,
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: "500",
          padding: 0,
        }}
      />
      <Pressable
        onPress={onFilterPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
      >
        <Ionicons name="options-outline" size={25} color={theme.colors.primaryLight} />
      </Pressable>
    </View>
  );
}

function GroupHeader({ title, count }: Readonly<{ title: string; count: number }>) {
  const { theme } = useTheme();
  const label = count === 1 ? "1 venda" : `${count} vendas`;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Ionicons name="calendar-outline" size={24} color={theme.colors.textSecondary} />
        <Typography variant="h2" serif color={theme.colors.text}>
          {title}
        </Typography>
      </View>
      <View
        style={{
          minHeight: 34,
          paddingHorizontal: spacing.md,
          borderRadius: radii.full,
          backgroundColor: "rgba(224, 114, 114, 0.15)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" color={theme.colors.primaryLight}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

function EmptySalesIllustration() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 148,
        height: 148,
        borderRadius: 74,
        backgroundColor: "rgba(196, 112, 126, 0.14)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 82,
          height: 96,
          borderRadius: radii.lg,
          backgroundColor: "#F8D8D4",
          borderWidth: 2,
          borderColor: "#FFE9E5",
          transform: [{ rotate: "8deg" }],
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 18,
          elevation: 5,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -14,
            left: 18,
            width: 48,
            height: 22,
            borderRadius: 10,
            backgroundColor: theme.colors.primaryLight,
          }}
        />
        {[24, 40, 56, 72].map((top, index) => (
          <View
            key={top}
            style={{
              position: "absolute",
              top,
              left: 14,
              width: index === 1 ? 40 : 54,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#E98B93",
            }}
          />
        ))}
      </View>
      <View
        style={{
          position: "absolute",
          right: 24,
          bottom: 30,
          width: 46,
          height: 46,
          borderRadius: 23,
          borderWidth: 7,
          borderColor: "#EE94A0",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 16,
          bottom: 20,
          width: 30,
          height: 8,
          borderRadius: 5,
          backgroundColor: "#D96E83",
          transform: [{ rotate: "48deg" }],
        }}
      />
      {[
        { top: 36, left: 34 },
        { top: 20, right: 38 },
        { bottom: 34, left: 54 },
      ].map((position, index) => (
        <Ionicons
          key={index}
          name="sparkles"
          size={18}
          color="#F39CA8"
          style={{ position: "absolute", ...position }}
        />
      ))}
    </View>
  );
}

function AvatarCircle({ name }: Readonly<{ name: string }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 14,
        elevation: 4,
      }}
    >
      <Typography variant="h3" color={theme.colors.textOnPrimary}>
        {(name || "M").charAt(0).toUpperCase()}
      </Typography>
    </View>
  );
}

function StatusSummary({
  activeFilter,
  count,
  total,
}: Readonly<{ activeFilter: FilterTab; count: number; total: number }>) {
  const { theme } = useTheme();
  if (activeFilter === "all") return null;

  const copy = getStatusSummaryCopy(activeFilter);
  const accent = getStatusSummaryAccent(activeFilter, theme);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(total);

  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
      <View
        style={{
          minHeight: 92,
          borderRadius: radii.xl,
          padding: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          ...getSurfaceStyle(theme),
        }}
      >
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={copy.icon} size={26} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h3" color={theme.colors.text}>
              {count}
            </Typography>
            <Typography variant="caption" numberOfLines={1}>
              {copy.label}
            </Typography>
            <Typography variant="caption">este mês</Typography>
          </View>
        </View>
        <View
          style={{
            width: 1,
            height: 54,
            backgroundColor:
              theme.mode === "dark"
                ? "rgba(245, 225, 219, 0.1)"
                : "rgba(74, 50, 40, 0.1)",
          }}
        />
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="cash-outline" size={25} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h3" color={theme.colors.text} numberOfLines={1}>
              {formattedTotal}
            </Typography>
            <Typography variant="caption" numberOfLines={1}>
              {copy.totalLabel}
            </Typography>
            <Typography variant="caption">este mês</Typography>
          </View>
        </View>
      </View>
    </View>
  );
}

function getEmptyStateCopy(isFiltered: boolean) {
  if (isFiltered) {
    return {
      title: "Nenhuma venda encontrada",
      description: "Não encontramos vendas com os filtros aplicados.",
      button: "Limpar filtros",
      icon: "options-outline" as const,
    };
  }
  return {
    title: "Nenhuma venda registrada",
    description: "Suas vendas aparecerão aqui depois do primeiro registro.",
    button: "Nova venda",
    icon: "add-outline" as const,
  };
}

type SalesContentProps = {
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly hasItems: boolean;
  readonly activeFilter: FilterTab;
  readonly hasActiveFilters: boolean;
  readonly groups: SaleGroup[];
  readonly primaryColor: string;
  readonly onSalePress: (id: string) => void;
  readonly onClearFilters: () => void;
  readonly onNewSalePress: () => void;
  readonly compactEmpty?: boolean;
};

function SalesContent({
  isLoading,
  error,
  hasItems,
  activeFilter,
  hasActiveFilters,
  groups,
  primaryColor,
  onSalePress,
  onClearFilters,
  onNewSalePress,
  compactEmpty = false,
}: SalesContentProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Typography variant="h3">Algo deu errado</Typography>
        <Typography variant="body" style={{ marginTop: spacing.sm, textAlign: "center" }}>
          Não foi possível carregar suas vendas. Tente novamente.
        </Typography>
      </View>
    );
  }
  if (!hasItems) {
    const isFiltered = activeFilter !== "all" || hasActiveFilters;
    const emptyCopy = getEmptyStateCopy(isFiltered);
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: compactEmpty ? "flex-start" : "center",
          paddingHorizontal: spacing["2xl"],
          paddingTop: compactEmpty ? spacing.md : spacing.xl,
          paddingBottom: spacing["5xl"],
        }}
      >
        <EmptySalesIllustration />
        <Typography variant="h2" style={{ marginTop: spacing.lg, textAlign: "center" }}>
          {emptyCopy.title}
        </Typography>
        <Typography variant="body" style={{ marginTop: spacing.md, textAlign: "center" }}>
          {emptyCopy.description}
        </Typography>
        <Pressable
          onPress={isFiltered ? onClearFilters : onNewSalePress}
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              marginTop: spacing.xl,
              minHeight: 52,
              paddingHorizontal: spacing["2xl"],
              borderRadius: radii.full,
              backgroundColor: theme.colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.86 : 1,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.28,
              shadowRadius: 18,
              elevation: 4,
            },
          ]}
        >
          <Ionicons name={emptyCopy.icon} size={22} color={theme.colors.textOnPrimary} />
          <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
            {emptyCopy.button}
          </Typography>
        </Pressable>
      </View>
    );
  }
  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.title}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing["5xl"],
      }}
      renderItem={({ item: group }) => (
        <View style={{ marginTop: spacing.xl }}>
          <GroupHeader title={group.title} count={group.data.length} />
          <View style={{ gap: spacing.md }}>
            {group.data.map((sale, i) => (
              <AnimatedListItem key={sale.id} index={i}>
                <SaleCard sale={sale} onPress={() => onSalePress(sale.id)} />
              </AnimatedListItem>
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
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { data: profile } = useProfile();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const statusParam = activeFilter === "all" ? undefined : activeFilter;
  const { data, isLoading, error, refetch } = useSales({ status: statusParam });
  const { data: selectedSale } = useSale(selectedSaleId ?? "");
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: selectedClient } = useClient(selectedSale?.clientId ?? "");
  const updateSale = useUpdateSale();

  function handleClearFilters() {
    setActiveFilter("all");
    setSearchQuery("");
  }

  function handleStatusUpdated() {
    setSelectedSaleId(null);
    void refetch();
  }

  function handleEditPress() {
    if (!selectedSale) return;
    setEditPayment(selectedSale.paymentMethod);
    setEditNotes(selectedSale.notes ?? "");
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    if (!selectedSaleId) return;
    try {
      await updateSale.mutateAsync({
        id: selectedSaleId,
        data: {
          paymentMethod: editPayment,
          notes: editNotes.trim() || undefined,
        },
      });
      showAlert({ title: "Venda atualizada!" });
      setShowEdit(false);
      void refetch();
    } catch {
      alertError("Não foi possível atualizar a venda.");
    }
  }

  const saleProductIds = Array.from(
    new Set(
      [
        ...(data?.items ?? []).flatMap((sale) =>
          sale.items.map((item) => item.productId),
        ),
        ...(selectedSale?.items ?? []).map((item) => item.productId),
      ].filter(Boolean),
    ),
  );
  const productQueries = useQueries({
    queries: saleProductIds.map((productId) => ({
      queryKey: ["products", productId],
      queryFn: () => fetchProduct(token!, productId),
      enabled: !!token,
    })),
  });
  const queriedProducts = productQueries
    .map((query) => query.data)
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  const productPhotosById = new Map([
    ...queriedProducts.map((product) => [product.id, product.photoUrl] as const),
    ...(productsData?.items ?? []).map(
      (product) => [product.id, product.photoUrl] as const,
    ),
  ]);
  const productPhotosByName = new Map([
    ...queriedProducts.map(
      (product) => [product.name.trim().toLowerCase(), product.photoUrl] as const,
    ),
    ...(productsData?.items ?? []).map(
      (product) => [product.name.trim().toLowerCase(), product.photoUrl] as const,
    ),
  ]);
  const salesWithPhotos = data?.items?.map((sale) =>
    addProductPhotosToSale(sale, productPhotosById, productPhotosByName),
  );
  const selectedSaleWithPhotos = selectedSale
    ? addProductPhotosToSale(selectedSale, productPhotosById, productPhotosByName)
    : null;

  const filteredItems = salesWithPhotos?.filter((sale) => {
    if (activeFilter !== "all" && sale.status !== activeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchProduct = sale.items?.some((i) =>
      i.productName?.toLowerCase().includes(q),
    );
    const matchClient = sale.clientName?.toLowerCase().includes(q);
    return matchProduct || matchClient;
  });

  const groups = filteredItems ? groupSalesByDate(filteredItems) : [];
  const filteredTotal = filteredItems?.reduce((sum, sale) => sum + sale.total, 0) ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="display" serif>
          Vendas
        </Typography>
        <AvatarCircle name={profile?.name ?? "Maria"} />
      </View>

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.xs,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <FilterPill
            key={tab.key}
            label={tab.label}
            selected={activeFilter === tab.key}
            onPress={() => setActiveFilter(tab.key)}
          />
        ))}
      </View>

      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setShowFilters(true)}
        />
      </View>

      <StatusSummary
        activeFilter={activeFilter}
        count={filteredItems?.length ?? 0}
        total={filteredTotal}
      />

      <SalesContent
        isLoading={isLoading}
        error={error}
        hasItems={!!filteredItems?.length}
        activeFilter={activeFilter}
        hasActiveFilters={!!searchQuery.trim()}
        groups={groups}
        primaryColor={theme.colors.primary}
        onSalePress={setSelectedSaleId}
        onClearFilters={handleClearFilters}
        onNewSalePress={() => router.push("/tabs/new-sale")}
        compactEmpty={activeFilter === "cancelled"}
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowFilters(false)}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              padding: spacing.xl,
              paddingBottom: Math.max(insets.bottom + spacing["3xl"], spacing["5xl"]),
              gap: spacing.xl,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h2">Filtrar vendas</Typography>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={12}>
                <Ionicons
                  name="close-outline"
                  size={26}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {FILTER_TABS.map((tab) => (
                <Chip
                  key={tab.key}
                  label={tab.label}
                  selected={activeFilter === tab.key}
                  onPress={() => {
                    setActiveFilter(tab.key);
                    setShowFilters(false);
                  }}
                />
              ))}
            </View>

            <Button
              title="Limpar filtros"
              variant="outline"
              size="lg"
              style={{ alignSelf: "stretch" }}
              onPress={() => {
                handleClearFilters();
                setShowFilters(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!selectedSaleId && !!selectedSaleWithPhotos}
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
          {selectedSaleWithPhotos && (
            <SaleDetail
              sale={selectedSaleWithPhotos}
              clientPhone={selectedClient?.phone}
              onStatusUpdated={handleStatusUpdated}
              onEditPress={handleEditPress}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEdit(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowEdit(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Cancelar
              </Typography>
            </Pressable>
            <Typography variant="h3">Editar venda</Typography>
            <View style={{ width: 60 }} />
          </View>
          <KeyboardAwareScrollView
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: spacing["3xl"],
              gap: spacing.lg,
            }}
          >
            <View style={{ gap: spacing.sm }}>
              <Typography variant="caption">Forma de pagamento</Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={editPayment === opt.value}
                    onPress={() => setEditPayment(opt.value)}
                  />
                ))}
              </View>
            </View>
            <Input
              label="Observações"
              placeholder="Alguma anotação sobre a venda..."
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
            />
            <Button
              title="Salvar alterações"
              size="lg"
              onPress={() => {
                handleSaveEdit().catch(() => {});
              }}
              loading={updateSale.isPending}
            />
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
