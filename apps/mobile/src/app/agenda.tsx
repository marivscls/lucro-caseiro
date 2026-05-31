import { formatCurrency as formatMoney } from "../shared/utils/format";
import type { Order, OrderStatus } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Typography,
  useTheme,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

function OrderDetail({
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

function OrdersSummaryHeader() {
  const { theme } = useTheme();
  const { data: summary } = useOrdersSummary();

  if (!summary || summary.totalOrders === 0) return null;

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Total dos pedidos
        </Typography>
        <Typography variant="h2" color={theme.colors.success}>
          {formatMoney(summary.totalAmount)}
        </Typography>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Typography variant="body" color={theme.colors.textSecondary}>
            A receber: {formatMoney(summary.pending.amount)}
          </Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Recebido: {formatMoney(summary.delivered.amount)}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

function OrdersList({
  groups,
  onSelect,
  bottomInset,
}: Readonly<{
  groups: OrderGroup[];
  onSelect: (id: string) => void;
  bottomInset: number;
}>) {
  const { theme } = useTheme();
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
        gap: spacing.xl,
      }}
    >
      <OrdersSummaryHeader />
      {groups.map((group) => {
        const meta = GROUP_META[group.key] ?? {
          icon: "calendar-outline" as const,
          tone: "default" as const,
        };
        const c = toneColor(meta.tone);
        return (
          <View key={group.key} style={{ gap: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Ionicons name={meta.icon} size={18} color={c} />
              <Typography variant="h3" color={c}>
                {group.title}
              </Typography>
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
    </ScrollView>
  );
}

export default function AgendaScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: orders, isLoading, error } = useOrders();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const groups = orders ? groupOrders(orders, new Date()) : [];
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
      <OrderDetail
        order={selected}
        onClose={() => setSelectedId(null)}
        onEdit={() => setEditing(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {renderContent()}

      {/* FAB */}
      <View
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      >
        <Button title="+ Nova encomenda" onPress={() => setShowCreate(true)} size="md" />
      </View>

      {/* Criar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowCreate(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          <OrderForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Detalhe / edição */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedId(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
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
          </View>
          {renderDetail()}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
