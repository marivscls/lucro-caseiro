import { Button } from "@lucro-caseiro/ui";
import React, { useState } from "react";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormActions } from "../../../shared/components/form-layout";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { uploadRecipeImage } from "../../../shared/utils/upload-image";
import { useCreateRecipe, useRecipes } from "../hooks";
import { RECIPE_FORM_STEPS, RecipeFormSteps, useRecipeDraft } from "./recipe-form-fields";
import { alertError } from "../../../shared/utils/alerts";
import { useBusinessCopy } from "../../subscription/business-copy";

interface CreateRecipeFormProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function CreateRecipeForm({ visible, onClose, onSuccess }: CreateRecipeFormProps) {
  const experienceCopy = useBusinessCopy();
  const formulaLabel = experienceCopy.formulaNoun.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
  const draft = useRecipeDraft({ visible, requireCategory: true });
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const createRecipe = useCreateRecipe();
  const { data: recipesData } = useRecipes();
  const { checkAndBlock: checkRecipeLimit } = useLimitCheck("recipes");
  const showPaywall = usePaywall((s) => s.show);
  const loading = createRecipe.isPending || uploading;

  async function handleSubmit() {
    if (!draft.validateAll()) return;
    if (checkRecipeLimit()) return;
    const { name, category, instructions, yieldUnit, parsedYield } = draft;
    const validLines = draft.validLines();

    const duplicatedName = recipesData?.items.some(
      (recipe) => duplicateKey(recipe.name) === duplicateKey(name),
    );
    if (duplicatedName) {
      const shouldContinue = await confirmPossibleDuplicate(
        `${formulaLabel} parecida`,
        `Já existe uma ${experienceCopy.formulaNoun} com esse nome. Confira se não é melhor editar ou duplicar a existente.`,
      );
      if (!shouldContinue) return;
    }

    // Sobe a foto (se houver); se falhar, salva sem ela.
    let photoUrl: string | undefined;
    if (imageUri) {
      try {
        setUploading(true);
        photoUrl = await uploadRecipeImage(imageUri);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message:
            "Não consegui enviar a foto agora. Vou salvar o cadastro sem ela. Você pode adicionar depois.",
        });
      } finally {
        setUploading(false);
      }
    }

    try {
      await createRecipe.mutateAsync({
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
      });
      showAlert({
        title: `${formulaLabel} cadastrada!`,
        message: `${name} foi adicionada`,
      });
      onSuccess?.();
    } catch (e) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("recipes");
        return;
      }
      alertError(
        `Não foi possível cadastrar a ${experienceCopy.formulaNoun}. Tente novamente.`,
      );
    }
  }

  const lastStep = draft.step === RECIPE_FORM_STEPS.length;
  let primaryAction = (
    <Button
      title="Continuar"
      disabled={loading}
      onPress={() => {
        draft.goToStep(draft.step + 1);
      }}
    />
  );
  if (lastStep) {
    primaryAction = (
      <Button
        title={uploading ? "Enviando foto..." : `Cadastrar ${experienceCopy.formulaNoun}`}
        loading={loading}
        onPress={() => {
          void handleSubmit();
        }}
      />
    );
  }

  return (
    <StandardModal
      title={`Nova ${experienceCopy.formulaNoun}`}
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          {draft.step > 1 ? (
            <Button
              title="Voltar"
              variant="outline"
              disabled={loading}
              onPress={() => draft.setStep(draft.step - 1)}
            />
          ) : (
            <Button
              title="Cancelar"
              variant="outline"
              disabled={loading}
              onPress={onClose}
            />
          )}
          {primaryAction}
        </FormActions>
      }
    >
      <RecipeFormSteps draft={draft} imageUri={imageUri} onPickPhoto={showPicker} />
    </StandardModal>
  );
}
