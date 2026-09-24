import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import {
  Button,
  Typography,
  ValidationField,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";

import { formatCurrency } from "../../../shared/utils/format";
import {
  FormField,
  SelectField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { StandardModal } from "../../../shared/components/standard-modal";
import {
  RecipeMaterialsEditor,
  emptyLine,
  type RecipeLine,
} from "./recipe-materials-editor";
import { YIELD_UNIT_PRESETS } from "../yield-units";
import { useBusinessCopy } from "../../subscription/business-copy";

const YIELD_UNIT_ICONS: Record<string, AppIconName> = {
  unidades: "cube-outline",
  fatias: "pizza-outline",
  porções: "restaurant-outline",
  kg: "barbell-outline",
  g: "flask-outline",
};

/** Ficha de escolha no visual das categorias do produto (44 px, raio cheio). */
function Chip({
  label,
  selected,
  icon,
  onPress,
  accessibilityRole = "button",
}: Readonly<{
  label: string;
  selected: boolean;
  icon?: AppIconName;
  onPress: () => void;
  accessibilityRole?: "button" | "radio";
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        justifyContent: "center",
        borderRadius: radii.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.primaryStrong : pal.border,
        backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size={18}
          color={selected ? theme.colors.primaryStrong : pal.icon}
        />
      ) : null}
      <Typography
        variant={selected ? "bodyBold" : "body"}
        color={selected ? theme.colors.primaryStrong : theme.colors.text}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

/**
 * Categoria da receita: campo de escolha que abre a janela com "Nova
 * categoria" + sugestões (o mesmo desenho da categoria do produto).
 */
export function CategoryField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const experienceCopy = useBusinessCopy();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const categoryValidation = useFormValidation({
    draft: !draft.trim() && "Digite uma categoria ou escolha uma das opções.",
  });

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function confirm(cat: string) {
    if (!cat.trim()) {
      categoryValidation.validate();
      return;
    }
    onChange(cat.trim());
    setOpen(false);
  }

  const categories = experienceCopy.categoryPresets;

  return (
    <>
      <SelectField
        icon="grid-outline"
        value={value}
        placeholder={`Ex: ${experienceCopy.categoryExample}`}
        onPress={openSheet}
        accessibilityLabel="Escolher categoria"
      />

      <StandardModal
        visible={open}
        title="Categoria"
        subtitle="Escolha uma das sugestões ou digite uma nova."
        onClose={() => setOpen(false)}
        footer={
          <FormActions>
            <Button title="Cancelar" variant="outline" onPress={() => setOpen(false)} />
            <Button title="Usar categoria" onPress={() => confirm(draft)} />
          </FormActions>
        }
      >
        <FormField label="Nova categoria" validation={categoryValidation.field("draft")}>
          <TextField
            icon="create-outline"
            value={draft}
            onChangeText={setDraft}
            placeholder={`Ex: ${experienceCopy.categoryExample}`}
            accessibilityLabel="Nova categoria"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => confirm(draft)}
          />
        </FormField>

        {categories.length > 0 ? (
          <FormField label="Sugestões">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={cat === value}
                  onPress={() => confirm(cat)}
                />
              ))}
            </View>
          </FormField>
        ) : null}
      </StandardModal>
    </>
  );
}

/** Etapas ou observações: caixa multilinha padrão com contador. */
export function InstructionsField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { theme } = useTheme();
  const MAX = 1000;
  return (
    <>
      <TextField
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX))}
        placeholder="Descreva etapas, observações ou modo de preparo..."
        accessibilityLabel="Etapas ou observações"
        multiline
        maxLength={MAX}
      />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ alignSelf: "flex-end", marginTop: spacing.xs }}
      >
        {value.length}/{MAX}
      </Typography>
    </>
  );
}

