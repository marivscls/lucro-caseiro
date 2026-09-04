import type { Order, Sale } from "@lucro-caseiro/contracts";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Chip,
  EmptyState,
  FilterChipRow,
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
import { fetchProduct } from "../../features/products/api";
import {
  displayProductName,
  productNameMatchesSearch,
} from "../../features/products/display";
import { useProducts } from "../../features/products/hooks";
import { SaleCard } from "../../features/sales/components/sale-card";
import { SaleDetail } from "../../features/sales/components/sale-detail";
import {
  useSale,
  useSales,
  useUpdateSale,
  useUpdateSaleStatus,
} from "../../features/sales/hooks";
import { useOrders } from "../../features/orders/hooks";
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
import {
  desktopModalSurface,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { floatingTabBarContentPadding } from "../../shared/layout/floating-tab-bar";
import { alertError } from "../../shared/utils/alerts";
import { brandScreenPalette } from "../../shared/brand-palette";
import salesHeaderIcon from "../../assets/sales-header-icon.png";

type FilterTab = "all" | "paid" | "pending" | "cancelled";
type OperationView = "sales" | "orders";

function orderPaymentLabel(order: Order): string {
  const amount = order.amount ?? 0;
  const received = order.deposit ?? 0;
  if (amount > 0 && received >= amount) return "Pago";
  if (received > 0) return "Parcial";
  return "Pendente";
}

function orderDeliveryLabel(order: Order): string {
  if (order.status === "done") return "Entregue";
  if (order.status === "ready") return "Pronta";
  if (order.status === "in_production") return "Produzindo";
  if (order.status === "cancelled") return "Cancelada";
  return "Pendente";
}

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
  const palette = brandScreenPalette(theme);
  return {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  };
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
          minHeight: 56,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          ...getSurfaceStyle(theme),
        }}
      >
        <AppIcon name="search-outline" size={24} color={theme.colors.textSecondary} />
        <TextInput
          placeholder="Buscar por produto ou cliente"
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
          width: 56,
          height: 56,
          borderRadius: radii.lg,
          backgroundColor: palette.wineFill,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.84 : 1,
        })}
      >
        <AppIcon name="options-outline" size={26} color={palette.onWine} />
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
      <Typography variant="h3" color={palette.wine}>
        {title}
      </Typography>
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

function AvatarCircle({ name }: Readonly<{ name: string }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: radii.full,
        backgroundColor: palette.rose,
        borderWidth: 2,
        borderColor: palette.onWine,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h3" color={palette.onWine}>
        {(name || "M").charAt(0).toUpperCase()}
      </Typography>
    </View>
  );
}

