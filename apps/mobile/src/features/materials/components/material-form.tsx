import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Material } from "@lucro-caseiro/contracts";
import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormSection } from "../../../shared/components/form-section";
import {
  FormField,
  SelectField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { MaterialIconField } from "./material-icon-field";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { formatCost } from "../domain";
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useUpdateMaterial,
} from "../hooks";
import { alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { duplicateKey } from "../../../shared/utils/duplicates";
import { useBusinessCopy } from "../../subscription/business-copy";

interface MaterialFormProps {
  readonly material?: Material | null;
  readonly existingMaterials?: Material[];
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onCreated?: (material: Material) => void;
  readonly onSuccess?: () => void;
}

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "un", "dz"];
const CONTENT_UNITS = ["ml", "l", "g", "kg", "un"];
const NOTES_MAX = 200;

function parseNum(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? undefined : n;
}

/** Cabeçalho de resumo do insumo em edição (avatar + nome + unidade + preço). */
function SummaryCard({
  name,
  unit,
  cost,
  icon,
}: Readonly<{
  name: string;
  unit: string;
  cost: string;
  icon: string | null;
  /** Lido pelo `FormGrid`: o resumo ocupa a linha inteira. */
  span?: "full";
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const price = cost.trim() ? parseCurrencyInput(cost) : NaN;
  const hasPrice = !isNaN(price) && price > 0;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderRadius: fieldMetrics.radius,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        padding: spacing.md,
      }}
    >
      <IngredientAvatar name={name} emoji={icon} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
        <Typography variant="h3" color={theme.colors.text} numberOfLines={1}>
          {name}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {hasPrice ? `${unit} · ${formatCost(price, unit)}` : unit}
        </Typography>
      </View>
    </View>
  );
}

/**
 * Escolha única entre opções curtas (unidades). São mais de 4, então ficam
 * em fichas no mesmo visual das categorias do produto.
 */
