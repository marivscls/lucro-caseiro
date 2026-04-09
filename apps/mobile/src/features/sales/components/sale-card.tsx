import type { Sale } from "@lucro-caseiro/contracts";
import { Badge, Card, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

interface SaleCardProps {
  readonly sale: Sale;
  readonly onPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
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

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const { theme } = useTheme();
  const status = STATUS_MAP[sale.status] ?? {
    label: sale.status,
    variant: "neutral" as const,
  };
  const paymentLabel = PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod;

  const itemsSummary = sale.items
    ?.map((i) => i.productName)
    .filter(Boolean)
    .join(", ");

  const statusColorMap: Record<string, string> = {
    success: theme.colors.success,
    warning: theme.colors.yellow,
  };
  const statusDotColor = statusColorMap[status.variant] ?? theme.colors.alert;

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {/* Status indicator dot */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: statusDotColor,
            }}
          />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="bodyBold">
            {sale.items?.[0]?.productName ?? "Venda"}
            {(sale.items?.length ?? 0) > 1 ? ` +${(sale.items?.length ?? 1) - 1}` : ""}
          </Typography>
          {itemsSummary ? (
            <Typography variant="caption" numberOfLines={1}>
              {itemsSummary}
            </Typography>
          ) : (
            <Typography variant="caption">{paymentLabel}</Typography>
          )}
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatCurrency(sale.total)}
          </Typography>
          <Badge label={status.label} variant={status.variant} />
        </View>
      </View>
    </Card>
  );
}
