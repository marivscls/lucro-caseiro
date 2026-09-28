/**
 * Vendas no desktop (web >= 1024px): abas Vendas/Encomendas, indicadores,
 * barra de ferramentas e tabela. Estado, consultas e ações ficam em
 * `app/tabs/sales.tsx`; aqui só a apresentação.
 */
import type { Order, Sale } from "@lucro-caseiro/contracts";
import { spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useState, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { SkeletonList } from "../../../shared/components/skeleton";
import {
  DesktopStatRow,
  DesktopTable,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName } from "../../products/display";
import { paymentLabel } from "../payment";
import {
  DesktopEmptyCard,
  DesktopSearchField,
  DesktopSegmented,
  DesktopToolbar,
} from "../../../shared/layout/desktop-kit";
import {
  DesktopCellText,
  DesktopPager,
  DesktopRowButton,
  DesktopStatGrid,
  DesktopStatusPill,
  DesktopViewTabs,
  type DesktopTone,
} from "./desktop-list-kit";

export type SalesStatusFilter = "all" | "paid" | "pending" | "cancelled";
export type SalesOperationView = "sales" | "orders";

const STATUS_OPTIONS: readonly { key: SalesStatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "paid", label: "Concluídas" },
  { key: "cancelled", label: "Canceladas" },
];

type OrderFilter = "all" | "open" | "done";

const ORDER_OPTIONS: readonly { key: OrderFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "open", label: "Em aberto" },
  { key: "done", label: "Entregues" },
];

/** Abaixo disso a tabela junta data e pagamento na linha da venda. */
const WIDE_TABLE_VIEWPORT = 1280;

function saleStatus(status: Sale["status"]): { label: string; tone: DesktopTone } {
  if (status === "paid") return { label: "Pago", tone: "positive" };
  if (status === "pending") return { label: "Pendente", tone: "attention" };
  return { label: "Cancelado", tone: "negative" };
}

function saleTitle(sale: Sale): string {
  return (
    sale.items
      ?.map((item) => displayProductName(item.productName))
      .filter(Boolean)
      .join(", ") || "Venda"
  );
}

function saleDate(sale: Sale): string {
  return new Date(sale.soldAt).toLocaleDateString("pt-BR");
}

function orderPayment(order: Order): { label: string; tone: DesktopTone } {
  const amount = order.amount ?? 0;
  const received = order.deposit ?? 0;
  if (amount > 0 && received >= amount) return { label: "Pago", tone: "positive" };
  if (received > 0) return { label: "Parcial", tone: "attention" };
  return { label: "Pendente", tone: "attention" };
}

function orderDelivery(order: Order): { label: string; tone: DesktopTone } {
  if (order.status === "done") return { label: "Entregue", tone: "positive" };
  if (order.status === "ready") return { label: "Pronta", tone: "positive" };
  if (order.status === "in_production") return { label: "Produzindo", tone: "neutral" };
  if (order.status === "cancelled") return { label: "Cancelada", tone: "negative" };
  return { label: "Pendente", tone: "neutral" };
}

function isOrderOpen(order: Order): boolean {
  return !["done", "cancelled"].includes(order.status);
}

function SalesStats({ sales, orders }: Readonly<{ sales: Sale[]; orders: Order[] }>) {
  const { theme } = useTheme();
  const active = sales.filter((sale) => sale.status !== "cancelled");
  const sum = (items: Sale[]) => items.reduce((total, sale) => total + sale.total, 0);
  return (
    <DesktopStatGrid
      items={[
        { label: "Vendido no período", value: formatCurrency(sum(active)) },
        {
          label: "Recebido",
          value: formatCurrency(sum(active.filter((sale) => sale.status === "paid"))),
          color: theme.colors.success,
        },
        {
          label: "A receber",
          value: formatCurrency(sum(active.filter((sale) => sale.status === "pending"))),
        },
        { label: "Encomendas abertas", value: String(orders.filter(isOrderOpen).length) },
      ]}
    />
  );
}

