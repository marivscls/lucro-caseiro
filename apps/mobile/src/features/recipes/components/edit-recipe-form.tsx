import type { Recipe } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { useUpdateRecipe } from "../hooks";

interface EditRecipeFormProps {
  readonly recipe: Recipe;
  readonly onSuccess?: () => void;
}

interface IngredientField {
  ingredientId: string;
  quantity: string;
  unit: string;
}

export function EditRecipeForm({ recipe, onSuccess }: EditRecipeFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [instructions, setInstructions] = useState(recipe.instructions ?? "");
  const [yieldQuantity, setYieldQuantity] = useState(String(recipe.yieldQuantity));
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [ingredients, setIngredients] = useState<IngredientField[]>(
    recipe.ingredients.map((ing) => ({
      ingredientId: ing.ingredientId,
      quantity: String(ing.quantity),
      unit: ing.unit,
    })),
  );

  const updateRecipe = useUpdateRecipe();

  function handleAddIngredient() {
    setIngredients((prev) => [...prev, { ingredientId: "", quantity: "", unit: "" }]);
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleIngredientChange(
    index: number,
    field: keyof IngredientField,
    value: string,
  ) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Opa!", "Informe o nome da receita");
      return;
    }

    const parsedYield = parseFloat(yieldQuantity.replace(",", "."));
    if (isNaN(parsedYield) || parsedYield <= 0) {
      Alert.alert("Opa!", "Informe o rendimento da receita");
      return;
    }

    if (!yieldUnit.trim()) {
      Alert.alert("Opa!", "Informe a unidade de rendimento");
      return;
    }

    const validIngredients = ingredients.filter(
      (ing) => ing.ingredientId.trim() && ing.quantity.trim(),
    );

    if (validIngredients.length === 0) {
      Alert.alert("Opa!", "Adicione pelo menos um ingrediente");
      return;
    }

    try {
      await updateRecipe.mutateAsync({
        id: recipe.id,
        data: {
          name: name.trim(),
          category: category.trim(),
          instructions: instructions.trim() || undefined,
          yieldQuantity: parsedYield,
          yieldUnit: yieldUnit.trim(),
          ingredients: validIngredients.map((ing) => ({
            ingredientId: ing.ingredientId.trim(),
            quantity: parseFloat(ing.quantity.replace(",", ".")),
            unit: ing.unit.trim(),
          })),
        },
      });
      Alert.alert("Receita atualizada!", `${name} foi atualizada`);
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar a receita. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Typography variant="h2">Editar receita</Typography>

      <Input label="Nome da receita" value={name} onChangeText={setName} autoFocus />
      <Input label="Categoria" value={category} onChangeText={setCategory} />
      <Input
        label="Modo de preparo (opcional)"
        value={instructions}
        onChangeText={setInstructions}
        multiline
        numberOfLines={4}
        style={{ height: 120, textAlignVertical: "top", paddingTop: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Input
            label="Rendimento"
            value={yieldQuantity}
            onChangeText={setYieldQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Unidade" value={yieldUnit} onChangeText={setYieldUnit} />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Typography variant="h3">Ingredientes</Typography>

        {ingredients.map((ing, index) => (
          <View
            key={index}
            style={{
              gap: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: theme.colors.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption">Ingrediente {index + 1}</Typography>
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <Typography variant="caption" color={theme.colors.alert}>
                    Remover
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <Input
              label="ID do ingrediente"
              placeholder="ID do ingrediente cadastrado"
              value={ing.ingredientId}
              onChangeText={(v) => handleIngredientChange(index, "ingredientId", v)}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Quantidade"
                  value={ing.quantity}
                  onChangeText={(v) => handleIngredientChange(index, "quantity", v)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Unidade"
                  value={ing.unit}
                  onChangeText={(v) => handleIngredientChange(index, "unit", v)}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleAddIngredient}
          style={{
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.success,
            borderStyle: "dashed",
            alignItems: "center",
          }}
        >
          <Typography variant="body" color={theme.colors.success}>
            + Adicionar ingrediente
          </Typography>
        </TouchableOpacity>
      </View>

      <Button
        title="Salvar alteracoes"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={updateRecipe.isPending}
      />
    </ScrollView>
  );
}
