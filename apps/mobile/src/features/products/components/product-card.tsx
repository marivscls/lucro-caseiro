import { formatCurrency } from "../../../shared/utils/format";
import type { Product } from "@lucro-caseiro/contracts";
import { Badge, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";

import { useNotificationEnabled } from "../../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../../shared/hooks/notification-types";
import { getStockBadge } from "../stock-badge";
import { productInitial } from "../display";

interface ProductCardProps {
  readonly product: Product;
  readonly onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { theme } = useTheme();
  const lowStockEnabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);
  const stockBadge = getStockBadge(product, lowStockEnabled);

  return (
    <Card onPress={onPress} style={{ flexDirection: "row", gap: 12 }}>
      {product.photoUrl ? (
        <Image
          source={{ uri: product.photoUrl }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
          }}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" color={theme.colors.textSecondary}>
            {productInitial(product.name)}
          </Typography>
        </View>
      )}

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Typography variant="h3" numberOfLines={2} style={{ flex: 1, minWidth: 0 }}>
            {product.name}
          </Typography>
          {product.isComposite && (
            <Badge label="Kit" variant="lavender" style={{ flexShrink: 0 }} />
          )}
        </View>
        <Typography variant="caption">{product.category}</Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3" color={theme.colors.success}>
            {product.saleUnit === "kg"
              ? `${formatCurrency(product.salePrice)}/kg`
              : formatCurrency(product.salePrice)}
          </Typography>
          {stockBadge && <Badge label={stockBadge.label} variant={stockBadge.variant} />}
        </View>
      </View>
    </Card>
  );
}
