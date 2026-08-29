import { formatCurrency } from "../../../shared/utils/format";
import type { Product } from "@lucro-caseiro/contracts";
import { Badge, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, Pressable, useWindowDimensions, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { useNotificationEnabled } from "../../../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../../../shared/hooks/notification-types";
import { brandScreenPalette } from "../../../shared/brand-palette";
import { getStockBadge } from "../stock-badge";
import { productInitial } from "../display";

interface ProductCardProps {
  readonly product: Product;
  readonly onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width } = useWindowDimensions();
  const compact = width < 350;
  const thumbnailSize = compact ? 64 : 72;
  const lowStockEnabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);
  const stockBadge = getStockBadge(product, lowStockEnabled);

  return (
    <Card
      onPress={onPress}
      variant="elevated"
      padding="md"
      style={{
        minHeight: compact ? 92 : 104,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        position: "relative",
        backgroundColor: palette.white,
      }}
    >
      {product.photoUrl ? (
        <Image
          source={{ uri: product.photoUrl }}
          resizeMode="cover"
          style={{
            width: thumbnailSize,
            height: thumbnailSize,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
          }}
        />
      ) : (
        <View
          style={{
            width: thumbnailSize,
            height: thumbnailSize,
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

      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography
          variant="h3"
          numberOfLines={2}
          style={{ minWidth: 0, paddingRight: 30 }}
        >
          {product.name}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Typography variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
            {product.category}
          </Typography>
          {product.isComposite ? (
            <Badge label="Kit" variant="lavender" style={{ flexShrink: 0 }} />
          ) : null}
        </View>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            paddingTop: 2,
          }}
        >
          <Typography variant="money" color={palette.wine}>
            {product.saleUnit === "kg"
              ? `${formatCurrency(product.salePrice)}/kg`
              : formatCurrency(product.salePrice)}
          </Typography>
          {stockBadge && <Badge label={stockBadge.label} variant={stockBadge.variant} />}
        </View>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir op\u00e7\u00f5es de ${product.name}`}
        hitSlop={8}
        style={({ pressed }) => ({
          position: "absolute",
          top: 8,
          right: 4,
          width: 36,
          height: 36,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <AppIcon name="ellipsis-vertical" size={20} color={palette.ink} />
      </Pressable>
    </Card>
  );
}