/** Campo de foto do cadastro: prévia da imagem ou caixa tracejada "Adicionar foto". */
export function RecipePhotoField({
  imageUri,
  onPick,
}: Readonly<{ imageUri: string | null; onPick: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      onPress={onPick}
      accessibilityRole="button"
      accessibilityLabel={imageUri ? "Trocar foto" : "Adicionar foto"}
      style={({ pressed }) => ({
        borderRadius: fieldMetrics.radius,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        overflow: "hidden",
        minHeight: 88,
        justifyContent: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: "100%", height: 160 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.md,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="camera-outline" size={24} color={theme.colors.textSecondary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Typography variant="bodyBold" color={theme.colors.text}>
              Adicionar foto
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              PNG ou JPG, até 5 MB
            </Typography>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** Atalhos para a unidade da quantidade final (fichas com ícone). */
export function YieldUnitChips({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  /** Lido pelo `FormGrid`: as fichas ocupam a linha inteira. */
  span?: "full";
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Ex: 30 unidades ou 1,5 kg. Toque para usar uma unidade comum.
      </Typography>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Unidades comuns"
        style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
      >
        {YIELD_UNIT_PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={preset}
            icon={YIELD_UNIT_ICONS[preset] ?? "ellipse-outline"}
            selected={value.trim() === preset}
            accessibilityRole="radio"
            onPress={() => onChange(preset)}
          />
        ))}
      </View>
    </View>
  );
}

/** Resumo de custo (total + por unidade) — usado na edição. */
export function RecipeCostCard({
  totalCost,
  costPerUnit,
}: Readonly<{ totalCost: number; costPerUnit: number }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: fieldMetrics.radius,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs }}
      >
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          Custo total
        </Typography>
        <Typography
          variant="money"
          color={theme.colors.text}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(totalCost)}
        </Typography>
      </View>
      <View style={{ width: 1, alignSelf: "stretch", backgroundColor: pal.border }} />
      <View
        style={{ flex: 1, alignItems: "center", gap: 2, paddingHorizontal: spacing.xs }}
      >
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={1}
        >
          Custo por unidade
        </Typography>
        <Typography
          variant="money"
          color={theme.colors.success}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(costPerUnit)}
        </Typography>
      </View>
    </View>
  );
}

export const RECIPE_FORM_STEPS = [
  { label: "Receita", title: "Informações da receita" },
  { label: "Rendimento", title: "Rendimento da receita" },
  { label: "Insumos", title: "Ingredientes e custo" },
] as const;

function lineQuantity(line: RecipeLine) {
  return Number(line.quantity.replace(",", "."));
}

/**
 * Estado e validação do cadastro/edição de receita, por etapa: "Continuar"
 * confere só os campos da etapa atual, com o erro no campo.
 */
export function useRecipeDraft({
  initial,
  visible,
  resetKey,
  requireCategory,
}: Readonly<{
  initial?: {
    name: string;
    category: string;
    instructions: string;
    yieldQuantity: string;
    yieldUnit: string;
    lines: RecipeLine[];
  };
  visible: boolean;
  resetKey?: unknown;
  requireCategory: boolean;
}>) {
  const experienceCopy = useBusinessCopy();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [yieldQuantity, setYieldQuantity] = useState(initial?.yieldQuantity ?? "");
  const [yieldUnit, setYieldUnit] = useState(initial?.yieldUnit ?? "");
  const [lines, setLines] = useState<RecipeLine[]>(initial?.lines ?? [emptyLine()]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (visible) setStep(1);
  }, [resetKey, visible]);

  const parsedYield = Number(yieldQuantity.replace(",", "."));
  const isYieldValid = Number.isFinite(parsedYield) && parsedYield > 0;

  const infoValidation = useFormValidation(
    {
      name: !name.trim() && `Informe o nome da ${experienceCopy.formulaNoun}.`,
      category:
        requireCategory && !category.trim() && "Selecione ou informe uma categoria.",
    },
    visible,
  );
  const yieldValidation = useFormValidation(
    {
      yieldQuantity: !isYieldValid && "Informe uma quantidade final maior que zero.",
      yieldUnit: !yieldUnit.trim() && "Informe a unidade da quantidade final.",
    },
    visible,
  );
  const linesValidation = useFormValidation(
    {
      lines:
        (!lines.some((line) => line.materialId) ||
          lines.some(
            (line) =>
              line.materialId &&
              (!Number.isFinite(lineQuantity(line)) || lineQuantity(line) <= 0),
          )) &&
        `Adicione um ${experienceCopy.materialNoun} e preencha uma quantidade maior que zero em cada item.`,
    },
    visible,
  );
  const stepValidations = [infoValidation, yieldValidation, linesValidation];

  function goToStep(target: number) {
    // Voltar é livre; avançar confere as etapas no caminho.
    for (let current = step; current < target; current += 1) {
      if (!stepValidations[current - 1].validate()) {
        setStep(current);
        return false;
      }
    }
    setStep(target);
    return true;
  }

  /** Confere tudo antes de salvar e leva à primeira etapa com problema. */
  function validateAll() {
    for (let index = 0; index < stepValidations.length; index += 1) {
      if (!stepValidations[index].validate()) {
        setStep(index + 1);
        return false;
      }
    }
    return true;
  }

  return {
    name,
    setName,
    category,
    setCategory,
    instructions,
    setInstructions,
    yieldQuantity,
    setYieldQuantity,
    yieldUnit,
    setYieldUnit,
    lines,
    setLines,
    parsedYield,
    isYieldValid,
    step,
    setStep,
    goToStep,
    validateAll,
    infoValidation,
    yieldValidation,
    linesValidation,
    /** Linhas com insumo e quantidade, prontas para o envio. */
    validLines: () => lines.filter((l) => l.materialId && l.quantity.trim()),
  };
}

