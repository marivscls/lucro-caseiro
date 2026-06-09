import type { Sale } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, View } from "react-native";

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
    return { text: theme.colors.success, bg: "rgba(107, 191, 150, 0.22)" };
  }
  if (color === "warning") {
    return { text: theme.colors.yellow, bg: "rgba(232, 197, 85, 0.2)" };
  }
  return { text: theme.colors.alert, bg: "rgba(224, 114, 114, 0.2)" };
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          minHeight: 96,
          borderRadius: radii.xl,
          padding: spacing.md,
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(44, 36, 32, 0.84)"
              : theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor:
            theme.mode === "dark" ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.08)",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: theme.mode === "dark" ? 0.28 : 0.07,
          shadowRadius: 18,
          elevation: 3,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 18,
            backgroundColor:
              theme.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor:
              theme.mode === "dark"
                ? "rgba(245, 225, 219, 0.1)"
                : "rgba(74, 50, 40, 0.06)",
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

        <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
}
