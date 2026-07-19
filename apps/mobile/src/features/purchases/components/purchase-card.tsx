import type { Purchase } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Typography,
  fonts,
  useTheme,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import { useSupplierName } from "../../suppliers/hooks";
import { categoryLabel } from "../domain";

interface PurchaseCardProps {
  readonly purchase: Purchase;
  readonly onPay: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly isPaying?: boolean;
  readonly payDisabled?: boolean;
  readonly isDeleting?: boolean;
  readonly deleteDisabled?: boolean;
  readonly editDisabled?: boolean;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PurchaseCard({
  purchase,
  onPay,
  onEdit,
  onDelete,
  isPaying,
  payDisabled,
  isDeleting,
  deleteDisabled,
  editDisabled,
}: PurchaseCardProps) {
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

        {purchase.items.length ? (
          <View style={{ gap: spacing.xs }}>
            {purchase.items.slice(0, 3).map((item) => (
              <Typography key={item.id} variant="caption">
                {item.quantity}x {item.productName}
                {item.variationName ? ` — ${item.variationName}` : ""}
              </Typography>
            ))}
            {purchase.items.length > 3 ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                +{purchase.items.length - 3} itens
              </Typography>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          {!isPaid ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Marcar como paga"
                variant="success"
                size="sm"
                onPress={onPay}
                loading={isPaying}
                disabled={payDisabled}
              />
            </View>
          ) : null}
          <Pressable
            onPress={onEdit}
            disabled={editDisabled}
            accessibilityRole="button"
            accessibilityLabel="Editar compra"
            hitSlop={8}
            style={({ pressed }) => ({
              marginLeft: isPaid ? "auto" : undefined,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              minHeight: 36,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              opacity: pressed || editDisabled ? 0.55 : 1,
            })}
          >
            <AppIcon name="pencil-outline" size={18} color={theme.colors.primaryStrong} />
            <Typography
              variant="caption"
              color={theme.colors.primaryStrong}
              style={{ fontFamily: fonts.bold }}
            >
              Editar
            </Typography>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={deleteDisabled}
            accessibilityRole="button"
            accessibilityLabel={isDeleting ? "Excluindo compra" : "Excluir compra"}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              minHeight: 36,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              opacity: pressed || (deleteDisabled && !isDeleting) ? 0.55 : 1,
            })}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.colors.alert} />
            ) : (
              <AppIcon name="trash-outline" size={18} color={theme.colors.alert} />
            )}
            <Typography
              variant="caption"
              color={theme.colors.alert}
              style={{ fontFamily: fonts.bold }}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Typography>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
