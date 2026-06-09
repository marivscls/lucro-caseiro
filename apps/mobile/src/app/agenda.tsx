import { formatCurrency as formatMoney } from "../shared/utils/format";
import type { Order, OrderStatus } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Typography,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClient } from "../features/clients/hooks";
import { OrderCard } from "../features/orders/components/order-card";
import { OrderForm } from "../features/orders/components/order-form";
import {
  STATUS_LABEL,
  formatDateBR,
  groupOrders,
  type OrderGroup,
} from "../features/orders/domain";
import {
  useDeleteOrder,
  useDeliverOrder,
  useOrders,
  useOrdersSummary,
  useUpdateOrder,
} from "../features/orders/hooks";
import { openWhatsApp, waMessages } from "../shared/utils/whatsapp";

const PIPELINE: OrderStatus[] = ["pending", "in_production", "ready"];
const SURFACE = "rgba(44, 36, 32, 0.84)";
const BORDER = "rgba(245, 225, 219, 0.1)";
const MUTED = "#B8A090";

type GroupTone = "alert" | "success" | "default";
const GROUP_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; tone: GroupTone }
> = {
  overdue: { icon: "alarm", tone: "alert" },
  today: { icon: "today-outline", tone: "default" },
  tomorrow: { icon: "sunny-outline", tone: "default" },
  week: { icon: "calendar-outline", tone: "default" },
  later: { icon: "time-outline", tone: "default" },
  finished: { icon: "checkmark-done-circle", tone: "success" },
};