function UnitChips({
  value,
  options,
  onChange,
  accessibilityLabel,
}: Readonly<{
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  accessibilityLabel: string;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityLabel={option}
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => ({
              minWidth: 56,
              minHeight: 44,
              paddingHorizontal: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.full,
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primaryStrong : pal.border,
              backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Typography
              variant={selected ? "bodyBold" : "body"}
              color={selected ? theme.colors.primaryStrong : theme.colors.text}
            >
              {option}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Unidade do conteúdo: campo de escolha que abre a lista de unidades. */
function ContentUnitField({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SelectField
        value={value}
        placeholder="Ex: ml"
        onPress={() => setOpen(true)}
        accessibilityLabel="Escolher unidade do conteúdo"
      />
      <StandardModal
        visible={open}
        title="Unidade do conteúdo"
        onClose={() => setOpen(false)}
      >
        <UnitChips
          value={value}
          options={CONTENT_UNITS}
          accessibilityLabel="Unidade do conteúdo"
          onChange={(unit) => {
            onChange(unit);
            setOpen(false);
          }}
        />
      </StandardModal>
    </>
  );
}

/** Exemplo vivo do conteúdo por unidade ("1 kg = 350 ml"). */
function ContentExample({
  unit,
  contentPerUnit,
  contentUnit,
  text,
}: Readonly<{
  unit: string;
  contentPerUnit: string;
  contentUnit: string;
  text: string;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: fieldMetrics.radius,
        backgroundColor: theme.colors.successBg,
      }}
    >
      <AppIcon
        name="bulb-outline"
        size={fieldMetrics.iconSize}
        color={theme.colors.success}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="captionBold" color={theme.colors.success}>
          Ex.: 1 {unit.trim() || "kg"} = {contentPerUnit.trim() || "350"}{" "}
          {contentUnit.trim() || "ml"}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {text}
        </Typography>
      </View>
    </View>
  );
}

export function MaterialForm({
  material,
  existingMaterials = [],
  visible,
  onClose,
  onSuccess,
  onCreated,
}: MaterialFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const materialTitle = experienceCopy.materialNoun.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
  const [name, setName] = useState(material?.name ?? "");
  const [unit, setUnit] = useState(material?.unit ?? "kg");
  const [stock, setStock] = useState(
    material ? String(material.stockQuantity).replace(".", ",") : "",
  );
  const [alertThreshold, setAlertThreshold] = useState(
    material?.stockAlertThreshold != null
      ? String(material.stockAlertThreshold).replace(".", ",")
      : "",
  );
  const [cost, setCost] = useState(
    material?.costPerUnit != null ? currencyInput(material.costPerUnit) : "",
  );
  const [contentPerUnit, setContentPerUnit] = useState(
    material?.contentPerUnit != null
      ? String(material.contentPerUnit).replace(".", ",")
      : "",
  );
  const [contentUnit, setContentUnit] = useState(material?.contentUnit ?? "");
  const [notes, setNotes] = useState(material?.notes ?? "");
  const [icon, setIcon] = useState<string | null>(material?.icon ?? null);
  const [supplierId, setSupplierId] = useState<string | null>(
    material?.supplierId ?? null,
  );

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const { data: matchingMaterials } = useMaterials({
    search: name.trim() || "__sem_nome__",
  });
  const isEditing = !!material;
  const saving = createMaterial.isPending || updateMaterial.isPending;

  // Inclui a unidade atual do insumo se ela não estiver entre as opções padrão.
  const unitOptions = UNIT_OPTIONS.includes(unit)
    ? UNIT_OPTIONS
    : [unit, ...UNIT_OPTIONS];

  // Quantidade e unidade do conteúdo andam juntas: as duas ou nenhuma.
  const formValidation = useFormValidation(
    {
      name: !name.trim() && `Informe o nome do ${experienceCopy.materialNoun}.`,
      contentPerUnit:
        !!contentUnit.trim() &&
        parseNum(contentPerUnit) == null &&
        "Informe a quantidade do conteúdo.",
      contentUnit:
        !!contentPerUnit.trim() &&
        !contentUnit.trim() &&
        "Informe a unidade do conteúdo.",
    },
    visible,
  );

  async function handleSave() {
    if (!formValidation.validate()) return;
    const contentValue = parseNum(contentPerUnit);
    const contentUnitTrimmed = contentUnit.trim();

    const normalizedName = duplicateKey(name);
    const normalizedUnit = duplicateKey(unit);
    const duplicateCandidates = [
      ...existingMaterials,
      ...(matchingMaterials?.items ?? []),
    ];
    const duplicate = duplicateCandidates.find(
      (item) =>
        item.id !== material?.id &&
        duplicateKey(item.name) === normalizedName &&
        duplicateKey(item.unit) === normalizedUnit,
    );
    if (duplicate) {
      showAlert({
        title: `${materialTitle} já cadastrado`,
        message: `Esse ${experienceCopy.materialNoun} já existe. Abra o cadastro existente para ajustar o estoque.`,
      });
      return;
    }

    const data = {
      name: name.trim(),
      unit: unit.trim() || "un",
      stockQuantity: parseNum(stock) ?? 0,
      stockAlertThreshold: parseNum(alertThreshold),
      costPerUnit: cost.trim() ? parseCurrencyInput(cost) : undefined,
      contentPerUnit: contentValue ?? null,
      contentUnit: contentUnitTrimmed || null,
      notes: notes.trim() || undefined,
      icon,
      supplierId,
    };
    try {
      if (isEditing && material) {
        await updateMaterial.mutateAsync({ id: material.id, data });
      } else {
        const created = await createMaterial.mutateAsync(data);
        onCreated?.(created);
      }
      onSuccess?.();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alertError(e.message);
        return;
      }
      alertError(
        `Não foi possível salvar o ${experienceCopy.materialNoun}. Tente novamente.`,
      );
    }
  }

  function handleDelete() {
    if (!material) return;
    showAlert({
      title: `Excluir ${experienceCopy.materialNoun}?`,
      message: `"${material.name}" será excluído e não pode ser recuperado.`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            deleteMaterial.mutate(material.id, {
              onSuccess,
              onError: () => alertError("Não foi possível excluir. Tente novamente."),
            });
          },
        },
      ],
    });
  }

  const unitSuffix = unit.trim() || undefined;

  return (
    <StandardModal
      title={`${isEditing ? "Editar" : "Novo"} ${experienceCopy.materialNoun}`}
      subtitle={
        isEditing
          ? undefined
          : `Cadastre um ${experienceCopy.materialNoun} para controlar custos e usar na ${experienceCopy.formulaNoun}.`
      }
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          <Button
            title="Cancelar"
            variant="outline"
            disabled={saving}
            onPress={onClose}
          />
          <Button
            title={
              isEditing ? "Salvar alterações" : `Cadastrar ${experienceCopy.materialNoun}`
            }
            onPress={() => {
              void handleSave();
            }}
            loading={saving}
          />
        </FormActions>
      }
    >
      <FormBody>
        <FormGrid>
          {isEditing ? (
            <SummaryCard span="full" name={name} unit={unit} cost={cost} icon={icon} />
          ) : (
            <FormField
              span="full"
              label={`Nome do ${experienceCopy.materialNoun}`}
              validation={formValidation.field("name")}
            >
              <TextField
                icon="pricetag-outline"
                accessibilityLabel={`Nome do ${experienceCopy.materialNoun}`}
                placeholder={`Ex: ${experienceCopy.materialExample}`}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </FormField>
          )}
          <FormField
            span="full"
            label="Unidade"
            hint={`A unidade em que você compra e conta este ${experienceCopy.materialNoun}.`}
          >
            <UnitChips
              value={unit}
              options={unitOptions}
              onChange={setUnit}
              accessibilityLabel="Unidade"
            />
          </FormField>
        </FormGrid>

        <FormSection collapsible={false} title="Estoque e custo">
          <FormGrid>
            <FormField label="Estoque atual" hint="Quanto você tem agora.">
              <TextField
                icon="cube-outline"
                placeholder="Ex: 10"
                accessibilityLabel="Estoque atual"
                suffix={unitSuffix}
                value={stock}
                onChangeText={setStock}
                keyboardType="decimal-pad"
                numericMode="decimal"
              />
            </FormField>
            <FormField
              label="Avisar quando chegar a"
              optional
              hint="Você recebe um aviso ao atingir."
            >
              <TextField
                icon="notifications-outline"
                placeholder="Ex: 3"
                accessibilityLabel="Avisar quando chegar a"
                suffix={unitSuffix}
                value={alertThreshold}
                onChangeText={setAlertThreshold}
                keyboardType="decimal-pad"
                numericMode="decimal"
              />
            </FormField>
            <FormField
              label="Custo por unidade"
              optional
              hint={`Quanto você paga por 1 ${unit.trim() || "unidade"}.`}
            >
              <TextField
                prefix="R$"
                placeholder="4,50"
                accessibilityLabel="Custo por unidade, em reais"
                value={cost}
                onChangeText={(value) => setCost(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection
          collapsible={false}
          title="Conteúdo por unidade"
          subtitle={`Opcional. Diz quanto vem em uma unidade de ${experienceCopy.materialNoun}.`}
        >
          <FormGrid>
            <FormField
              label="Quantidade"
              validation={formValidation.field("contentPerUnit")}
            >
              <TextField
                icon="beaker-outline"
                placeholder="Ex: 350"
                accessibilityLabel="Quantidade do conteúdo"
                value={contentPerUnit}
                onChangeText={setContentPerUnit}
                keyboardType="decimal-pad"
                numericMode="decimal"
              />
            </FormField>
            <FormField
              label="Unidade do conteúdo"
              validation={formValidation.field("contentUnit")}
            >
              <ContentUnitField value={contentUnit} onChange={setContentUnit} />
            </FormField>
          </FormGrid>
          <ContentExample
            unit={unit}
            contentPerUnit={contentPerUnit}
            contentUnit={contentUnit}
            text={`Permite usar este ${experienceCopy.materialNoun} em quantidades menores na ${experienceCopy.formulaNoun}.`}
          />
        </FormSection>

        <FormSection collapsible={false} title="Outros detalhes">
          <FormGrid>
            <FormField label="Ícone" optional hint="Ajuda a achar na lista.">
              <MaterialIconField name={name} value={icon} onChange={setIcon} />
            </FormField>
            <FormField
              label="Fornecedor"
              optional
              hint={`De quem você compra este ${experienceCopy.materialNoun}.`}
            >
              <SupplierSelector value={supplierId} onChange={setSupplierId} />
            </FormField>
            <FormField label="Observações" optional span="full">
              <TextField
                value={notes}
                onChangeText={(t) => setNotes(t.slice(0, NOTES_MAX))}
                placeholder="Ex: Informações importantes para este cadastro..."
                accessibilityLabel="Observações"
                multiline
                maxLength={NOTES_MAX}
              />
              <Typography
                variant="caption"
                color={theme.colors.textSecondary}
                style={{ alignSelf: "flex-end", marginTop: spacing.xs }}
              >
                {notes.length}/{NOTES_MAX}
              </Typography>
            </FormField>
          </FormGrid>
        </FormSection>

        {isEditing ? (
          <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
            <Button
              title={`Excluir ${experienceCopy.materialNoun}`}
              variant="alertOutline"
              icon={<AppIcon name="trash-outline" size={18} color={theme.colors.alert} />}
              onPress={handleDelete}
              disabled={saving || deleteMaterial.isPending}
            />
          </View>
        ) : null}
      </FormBody>
    </StandardModal>
  );
}
