import type { Purchase } from "@lucro-caseiro/contracts";
import { Badge, Button, Card, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { useSupplierName } from "../../suppliers/hooks";
import { categoryLabel } from "../domain";

interface PurchaseCardProps {
  readonly purchase: Purchase;
  readonly onPay: () => void;
  readonly onDelete: () => void;
  readonly isPaying?: boolean;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PurchaseCard({ purchase, onPay, onDelete, isPaying }: PurchaseCardProps) {
  const { theme } = useTheme();
  const supplierName = useSupplierName(purchase.supplierId);
  const isPaid = purchase.paymentStatus === "paid";

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: spacing.sm,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Typography variant="bodyBold" numberOfLines={1}>
              {purchase.description}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {supplierName ? `${supplierName} • ` : ""}
              {categoryLabel(purchase.category)} • {formatDate(purchase.purchasedAt)}
            </Typography>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {formatCurrency(purchase.amount)}
            </Typography>
            <Badge
              label={isPaid ? "Pago" : "A pagar"}
              variant={isPaid ? "success" : "warning"}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {!isPaid ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Marcar como paga"
                variant="success"
                size="sm"
                onPress={onPay}
                loading={isPaying}
              />
            </View>
          ) : null}
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Excluir compra"
            hitSlop={8}
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              minHeight: 36,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
            }}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.alert} />
            <Typography
              variant="caption"
              color={theme.colors.alert}
              style={{ fontWeight: "700" }}
            >
              Excluir
            </Typography>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