function _OrderDetail({
  order,
  onClose,
  onEdit,
}: Readonly<{ order: Order; onClose: () => void; onEdit: () => void }>) {
  const { theme } = useTheme();
  const updateOrder = useUpdateOrder();
  const deliverOrder = useDeliverOrder();
  const deleteOrder = useDeleteOrder();
  const { data: client } = useClient(order.clientId ?? "");

  function setStatus(status: OrderStatus) {
    updateOrder.mutate({ id: order.id, data: { status } });
  }

  function handleDeliver() {
    Alert.alert(
      "Marcar como entregue?",
      "Deseja registrar essa encomenda como receita no financeiro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sem receita",
          onPress: () => {
            deliverOrder.mutate(
              { id: order.id, data: { registerIncome: false } },
              { onSuccess: onClose },
            );
          },
        },
        {
          text: "Registrar receita",
          onPress: () => {
            deliverOrder.mutate(
              { id: order.id, data: { registerIncome: true } },
              { onSuccess: onClose },
            );
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert("Excluir encomenda", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deleteOrder.mutate(order.id, { onSuccess: onClose });
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h2">{order.title}</Typography>
      {order.clientName ? (
        <Typography variant="body">{order.clientName}</Typography>
      ) : null}

      <Card>
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Entrega</Typography>
            <Typography variant="bodyBold">
              {formatDateBR(order.deliveryDate)}
              {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
            </Typography>
          </View>
          {order.amount != null ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Typography variant="caption">Valor</Typography>
              <Typography variant="bodyBold" color={theme.colors.success}>
                {formatMoney(order.amount)}
              </Typography>
            </View>
          ) : null}
          {order.notes ? (
            <View style={{ gap: spacing.xs }}>
              <Typography variant="caption">Observações</Typography>
              <Typography variant="body">{order.notes}</Typography>
            </View>
          ) : null}
        </View>
      </Card>

      {client?.phone ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption">WhatsApp</Typography>
          <Button
            title="Confirmar pedido"
            variant="secondary"
            onPress={() => {
              void openWhatsApp(
                client.phone!,
                waMessages.orderConfirm(
                  order.clientName,
                  order.title,
                  order.deliveryDate,
                ),
              );
            }}
          />
          <Button
            title="Avisar que está pronto"
            variant="secondary"
            onPress={() => {
              void openWhatsApp(
                client.phone!,
                waMessages.orderReady(order.clientName, order.title),
              );
            }}
          />
        </View>
      ) : null}

      {order.status !== "done" && order.status !== "cancelled" ? (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption">Status</Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PIPELINE.map((s) => (
              <Chip
                key={s}
                label={STATUS_LABEL[s]}
                selected={order.status === s}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>
        </View>
      ) : (
        <Typography variant="body" color={theme.colors.textSecondary}>
          Encomenda {STATUS_LABEL[order.status].toLowerCase()}.
        </Typography>
      )}

      {order.status !== "done" && order.status !== "cancelled" ? (
        <Button
          title="Marcar como entregue"
          size="lg"
          onPress={handleDeliver}
          loading={deliverOrder.isPending}
        />
      ) : null}
      <Button title="Editar" variant="secondary" onPress={onEdit} />
      <Button
        title="Excluir"
        variant="secondary"
        onPress={handleDelete}
        loading={deleteOrder.isPending}
      />
    </ScrollView>
  );
}

function ModernOrderDetail({
  order,
  onClose,
  onEdit,
}: Readonly<{ order: Order; onClose: () => void; onEdit: () => void }>) {
  const { theme } = useTheme();
  const updateOrder = useUpdateOrder();
  const deliverOrder = useDeliverOrder();
  const deleteOrder = useDeleteOrder();
  const { data: client } = useClient(order.clientId ?? "");
  const isFinished = order.status === "done" || order.status === "cancelled";
  const statusMeta: Record<
    OrderStatus,
    { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
  > = {
    pending: {
      icon: "time-outline",
      color: theme.colors.premium,
      bg: "rgba(212, 160, 84, 0.12)",
    },
    in_production: {
      icon: "sync-circle-outline",
      color: theme.colors.blue,
      bg: "rgba(137, 165, 181, 0.14)",
    },
    ready: {
      icon: "checkmark-done-outline",
      color: theme.colors.success,
      bg: "rgba(107, 191, 150, 0.12)",
    },
    done: {
      icon: "checkmark",
      color: theme.colors.success,
      bg: "rgba(107, 191, 150, 0.12)",
    },
    cancelled: {
      icon: "close",
      color: theme.colors.alert,
      bg: "rgba(224, 114, 114, 0.12)",
    },
  };
  const statusVisual = statusMeta[order.status];

  function setStatus(status: OrderStatus) {
    updateOrder.mutate({ id: order.id, data: { status } });
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  function handleDeliver() {
    Alert.alert(
      "Marcar como entregue?",
      "Deseja registrar essa encomenda como receita no financeiro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sem receita",
          onPress: () => {
            deliverOrder.mutate(
              { id: order.id, data: { registerIncome: false } },
              { onSuccess: onClose },
            );
          },
        },
        {
          text: "Registrar receita",
          onPress: () => {
            deliverOrder.mutate(
              { id: order.id, data: { registerIncome: true } },
              { onSuccess: onClose },
            );
          },
        },
      ],
    );
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  function handleDelete() {
    Alert.alert("Excluir encomenda", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deleteOrder.mutate(order.id, { onSuccess: onClose });
        },
      },
    ]);
  }

  function ActionCard({
    icon,
    title,
    subtitle,
    onPress,
  }: Readonly<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
  }>) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 78,
          borderRadius: radii.xl,
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          padding: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name={icon} size={26} color={theme.colors.primaryLight} />
        <View style={{ flex: 1, gap: 2 }}>
          <Typography
            variant="bodyBold"
            color={theme.colors.text}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            style={{ fontSize: 15, lineHeight: 19 }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color={MUTED}
            numberOfLines={2}
            style={{ fontSize: 12 }}
          >
            {subtitle}
          </Typography>
        </View>
      </Pressable>
    );
  }

  function RowAction({
    icon,
    title,
    subtitle,
    onPress,
    danger,
  }: Readonly<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    onPress?: () => void;
    danger?: boolean;
  }>) {
    const iconColor = danger ? theme.colors.alert : theme.colors.primaryLight;
    return (
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => ({
          minHeight: 74,
          borderRadius: radii.xl,
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          padding: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radii.lg,
            backgroundColor: danger
              ? "rgba(224, 114, 114, 0.12)"
              : "rgba(196, 112, 126, 0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={25} color={iconColor} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography
            variant="bodyBold"
            color={danger ? theme.colors.alert : theme.colors.text}
            style={{ fontSize: 17 }}
          >
            {title}
          </Typography>
          <Typography variant="body" color={MUTED} style={{ fontSize: 14 }}>
            {subtitle}
          </Typography>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={24} color={MUTED} /> : null}
      </Pressable>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingTop: 0,
        paddingBottom: spacing["2xl"],
        gap: spacing.lg,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            backgroundColor: "rgba(196, 112, 126, 0.16)",
            borderWidth: 1,
            borderColor: "rgba(196, 112, 126, 0.45)",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {order.photoUrl ? (
            <Image source={{ uri: order.photoUrl }} style={{ width: 96, height: 96 }} />
          ) : (
            <Ionicons name="cube-outline" size={52} color={theme.colors.primaryLight} />
          )}
        </View>
        <View style={{ flex: 1, gap: spacing.sm }}>
          <Typography
            variant="display"
            color={theme.colors.text}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{ fontSize: 30, lineHeight: 36, fontWeight: "800" }}
          >
            {order.title}
          </Typography>
          {order.clientName ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.primaryLight}
              />
              <Typography
                variant="bodyBold"
                color={MUTED}
                numberOfLines={1}
                style={{ fontSize: 17 }}
              >
                {order.clientName}
              </Typography>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={{
          borderRadius: radii["2xl"],
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: BORDER,
          padding: spacing.md,
          flexDirection: "row",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1.2, gap: spacing.md, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              alignItems: "center",
              marginTop: spacing.sm,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radii.lg,
                backgroundColor: "rgba(196, 112, 126, 0.14)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={theme.colors.primaryLight}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body"
                color={MUTED}
                numberOfLines={1}
                style={{ fontSize: 13 }}
              >
                Data de entrega
              </Typography>
              <Typography
                variant="bodyBold"
                color={theme.colors.text}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
                style={{ fontSize: 18 }}
              >
                {formatDateBR(order.deliveryDate)}
              </Typography>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: radii.lg,
                backgroundColor: "rgba(107, 191, 150, 0.14)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="cash-outline" size={22} color={theme.colors.success} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body"
                color={MUTED}
                numberOfLines={1}
                style={{ fontSize: 13 }}
              >
                Valor
              </Typography>
              <Typography
                variant="bodyBold"
                color={theme.colors.success}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={{ fontSize: 18 }}
              >
                {order.amount != null ? formatMoney(order.amount) : "Não informado"}
              </Typography>
            </View>
          </View>
        </View>
        <View style={{ width: 1, backgroundColor: BORDER }} />
        <View
          style={{
            width: 118,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 3,
              borderColor: statusVisual.color,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: statusVisual.bg,
            }}
          >
            <Ionicons name={statusVisual.icon} size={44} color={statusVisual.color} />
          </View>
          <View
            style={{
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: statusVisual.bg,
            }}
          >
            <Typography
              variant="bodyBold"
              color={statusVisual.color}
              numberOfLines={1}
              style={{ fontSize: 15 }}
            >
              {STATUS_LABEL[order.status]}
            </Typography>
          </View>
        </View>
      </View>

      {client?.phone ? (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons name="logo-whatsapp" size={24} color={theme.colors.success} />
            <Typography variant="h3" color={MUTED} style={{ fontSize: 18 }}>
              WhatsApp
            </Typography>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <ActionCard
              icon="logo-whatsapp"
              title="Confirmar pedido"
              subtitle="Confirmar com o cliente"
              onPress={() => {
                void openWhatsApp(
                  client.phone!,
                  waMessages.orderConfirm(
                    order.clientName,
                    order.title,
                    order.deliveryDate,
                  ),
                );
              }}
            />
            <ActionCard
              icon="checkmark-done-outline"
              title="Avisar que está pronto"
              subtitle="Informar que o pedido está pronto"
              onPress={() => {
                void openWhatsApp(
                  client.phone!,
                  waMessages.orderReady(order.clientName, order.title),
                );
              }}
            />
          </View>
        </View>
      ) : null}

      <View style={{ height: 1, backgroundColor: BORDER }} />

      {isFinished ? (
        <Typography variant="h3" color={MUTED} style={{ fontSize: 19 }}>
          Encomenda {STATUS_LABEL[order.status].toLowerCase()}.
        </Typography>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption">Status</Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PIPELINE.map((s) => (
              <Chip
                key={s}
                label={STATUS_LABEL[s]}
                selected={order.status === s}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>
          <Button
            title="Marcar como entregue"
            size="lg"
            onPress={handleDeliver}
            loading={deliverOrder.isPending}
          />
        </View>
      )}

      <RowAction
        icon="pencil-outline"
        title="Editar encomenda"
        subtitle="Alterar informações da encomenda"
        onPress={onEdit}
      />
      <RowAction
        icon="trash-outline"
        title="Excluir encomenda"
        subtitle={deleteOrder.isPending ? "Excluindo..." : "Remover esta encomenda"}
        onPress={handleDelete}
        danger
      />
      <RowAction
        icon="clipboard-outline"
        title="Observações"
        subtitle={order.notes || "Nenhuma observação adicionada."}
      />
    </ScrollView>
  );
}

function AgendaHeader() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <Typography
        variant="h1"
        color={theme.colors.text}
        style={{ fontSize: 29, fontWeight: "800" }}
      >
        Agenda
      </Typography>
    </View>
  );
}

