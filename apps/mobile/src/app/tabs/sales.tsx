import type { Sale } from "@lucro-caseiro/contracts";
import { useRouter } from "expo-router";
import {
  Button,
  Chip,
  EmptyState,
  fonts,
  iconSizes,
  Input,
  Typography,
  useBrand,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import { useQueries } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClient } from "../../features/clients/hooks";
import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { fetchProduct } from "../../features/products/api";
import { useProducts } from "../../features/products/hooks";
import { SaleCard } from "../../features/sales/components/sale-card";
import { SaleDetail } from "../../features/sales/components/sale-detail";
import { useSale, useSales, useUpdateSale } from "../../features/sales/hooks";
import { paymentLabel, PAYMENT_OPTIONS } from "../../features/sales/payment";
import { useAuth } from "../../shared/hooks/use-auth";
import { useProfile } from "../../features/subscription/hooks";
import { ResponsiveOverlayModal } from "../../shared/components/responsive-modal-surface";
import { StandardModal } from "../../shared/components/standard-modal";
import { showAlert } from "../../shared/components/alert-store";
import { SkeletonList } from "../../shared/components/skeleton";
import { AnimatedListItem } from "../../shared/components/animated-list-item";
import { DesktopPagination } from "../../shared/components/desktop-pagination";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { desktopModalSurface } from "../../shared/layout/desktop-density";
import { alertError } from "../../shared/utils/alerts";
import salesEmpty from "../../assets/sales-empty.png";

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

// Cards flat com borda sutil, no padrao canonico da home (sem sombra hardcoded).
function getSurfaceStyle(theme: ReturnType<typeof useTheme>["theme"]): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
  };
}

