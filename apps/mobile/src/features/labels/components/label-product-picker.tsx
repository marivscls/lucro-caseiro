import type { Product } from "@lucro-caseiro/contracts";
import { Chip, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { useProducts } from "../../products/hooks";

interface LabelProductPickerProps {
  selectedId: string | null;
  onSelect: (product: Product) => void;
}

export function LabelProductPicker({
  selectedId,
  onSelect,
}: Readonly<LabelProductPickerProps>) {
  const { theme } = useTheme();
  const { data, isLoading } = useProducts({ limit: 100 });
  const products = data?.items ?? [];

  return (
    <View style={{ gap: spacing.sm }}>
      <Typography variant="h3">Produto do rótulo</Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        O QR Code abrirá este produto diretamente no seu catálogo.
      </Typography>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {products.map((product) => (
            <Chip
              key={product.id}
              label={product.name}
              selected={selectedId === product.id}
              onPress={() => onSelect(product)}
            />
          ))}
        </ScrollView>
      )}
      {!isLoading && products.length === 0 ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Cadastre um produto antes de criar o rótulo.
        </Typography>
      ) : null}
    </View>
  );
}
