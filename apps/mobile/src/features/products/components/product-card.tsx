import type { Product } from "@lucro-caseiro/contracts";
import { Badge, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, View } from "react-native";

interface ProductCardProps {
  readonly product: Product;
  readonly onPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function getStockBadge(product: Product) {
  if (product.stockQuantity === null) return null;
  if (product.stockQuantity === 0)
    return { label: "Sem estoque", variant: "danger" as const };
  if (
    product.stockAlertThreshold !== null &&
    product.stockQuantity <= product.stockAlertThreshold
  )
    return { label: "Estoque baixo", variant: "warning" as const };
  return { label: `${product.stockQuantity} un.`, variant: "success" as const };
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { theme } = useTheme();
  const stockBadge = getStockBadge(product);

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
        <Typography variant="h3">{product.name}</Typography>
        <Typography variant="caption">{product.category}</Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Typography variant="h3" color={theme.colors.success}>
            {formatCurrency(product.salePrice)}
          </Typography>
          {stockBadge && <Badge label={stockBadge.label} variant={stockBadge.variant} />}
        </View>
      </View>
    </Card>
  );
}