function OrdersSummaryHeader({
  selectedDate,
  onOpenFilter,
}: Readonly<{ selectedDate: string | null; onOpenFilter: () => void }>) {
  const { theme } = useTheme();
  const { data: summary } = useOrdersSummary(
    selectedDate ? { startDate: selectedDate, endDate: selectedDate } : undefined,
  );
  const filterLabel = selectedDate ? formatDateBR(selectedDate) : "Todos";

  if (!summary || summary.totalOrders === 0) return null;

  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}
      >
        <View style={{ flex: 1, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Ionicons
              name="analytics-outline"
              size={20}
              color={theme.colors.primaryLight}
            />
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={{ fontSize: 17 }}
            >
              Resumo do dia
            </Typography>
          </View>
          <Typography variant="body" color={MUTED} style={{ fontSize: 18 }}>
            Total dos pedidos
          </Typography>
          <Typography
            variant="moneyLg"
            color={theme.colors.success}
            style={{ fontSize: 32 }}
          >
            {formatMoney(summary.totalAmount)}
          </Typography>
        </View>
        <Pressable
          onPress={onOpenFilter}
          style={{
            alignSelf: "flex-start",
            borderRadius: radii.lg,
            backgroundColor: "rgba(245, 225, 219, 0.06)",
            paddingHorizontal: spacing.md,
            minHeight: 42,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={1}>
            {filterLabel}
          </Typography>
          <Ionicons name="chevron-down" size={18} color={MUTED} />
        </Pressable>
      </View>
      <View
        style={{
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: BORDER,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {[
          [
            "A receber",
            summary.pending.amount,
            "apps-outline" as const,
            theme.colors.primaryLight,
          ],
          [
            "Recebido",
            summary.delivered.amount,
            "analytics-outline" as const,
            theme.colors.success,
          ],
        ].map(([label, value, icon, color], index) => (
          <View
            key={label as string}
            style={{
              flex: 1,
              padding: spacing.sm,
              flexDirection: "row",
              gap: spacing.sm,
              alignItems: "center",
              borderLeftWidth: index === 1 ? 1 : 0,
              borderLeftColor: BORDER,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                backgroundColor: "rgba(196, 112, 126, 0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={color as string}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body"
                color={MUTED}
                numberOfLines={1}
                style={{ fontSize: 14 }}
              >
                {label as string}
              </Typography>
              <Typography
                variant="bodyBold"
                color={theme.colors.success}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={{ fontSize: 15 }}
              >
                {formatMoney(value as number)}
              </Typography>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function OrdersList({
  groups,
  onSelect,
  onCreate,
  selectedDate,
  onOpenDayFilter,
  bottomInset,
}: Readonly<{
  groups: OrderGroup[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  selectedDate: string | null;
  onOpenDayFilter: () => void;
  bottomInset: number;
}>) {
  const { theme } = useTheme();
  const [showTip, setShowTip] = useState(true);
  const toneColor = (tone: GroupTone) => {
    if (tone === "alert") return theme.colors.alert;
    if (tone === "success") return theme.colors.success;
    return theme.colors.text;
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: 96 + bottomInset,
        gap: spacing.lg,
      }}
    >
      <AgendaHeader />
      <OrdersSummaryHeader selectedDate={selectedDate} onOpenFilter={onOpenDayFilter} />
      {groups.map((group) => {
        const meta = GROUP_META[group.key] ?? {
          icon: "calendar-outline" as const,
          tone: "default" as const,
        };
        const c = toneColor(meta.tone);
        return (
          <View key={group.key} style={{ gap: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.sm,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Ionicons name={meta.icon} size={23} color={c} />
                <Typography variant="h3" color={c} style={{ fontSize: 22 }}>
                  {group.title}
                </Typography>
              </View>
              {group.key !== "finished" ? (
                <Ionicons name="chevron-up" size={22} color={theme.colors.text} />
              ) : null}
            </View>
            <View style={{ gap: spacing.md }}>
              {group.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => onSelect(order.id)}
                />
              ))}
            </View>
          </View>
        );
      })}
      <Pressable
        onPress={onCreate}
        style={{
          minHeight: 58,
          borderRadius: radii.xl,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: theme.colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.md,
          backgroundColor: "rgba(44, 36, 32, 0.35)",
        }}
      >
        <Ionicons name="add-circle-outline" size={24} color={theme.colors.primaryLight} />
        <Typography
          variant="bodyBold"
          color={theme.colors.primaryLight}
          style={{ fontSize: 17 }}
        >
          Nova encomenda
        </Typography>
      </Pressable>
      {showTip ? (
        <View
          style={{
            minHeight: 64,
            borderRadius: radii.xl,
            padding: spacing.md,
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Ionicons name="calendar" size={26} color={theme.colors.primaryLight} />
          <View style={{ flex: 1, gap: 2 }}>
            <Typography variant="bodyBold" color={theme.colors.primaryLight}>
              Dica do dia
            </Typography>
            <Typography variant="body" color={theme.colors.text} style={{ fontSize: 13 }}>
              Mantenha sua agenda em dia para não perder nenhum pedido!
            </Typography>
          </View>
          <Pressable onPress={() => setShowTip(false)} hitSlop={10}>
            <Ionicons name="close" size={22} color={MUTED} />
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function getDayFilterOptions(orders: Order[]) {
  const countByDate = new Map<string, number>();
  for (const order of orders) {
    countByDate.set(order.deliveryDate, (countByDate.get(order.deliveryDate) ?? 0) + 1);
  }

  return [...countByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function DayFilterModal({
  visible,
  options,
  selectedDate,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  options: Array<{ date: string; count: number }>;
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  onClose: () => void;
}>) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.58)",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Pressable
          style={{
            borderRadius: radii["2xl"],
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: BORDER,
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={theme.colors.primaryLight}
              />
              <Typography variant="h3" color={theme.colors.text}>
                Filtrar por dia
              </Typography>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={MUTED} />
            </Pressable>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              style={{
                borderRadius: radii.lg,
                backgroundColor:
                  selectedDate === null
                    ? "rgba(196, 112, 126, 0.22)"
                    : "rgba(245, 225, 219, 0.05)",
                padding: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="bodyBold" color={theme.colors.text}>
                Todos os dias
              </Typography>
              <Typography variant="caption" color={MUTED}>
                limpar filtro
              </Typography>
            </Pressable>

            {options.map((option) => {
              const selected = selectedDate === option.date;
              return (
                <Pressable
                  key={option.date}
                  onPress={() => {
                    onSelect(option.date);
                    onClose();
                  }}
                  style={{
                    borderRadius: radii.lg,
                    backgroundColor: selected
                      ? "rgba(196, 112, 126, 0.22)"
                      : "rgba(245, 225, 219, 0.05)",
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.md,
                  }}
                >
                  <Typography variant="bodyBold" color={theme.colors.text}>
                    {formatDateBR(option.date)}
                  </Typography>
                  <Typography variant="caption" color={MUTED}>
                    {option.count} {option.count === 1 ? "encomenda" : "encomendas"}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AgendaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: orders, isLoading, error } = useOrders();
  const [showCreate, setShowCreate] = useState(false);
  const [showDayFilter, setShowDayFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const dayFilterOptions = useMemo(() => getDayFilterOptions(orders ?? []), [orders]);
  const visibleOrders = useMemo(
    () =>
      selectedDate && orders
        ? orders.filter((order) => order.deliveryDate === selectedDate)
        : (orders ?? []),
    [orders, selectedDate],
  );
  const groups = groupOrders(visibleOrders, new Date());
  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  function renderContent() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Algo deu errado"
          description="Não foi possível carregar sua agenda. Tente novamente."
        />
      );
    }
    if (groups.length === 0) {
      return (
        <EmptyState
          title="Sua agenda está vazia"
          description="Cadastre uma encomenda com data de entrega para começar a se organizar."
          action={<Button title="Nova encomenda" onPress={() => setShowCreate(true)} />}
        />
      );
    }
    return (
      <OrdersList
        groups={groups}
        bottomInset={insets.bottom}
        onCreate={() => setShowCreate(true)}
        selectedDate={selectedDate}
        onOpenDayFilter={() => setShowDayFilter(true)}
        onSelect={(id) => {
          setSelectedId(id);
          setEditing(false);
        }}
      />
    );
  }

  function renderDetail() {
    if (!selected) return null;
    if (editing) {
      return (
        <OrderForm
          order={selected}
          onSuccess={() => {
            setEditing(false);
            setSelectedId(null);
          }}
        />
      );
    }
    return (
      <ModernOrderDetail
        order={selected}
        onClose={() => setSelectedId(null)}
        onEdit={() => setEditing(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderContent()}

      {/* Criar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
            }}
          >
            <Pressable
              onPress={() => setShowCreate(false)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: BORDER,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={25} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={() => setShowCreate(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <OrderForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      <DayFilterModal
        visible={showDayFilter}
        options={dayFilterOptions}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowDayFilter(false)}
      />

      {/* Detalhe / edição */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedId(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
            }}
          >
            <Pressable
              onPress={() => {
                setSelectedId(null);
                setEditing(false);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: "rgba(245, 225, 219, 0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={25} color={theme.colors.text} />
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable
                onPress={() => {
                  setSelectedId(null);
                  setEditing(false);
                }}
              >
                <Typography variant="bodyBold" color={theme.colors.primary}>
                  Fechar
                </Typography>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedId(null);
                  setEditing(false);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(245, 225, 219, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color={MUTED} />
              </Pressable>
            </View>
          </View>
          {renderDetail()}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
