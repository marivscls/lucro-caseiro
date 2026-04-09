import { Button, Input, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { useCreateRecipe } from "../hooks";

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface CreateRecipeFormProps {
  readonly onSuccess?: () => void;
}

function createEmptyIngredient(): Ingredient {
  return { name: "", quantity: "", unit: "" };
}

export function CreateRecipeForm({ onSuccess }: CreateRecipeFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [instructions, setInstructions] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([createEmptyIngredient()]);

  const createRecipe = useCreateRecipe();
  const { checkAndBlock: checkRecipeLimit } = useLimitCheck("recipes");

  function handleAddIngredient() {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }

  function handleRemoveIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function handleIngredientChange(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    );
  }

  async function handleSubmit() {
    if (checkRecipeLimit()) return;

    if (!name.trim()) {
      Alert.alert("Opa!", "Informe o nome da receita");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Opa!", "Escolha uma categoria");
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
      (ing) => ing.name.trim() && ing.quantity.trim(),
    );

    if (validIngredients.length === 0) {
      Alert.alert("Opa!", "Adicione pelo menos um ingrediente");
      return;
    }

    try {
      await createRecipe.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        instructions: instructions.trim() || undefined,
        yieldQuantity: parsedYield,
        yieldUnit: yieldUnit.trim(),
        ingredients: validIngredients.map((ing) => ({
          ingredientId: ing.name.trim(),
          quantity: parseFloat(ing.quantity.replace(",", ".")),
          unit: ing.unit.trim(),
        })),
      });
      Alert.alert("Receita cadastrada!", `${name} foi adicionada`);
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Nao foi possivel cadastrar a receita. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Typography variant="h2">Nova receita</Typography>

      <Input
        label="Nome da receita"
        placeholder="Ex: Brigadeiro, Bolo de cenoura..."
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Input
        label="Categoria"
        placeholder="Ex: Doces, Salgados, Bolos..."
        value={category}
        onChangeText={setCategory}
      />

      <Input
        label="Modo de preparo (opcional)"
        placeholder="Descreva o passo a passo..."
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
            placeholder="Ex: 30"
            value={yieldQuantity}
            onChangeText={setYieldQuantity}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Unidade"
            placeholder="Ex: unidades, fatias..."
            value={yieldUnit}
            onChangeText={setYieldUnit}
          />
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
              label="Nome"
              placeholder="Ex: Leite condensado"
              value={ing.name}
              onChangeText={(v) => handleIngredientChange(index, "name", v)}
            />

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Quantidade"
                  placeholder="Ex: 2"
                  value={ing.quantity}
                  onChangeText={(v) => handleIngredientChange(index, "quantity", v)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Unidade"
                  placeholder="Ex: lata, g, ml..."
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
        title="Cadastrar receita"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createRecipe.isPending}
      />
    </ScrollView>
  );
}
