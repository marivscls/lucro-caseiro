import type { Sale } from "@lucro-caseiro/contracts";
import { PressableScale, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { Image, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
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
  const palette = brandScreenPalette(theme);
  if (color === "success") {
    return {
      text: palette.wine,
      bg: palette.softRose,
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
        minHeight: 108,
        borderRadius: radii.xl,
        padding: spacing.md,
        backgroundColor: palette.white,
        borderWidth: 1,
        borderColor: palette.border,
        borderLeftWidth: 4,
        borderLeftColor: palette.rose,
        shadowColor: theme.shadows.sm.shadowColor,
        shadowOffset: theme.shadows.sm.shadowOffset,
        shadowOpacity: theme.shadows.sm.shadowOpacity,
        shadowRadius: theme.shadows.sm.shadowRadius,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: radii.lg,
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

        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Typography variant="bodyBold" numberOfLines={2} color={theme.colors.text}>
            {title}
            {extraCount > 0 ? ` +${extraCount}` : ""}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography
              variant="caption"
              numberOfLines={1}
              style={{ flex: 1, minWidth: 0 }}
            >
              {sale.clientName ?? itemsSummary ?? "Cliente avulso"}
            </Typography>
            <Typography variant="bodyBold" color={palette.wine} numberOfLines={1}>
              {formatCurrency(sale.total)}
            </Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography variant="caption" numberOfLines={1} style={{ flex: 1 }}>
              {soldDate} • {payment}
            </Typography>
            <View
              style={{
                minHeight: 28,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
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
        </View>

        <AppIcon name="chevron-forward" size={22} color={theme.colors.text} />
      </View>
    </PressableScale>
  );
}
