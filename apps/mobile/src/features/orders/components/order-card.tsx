import { formatCurrency as formatMoney } from "../../../shared/utils/format";
import type { Order } from "@lucro-caseiro/contracts";
import {
  Card,
  Typography,
  useTheme,
  spacing,
  radii,
  type Theme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

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
      return { bg: theme.colors.surfaceElevated, fg: theme.colors.textSecondary };
  }
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { theme } = useTheme();
  const c = toneColors(theme, STATUS_TONE[order.status]);

  return (
    <Card onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="bodyBold">{order.title}</Typography>
          {order.clientName ? (
            <Typography variant="caption">{order.clientName}</Typography>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Typography variant="caption">
              {formatDateBR(order.deliveryDate)}
              {order.deliveryTime ? ` · ${order.deliveryTime}` : ""}
            </Typography>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 6 }}>
          {order.amount != null ? (
            <Typography variant="bodyBold" color={theme.colors.success}>
              {formatMoney(order.amount)}
            </Typography>
          ) : null}
          <View
            style={{
              backgroundColor: c.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radii.full,
            }}
          >
            <Typography variant="caption" color={c.fg}>
              {STATUS_LABEL[order.status]}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}
