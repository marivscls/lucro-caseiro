import type { Sale } from "@lucro-caseiro/contracts";
import { PressableScale, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { Image, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { formatCurrency } from "../../../shared/utils/format";
import { displayProductName, productInitial } from "../../products/display";
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
    return {
      text: theme.colors.success,
      bg: theme.colors.successBg,
    };
  }
  if (color === "warning") {
    return { text: theme.colors.yellow, bg: theme.colors.yellowBg };
  }
  return { text: theme.colors.alert, bg: theme.colors.alertBg };
}

export function SaleCard({ sale, onPress }: SaleCardProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const status = STATUS_MAP[sale.status] ?? {
    label: sale.status,
    color: "danger" as const,
  };
  const payment = paymentLabel(sale.paymentMethod);
  const firstItem = sale.items?.[0];
  const title = firstItem ? displayProductName(firstItem.productName) : "Venda";
  const photoUrl = firstItem?.productPhotoUrl ?? null;
  const extraCount = Math.max((sale.items?.length ?? 1) - 1, 0);
  const soldDate = new Date(sale.soldAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

  const statusColors = getStatusColors(status.color, theme);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatCurrency(sale.total)}, ${status.label}`}
      style={{
        minHeight: 104,
        borderRadius: radii.lg,
        padding: spacing.md,
        gap: spacing.md,
        backgroundColor: palette.white,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
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
            <Typography variant="bodyBold" color={theme.colors.textSecondary}>
              {productInitial(title)}
            </Typography>
          )}
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Typography variant="bodyBold" numberOfLines={2} color={theme.colors.text}>
            {title}
            {extraCount > 0 ? ` +${extraCount}` : ""}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {sale.clientName ?? "Venda avulsa"}
          </Typography>
        </View>
        <AppIcon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Typography variant="caption" style={{ flex: 1 }}>
          {soldDate} · {payment}
        </Typography>
        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          <Typography variant="bodyBold" color={theme.colors.text} numberOfLines={1}>
            {formatCurrency(sale.total)}
          </Typography>
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radii.sm,
              backgroundColor: statusColors.bg,
            }}
          >
            <Typography variant="caption" color={statusColors.text}>
              {status.label}
            </Typography>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}