function getFilterBg(
  selected: boolean,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  // Selecao = fundo rosado suave (primaryBg), nunca pilula cheia de rosa.
  if (selected) return theme.colors.primaryBg;
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
        },
      ]}
    >
      <Typography
        variant="caption"
        color={selected ? theme.colors.primaryStrong : theme.colors.textSecondary}
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
      <AppIcon name="search-outline" size={23} color={theme.colors.textSecondary} />
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
          fontFamily: fonts.semiBold,
          padding: 0,
        }}
      />
      <Pressable
        onPress={onFilterPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
      >
        <AppIcon name="options-outline" size={25} color={theme.colors.textSecondary} />
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
        <AppIcon name="calendar-outline" size={24} color={theme.colors.textSecondary} />
        <Typography variant="h2" serif color={theme.colors.text}>
          {title}
        </Typography>
      </View>
      <View
        style={{
          minHeight: 34,
          paddingHorizontal: spacing.md,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

function EmptySalesIllustration() {
  return (
    <Image source={salesEmpty} resizeMode="contain" style={{ width: 184, height: 184 }} />
  );
}

function AvatarCircle({ name }: Readonly<{ name: string }>) {
  const { theme } = useTheme();
  const pastel = avatarPastel(name || "?", theme.mode);
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: radii.full,
        backgroundColor: pastel.bg,
        borderWidth: 1,
        borderColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h3" color={pastel.fg}>
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
              borderRadius: radii.full,
              borderWidth: 2,
              borderColor: accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={copy.icon} size={26} color={accent} />
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
            backgroundColor: theme.colors.border,
          }}
        />
        <View
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.full,
              borderWidth: 2,
              borderColor: accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="cash-outline" size={25} color={accent} />
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
  readonly items: Sale[];
  readonly isDesktop: boolean;
  readonly page: number;
  readonly total: number;
  readonly totalPages: number;
  readonly primaryColor: string;
  readonly onSalePress: (id: string) => void;
  readonly onClearFilters: () => void;
  readonly onNewSalePress: () => void;
  readonly onPageChange: (page: number) => void;
  readonly compactEmpty?: boolean;
};

function saleStatusPresentation(
  status: Sale["status"],
  theme: ReturnType<typeof useTheme>["theme"],
) {
  if (status === "paid") return { label: "Pago", color: theme.colors.success };
  if (status === "pending") return { label: "Pendente", color: theme.colors.yellow };
  return { label: "Cancelado", color: theme.colors.alert };
}

function DesktopSalesTable({
  items,
  page,
  total,
  totalPages,
  onSalePress,
  onPageChange,
}: Readonly<{
  items: Sale[];
  page: number;
  total: number;
  totalPages: number;
  onSalePress: (id: string) => void;
  onPageChange: (page: number) => void;
}>) {
  const { theme } = useTheme();
  const headerStyle = {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.4,
  } as const;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.md }}
    >
      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          backgroundColor: theme.colors.surfaceElevated,
          overflow: "hidden",
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 920, flex: 1 }}>
            <View
              style={{
                minHeight: 46,
                paddingHorizontal: spacing.lg,
                backgroundColor: theme.colors.surface,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <Typography variant="caption" style={[headerStyle, { flex: 2 }]}>
                Venda
              </Typography>
              <Typography variant="caption" style={[headerStyle, { flex: 1.4 }]}>
                Cliente
              </Typography>
              <Typography variant="caption" style={[headerStyle, { flex: 1 }]}>
                Data
              </Typography>
              <Typography variant="caption" style={[headerStyle, { flex: 1.1 }]}>
                Pagamento
              </Typography>
              <Typography variant="caption" style={[headerStyle, { flex: 1 }]}>
                Status
              </Typography>
              <Typography
                variant="caption"
                style={[headerStyle, { flex: 1, textAlign: "right" }]}
              >
                Total
              </Typography>
              <View style={{ width: 20 }} />
            </View>

            {items.map((sale) => {
              const status = saleStatusPresentation(sale.status, theme);
              const saleTitle =
                sale.items
                  ?.map((item) => item.productName)
                  .filter(Boolean)
                  .join(", ") || "Venda";
              return (
                <Pressable
                  key={sale.id}
                  accessibilityRole="button"
                  onPress={() => onSalePress(sale.id)}
                  style={({ pressed }) => ({
                    minHeight: 62,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.lg,
                    backgroundColor: pressed
                      ? theme.colors.primaryBg
                      : theme.colors.surfaceElevated,
                  })}
                >
                  <Typography variant="bodyBold" numberOfLines={1} style={{ flex: 2 }}>
                    {saleTitle}
                  </Typography>
                  <Typography variant="body" numberOfLines={1} style={{ flex: 1.4 }}>
                    {sale.clientName ?? "Cliente avulso"}
                  </Typography>
                  <Typography variant="body" style={{ flex: 1 }}>
                    {new Date(sale.soldAt).toLocaleDateString("pt-BR")}
                  </Typography>
                  <Typography variant="body" numberOfLines={1} style={{ flex: 1.1 }}>
                    {paymentLabel(sale.paymentMethod)}
                  </Typography>
                  <Typography variant="bodyBold" color={status.color} style={{ flex: 1 }}>
                    {status.label}
                  </Typography>
                  <Typography
                    variant="bodyBold"
                    color={theme.colors.success}
                    style={{ flex: 1, textAlign: "right" }}
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(sale.total)}
                  </Typography>
                  <AppIcon
                    name="chevron-forward"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <DesktopPagination
          page={page}
          total={total}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </View>
    </ScrollView>
  );
}

function SalesContent({
  isLoading,
  error,
  hasItems,
  activeFilter,
  hasActiveFilters,
  groups,
  items,
  isDesktop,
  page,
  total,
  totalPages,
  primaryColor: _primaryColor,
  onSalePress,
  onClearFilters,
  onNewSalePress,
  onPageChange,
  compactEmpty = false,
}: SalesContentProps) {
  const { theme } = useTheme();
  const { copy } = useBrand();

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: spacing.xl }}>
        <SkeletonList rows={6} />
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
      <EmptyState
        icon={<EmptySalesIllustration />}
        title={emptyCopy.title}
        description={emptyCopy.description}
        style={{
          justifyContent: compactEmpty ? "flex-start" : "center",
          // Os status possuem o resumo acima: o estado vazio começa com o mesmo
          // respiro em todas as abas para a ilustração não parecer colada ao card.
          paddingTop: spacing.xl,
          paddingBottom: spacing["5xl"],
        }}
        action={
          <Button
            title={isFiltered ? emptyCopy.button : copy.saleLabel}
            size="lg"
            icon={
              <AppIcon
                name={emptyCopy.icon}
                size={iconSizes.sm}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={isFiltered ? onClearFilters : onNewSalePress}
          />
        }
      />
    );
  }
  if (isDesktop) {
    return (
      <DesktopSalesTable
        items={items}
        page={page}
        total={total}
        totalPages={totalPages}
        onSalePress={onSalePress}
        onPageChange={onPageChange}
      />
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
  const isDesktop = useDesktopLayout();
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
  const [page, setPage] = useState(1);

  const statusParam = activeFilter === "all" ? undefined : activeFilter;
  const { data, isLoading, error, refetch } = useSales({
    page: isDesktop ? page : undefined,
    status: statusParam,
  });
  const { data: selectedSale } = useSale(selectedSaleId ?? "");
  // Abre o detalhe imediatamente com a venda que a lista já carregou (inclui
  // itens); o useSale revalida em segundo plano. Sem isso, o modal só abria
  // depois do round-trip de rede — daí a demora ao tocar na venda.
  const listSale = data?.items?.find((s) => s.id === selectedSaleId) ?? null;
  const activeSale = selectedSale ?? listSale;
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: selectedClient } = useClient(activeSale?.clientId ?? "");
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
    if (!activeSale) return;
    setEditPayment(activeSale.paymentMethod);
    setEditNotes(activeSale.notes ?? "");
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
        ...(activeSale?.items ?? []).map((item) => item.productId),
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
  const selectedSaleWithPhotos = activeSale
    ? addProductPhotosToSale(activeSale, productPhotosById, productPhotosByName)
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
      {!isDesktop && (
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
      )}

      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          gap: spacing.xs,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <FilterPill
            key={tab.key}
            label={tab.label}
            selected={activeFilter === tab.key}
            onPress={() => {
              setActiveFilter(tab.key);
              setPage(1);
            }}
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
          onChangeText={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
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
        items={filteredItems ?? []}
        isDesktop={isDesktop}
        page={data?.page ?? page}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        primaryColor={theme.colors.primary}
        onSalePress={setSelectedSaleId}
        onClearFilters={handleClearFilters}
        onNewSalePress={() => router.push("/tabs/new-sale")}
        onPageChange={setPage}
        compactEmpty={activeFilter !== "all"}
      />

      <ResponsiveOverlayModal
        visible={showFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilters(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: isDesktop ? "center" : "flex-end",
            padding: isDesktop ? spacing.xl : 0,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar filtros"
            onPress={() => setShowFilters(false)}
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={[
              {
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                padding: spacing.xl,
                paddingBottom: isDesktop
                  ? spacing.xl
                  : Math.max(insets.bottom + spacing["3xl"], spacing["5xl"]),
                gap: spacing.xl,
              },
              desktopModalSurface(isDesktop, 720),
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h2">Filtrar vendas</Typography>
              <Pressable
                onPress={() => setShowFilters(false)}
                accessibilityLabel="Fechar filtros"
                hitSlop={12}
              >
                <AppIcon
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
          </View>
        </View>
      </ResponsiveOverlayModal>

      {selectedSaleWithPhotos ? (
        <StandardModal
          visible
          onClose={() => setSelectedSaleId(null)}
          title="Detalhes da venda"
        >
          <SaleDetail
            sale={selectedSaleWithPhotos}
            clientPhone={selectedClient?.phone}
            onStatusUpdated={handleStatusUpdated}
            onEditPress={handleEditPress}
          />
        </StandardModal>
      ) : null}

      <StandardModal
        title="Editar venda"
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        footer={
          <>
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setShowEdit(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Salvar alterações"
              size="lg"
              onPress={() => {
                handleSaveEdit().catch(() => {});
              }}
              loading={updateSale.isPending}
              style={{ flex: 1 }}
            />
          </>
        }
      >
        <View style={{ flexShrink: 1, gap: spacing.lg }}>
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
        </View>
      </StandardModal>
    </SafeAreaView>
  );
}
