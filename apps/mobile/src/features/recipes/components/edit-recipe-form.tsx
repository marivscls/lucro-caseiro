import type { Recipe } from "@lucro-caseiro/contracts";
import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { useUpdateRecipe } from "../hooks";
import {
  RecipeMaterialsEditor,
  emptyLine,
  type RecipeLine,
} from "./recipe-materials-editor";

interface EditRecipeFormProps {
  readonly recipe: Recipe;
  readonly onSuccess?: () => void;
}

export function EditRecipeForm({ recipe, onSuccess }: EditRecipeFormProps) {
  const [name, setName] = useState(recipe.name);
  const [category, setCategory] = useState(recipe.category);
  const [instructions, setInstructions] = useState(recipe.instructions ?? "");
  const [yieldQuantity, setYieldQuantity] = useState(String(recipe.yieldQuantity));
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [lines, setLines] = useState<RecipeLine[]>(
    recipe.ingredients.length > 0
      ? recipe.ingredients.map((line) => ({
          materialId: line.materialId,
          quantity: String(line.quantity),
          unit: line.unit,
        }))
      : [emptyLine()],
  );

  const updateRecipe = useUpdateRecipe();

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

    const validLines = lines.filter((l) => l.materialId && l.quantity.trim());

    if (validLines.length === 0) {
      Alert.alert("Opa!", "Adicione pelo menos um insumo");
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
          ingredients: validLines.map((l) => ({
            materialId: l.materialId,
            quantity: parseFloat(l.quantity.replace(",", ".")),
            unit: l.unit.trim(),
          })),
        },
      });
      Alert.alert("Receita atualizada!", `${name} foi atualizada`);
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar a receita. Tente novamente.");
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

      <RecipeMaterialsEditor lines={lines} onChange={setLines} />

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