type RecipeDraft = ReturnType<typeof useRecipeDraft>;

function stepVisibility(visible: boolean) {
  return {
    style: { display: visible ? ("flex" as const) : ("none" as const) },
    accessibilityElementsHidden: !visible,
    importantForAccessibility: visible
      ? ("auto" as const)
      : ("no-hide-descendants" as const),
  };
}

/** Campos das três etapas da receita (cadastro e edição usam os mesmos). */
export function RecipeFormSteps({
  draft,
  imageUri,
  onPickPhoto,
  nameMaxLength,
  costSummary,
  onTotalCost,
}: Readonly<{
  draft: RecipeDraft;
  imageUri: string | null;
  onPickPhoto: () => void;
  nameMaxLength?: number;
  /** Resumo de custo mostrado acima dos insumos (edição). */
  costSummary?: React.ReactNode;
  onTotalCost?: (total: number) => void;
}>) {
  const experienceCopy = useBusinessCopy();
  const formulaNoun = experienceCopy.formulaNoun;
  return (
    <>
      <FormStepProgress
        current={draft.step}
        steps={RECIPE_FORM_STEPS}
        onStepPress={(target) => {
          draft.goToStep(target);
        }}
      />

      <View {...stepVisibility(draft.step === 1)}>
        <FormBody>
          <FormGrid>
            <FormField
              label={`Nome da ${formulaNoun}`}
              validation={draft.infoValidation.field("name")}
            >
              <TextField
                icon="document-text-outline"
                accessibilityLabel={`Nome da ${formulaNoun}`}
                value={draft.name}
                onChangeText={(value) =>
                  draft.setName(nameMaxLength ? value.slice(0, nameMaxLength) : value)
                }
                placeholder={`Ex: ${experienceCopy.productExample}`}
                maxLength={nameMaxLength}
                autoFocus
              />
            </FormField>
            <FormField
              label="Categoria"
              validation={draft.infoValidation.field("category")}
            >
              <CategoryField value={draft.category} onChange={draft.setCategory} />
            </FormField>
            <FormField label={`Foto da ${formulaNoun}`} optional span="full">
              <RecipePhotoField imageUri={imageUri} onPick={onPickPhoto} />
            </FormField>
            <FormField label="Etapas ou observações" optional span="full">
              <InstructionsField
                value={draft.instructions}
                onChange={draft.setInstructions}
              />
            </FormField>
          </FormGrid>
        </FormBody>
      </View>

      <View {...stepVisibility(draft.step === 2)}>
        <FormBody>
          <FormGrid>
            <FormField
              label={experienceCopy.quantityLabel}
              validation={draft.yieldValidation.field("yieldQuantity")}
            >
              <TextField
                icon="pie-chart-outline"
                accessibilityLabel={experienceCopy.quantityLabel}
                value={draft.yieldQuantity}
                onChangeText={draft.setYieldQuantity}
                placeholder="Ex: 30 ou 1,5"
                keyboardType="decimal-pad"
                numericMode="decimal"
              />
            </FormField>
            <FormField
              label="Unidade"
              validation={draft.yieldValidation.field("yieldUnit")}
            >
              <TextField
                accessibilityLabel="Unidade da quantidade final"
                value={draft.yieldUnit}
                onChangeText={draft.setYieldUnit}
                placeholder="Ex: unidades"
              />
            </FormField>
            <YieldUnitChips
              span="full"
              value={draft.yieldUnit}
              onChange={draft.setYieldUnit}
            />
          </FormGrid>
        </FormBody>
      </View>

      <View {...stepVisibility(draft.step === 3)}>
        <FormBody>
          {costSummary}
          <ValidationField {...draft.linesValidation.field("lines")}>
            <RecipeMaterialsEditor
              lines={draft.lines}
              onChange={draft.setLines}
              onTotalCost={onTotalCost}
            />
          </ValidationField>
        </FormBody>
      </View>
    </>
  );
}
