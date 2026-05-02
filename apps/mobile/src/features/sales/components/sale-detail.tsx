import type { Sale } from "@lucro-caseiro/contracts";
import { Badge, Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Alert, ScrollView, View } from "react-native";

import { useUpdateSaleStatus } from "../hooks";

interface SaleDetailProps {
  readonly sale: Sale;
  readonly onStatusUpdated?: () => void;
  readonly onEditPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Pago", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card: "Cartao",
  credit: "Fiado",
  transfer: "Transferencia",
};

export function SaleDetail({ sale, onStatusUpdated, onEditPress }: SaleDetailProps) {
  const { theme } = useTheme();
  const updateStatus = useUpdateSaleStatus();

  const status = STATUS_MAP[sale.status] ?? {
    label: sale.status,
    variant: "neutral" as const,
  };
  const paymentLabel = PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod;

  function handleMarkAsPaid() {
    Alert.alert("Confirmar", "Deseja marcar esta venda como paga?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim, marcar como paga",
        onPress: () => {
          void (async () => {
            try {
              await updateStatus.mutateAsync({ id: sale.id, status: "paid" });
              Alert.alert("Pronto!", "Venda marcada como paga.");
              onStatusUpdated?.();
            } catch {
              Alert.alert("Erro", "Nao foi possivel atualizar o status.");
            }
          })();
        },
      },
    ]);
  }

  function handleCancel() {
    Alert.alert("Cancelar venda", "Tem certeza que deseja cancelar esta venda?", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await updateStatus.mutateAsync({ id: sale.id, status: "cancelled" });
              Alert.alert("Pronto!", "Venda cancelada.");
              onStatusUpdated?.();
            } catch {
              Alert.alert("Erro", "Nao foi possivel cancelar a venda.");
            }
          })();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h2">Detalhes da venda</Typography>
        <Badge label={status.label} variant={status.variant} />
      </View>

      <Card>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Cliente</Typography>
            <Typography variant="body">{sale.clientName ?? "Cliente avulso"}</Typography>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Pagamento</Typography>
            <Badge label={paymentLabel} variant="info" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="caption">Data</Typography>
            <Typography variant="body">{formatDate(sale.soldAt)}</Typography>
          </View>
          {sale.notes && (
            <View style={{ marginTop: 4 }}>
              <Typography variant="caption">Observacoes</Typography>
              <Typography variant="body">{sale.notes}</Typography>
            </View>
          )}
        </View>
      </Card>

      <Typography variant="h3">Itens</Typography>
      {sale.items.map((item) => (
        <Card key={item.id}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="body">{item.productName}</Typography>
              <Typography variant="caption">
                {item.quantity}x {formatCurrency(item.unitPrice)}
              </Typography>
            </View>
            <Typography variant="h3" color={theme.colors.success}>
              {formatCurrency(item.subtotal)}
            </Typography>
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: theme.colors.successBg }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h3">Total</Typography>
          <Typography variant="h2" color={theme.colors.success}>
            {formatCurrency(sale.total)}
          </Typography>
        </View>
      </Card>

      <View style={{ gap: 12, marginTop: 8 }}>
        {sale.status !== "cancelled" && onEditPress && (
          <Button
            title="Editar venda"
            variant="secondary"
            size="lg"
            onPress={onEditPress}
          />
        )}
        {sale.status === "pending" && (
          <Button
            title="Marcar como pago"
            size="lg"
            onPress={handleMarkAsPaid}
            loading={updateStatus.isPending}
          />
        )}
        {sale.status !== "cancelled" && (
          <Button
            title="Cancelar venda"
            variant="outline"
            size="lg"
            onPress={handleCancel}
            loading={updateStatus.isPending}
          />
        )}
      </View>
    </ScrollView>
  );
}
