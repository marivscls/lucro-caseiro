import { ScreenHeader } from "../../shared/components/screen-header";
import { ScreenGuidance } from "../../shared/guidance/screen-guidance";
import type { Sale } from "@lucro-caseiro/contracts";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CenteredTextInput,
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
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClient } from "../../features/clients/hooks";
import { fetchProduct } from "../../features/products/api";
import { productNameMatchesSearch } from "../../features/products/display";
import { useProducts } from "../../features/products/hooks";
import { SaleCard } from "../../features/sales/components/sale-card";
import { SaleDetail } from "../../features/sales/components/sale-detail";
import {
  useSale,
  useSales,
  useSalesFeed,
  useUpdateSale,
  useUpdateSaleStatus,
} from "../../features/sales/hooks";
import { useOrders } from "../../features/orders/hooks";
import { PAYMENT_OPTIONS } from "../../features/sales/payment";
import { useAuth } from "../../shared/hooks/use-auth";
import { useProfile } from "../../features/subscription/hooks";
import { ResponsiveOverlayModal } from "../../shared/components/responsive-modal-surface";
import { StandardModal } from "../../shared/components/standard-modal";
import { showAlert } from "../../shared/components/alert-store";
import { SkeletonList } from "../../shared/components/skeleton";
import { AnimatedListItem } from "../../shared/components/animated-list-item";
import { FAB } from "../../shared/components/fab";
import { desktopPageContent } from "../../shared/layout/desktop-page";
import { DesktopSalesPage } from "../../features/sales/components/sales-desktop";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { desktopModalSurface, pageGutter } from "../../shared/layout/desktop-density";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { alertError } from "../../shared/utils/alerts";
import { localDayOf, localIsoDate } from "../../shared/utils/date";
import { brandScreenPalette } from "../../shared/brand-palette";

type FilterTab = "all" | "paid" | "pending" | "cancelled";
type OperationView = "sales" | "orders";

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
        (item.productId ? productPhotosById.get(item.productId) : undefined) ??
        productPhotosByName.get(item.productName.trim().toLowerCase()) ??
        null,
    })),
  };
}

function groupSalesByDate(items: Sale[]): SaleGroup[] {
  const groups: SaleGroup[] = [];
  const map = new Map<string, Sale[]>();

  const today = new Date();
  const todayStr = localIsoDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localIsoDate(yesterday);

  for (const item of items) {
    const dateStr = localDayOf(item.soldAt);
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
  const palette = brandScreenPalette(theme);
  return {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  };
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
  const palette = brandScreenPalette(theme);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      <View
        style={{
          flex: 1,
          minHeight: 52,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          ...getSurfaceStyle(theme),
        }}
      >
        <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
        <CenteredTextInput
          placeholder="Produto ou cliente"
          placeholderTextColor={theme.colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel="Buscar por produto ou cliente"
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            height: 48,
            color: theme.colors.text,
            fontSize: 16,
            fontFamily: fonts.regular,
            padding: 0,
          }}
        />
      </View>
      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: radii.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.84 : 1,
        })}
      >
        <AppIcon name="options-outline" size={22} color={palette.wine} />
      </Pressable>
    </View>
  );
}

