import type { Product } from "@lucro-caseiro/contracts";
import { Input, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { useProducts } from "../../products/hooks";
import { Skeleton } from "../../../shared/components/skeleton";

interface LabelProductPickerProps {
  selectedId: string | null;
  onSelect: (product: Product) => void;
}

export function LabelProductPicker({
  selectedId,
  onSelect,
}: Readonly<LabelProductPickerProps>) {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProducts({ limit: 100 });
  const products = data?.items ?? [];
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [products, search]);

  return (
    <View style={{ width: "100%", minWidth: 0, gap: spacing.sm }}>
      <Typography variant="h3">Produto da etiqueta</Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Escolha um produto para preencher o nome que será impresso.
      </Typography>
      {isLoading ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Skeleton width={110} height={36} borderRadius={9999} />
          <Skeleton width={90} height={36} borderRadius={9999} />
          <Skeleton width={120} height={36} borderRadius={9999} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChangeText={setSearch}
            icon={
              <AppIcon
                name="search-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
          />
          <ScrollView
            style={{ maxHeight: 260 }}
            contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.xs }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            {visibleProducts.map((product) => {
              const selected = selectedId === product.id;
              return (
                <Pressable
                  key={product.id}
                  onPress={() => onSelect(product)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected
                      ? `${theme.colors.primary}14`
                      : theme.colors.surfaceElevated,
                    paddingHorizontal: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Typography
                    variant={selected ? "bodyBold" : "body"}
                    color={theme.colors.text}
                    numberOfLines={2}
                    style={{ flex: 1 }}
                  >
                    {product.name}
                  </Typography>
                  {selected ? (
                    <AppIcon
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
            {visibleProducts.length === 0 && search.trim() ? (
              <Typography
                variant="caption"
                color={theme.colors.textSecondary}
                style={{ textAlign: "center", paddingVertical: spacing.md }}
              >
                Nenhum produto encontrado.
              </Typography>
            ) : null}
          </ScrollView>
        </View>
      )}
      {!isLoading && products.length === 0 ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Cadastre um produto antes de criar a etiqueta.
        </Typography>
      ) : null}
    </View>
  );
}
