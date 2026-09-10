import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Recipe } from "@lucro-caseiro/contracts";
import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
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
import { useBusinessCopy } from "../../subscription/business-copy";

interface EditRecipeFormProps {
  readonly recipe: Recipe;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const RECIPE_FORM_STEPS = [
  { label: "Receita", title: "Informações da receita" },
  { label: "Rendimento", title: "Rendimento da receita" },
  { label: "Insumos", title: "Ingredientes e custo" },
] as const;

export function EditRecipeForm({
  recipe,
  visible,
  onClose,
  onSuccess,
}: EditRecipeFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const formulaLabel = "Receita";
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
  const [formStep, setFormStep] = useState(1);

  // Hidrata a foto existente da receita.
  useEffect(() => {
    if (recipe.photoUrl) setImageUri(recipe.photoUrl);
  }, [recipe.photoUrl, setImageUri]);

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [recipe.id, visible]);

  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const saving = updateRecipe.isPending || uploading;

  const parsedYield = Number(yieldQuantity.replace(",", "."));
  const isYieldValid = Number.isFinite(parsedYield) && parsedYield > 0;
  const costPerUnit = isYieldValid ? totalCost / parsedYield : 0;

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome da receita.",
      yieldQuantity: !isYieldValid && "Informe uma quantidade final maior que zero.",
      yieldUnit: !yieldUnit.trim() && "Informe a unidade da quantidade final.",
      lines:
        (!lines.some((line) => line.materialId) ||
          lines.some(
            (line) =>
              line.materialId &&
              (!Number.isFinite(Number(line.quantity.replace(",", "."))) ||
                Number(line.quantity.replace(",", ".")) <= 0),
          )) &&
        "Adicione um material e preencha uma quantidade maior que zero em cada item.",
    },
    visible,
  );

  async function handleSubmit() {
    if (!formValidation.validate()) {
      if (!name.trim()) setFormStep(1);
      else if (!yieldUnit.trim() || !isYieldValid) setFormStep(2);
      else setFormStep(3);
      return;
    }
    if (!name.trim()) {
      alertValidation("Informe o nome da receita");
      return;
    }
    if (!isYieldValid) {
      alertValidation(`Informe ${experienceCopy.quantityLabel.toLowerCase()}`);
      return;
    }
    if (!yieldUnit.trim()) {
      alertValidation("Informe a unidade de rendimento");
      return;
    }
    const linesWithMaterial = lines.filter((l) => l.materialId);
    if (linesWithMaterial.length === 0) {
      alertValidation(`Adicione pelo menos um ${experienceCopy.materialNoun}`);
      return;
    }
    const validLines = linesWithMaterial.filter((l) => l.quantity.trim());
    if (validLines.length === 0) {
      alertValidation(`Informe a quantidade do ${experienceCopy.materialNoun}`);
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

  return (
    <StandardModal
      title="Editar receita"
      visible={visible}
      onClose={onClose}
      footer={
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            justifyContent: isDesktop ? "flex-end" : undefined,
            width: "100%",
          }}
        >
          {formStep === RECIPE_FORM_STEPS.length ? (
            <Pressable
              onPress={handleDelete}
              disabled={deleteRecipe.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [
                {
                  minHeight: 50,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: `${theme.colors.alert}66`,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                },
                isDesktop ? desktopAction(isDesktop, 180) : { flex: 1 },
              ]}
            >
              <AppIcon name="trash-outline" size={20} color={theme.colors.alert} />
              <Typography variant="bodyBold" color={theme.colors.alert}>
                Excluir receita
              </Typography>
            </Pressable>
          ) : null}
          {formStep > 1 ? (
            <Button
              title="Voltar"
              variant="ghost"
              onPress={() => setFormStep(formStep - 1)}
            />
          ) : null}
          {formStep < RECIPE_FORM_STEPS.length ? (
            <Button
              title="Continuar"
              onPress={() => {
                if (formStep === 1 && !name.trim()) {
                  alertValidation("Informe o nome da receita antes de continuar.");
                  return;
                }
                if (formStep === 2 && (!isYieldValid || !yieldUnit.trim())) {
                  alertValidation("Informe o rendimento e a unidade antes de continuar.");
                  return;
                }
                setFormStep(formStep + 1);
              }}
              style={isDesktop ? desktopAction(isDesktop, 220) : { flex: 1 }}
            />
          ) : (
            <Pressable
              onPress={() => {
                void handleSubmit();
              }}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                {
                  minHeight: 48,
                  borderRadius: radii.md,
                  backgroundColor: theme.colors.primaryInteractive,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  opacity: pressed || saving ? 0.85 : 1,
                },
                isDesktop ? desktopAction(isDesktop, 220) : { flex: 1 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <AppIcon
                  name="save-outline"
                  size={22}
                  color={theme.colors.textOnPrimary}
                />
              )}
              <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                {uploading ? "Enviando foto..." : "Salvar alterações"}
              </Typography>
            </Pressable>
          )}
        </View>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.xl }}>
        <FormStepProgress
          current={formStep}
          steps={RECIPE_FORM_STEPS}
          onStepPress={setFormStep}
        />
        <View
          style={{ display: formStep === 1 ? "flex" : "none", gap: spacing.xl }}
          accessibilityElementsHidden={formStep !== 1}
          importantForAccessibility={formStep === 1 ? "auto" : "no-hide-descendants"}
        >
          <FieldRow icon="document-text-outline" label="Nome da receita">
            <ValidationField {...formValidation.field("name")}>
              <TextBox
                value={name}
                onChangeText={setName}
                placeholder={`Ex: ${experienceCopy.productExample}`}
                maxLength={80}
                autoFocus
              />
            </ValidationField>
          </FieldRow>

          <FieldRow icon="grid-outline" label="Categoria">
            <CategoryField value={category} onChange={setCategory} />
          </FieldRow>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              Foto da receita{" "}
              <Typography variant="caption" color={theme.colors.textSecondary}>
                (opcional)
              </Typography>
            </Typography>
            <RecipePhotoField imageUri={imageUri} onPick={showPicker} />
          </View>

          <FieldRow
            icon="document-text-outline"
            label="Etapas ou observações"
            optional
            align="top"
          >
            <InstructionsField value={instructions} onChange={setInstructions} />
          </FieldRow>
        </View>

        <View
          style={{ display: formStep === 2 ? "flex" : "none", gap: spacing.xl }}
          accessibilityElementsHidden={formStep !== 2}
          importantForAccessibility={formStep === 2 ? "auto" : "no-hide-descendants"}
        >
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View
                style={[{ flex: 1, gap: spacing.sm }, desktopCompactField(isDesktop)]}
              >
                <Typography variant="bodyBold" color={theme.colors.text}>
                  {experienceCopy.quantityLabel}
                </Typography>
                <ValidationField {...formValidation.field("yieldQuantity")}>
                  <TextBox
                    value={yieldQuantity}
                    onChangeText={setYieldQuantity}
                    placeholder="Ex: 30 ou 1,5"
                    keyboardType="decimal-pad"
                  />
                </ValidationField>
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <Typography variant="bodyBold" color={theme.colors.text}>
                  Unidade
                </Typography>
                <ValidationField {...formValidation.field("yieldUnit")}>
                  <TextBox
                    value={yieldUnit}
                    onChangeText={setYieldUnit}
                    placeholder="Ex: unidades"
                  />
                </ValidationField>
              </View>
            </View>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Ex: 30 unidades ou 1,5 kg
            </Typography>
            <YieldUnitChips value={yieldUnit} onChange={setYieldUnit} />
          </View>
        </View>

        <View
          style={{ display: formStep === 3 ? "flex" : "none", gap: spacing.xl }}
          accessibilityElementsHidden={formStep !== 3}
          importantForAccessibility={formStep === 3 ? "auto" : "no-hide-descendants"}
        >
          <RecipeCostCard totalCost={totalCost} costPerUnit={costPerUnit} />

          <ValidationField {...formValidation.field("lines")}>
            <RecipeMaterialsEditor
              lines={lines}
              onChange={setLines}
              onTotalCost={setTotalCost}
            />
          </ValidationField>
        </View>
      </View>
    </StandardModal>
  );
}