function GroupHeader({ title, count }: Readonly<{ title: string; count: number }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
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
      <Typography variant="bodyBold" color={palette.ink}>
        {title}
      </Typography>
      <View
        style={{
          minHeight: 28,
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

function AvatarCircle({ name }: Readonly<{ name: string }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.full,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="bodyBold" color={palette.muted}>
        {(name || "M").charAt(0).toUpperCase()}
      </Typography>
    </View>
  );
}

function SalesHeader({
  help,
  count,
  name,
  receivedTotal,
}: Readonly<{
  count: number;
  name: string;
  receivedTotal: number;
  help: React.ReactNode;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(receivedTotal);
  const countLabel = count === 1 ? "1 venda" : `${count} vendas`;

  return (
    <View
      style={{
        backgroundColor: palette.background,
        ...pageGutter(false),
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="screenTitle">Vendas</Typography>
          <Typography variant="caption">Pedidos e recebimentos</Typography>
        </View>
        {help}
        <AvatarCircle name={name} />
      </View>
      <View
        style={{
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: radii.lg,
          padding: spacing.md,
          gap: spacing.xs,
        }}
      >
        <Typography variant="caption">Recebido nas vendas desta lista</Typography>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Typography
            variant="moneyLg"
            color={theme.colors.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ flex: 1, minWidth: 0 }}
          >
            {formattedTotal}
          </Typography>
          <Typography variant="caption">{countLabel}</Typography>
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
  readonly isDesktop: boolean;
  readonly primaryColor: string;
  readonly onSalePress: (id: string) => void;
  readonly onClearFilters: () => void;
  readonly onNewSalePress: () => void;
  readonly onRetry: () => void;
  readonly hasMore?: boolean;
  readonly loadingMore?: boolean;
  readonly onLoadMore?: () => void;
  readonly compactEmpty?: boolean;
};

function SalesContent({
  isLoading,
  error,
  hasItems,
  activeFilter,
  hasActiveFilters,
  groups,
  isDesktop,
  primaryColor: _primaryColor,
  onSalePress,
  onClearFilters,
  onNewSalePress,
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  compactEmpty = false,
}: SalesContentProps) {
  const { theme } = useTheme();
  const { copy } = useBrand();
  const listBottomPadding = isDesktop ? spacing["5xl"] : spacing.lg;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 0,
          paddingVertical: spacing.xl,
          ...pageGutter(isDesktop),
        }}
      >
        <SkeletonList rows={6} variant="sale" />
      </View>
    );
  }
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          minHeight: 0,
          alignItems: isDesktop ? "flex-start" : "center",
          justifyContent: isDesktop ? "flex-start" : "center",
          paddingVertical: spacing.xl,
          ...pageGutter(isDesktop),
        }}
      >
        <Typography variant="h3">Algo deu errado</Typography>
        <Typography variant="body" style={{ marginTop: spacing.sm, textAlign: "center" }}>
          Não foi possível carregar suas vendas. Tente novamente.
        </Typography>
        <Button
          title="Tentar novamente"
          variant="secondary"
          onPress={onRetry}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }
  if (!hasItems) {
    const isFiltered = activeFilter !== "all" || hasActiveFilters;
    const emptyCopy = getEmptyStateCopy(isFiltered);
    return (
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <EmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          style={{
            justifyContent: compactEmpty ? "flex-start" : "center",
            paddingTop: spacing.md,
            paddingBottom: listBottomPadding,
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
      </ScrollView>
    );
  }
  return (
    <FlatList
      style={{ flex: 1, minHeight: 0 }}
      data={groups}
      keyExtractor={(item) => item.title}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: listBottomPadding,
      }}
      showsVerticalScrollIndicator={false}
      // Carrega a próxima página ao chegar perto do fim da lista.
      onEndReached={hasMore && !loadingMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            accessibilityLabel="Carregando mais vendas"
            color={theme.colors.primary}
            style={{ marginTop: spacing.lg }}
          />
        ) : null
      }
      renderItem={({ item: group }) => (
        <View style={{ marginTop: spacing.md }}>
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
  const palette = brandScreenPalette(theme);
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { saleId } = useLocalSearchParams<{ saleId?: string }>();
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
  const [operationView, setOperationView] = useState<OperationView>("sales");

  useEffect(() => {
    if (saleId) setSelectedSaleId(saleId);
  }, [saleId]);

  const statusParam = activeFilter === "all" ? undefined : activeFilter;
  // Computador: paginação numerada. Celular: carrega mais ao rolar.
  const pagedSales = useSales({ page, status: statusParam }, { enabled: isDesktop });
  const salesFeed = useSalesFeed({ status: statusParam }, { enabled: !isDesktop });
  const { data, isLoading, error, refetch } = isDesktop ? pagedSales : salesFeed;
  const { data: orders = [] } = useOrders();
  const { data: selectedSale } = useSale(selectedSaleId ?? "");
  // Abre o detalhe imediatamente com a venda que a lista já carregou (inclui
  // itens); o useSale revalida em segundo plano. Sem isso, o modal só abria
  // depois do round-trip de rede — daí a demora ao tocar na venda.
  const listSale = data?.items?.find((s) => s.id === selectedSaleId) ?? null;
  const activeSale = selectedSale ?? listSale;
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: selectedClient } = useClient(activeSale?.clientId ?? "");
  const updateSale = useUpdateSale();
  const updateSaleStatus = useUpdateSaleStatus();

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
      ].filter((productId): productId is string => productId !== null),
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
      productNameMatchesSearch(i.productName ?? "", q),
    );
    const matchClient = sale.clientName?.toLowerCase().includes(q);
    return matchProduct || matchClient;
  });

  const groups = filteredItems ? groupSalesByDate(filteredItems) : [];
  const receivedTotal =
    filteredItems
      ?.filter((sale) => sale.status === "paid")
      .reduce((sum, sale) => sum + sale.total, 0) ?? 0;

  const modals = (
    <>
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
              <Typography variant="h3">Filtrar vendas</Typography>
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
            style={{ height: 80, textAlignVertical: "center" }}
          />
        </View>
      </StandardModal>
    </>
  );

  const handleMarkPaid = (id: string) => {
    void updateSaleStatus.mutateAsync({ id, status: "paid" }).catch(() => {
      alertError("Não foi possível marcar a venda como paga.");
    });
  };

  if (isDesktop) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          height: "100%",
          width: "100%",
          backgroundColor: palette.background,
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[desktopPageContent(true), { gap: 0 }]}
          keyboardShouldPersistTaps="handled"
        >
          <DesktopSalesPage
            header={
              <ScreenGuidance
                renderHeader={(helpButton) => (
                  <ScreenHeader
                    help={helpButton}
                    title="Vendas"
                    subtitle="Acompanhe seus pedidos e recebimentos"
                    hideBack
                    right={
                      <FAB
                        icon="add"
                        header
                        accessibilityLabel="Nova venda"
                        onPress={() => router.push("/tabs/new-sale")}
                      />
                    }
                  />
                )}
                area="sales"
                onStart={() => router.push("/tabs/new-sale")}
                hasRecords={(data?.total ?? 0) > 0}
                loading={isLoading || !!error}
                suspended={showFilters || !!selectedSaleId}
              />
            }
            view={operationView}
            onViewChange={setOperationView}
            orders={orders}
            onOpenAgenda={() => router.push("/tabs/agenda")}
            isLoading={isLoading}
            error={error}
            onRetry={() => void refetch()}
            items={filteredItems ?? []}
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              setPage(1);
            }}
            search={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            onClearFilters={handleClearFilters}
            onNewSale={() => router.push("/tabs/new-sale")}
            onSalePress={setSelectedSaleId}
            onMarkPaid={handleMarkPaid}
            page={data?.page ?? page}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </ScrollView>
        {modals}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundColor: palette.background,
      }}
    >
      <ScreenGuidance
        renderHeader={(helpButton) => (
          <SalesHeader
            help={helpButton}
            count={filteredItems?.length ?? 0}
            name={profile?.name ?? "Maria"}
            receivedTotal={receivedTotal}
          />
        )}
        area="sales"
        onStart={() => router.push("/tabs/new-sale")}
        hasRecords={(data?.total ?? 0) > 0}
        loading={isLoading || !!error}
        suspended={showFilters || !!selectedSaleId}
      />
      <View
        style={{
          flex: 1,
          minHeight: 0,
          backgroundColor: palette.background,
        }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
        >
          <>
            <View
              accessibilityRole="tablist"
              accessibilityLabel="Status das vendas"
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                paddingTop: spacing.xs,
                paddingBottom: spacing.md,
                ...pageGutter(isDesktop),
              }}
            >
              {FILTER_TABS.map((tab) => (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeFilter === tab.key }}
                  onPress={() => {
                    setActiveFilter(tab.key);
                    setPage(1);
                  }}
                  style={({ pressed }) => ({
                    flex: isDesktop ? undefined : 1,
                    minWidth: isDesktop ? undefined : 90,
                    minHeight: 44,
                    paddingHorizontal: isDesktop ? spacing.lg : spacing.xs,
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottomWidth: 2,
                    borderBottomColor:
                      activeFilter === tab.key ? palette.wine : theme.colors.border,
                    backgroundColor: pressed ? theme.colors.surface : "transparent",
                  })}
                >
                  <Typography
                    variant={activeFilter === tab.key ? "captionBold" : "caption"}
                    color={
                      activeFilter === tab.key ? palette.wine : theme.colors.textSecondary
                    }
                    style={{ textAlign: "center" }}
                  >
                    {tab.label}
                  </Typography>
                </Pressable>
              ))}
            </View>

            <View
              style={{
                paddingTop: 0,
                paddingBottom: spacing.md,
                ...pageGutter(isDesktop),
                ...(isDesktop
                  ? { alignSelf: "flex-start", maxWidth: 480, width: "100%" }
                  : undefined),
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

            <View
              style={{
                flex: 1,
                minHeight: 0,
                paddingBottom: isDesktop
                  ? 0
                  : floatingTabBarContentPadding(insets.bottom),
              }}
            >
              <SalesContent
                isLoading={isLoading}
                error={error}
                hasItems={!!filteredItems?.length}
                activeFilter={activeFilter}
                hasActiveFilters={!!searchQuery.trim()}
                groups={groups}
                isDesktop={isDesktop}
                primaryColor={theme.colors.primary}
                onSalePress={setSelectedSaleId}
                onClearFilters={handleClearFilters}
                onNewSalePress={() => router.push("/tabs/new-sale")}
                onRetry={() => void refetch()}
                hasMore={!isDesktop && salesFeed.hasNextPage}
                loadingMore={salesFeed.isFetchingNextPage}
                onLoadMore={() => void salesFeed.fetchNextPage()}
                compactEmpty={activeFilter !== "all"}
              />
            </View>
          </>
        </View>
      </View>

      {modals}
    </SafeAreaView>
  );
}
