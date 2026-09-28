import type { Recipe } from "@lucro-caseiro/contracts";
import { Button, useTheme } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormActions } from "../../../shared/components/form-layout";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadRecipeImage } from "../../../shared/utils/upload-image";
import { useDeleteRecipe, useUpdateRecipe } from "../hooks";
import {
  RECIPE_FORM_STEPS,
  RecipeCostCard,
  RecipeFormSteps,
  useRecipeDraft,
} from "./recipe-form-fields";
import { emptyLine } from "./recipe-materials-editor";
import { alertError } from "../../../shared/utils/alerts";

interface EditRecipeFormProps {
  readonly recipe: Recipe;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function EditRecipeForm({
  recipe,
  visible,
  onClose,
  onSuccess,
}: EditRecipeFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const formulaLabel = "Receita";
  const draft = useRecipeDraft({
    visible,
    resetKey: recipe.id,
    requireCategory: false,
    initial: {
      name: recipe.name,
      category: recipe.category,
      instructions: recipe.instructions ?? "",
      yieldQuantity: String(recipe.yieldQuantity),
      yieldUnit: recipe.yieldUnit,
      lines:
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((line) => ({
              materialId: line.materialId,
              quantity: String(line.quantity),
              unit: line.unit,
            }))
          : [emptyLine()],
    },
  });
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
  const costPerUnit = draft.isYieldValid ? totalCost / draft.parsedYield : 0;

  async function handleSubmit() {
    if (!draft.validateAll()) return;
    const { name, category, instructions, yieldUnit, parsedYield } = draft;
    const validLines = draft.validLines();

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
          showAlert({
            title: "Foto não enviada",
            message:
              "Não consegui enviar a foto agora. As outras alterações serão salvas.",
          });
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
          yieldQuantity: parsedYield,
          yieldUnit: yieldUnit.trim(),
          photoUrl,
          ingredients: validLines.map((l) => ({
            materialId: l.materialId,
            quantity: parseFloat(l.quantity.replace(",", ".")),
            unit: l.unit.trim(),
          })),
        },
      });
      showAlert({
        title: `${formulaLabel} atualizada!`,
        message: `${name} foi atualizada`,
      });
      onSuccess?.();
    } catch {
      alertError("Não foi possível atualizar a receita. Tente novamente.");
    }
  }

  function handleDelete() {
    showAlert({
      title: "Excluir receita",
      message: "Tem certeza que deseja excluir esta receita?",
      buttons: [
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
      ],
    });
  }

  const lastStep = draft.step === RECIPE_FORM_STEPS.length;

  return (
    <StandardModal
      title="Editar receita"
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          {draft.step > 1 ? (
            <Button
              title="Voltar"
              variant="outline"
              disabled={saving}
              onPress={() => draft.setStep(draft.step - 1)}
            />
          ) : (
            <Button
              title="Cancelar"
              variant="outline"
              disabled={saving}
              onPress={onClose}
            />
          )}
          {lastStep ? (
            <Button
              title={uploading ? "Enviando foto..." : "Salvar alterações"}
              loading={saving}
              onPress={() => {
                void handleSubmit();
              }}
            />
          ) : (
            <Button
              title="Continuar"
              disabled={saving}
              onPress={() => {
                draft.goToStep(draft.step + 1);
              }}
            />
          )}
        </FormActions>
      }
    >
      <RecipeFormSteps
        draft={draft}
        imageUri={imageUri}
        onPickPhoto={showPicker}
        nameMaxLength={80}
        onTotalCost={setTotalCost}
        costSummary={<RecipeCostCard totalCost={totalCost} costPerUnit={costPerUnit} />}
      />

      {lastStep ? (
        <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
          <Button
            title="Excluir receita"
            variant="alertOutline"
            icon={<AppIcon name="trash-outline" size={18} color={theme.colors.alert} />}
            onPress={handleDelete}
            disabled={deleteRecipe.isPending || saving}
          />
        </View>
      ) : null}
    </StandardModal>
  );
}
