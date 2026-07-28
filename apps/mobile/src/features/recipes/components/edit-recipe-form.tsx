import type { Recipe } from "@lucro-caseiro/contracts";
import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
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
      showAlert({ title: `${formulaLabel} atualizada!`, message: `${name} foi atualizada` });
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
              <AppIcon name="save-outline" size={22} color={theme.colors.textOnPrimary} />
            )}
            <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
              {uploading ? "Enviando foto..." : "Salvar alterações"}
            </Typography>
          </Pressable>
        </View>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.xl }}>
        <FieldRow icon="document-text-outline" label="Nome da receita">
          <TextBox
            value={name}
            onChangeText={setName}
            placeholder={`Ex: ${experienceCopy.productExample}`}
            maxLength={80}
            autoFocus
          />
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

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={[{ flex: 1, gap: spacing.sm }, desktopCompactField(isDesktop)]}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                {experienceCopy.quantityLabel}
              </Typography>
              <TextBox
                value={yieldQuantity}
                onChangeText={setYieldQuantity}
                placeholder="Ex: 30 ou 1,5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Unidade
              </Typography>
              <TextBox
                value={yieldUnit}
                onChangeText={setYieldUnit}
                placeholder="Ex: unidades"
              />
            </View>
          </View>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Ex: 30 unidades ou 1,5 kg
          </Typography>
          <YieldUnitChips value={yieldUnit} onChange={setYieldUnit} />
        </View>

        <RecipeCostCard totalCost={totalCost} costPerUnit={costPerUnit} />

        <RecipeMaterialsEditor
          lines={lines}
          onChange={setLines}
          onTotalCost={setTotalCost}
        />
      </View>
    </StandardModal>
  );
}