function SalesTable({
  items,
  onSalePress,
  onMarkPaid,
}: Readonly<{
  items: Sale[];
  onSalePress: (id: string) => void;
  onMarkPaid: (id: string) => void;
}>) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_TABLE_VIEWPORT;
  const hasPending = items.some((sale) => sale.status === "pending");

  const clientCell = (sale: Sale) => (
    <DesktopCellText color={sale.clientName ? undefined : theme.colors.textSecondary}>
      {sale.clientName ?? "Cliente avulso"}
    </DesktopCellText>
  );
  const actionsColumn: DesktopTableColumn<Sale> = {
    key: "actions",
    title: "",
    width: hasPending ? 196 : 24,
    align: "right",
    render: (sale) => (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {sale.status === "pending" ? (
          <DesktopRowButton
            icon="checkmark-circle-outline"
            label="Marcar pago"
            accessibilityLabel={`Marcar como paga a venda de ${formatCurrency(sale.total)}`}
            color={theme.colors.success}
            onPress={() => onMarkPaid(sale.id)}
          />
        ) : null}
        <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    ),
  };

  // Telas largas: uma coluna por dado. Em 1024px, cliente, data e pagamento
  // viram a linha de apoio da venda, e a situação fica sob o total.
  const columns: DesktopTableColumn<Sale>[] = wide
    ? [
        {
          key: "sale",
          title: "Venda",
          flex: 2.2,
          render: (sale) => <DesktopCellText strong>{saleTitle(sale)}</DesktopCellText>,
        },
        { key: "client", title: "Cliente", flex: 1.4, render: clientCell },
        {
          key: "date",
          title: "Data",
          flex: 1,
          render: (sale) => <DesktopCellText>{saleDate(sale)}</DesktopCellText>,
        },
        {
          key: "payment",
          title: "Pagamento",
          flex: 1.1,
          render: (sale) => (
            <DesktopCellText>{paymentLabel(sale.paymentMethod)}</DesktopCellText>
          ),
        },
        {
          key: "status",
          title: "Situação",
          width: 124,
          render: (sale) => <DesktopStatusPill {...saleStatus(sale.status)} />,
        },
        {
          key: "total",
          title: "Total",
          width: 116,
          align: "right",
          render: (sale) => (
            <DesktopCellText strong align="right">
              {formatCurrency(sale.total)}
            </DesktopCellText>
          ),
        },
        actionsColumn,
      ]
    : [
        {
          key: "sale",
          title: "Venda",
          flex: 1,
          render: (sale) => (
            <View style={{ gap: 2, width: "100%" }}>
              <DesktopCellText strong>{saleTitle(sale)}</DesktopCellText>
              <Typography variant="desktopMeta" numberOfLines={1}>
                {`${sale.clientName ?? "Cliente avulso"} · ${saleDate(sale)} · ${paymentLabel(
                  sale.paymentMethod,
                )}`}
              </Typography>
            </View>
          ),
        },
        {
          key: "total",
          title: "Total",
          width: 120,
          align: "right",
          render: (sale) => (
            <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
              <DesktopCellText strong align="right">
                {formatCurrency(sale.total)}
              </DesktopCellText>
              <DesktopStatusPill {...saleStatus(sale.status)} align="end" />
            </View>
          ),
        },
        actionsColumn,
      ];

  return (
    <DesktopTable
      columns={columns}
      rows={items}
      keyExtractor={(sale) => sale.id}
      onRowPress={(sale) => onSalePress(sale.id)}
      rowAccessibilityLabel={(sale) =>
        `Abrir venda: ${saleTitle(sale)}, ${formatCurrency(sale.total)}`
      }
    />
  );
}

function OrdersPanel({
  orders,
  onOpenAgenda,
}: Readonly<{ orders: Order[]; onOpenAgenda: () => void }>) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [search, setSearch] = useState("");
  const active = orders.filter(isOrderOpen);
  const toReceive = active.reduce(
    (sum, order) => sum + Math.max((order.amount ?? 0) - (order.deposit ?? 0), 0),
    0,
  );
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const visible = orders.filter((order) => {
    if (filter === "open" && !isOrderOpen(order)) return false;
    if (filter === "done" && order.status !== "done") return false;
    if (!query) return true;
    return [order.title, order.serviceName, order.clientName]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase("pt-BR").includes(query));
  });

  const columns: DesktopTableColumn<Order>[] = [
    {
      key: "order",
      title: "Encomenda",
      flex: 2.2,
      render: (order) => (
        <DesktopCellText strong>{order.serviceName ?? order.title}</DesktopCellText>
      ),
    },
    {
      key: "client",
      title: "Cliente",
      flex: 1.4,
      render: (order) => (
        <DesktopCellText
          color={order.clientName ? undefined : theme.colors.textSecondary}
        >
          {order.clientName ?? "Sem cliente"}
        </DesktopCellText>
      ),
    },
    {
      key: "date",
      title: "Entrega",
      flex: 1,
      render: (order) => (
        <DesktopCellText>
          {order.deliveryDate.split("-").reverse().join("/")}
        </DesktopCellText>
      ),
    },
    {
      key: "delivery",
      title: "Situação",
      width: 128,
      render: (order) => <DesktopStatusPill {...orderDelivery(order)} />,
    },
    {
      key: "payment",
      title: "Pagamento",
      width: 116,
      render: (order) => <DesktopStatusPill {...orderPayment(order)} />,
    },
    {
      key: "amount",
      title: "Valor",
      width: 116,
      align: "right",
      render: (order) => (
        <DesktopCellText strong align="right">
          {formatCurrency(order.amount ?? 0)}
        </DesktopCellText>
      ),
    },
    {
      key: "open",
      title: "",
      width: 24,
      align: "right",
      render: () => (
        <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      ),
    },
  ];

  return (
    <>
      <DesktopStatRow
        items={[
          { label: "Em andamento", value: String(active.length) },
          {
            label: "Entregues",
            value: String(orders.filter((order) => order.status === "done").length),
          },
          { label: "A receber", value: formatCurrency(toReceive) },
        ]}
      />
      <View style={{ gap: spacing.lg }}>
        <DesktopToolbar>
          <DesktopSearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar cliente ou encomenda"
          />
          <DesktopSegmented
            options={ORDER_OPTIONS}
            value={filter}
            onChange={setFilter}
            accessibilityLabel="Situação das encomendas"
          />
        </DesktopToolbar>
        {visible.length === 0 ? (
          <DesktopEmptyCard
            layout="tall"
            title={orders.length === 0 ? "Nenhuma encomenda ainda" : "Nada encontrado"}
            description={
              orders.length === 0
                ? "As encomendas que você marcar na agenda aparecem aqui, com entrega e pagamento."
                : "Ajuste a busca ou escolha outra situação."
            }
            action={
              orders.length === 0
                ? {
                    label: "Abrir agenda",
                    onPress: onOpenAgenda,
                    icon: "calendar-outline",
                  }
                : undefined
            }
          />
        ) : (
          <DesktopTable
            columns={columns}
            rows={visible}
            keyExtractor={(order) => order.id}
            onRowPress={onOpenAgenda}
            rowAccessibilityLabel={(order) =>
              `Abrir na agenda: ${order.serviceName ?? order.title}`
            }
          />
        )}
      </View>
    </>
  );
}

