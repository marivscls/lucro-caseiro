import { Button, Chip, Input } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, View } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { YIELD_UNIT_PRESETS } from "../yield-units";
import { useCreateRecipe } from "../hooks";
import {
  RecipeMaterialsEditor,
  emptyLine,
  type RecipeLine,
} from "./recipe-materials-editor";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface CreateRecipeFormProps {
  readonly onSuccess?: () => void;
}

export function CreateRecipeForm({ onSuccess }: CreateRecipeFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [instructions, setInstructions] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [lines, setLines] = useState<RecipeLine[]>([emptyLine()]);

  const createRecipe = useCreateRecipe();
  const { checkAndBlock: checkRecipeLimit } = useLimitCheck("recipes");

  async function handleSubmit() {
    if (checkRecipeLimit()) return;

    if (!name.trim()) {
      alertValidation("Informe o nome da receita");
      return;
    }

    if (!category.trim()) {
      alertValidation("Escolha uma categoria");
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
      await createRecipe.mutateAsync({
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
      });
      Alert.alert("Receita cadastrada!", `${name} foi adicionada`);
      onSuccess?.();
    } catch {
      alertError("Não foi possível cadastrar a receita. Tente novamente.");
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }}
    >
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
            placeholder="Ex: 30 ou 1,5"
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
        title="Cadastrar receita"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createRecipe.isPending}
      />
    </KeyboardAwareScrollView>
  );
}
