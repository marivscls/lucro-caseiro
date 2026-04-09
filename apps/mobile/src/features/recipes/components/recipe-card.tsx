import { Badge, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

interface Recipe {
  id: string;
  name: string;
  category: string;
  costPerUnit: number;
  yieldQuantity: number;
  yieldUnit: string;
}

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const { theme } = useTheme();

  return (
    <Card onPress={onPress} style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h3">{recipe.name}</Typography>
        <Badge label={recipe.category} variant="neutral" />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.lg }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Custo: {formatCurrency(recipe.costPerUnit)}/{recipe.yieldUnit}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Rende: {recipe.yieldQuantity} {recipe.yieldUnit}
          {recipe.yieldQuantity !== 1 ? "s" : ""}
        </Typography>
      </View>
    </Card>
  );
}
