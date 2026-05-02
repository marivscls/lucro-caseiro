import {
  Button,
  EmptyState,
  Typography,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, TouchableOpacity, View } from "react-native";

import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { useRecipes } from "../hooks";
import { RecipeCard } from "./recipe-card";

interface RecipeListProps {
  readonly onRecipePress?: (id: string) => void;
  readonly onAddPress?: () => void;
}

const CATEGORY_FILTERS = ["Todas", "Doces", "Salgados", "Bolos", "Bebidas", "Outros"];

export function RecipeList({ onRecipePress, onAddPress }: RecipeListProps) {
  const { theme } = useTheme();
  const showAds = useShowAds();
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const category = selectedCategory === "Todas" ? undefined : selectedCategory;
  const { data, isLoading, error } = useRecipes({ category });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Nao foi possivel carregar suas receitas. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="Nenhuma receita ainda"
        description="Cadastre sua primeira receita para calcular seus custos"
        action={
          onAddPress ? (
            <Button title="Cadastrar receita" onPress={onAddPress} />
          ) : undefined
        }
      />
    );
  }

  const listData = showAds ? interleaveAds(data.items) : data.items;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return <AdBanner size="banner" />;
        }
        return <RecipeCard recipe={item} onPress={() => onRecipePress?.(item.id)} />;
      }}
      contentContainerStyle={{ gap: spacing.md, padding: spacing.xl }}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg }}>
          {/* Serif title */}
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h1">Receitas</Typography>
            <Typography variant="body">
              Gerencie seus custos e margens de lucro
            </Typography>
          </View>

          {/* Filter chips */}
          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            {CATEGORY_FILTERS.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor:
                    selectedCategory === cat
                      ? theme.colors.primary
                      : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={
                    selectedCategory === cat
                      ? theme.colors.textOnPrimary
                      : theme.colors.textSecondary
                  }
                >
                  {cat}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
    />
  );
}
