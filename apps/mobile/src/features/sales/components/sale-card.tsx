import type { Sale } from "@lucro-caseiro/contracts";
import { PressableScale, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { Image, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { paymentLabel } from "../payment";

interface SaleCardProps {
  readonly sale: Sale;
  readonly onPress?: () => void;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: "success" | "warning" | "danger" }
> = {
  paid: { label: "Pago", color: "success" },
  pending: { label: "Pendente", color: "warning" },
  cancelled: { label: "Cancelado", color: "danger" },
};

function getStatusColors(
  color: "success" | "warning" | "danger",
  theme: ReturnType<typeof useTheme>["theme"],
) {
  if (color === "success") {
    return { text: theme.colors.success, bg: theme.colors.successBg };
  }
  if (color === "warning") {
    return { text: theme.colors.yellow, bg: theme.colors.yellowBg };
  }
  return { text: theme.colors.alert, bg: theme.colors.alertBg };
}

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const { theme } = useTheme();
  const status = STATUS_MAP[sale.status] ?? {
    label: sale.status,
    color: "danger" as const,
  };
  const payment = paymentLabel(sale.paymentMethod);
  const firstItem = sale.items?.[0];
  const title = firstItem?.productName ?? "Venda";
  const photoUrl = firstItem?.productPhotoUrl ?? null;
  const extraCount = Math.max((sale.items?.length ?? 1) - 1, 0);
  const itemsSummary = sale.items
    ?.map((i) => i.productName)
    .filter(Boolean)
    .join(", ");
  const soldDate = new Date(sale.soldAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });

  const statusColors = getStatusColors(status.color, theme);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      style={{
        minHeight: 96,
        borderRadius: radii.xl,
        padding: spacing.md,
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: radii.xl,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: "hidden",
          }}
        >
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Typography variant="h3" color={theme.colors.text}>
              {title.charAt(0).toUpperCase()}
            </Typography>
          )}
        </View>

        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="bodyBold" numberOfLines={1} color={theme.colors.text}>
            {title}
            {extraCount > 0 ? ` +${extraCount}` : ""}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {sale.clientName ?? itemsSummary ?? "Cliente avulso"}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {soldDate} • {payment}
          </Typography>
        </View>

        <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatCurrency(sale.total)}
          </Typography>
          <View
            style={{
              minHeight: 28,
              paddingHorizontal: spacing.md,
              borderRadius: radii.full,
              backgroundColor: statusColors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" color={statusColors.text}>
              {status.label}
            </Typography>
          </View>
        </View>

        <AppIcon name="chevron-forward" size={24} color={theme.colors.textSecondary} />
      </View>
    </PressableScale>
  );
}
