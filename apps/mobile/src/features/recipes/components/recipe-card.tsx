import { formatCurrency } from "../../../shared/utils/format";
import { Badge, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";

interface Recipe {
  id: string;
  name: string;
  category: string;
  costPerUnit: number;
  yieldQuantity: number;
  yieldUnit: string;
  photoUrl?: string | null;
}

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress?: () => void;
}

// Fallback por categoria (quando não há foto): emoji + cor coerentes com o prato.
const CATEGORY_FALLBACK = new Map<string, { emoji: string; color: string }>([
  ["Doces", { emoji: "🍬", color: "#C4566B" }],
  ["Bolos", { emoji: "🎂", color: "#C4707E" }],
  ["Salgados", { emoji: "🥟", color: "#C9A36A" }],
  ["Bebidas", { emoji: "🥤", color: "#6E93B5" }],
]);

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const { theme } = useTheme();
  const fallback = CATEGORY_FALLBACK.get(recipe.category) ?? {
    emoji: "🍽️",
    color: "#9A8F87",
  };

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <IngredientAvatar
          name={recipe.name}
          photoUrl={recipe.photoUrl}
          matchCatalog={false}
          fallbackEmoji={fallback.emoji}
          fallbackColor={fallback.color}
          size={52}
        />
        <View style={{ flex: 1, gap: spacing.sm }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
            }}
          >
            <Typography variant="h3" numberOfLines={1} style={{ flex: 1 }}>
              {recipe.name}
            </Typography>
            <Badge label={recipe.category} variant="neutral" />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo: {formatCurrency(recipe.costPerUnit)}/{recipe.yieldUnit}
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Rende: {recipe.yieldQuantity} {recipe.yieldUnit}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}