export type DesktopSalesPageProps = Readonly<{
  header: ReactNode;
  view: SalesOperationView;
  onViewChange: (view: SalesOperationView) => void;
  orders: Order[];
  onOpenAgenda: () => void;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  items: Sale[];
  activeFilter: SalesStatusFilter;
  onFilterChange: (filter: SalesStatusFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onNewSale: () => void;
  onSalePress: (id: string) => void;
  onMarkPaid: (id: string) => void;
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}>;

function SalesBody({
  isLoading,
  error,
  onRetry,
  items,
  activeFilter,
  search,
  onClearFilters,
  onNewSale,
  onSalePress,
  onMarkPaid,
  page,
  total,
  totalPages,
  onPageChange,
}: Omit<DesktopSalesPageProps, "header" | "view" | "onViewChange" | "orders">) {
  if (isLoading) return <SkeletonList rows={6} variant="sale" />;
  if (error) {
    return (
      <DesktopEmptyCard
        layout="tall"
        title="Algo deu errado"
        description="Não foi possível carregar suas vendas. Tente novamente."
        action={{ label: "Tentar novamente", onPress: onRetry, variant: "outline" }}
      />
    );
  }
  if (items.length === 0) {
    const filtered = activeFilter !== "all" || !!search.trim();
    return filtered ? (
      <DesktopEmptyCard
        layout="tall"
        title="Nenhuma venda encontrada"
        description="Não encontramos vendas com os filtros aplicados."
        action={{ label: "Limpar filtros", onPress: onClearFilters, variant: "outline" }}
      />
    ) : (
      <DesktopEmptyCard
        layout="tall"
        title="Nenhuma venda registrada"
        description="Suas vendas aparecerão aqui depois do primeiro registro."
        action={{ label: "Nova venda", onPress: onNewSale, icon: "add" }}
      />
    );
  }
  return (
    <View style={{ gap: spacing.md }}>
      <SalesTable items={items} onSalePress={onSalePress} onMarkPaid={onMarkPaid} />
      <DesktopPager
        page={page}
        total={total}
        totalPages={totalPages}
        noun={["venda", "vendas"]}
        onPageChange={onPageChange}
      />
    </View>
  );
}

export function DesktopSalesPage(props: DesktopSalesPageProps) {
  const { header, view, onViewChange, orders, onOpenAgenda, items } = props;
  const openOrders = orders.filter(isOrderOpen).length;
  return (
    <>
      {header}
      <View style={{ gap: spacing["3xl"] - spacing.xs }}>
        <DesktopViewTabs
          options={[
            { key: "sales", label: "Vendas" },
            { key: "orders", label: "Encomendas", count: openOrders || undefined },
          ]}
          value={view}
          onChange={onViewChange}
          accessibilityLabel="Vendas ou encomendas"
        />
        {view === "sales" ? (
          <>
            <SalesStats sales={items} orders={orders} />
            <View style={{ gap: spacing.lg }}>
              <DesktopToolbar>
                <DesktopSearchField
                  value={props.search}
                  onChangeText={props.onSearchChange}
                  placeholder="Buscar produto ou cliente"
                  accessibilityLabel="Buscar por produto ou cliente"
                />
                <DesktopSegmented
                  options={STATUS_OPTIONS}
                  value={props.activeFilter}
                  onChange={props.onFilterChange}
                  accessibilityLabel="Status das vendas"
                />
              </DesktopToolbar>
              <SalesBody {...props} />
            </View>
          </>
        ) : (
          <OrdersPanel orders={orders} onOpenAgenda={onOpenAgenda} />
        )}
      </View>
    </>
  );
}