function SalesHeader({
  count,
  isDesktop,
  name,
  receivedTotal,
}: Readonly<{
  count: number;
  isDesktop: boolean;
  name: string;
  receivedTotal: number;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(receivedTotal);
  const countLabel = count === 1 ? "1 venda" : `${count} vendas`;

  return (
    <View style={{ backgroundColor: palette.wineFill }}>
      <View
        style={{
          width: "100%",
          paddingTop: isDesktop ? spacing.xl : spacing.lg,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
          ...(isDesktop ? { paddingHorizontal: spacing["3xl"] } : undefined),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="screenTitle" color={palette.onWine}>
              Vendas
            </Typography>
            <Typography variant="body" color={palette.onWine}>
              Acompanhe seus pedidos e recebimentos
            </Typography>
          </View>
          <AvatarCircle name={name} />
        </View>

        <View
          accessibilityLabel={`${formattedTotal} recebidos em ${countLabel}`}
          style={{
            alignSelf: "flex-start",
            width: isDesktop ? 320 : "72%",
            minWidth: isDesktop ? 320 : 236,
            maxWidth: 340,
            minHeight: 82,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.06)",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            shadowColor: "#160A0F",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.14,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={salesHeaderIcon}
              resizeMode="contain"
              style={{ width: 104, height: 104 }}
            />
          </View>
          <View
            style={{
              width: 1,
              height: 52,
              marginHorizontal: spacing.lg,
              backgroundColor: "rgba(255,255,255,0.58)",
            }}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="moneyLg" color={palette.onWine} numberOfLines={1}>
              {formattedTotal}
            </Typography>
            <Typography variant="body" color={palette.onWine}>
              {countLabel}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
}

function StatusSummary({
  activeFilter,
  count,
  total,
  isDesktop,
}: Readonly<{
  activeFilter: FilterTab;
  count: number;
  total: number;
  isDesktop: boolean;
}>) {
  const { theme } = useTheme();
  if (activeFilter === "all") return null;

  const copy = getStatusSummaryCopy(activeFilter);
  const accent = getStatusSummaryAccent(activeFilter, theme);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(total);

  return (
    <View style={{ paddingTop: spacing.md, ...pageGutter(isDesktop) }}>
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
  readonly bottomInset: number;
  readonly page: number;
  readonly total: number;
  readonly totalPages: number;
  readonly primaryColor: string;
  readonly onSalePress: (id: string) => void;
  readonly onMarkPaid: (id: string) => void;
  readonly onClearFilters: () => void;
  readonly onNewSalePress: () => void;
  readonly onRetry: () => void;
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
  onMarkPaid,
  onPageChange,
}: Readonly<{
  items: Sale[];
  page: number;
  total: number;
  totalPages: number;
  onSalePress: (id: string) => void;
  onMarkPaid: (id: string) => void;
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
      contentContainerStyle={{
        width: "100%",
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
        ...pageGutter(true),
      }}
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ minWidth: 920, width: "100%" }}>
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
              <Typography
                variant="caption"
                style={[headerStyle, { width: 158, textAlign: "right" }]}
              >
                Ações
              </Typography>
            </View>

            {items.map((sale) => {
              const status = saleStatusPresentation(sale.status, theme);
              const saleTitle =
                sale.items
                  ?.map((item) => displayProductName(item.productName))
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
                  <View
                    style={{
                      width: 158,
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: spacing.sm,
                    }}
                  >
                    {sale.status === "pending" ? (
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          onMarkPaid(sale.id);
                        }}
                        accessibilityRole="button"
                        style={{
                          minHeight: 38,
                          paddingHorizontal: spacing.md,
                          borderRadius: radii.full,
                          borderWidth: 1,
                          borderColor: theme.colors.success,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="captionBold" color={theme.colors.success}>
                          Marcar pago
                        </Typography>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        onSalePress(sale.id);
                      }}
                      accessibilityRole="button"
                      style={{
                        minHeight: 38,
                        paddingHorizontal: spacing.md,
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="captionBold"
                        color={theme.colors.primaryStrong}
                      >
                        Abrir
                      </Typography>
                    </Pressable>
                  </View>
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

function DesktopOrdersTable({
  orders,
  onOpenAgenda,
}: Readonly<{ orders: Order[]; onOpenAgenda: () => void }>) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [search, setSearch] = useState("");
  const active = orders.filter((order) => !["done", "cancelled"].includes(order.status));
  const toReceive = active.reduce(
    (sum, order) => sum + Math.max((order.amount ?? 0) - (order.deposit ?? 0), 0),
    0,
  );
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const visibleOrders = orders.filter((order) => {
    if (filter === "open" && ["done", "cancelled"].includes(order.status)) return false;
    if (filter === "done" && order.status !== "done") return false;
    if (!normalizedSearch) return true;
    return [order.title, order.serviceName, order.clientName]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch));
  });
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingVertical: spacing.xl,
        gap: spacing.lg,
        ...pageGutter(true),
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {[
          ["Em andamento", active.length],
          ["Entregues", orders.filter((order) => order.status === "done").length],
          [
            "A receber",
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(toReceive),
          ],
        ].map(([label, value]) => (
          <View
            key={String(label)}
            style={{
              flex: 1,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
              padding: spacing.lg,
              gap: spacing.xs,
            }}
          >
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {label}
            </Typography>
            <Typography variant="moneyLg">{String(value)}</Typography>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cliente ou encomenda"
            placeholderTextColor={theme.colors.textSecondary}
            style={{ flex: 1, color: theme.colors.text, fontFamily: fonts.regular }}
          />
        </View>
        <FilterChipRow style={{ width: 330 }}>
          {[
            ["all", "Todas"],
            ["open", "Em aberto"],
            ["done", "Entregues"],
          ].map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              selected={filter === value}
              onPress={() => setFilter(value as "all" | "open" | "done")}
            />
          ))}
        </FilterChipRow>
      </View>
      <View
        style={{
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          overflow: "hidden",
        }}
      >
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
          {[
            ["Encomenda", 2],
            ["Cliente", 1.4],
            ["Data", 1],
            ["Pagamento", 1.2],
            ["Entrega", 1],
            ["Valor", 1],
          ].map(([label, flex]) => (
            <Typography
              key={String(label)}
              variant="caption"
              style={{
                flex: Number(flex),
                fontFamily: fonts.bold,
                textAlign: label === "Valor" ? "right" : "left",
              }}
            >
              {label}
            </Typography>
          ))}
          <View style={{ width: 90 }} />
        </View>
        {visibleOrders.map((order) => {
          const amount = order.amount ?? 0;
          const payment = orderPaymentLabel(order);
          return (
            <View
              key={order.id}
              style={{
                minHeight: 62,
                paddingHorizontal: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <Typography variant="bodyBold" numberOfLines={1} style={{ flex: 2 }}>
                {order.serviceName ?? order.title}
              </Typography>
              <Typography variant="body" numberOfLines={1} style={{ flex: 1.4 }}>
                {order.clientName ?? "Sem cliente"}
              </Typography>
              <Typography variant="body" style={{ flex: 1 }}>
                {order.deliveryDate.split("-").reverse().join("/")}
              </Typography>
              <Typography
                variant="bodyBold"
                color={payment === "Pago" ? theme.colors.success : theme.colors.premium}
                style={{ flex: 1.2 }}
              >
                {payment}
              </Typography>
              <Typography variant="bodyBold" style={{ flex: 1 }}>
                {orderDeliveryLabel(order)}
              </Typography>
              <Typography
                variant="bodyBold"
                color={theme.colors.success}
                style={{ flex: 1, textAlign: "right" }}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(amount)}
              </Typography>
              <Pressable
                onPress={onOpenAgenda}
                accessibilityRole="button"
                style={{
                  width: 90,
                  minHeight: 40,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="captionBold" color={theme.colors.primaryStrong}>
                  Abrir
                </Typography>
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function DesktopOperationKpis({
  sales,
  orders,
}: Readonly<{ sales: Sale[]; orders: Order[] }>) {
  const { theme } = useTheme();
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const activeSales = sales.filter((sale) => sale.status !== "cancelled");
  const received = activeSales
    .filter((sale) => sale.status === "paid")
    .reduce((sum, sale) => sum + sale.total, 0);
  const receivable = activeSales
    .filter((sale) => sale.status === "pending")
    .reduce((sum, sale) => sum + sale.total, 0);
  const openOrders = orders.filter(
    (order) => !["done", "cancelled"].includes(order.status),
  ).length;
  const values = [
    [
      "Vendido no período",
      formatter.format(activeSales.reduce((sum, sale) => sum + sale.total, 0)),
    ],
    ["Recebido", formatter.format(received)],
    ["A receber", formatter.format(receivable)],
    ["Encomendas abertas", String(openOrders)],
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.md,
        paddingTop: spacing.lg,
        ...pageGutter(true),
      }}
    >
      {values.map(([label, value]) => (
        <View
          key={label}
          style={{
            flex: 1,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            padding: spacing.lg,
            gap: spacing.xs,
          }}
        >
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {label}
          </Typography>
          <Typography
            variant="h3"
            color={label === "Recebido" ? theme.colors.success : theme.colors.text}
            numberOfLines={1}
          >
            {value}
          </Typography>
        </View>
      ))}
    </View>
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
  bottomInset,
  page,
  total,
  totalPages,
  primaryColor: _primaryColor,
  onSalePress,
  onMarkPaid,
  onClearFilters,
  onNewSalePress,
  onRetry,
  onPageChange,
  compactEmpty = false,
}: SalesContentProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { copy } = useBrand();
  const listBottomPadding = isDesktop
    ? spacing["5xl"]
    : floatingTabBarContentPadding(bottomInset);

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
  if (isDesktop) {
    return (
      <DesktopSalesTable
        items={items}
        page={page}
        total={total}
        totalPages={totalPages}
        onSalePress={onSalePress}
        onMarkPaid={onMarkPaid}
        onPageChange={onPageChange}
      />
    );
  }
  return (
    <FlatList
      style={{ flex: 1, minHeight: 0 }}
      data={groups}
      keyExtractor={(item) => item.title}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingBottom: listBottomPadding,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: group, index }) => (
        <View
          style={{
            position: "relative",
            marginTop: spacing.xl,
            paddingLeft: spacing.xl,
          }}
        >
          <View
            style={{
              position: "absolute",
              left: 7,
              top: 14,
              bottom: index === groups.length - 1 ? spacing.xl : -spacing.xl,
              width: 2,
              borderRadius: radii.full,
              backgroundColor: theme.colors.border,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 7,
              width: 16,
              height: 16,
              borderRadius: radii.full,
              borderWidth: 5,
              borderColor: palette.lime,
              backgroundColor: palette.white,
            }}
          />
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
  const { data, isLoading, error, refetch } = useSales({
    page: isDesktop ? page : undefined,
    status: statusParam,
  });
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
  const filteredTotal = filteredItems?.reduce((sum, sale) => sum + sale.total, 0) ?? 0;
  const receivedTotal =
    filteredItems
      ?.filter((sale) => sale.status === "paid")
      .reduce((sum, sale) => sum + sale.total, 0) ?? 0;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        height: "100%",
        width: "100%",
        overflow: "hidden",
        backgroundColor: palette.wineFill,
      }}
    >
      <SalesHeader
        count={filteredItems?.length ?? 0}
        isDesktop={isDesktop}
        name={profile?.name ?? "Maria"}
        receivedTotal={receivedTotal}
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
          {isDesktop ? (
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                paddingTop: spacing.xl,
                width: 330,
                ...pageGutter(isDesktop),
              }}
            >
              <Chip
                label="Vendas"
                selected={operationView === "sales"}
                onPress={() => setOperationView("sales")}
              />
              <Chip
                label="Encomendas"
                selected={operationView === "orders"}
                onPress={() => setOperationView("orders")}
              />
            </View>
          ) : null}

          {isDesktop ? (
            <DesktopOperationKpis sales={filteredItems ?? []} orders={orders} />
          ) : null}

          {operationView === "sales" ? (
            <>
              <FilterChipRow
                style={{
                  paddingTop: spacing.xl,
                  paddingBottom: spacing.lg,
                  ...pageGutter(isDesktop),
                }}
              >
                {FILTER_TABS.map((tab) => (
                  <Chip
                    key={tab.key}
                    label={tab.label}
                    selected={activeFilter === tab.key}
                    onPress={() => {
                      setActiveFilter(tab.key);
                      setPage(1);
                    }}
                  />
                ))}
              </FilterChipRow>

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

              {isDesktop ? (
                <StatusSummary
                  activeFilter={activeFilter}
                  count={filteredItems?.length ?? 0}
                  total={filteredTotal}
                  isDesktop
                />
              ) : null}

              <SalesContent
                isLoading={isLoading}
                error={error}
                hasItems={!!filteredItems?.length}
                activeFilter={activeFilter}
                hasActiveFilters={!!searchQuery.trim()}
                groups={groups}
                items={filteredItems ?? []}
                isDesktop={isDesktop}
                bottomInset={insets.bottom}
                page={data?.page ?? page}
                total={data?.total ?? 0}
                totalPages={data?.totalPages ?? 1}
                primaryColor={theme.colors.primary}
                onSalePress={setSelectedSaleId}
                onMarkPaid={(id) => {
                  void updateSaleStatus.mutateAsync({ id, status: "paid" }).catch(() => {
                    alertError("Não foi possível marcar a venda como paga.");
                  });
                }}
                onClearFilters={handleClearFilters}
                onNewSalePress={() => router.push("/tabs/new-sale")}
                onRetry={() => void refetch()}
                onPageChange={setPage}
                compactEmpty={activeFilter !== "all"}
              />
            </>
          ) : (
            <DesktopOrdersTable
              orders={orders}
              onOpenAgenda={() => router.push("/tabs/agenda")}
            />
          )}
        </View>
      </View>

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
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
          />
        </View>
      </StandardModal>
    </SafeAreaView>
  );
}
