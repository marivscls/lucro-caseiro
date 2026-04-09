import { Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";

import { useDeleteRecipe, useRecipe, useScaleRecipe } from "../hooks";

interface RecipeDetailProps {
  readonly recipeId: string;
  readonly onDuplicate?: () => void;
  readonly onEdit?: () => void;
  readonly onDeleted?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const SCALE_OPTIONS = [0.5, 1, 1.5, 2, 3, 5];

export function RecipeDetail({
  recipeId,
  onDuplicate: _onDuplicate,
  onEdit,
  onDeleted,
}: RecipeDetailProps) {
  const { theme } = useTheme();
  const [multiplier, setMultiplier] = useState(1);
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: scaledRecipe } = useScaleRecipe(recipeId, multiplier);
  const deleteRecipe = useDeleteRecipe();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.success} />
      </View>
    );
  }

  if (!recipe) return null;

  const displayRecipe = multiplier === 1 ? recipe : (scaledRecipe ?? recipe);
  const ingredients = displayRecipe.ingredients ?? [];
  const totalCost = ingredients.reduce(
    (sum: number, ing: { cost: number }) => sum + ing.cost,
    0,
  );
  const costPerUnit =
    displayRecipe.yieldQuantity > 0 ? totalCost / displayRecipe.yieldQuantity : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Typography variant="h2">{recipe.name}</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {recipe.category}
        </Typography>
      </View>

      {recipe.instructions && (
        <Card style={{ gap: 8 }}>
          <Typography variant="h3">Modo de preparo</Typography>
          <Typography variant="body">{recipe.instructions}</Typography>
        </Card>
      )}

      <Card
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 16,
        }}
      >
        <View style={{ alignItems: "center", gap: 4 }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Custo total
          </Typography>
          <Typography variant="h2" color={theme.colors.alert}>
            {formatCurrency(totalCost)}
          </Typography>
        </View>
        <View style={{ width: 1, backgroundColor: theme.colors.surface }} />
        <View style={{ alignItems: "center", gap: 4 }}>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Custo por unidade
          </Typography>
          <Typography variant="h2" color={theme.colors.success}>
            {formatCurrency(costPerUnit)}
          </Typography>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <Typography variant="h3">Escala da receita</Typography>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {SCALE_OPTIONS.map((scale) => (
            <View
              key={scale}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  multiplier === scale ? theme.colors.success : theme.colors.surface,
              }}
            >
              <Typography
                variant="caption"
                color={
                  multiplier === scale
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary
                }
                onPress={() => setMultiplier(scale)}
              >
                {scale}x
              </Typography>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Typography variant="h3">Ingredientes</Typography>
        <Typography variant="caption">
          Rende: {displayRecipe.yieldQuantity} {displayRecipe.yieldUnit}
          {displayRecipe.yieldQuantity !== 1 ? "s" : ""}
        </Typography>

        <Card style={{ gap: 0 }}>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surface,
            }}
          >
            <Typography variant="caption" style={{ flex: 2 }}>
              Ingrediente
            </Typography>
            <Typography variant="caption" style={{ flex: 1, textAlign: "center" }}>
              Qtd
            </Typography>
            <Typography variant="caption" style={{ flex: 1, textAlign: "right" }}>
              Custo
            </Typography>
          </View>

          {ingredients.map(
            (
              ing: {
                ingredientId: string;
                ingredientName: string;
                ingredientPrice: number;
                quantity: number;
                unit: string;
                cost: number;
              },
              index: number,
            ) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderBottomWidth: index < ingredients.length - 1 ? 1 : 0,
                  borderBottomColor: theme.colors.surface,
                  alignItems: "center",
                }}
              >
                <Typography variant="body" style={{ flex: 2 }}>
                  {ing.ingredientName}
                </Typography>
                <Typography
                  variant="caption"
                  color={theme.colors.textSecondary}
                  style={{ flex: 1, textAlign: "center" }}
                >
                  {ing.quantity} {ing.unit}
                </Typography>
                <Typography
                  variant="body"
                  color={theme.colors.alert}
                  style={{ flex: 1, textAlign: "right" }}
                >
                  {formatCurrency(ing.cost ?? 0)}
                </Typography>
              </View>
            ),
          )}

          <View
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: theme.colors.surface,
            }}
          >
            <Typography variant="h3" style={{ flex: 2 }}>
              Total
            </Typography>
            <View style={{ flex: 1 }} />
            <Typography
              variant="h3"
              color={theme.colors.alert}
              style={{ flex: 1, textAlign: "right" }}
            >
              {formatCurrency(totalCost)}
            </Typography>
          </View>
        </Card>
      </View>

      {onEdit && <Button title="Editar receita" size="lg" onPress={onEdit} />}

      <Button
        title="Excluir receita"
        variant="outline"
        size="lg"
        onPress={() => {
          Alert.alert("Excluir receita", "Tem certeza que deseja excluir esta receita?", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: () => {
                void (async () => {
                  try {
                    await deleteRecipe.mutateAsync(recipeId);
                    onDeleted?.();
                  } catch {
                    Alert.alert("Erro", "Nao foi possivel excluir a receita.");
                  }
                })();
              },
            },
          ]);
        }}
        loading={deleteRecipe.isPending}
      />
    </ScrollView>
  );
}
