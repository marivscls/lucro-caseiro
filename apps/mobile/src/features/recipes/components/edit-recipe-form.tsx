import type { Recipe } from "@lucro-caseiro/contracts";
import { Button, Chip, Input } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, View } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { YIELD_UNIT_PRESETS } from "../yield-units";
import { useUpdateRecipe } from "../hooks";
import {
  RecipeMaterialsEditor,
  emptyLine,
  type RecipeLine,
} from "./recipe-materials-editor";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

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
      alertValidation("Informe o nome da receita");
      return;
    }

    const parsedYield = parseFloat(yieldQuantity.replace(",", "."));
    if (isNaN(parsedYield) || parsedYield <= 0) {
      alertValidation("Informe o rendimento da receita");
      return;
    }

    if (!yieldUnit.trim()) {
      alertValidation("Informe a unidade de rendimento");
      return;
    }

    const validLines = lines.filter((l) => l.materialId && l.quantity.trim());

    if (validLines.length === 0) {
      alertValidation("Adicione pelo menos um insumo");
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
      alertError("Não foi possível atualizar a receita. Tente novamente.");
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }}
    >
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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {YIELD_UNIT_PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={preset}
            selected={yieldUnit.trim() === preset}
            onPress={() => setYieldUnit(preset)}
          />
        ))}
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
    </KeyboardAwareScrollView>
  );
}
