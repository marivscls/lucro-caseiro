import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { Button, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
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
import { useBusinessCopy } from "../../subscription/business-copy";

interface CreateRecipeFormProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const RECIPE_FORM_STEPS = [
  { label: "Receita", title: "Informações da receita" },
  { label: "Rendimento", title: "Rendimento da receita" },
  { label: "Insumos", title: "Ingredientes e custo" },
] as const;

export function CreateRecipeForm({ visible, onClose, onSuccess }: CreateRecipeFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const formulaLabel = experienceCopy.formulaNoun.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [instructions, setInstructions] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [yieldUnit, setYieldUnit] = useState("");
  const [lines, setLines] = useState<RecipeLine[]>([emptyLine()]);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const createRecipe = useCreateRecipe();
  const { data: recipesData } = useRecipes();
  const { checkAndBlock: checkRecipeLimit } = useLimitCheck("recipes");
  const showPaywall = usePaywall((s) => s.show);
  const loading = createRecipe.isPending || uploading;
  const parsedYield = Number(yieldQuantity.replace(",", "."));
  const isYieldValid = Number.isFinite(parsedYield) && parsedYield > 0;

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [visible]);

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome da receita.",
      category: !category.trim() && "Selecione ou informe uma categoria.",
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
      if (!name.trim() || !category.trim()) setFormStep(1);
      else if (!yieldUnit.trim() || !isYieldValid) setFormStep(2);
      else setFormStep(3);
      return;
    }
    if (checkRecipeLimit()) return;
    if (!name.trim()) {
      alertValidation(`Informe o nome da ${experienceCopy.formulaNoun}`);
      return;
    }
    if (!category.trim()) {
      alertValidation("Escolha uma categoria");
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

  let primaryActionLabel = "Continuar";
  if (formStep === RECIPE_FORM_STEPS.length) {
    primaryActionLabel = uploading
      ? "Enviando foto..."
      : `Salvar ${experienceCopy.formulaNoun}`;
  }

  return (
    <StandardModal
      title={`Nova ${experienceCopy.formulaNoun}`}
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
          {formStep > 1 ? (
            <Button
              title="Voltar"
              variant="ghost"
              onPress={() => setFormStep(formStep - 1)}
            />
          ) : null}
          <Button
            title={primaryActionLabel}
            onPress={() => {
              if (formStep === 1) {
                if (!name.trim() || !category.trim()) {
                  alertValidation("Informe o nome e a categoria antes de continuar.");
                  return;
                }
                setFormStep(2);
              } else if (formStep === 2) {
                if (!isYieldValid || !yieldUnit.trim()) {
                  alertValidation("Informe o rendimento e a unidade antes de continuar.");
                  return;
                }
                setFormStep(3);
              } else void handleSubmit();
            }}
            loading={loading}
            disabled={loading}
            style={isDesktop ? desktopAction(isDesktop, 220) : { flex: 1 }}
          />
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
          <FieldRow
            icon="document-text-outline"
            label={`Nome da ${experienceCopy.formulaNoun}`}
          >
            <ValidationField {...formValidation.field("name")}>
              <TextBox
                accessibilityLabel={`Nome da ${experienceCopy.formulaNoun}`}
                value={name}
                onChangeText={setName}
                placeholder={`Ex: ${experienceCopy.productExample}`}
                autoFocus
              />
            </ValidationField>
          </FieldRow>

          <FieldRow icon="grid-outline" label="Categoria">
            <ValidationField {...formValidation.field("category")}>
              <CategoryField value={category} onChange={setCategory} />
            </ValidationField>
          </FieldRow>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              {`Foto da ${experienceCopy.formulaNoun}`}{" "}
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
                    accessibilityLabel={experienceCopy.quantityLabel}
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
                    accessibilityLabel="Unidade da quantidade final"
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
          <ValidationField {...formValidation.field("lines")}>
            <RecipeMaterialsEditor lines={lines} onChange={setLines} />
          </ValidationField>
        </View>
      </View>
    </StandardModal>
  );
}
