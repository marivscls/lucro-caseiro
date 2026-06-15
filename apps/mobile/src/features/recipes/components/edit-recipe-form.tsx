import type { Recipe } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadRecipeImage } from "../../../shared/utils/upload-image";
import { useDeleteRecipe, useUpdateRecipe } from "../hooks";
import {
  CategoryField,
  FieldRow,
  InstructionsField,
  RecipeCostCard,
  RecipePhotoField,
  TextBox,
  YieldUnitChips,
} from "./recipe-form-fields";
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
  const { theme } = useTheme();
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
  const [totalCost, setTotalCost] = useState(0);
  const { imageUri, showPicker, setImageUri } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  // Hidrata a foto existente da receita.
  useEffect(() => {
    if (recipe.photoUrl) setImageUri(recipe.photoUrl);
  }, [recipe.photoUrl, setImageUri]);

  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const saving = updateRecipe.isPending || uploading;

  const parsedYield = parseFloat(yieldQuantity.replace(",", ".")) || 0;
  const costPerUnit = parsedYield > 0 ? totalCost / parsedYield : 0;

  async function handleSubmit() {
    if (!name.trim()) {
      alertValidation("Informe o nome da receita");
      return;
    }
    const validYield = parseFloat(yieldQuantity.replace(",", "."));
    if (isNaN(validYield) || validYield <= 0) {
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

    // Foto: mantém a URL atual (http) ou sobe a nova (file://) pro storage.
    let photoUrl: string | undefined;
    if (imageUri) {
      if (imageUri.startsWith("http")) {
        photoUrl = imageUri;
      } else {
        try {
          setUploading(true);
          photoUrl = await uploadRecipeImage(imageUri);
        } catch {
          Alert.alert(
            "Foto não enviada",
            "Não consegui enviar a foto agora. As outras alterações serão salvas.",
          );
        } finally {
          setUploading(false);
        }
      }
    }

    try {
      await updateRecipe.mutateAsync({
        id: recipe.id,
        data: {
          name: name.trim(),
          category: category.trim(),
          instructions: instructions.trim() || undefined,
          yieldQuantity: validYield,
          yieldUnit: yieldUnit.trim(),
          photoUrl,
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

  function handleDelete() {
    Alert.alert("Excluir receita", "Tem certeza que deseja excluir esta receita?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteRecipe.mutateAsync(recipe.id);
              onSuccess?.();
            } catch {
              alertError("Não foi possível excluir a receita.");
            }
          })();
        },
      },
    ]);
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing["5xl"],
        gap: spacing.xl,
      }}
    >
      <FieldRow icon="ice-cream-outline" label="Nome da receita">
        <TextBox
          value={name}
          onChangeText={setName}
          placeholder="Ex: Brigadeiro, Bolo de cenoura..."
          maxLength={80}
          autoFocus
        />
      </FieldRow>

      <FieldRow icon="grid-outline" label="Categoria">
        <CategoryField value={category} onChange={setCategory} />
      </FieldRow>

      <FieldRow icon="image-outline" label="Foto da receita" optional align="top">
        <RecipePhotoField imageUri={imageUri} onPick={showPicker} />
      </FieldRow>

      <FieldRow icon="document-text-outline" label="Modo de preparo" optional align="top">
        <InstructionsField value={instructions} onChange={setInstructions} />
      </FieldRow>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <FieldRow icon="restaurant-outline" label="Rendimento">
            <TextBox
              value={yieldQuantity}
              onChangeText={setYieldQuantity}
              placeholder="Ex: 30 ou 1,5"
              keyboardType="decimal-pad"
            />
          </FieldRow>
        </View>
        <View style={{ flex: 1 }}>
          <FieldRow icon="beaker-outline" label="Unidade">
            <TextBox
              value={yieldUnit}
              onChangeText={setYieldUnit}
              placeholder="Ex: unidades, fatias"
            />
          </FieldRow>
        </View>
      </View>

      <YieldUnitChips value={yieldUnit} onChange={setYieldUnit} />

      <RecipeCostCard totalCost={totalCost} costPerUnit={costPerUnit} />

      <RecipeMaterialsEditor
        lines={lines}
        onChange={setLines}
        onTotalCost={setTotalCost}
      />

      <Pressable
        onPress={() => {
          void handleSubmit();
        }}
        disabled={saving}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 58,
          borderRadius: radii.lg,
          backgroundColor: theme.colors.primary,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed || saving ? 0.85 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color={theme.colors.textOnPrimary} />
        ) : (
          <Ionicons name="save-outline" size={22} color={theme.colors.textOnPrimary} />
        )}
        <Typography
          variant="bodyBold"
          color={theme.colors.textOnPrimary}
          style={{ fontSize: 18 }}
        >
          {uploading ? "Enviando foto..." : "Salvar alterações"}
        </Typography>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        disabled={deleteRecipe.isPending}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.alert}66`,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
        <Typography variant="bodyBold" color={theme.colors.alert}>
          Excluir receita
        </Typography>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
