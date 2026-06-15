import { formatCurrency } from "../../../shared/utils/format";
import { Button, Card, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, View } from "react-native";

import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { useDeleteRecipe, useDuplicateRecipe, useRecipe, useScaleRecipe } from "../hooks";
import { exportRecipePdf } from "../recipe-pdf";
import { alertError } from "../../../shared/utils/alerts";

interface RecipeDetailProps {
  readonly recipeId: string;
  readonly onDuplicate?: () => void;
  readonly onEdit?: () => void;
  readonly onDeleted?: () => void;
}

const SCALE_OPTIONS = [0.5, 1, 1.5, 2, 3, 5];

export function RecipeDetail({
  recipeId,
  onDuplicate,
  onEdit,
  onDeleted,
}: RecipeDetailProps) {
  const { theme } = useTheme();
  const [multiplier, setMultiplier] = useState(1);
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const { data: scaledRecipe } = useScaleRecipe(recipeId, multiplier);
  const deleteRecipe = useDeleteRecipe();
  const duplicateRecipe = useDuplicateRecipe();

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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="ice-cream-outline" size={18} color={theme.colors.primary} />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {recipe.category}
        </Typography>
      </View>

      {recipe.photoUrl ? (
        <Image
          source={{ uri: recipe.photoUrl }}
          style={{ width: "100%", height: 200, borderRadius: 16 }}
          resizeMode="cover"
        />
      ) : null}

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
                  multiplier === scale ? theme.colors.primary : theme.colors.surface,
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
        <Typography variant="h3">Insumos</Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Rende: {displayRecipe.yieldQuantity} {displayRecipe.yieldUnit}
          </Typography>
        </View>

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
              Insumo
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
                materialId: string;
                materialName: string;
                materialCostPerUnit: number;
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
                <View
                  style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <IngredientAvatar name={ing.materialName} size={28} />
                  <Typography variant="body" style={{ flex: 1 }} numberOfLines={1}>
                    {ing.materialName}
                  </Typography>
                </View>
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
        title="Imprimir / Compartilhar"
        variant="outline"
        size="lg"
        onPress={() => {
          void (async () => {
            try {
              await exportRecipePdf({
                ...displayRecipe,
                ingredients,
                totalCost,
                costPerUnit,
              });
            } catch {
              Alert.alert(
                "Erro",
                "Não foi possível gerar o PDF da receita. Tente novamente.",
              );
            }
          })();
        }}
      />

      <Button
        title="Duplicar receita"
        variant="outline"
        size="lg"
        onPress={() => {
          void (async () => {
            try {
              await duplicateRecipe.mutateAsync(recipeId);
              Alert.alert("Receita duplicada", `Criamos uma cópia de "${recipe.name}".`);
              onDuplicate?.();
            } catch {
              Alert.alert(
                "Não foi possível duplicar",
                "Você pode ter atingido o limite de receitas do plano gratuito.",
              );
            }
          })();
        }}
        loading={duplicateRecipe.isPending}
      />

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
                    alertError("Não foi possível excluir a receita.");
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
