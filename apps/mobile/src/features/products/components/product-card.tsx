import { formatCurrency } from "../../../shared/utils/format";
import type { Product } from "@lucro-caseiro/contracts";
import { Badge, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";

import { useNotificationEnabled } from "../../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../../shared/hooks/notification-types";

interface ProductCardProps {
  readonly product: Product;
  readonly onPress?: () => void;
}

/**
 * Selo de estoque. Os selos de alerta ("Sem estoque" / "Estoque baixo") só
 * aparecem se a preferência "Estoque baixo" estiver ligada; a contagem neutra
 * ("X un.") é apenas informação e aparece sempre.
 */
function getStockBadge(product: Product, lowStockEnabled: boolean) {
  // Produtos vendidos por peso (kg) nao usam controle de estoque por unidade.
  if (product.saleUnit === "kg") return null;
  // Kits (produtos compostos) nao tem estoque proprio por unidade no MVP.
  if (product.isComposite) return null;
  if (product.stockQuantity === null) return null;
  if (product.stockQuantity === 0)
    return lowStockEnabled ? { label: "Sem estoque", variant: "danger" as const } : null;
  if (
    product.stockAlertThreshold !== null &&
    product.stockQuantity <= product.stockAlertThreshold
  )
    return lowStockEnabled
      ? { label: "Estoque baixo", variant: "warning" as const }
      : null;
  return { label: `${product.stockQuantity} un.`, variant: "success" as const };
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
            {product.name.charAt(0).toUpperCase()}
          </Typography>
        </View>
      )}

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3">{product.name}</Typography>
          {product.isComposite && <Badge label="Kit" variant="lavender" />}
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
