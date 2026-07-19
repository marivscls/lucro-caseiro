import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { uploadRecipeImage } from "../../../shared/utils/upload-image";
import { useCreateRecipe, useRecipes } from "../hooks";
import {
  CategoryField,
  FieldRow,
  InstructionsField,
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

interface CreateRecipeFormProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function CreateRecipeForm({ visible, onClose, onSuccess }: CreateRecipeFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [instructions, setInstructions] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [lines, setLines] = useState<RecipeLine[]>([emptyLine()]);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const createRecipe = useCreateRecipe();
  const { data: recipesData } = useRecipes();
  const { checkAndBlock: checkRecipeLimit } = useLimitCheck("recipes");
  const showPaywall = usePaywall((s) => s.show);
  const loading = createRecipe.isPending || uploading;

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
    const linesWithMaterial = lines.filter((l) => l.materialId);
    if (linesWithMaterial.length === 0) {
      alertValidation("Adicione pelo menos um insumo");
      return;
    }
    const validLines = linesWithMaterial.filter((l) => l.quantity.trim());
    if (validLines.length === 0) {
      alertValidation("Informe a quantidade do insumo");
      return;
    }

    const duplicatedName = recipesData?.items.some(
      (recipe) => duplicateKey(recipe.name) === duplicateKey(name),
    );
    if (duplicatedName) {
      const shouldContinue = await confirmPossibleDuplicate(
        "Receita parecida",
        "Já existe uma receita com esse nome. Confira se não é melhor editar ou duplicar a existente.",
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
            "Não consegui enviar a foto agora. Vou salvar a receita sem ela. Você pode adicionar depois.",
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
      showAlert({ title: "Receita cadastrada!", message: `${name} foi adicionada` });
      onSuccess?.();
    } catch (e) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("recipes");
        return;
      }
      alertError("Não foi possível cadastrar a receita. Tente novamente.");
    }
  }

  return (
    <StandardModal
      title="Nova receita"
      visible={visible}
      onClose={onClose}
      footer={
        <Pressable
          onPress={() => {
            void handleSubmit();
          }}
          disabled={loading}
          accessibilityRole="button"
          style={({ pressed }) => [
            {
              minHeight: 58,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed || loading ? 0.85 : 1,
            },
            { flex: 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <AppIcon name="save-outline" size={22} color={theme.colors.textOnPrimary} />
          )}
          <Typography variant="h3" color={theme.colors.textOnPrimary}>
            {uploading ? "Enviando foto..." : "Salvar receita"}
          </Typography>
        </Pressable>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.xl }}>
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ marginTop: -spacing.sm }}
        >
          Preencha os detalhes da sua receita
        </Typography>

        <FieldRow icon="ice-cream-outline" label="Nome da receita">
          <TextBox
            value={name}
            onChangeText={setName}
            placeholder="Ex: Brigadeiro, Bolo de cenoura..."
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
          label="Modo de preparo"
          optional
          align="top"
        >
          <InstructionsField value={instructions} onChange={setInstructions} />
        </FieldRow>

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Rendimento
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

        <RecipeMaterialsEditor lines={lines} onChange={setLines} />
      </View>
    </StandardModal>
  );
}
