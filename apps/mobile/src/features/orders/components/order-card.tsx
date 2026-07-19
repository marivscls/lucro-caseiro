import { formatCurrency as formatMoney } from "../../../shared/utils/format";
import type { Order } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii, type Theme } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React from "react";
import { Image, Pressable, View } from "react-native";

import { STATUS_LABEL, STATUS_TONE, formatDateBR, type StatusTone } from "../domain";

interface OrderCardProps {
  readonly order: Order;
  readonly onPress?: () => void;
}

function toneColors(theme: Theme, tone: StatusTone): { bg: string; fg: string } {
  switch (tone) {
    case "info":
      return { bg: theme.colors.blueBg, fg: theme.colors.blue };
    case "warn":
      return { bg: theme.colors.premiumBg, fg: theme.colors.premium };
    case "success":
      return { bg: theme.colors.successBg, fg: theme.colors.success };
    case "danger":
      return { bg: theme.colors.alertBg, fg: theme.colors.alert };
    default:
      return {
        bg: theme.colors.surface,
        fg: theme.colors.textSecondary,
      };
  }
}

function orderIcon(order: Order): AppIconName {
  if (order.status === "done") return "cube-outline";
  if (order.status === "in_production") return "bag-handle-outline";
  if (order.status === "ready") return "checkmark-circle-outline";
  return "cube-outline";
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { theme } = useTheme();
  const colors = toneColors(theme, STATUS_TONE[order.status]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 86,
        borderRadius: radii.xl,
        padding: spacing.md,
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radii.lg,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {order.photoUrl ? (
          <Image source={{ uri: order.photoUrl }} style={{ width: 52, height: 52 }} />
        ) : (
          <AppIcon name={orderIcon(order)} size={25} color={colors.fg} />
        )}
      </View>

      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <Typography
          variant="bodyBold"
          numberOfLines={1}
          style={{ color: theme.colors.text }}
        >
          {order.title}
        </Typography>
        {order.clientName ? (
          <Typography variant="caption" numberOfLines={1}>
            {order.clientName}
          </Typography>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AppIcon name="calendar-outline" size={14} color={theme.colors.textSecondary} />
          <Typography variant="caption" numberOfLines={1}>
            {formatDateBR(order.deliveryDate)}
            {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
          </Typography>
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 7 }}>
        {order.amount != null ? (
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatMoney(order.amount)}
          </Typography>
        ) : null}
        {order.deposit != null && order.amount != null && order.deposit < order.amount ? (
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Falta {formatMoney(order.amount - order.deposit)}
          </Typography>
        ) : null}
        <View
          style={{
            backgroundColor: colors.bg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radii.full,
          }}
        >
          <Typography variant="caption" color={colors.fg} style={{ fontSize: 13 }}>
            {STATUS_LABEL[order.status]}
          </Typography>
        </View>
      </View>

      <AppIcon name="chevron-forward" size={23} color={theme.colors.textSecondary} />
    </Pressable>
  );
}
