import { MaterialForm } from "../../materials/components/material-form";
import { guidanceEvent } from "../../../shared/guidance/guidance-events";
import { useAuth } from "../../../shared/hooks/use-auth";
import { formatCurrency as formatMoney } from "../../../shared/utils/format";
import type { Material } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import {
  ChoiceField,
  FormField,
  SelectField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormGrid } from "../../../shared/components/form-layout";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { IngredientAvatar } from "../../../shared/ingredient-image/ingredient-avatar";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useMaterials } from "../../materials/hooks";
import { useBusinessCopy } from "../../subscription/business-copy";

export interface RecipeLine {
  materialId: string;
  quantity: string;
  unit: string;
}

export function emptyLine(): RecipeLine {
  return { materialId: "", quantity: "", unit: "" };
}

/**
 * #14: custo efetivo por unidade da linha. Se o insumo declara conteudo por unidade
 * (ex.: 1 lata = 350 ml) e a linha usa essa unidade de conteudo, converte o custo.
 * Caso contrario, usa o custo por unidade do insumo (comportamento original).
 */
function effectiveCostPerUnit(material: Material, lineUnit: string): number {
  const base = material.costPerUnit ?? 0;
  if (
    material.contentPerUnit != null &&
    material.contentPerUnit > 0 &&
    material.contentUnit != null &&
    material.contentUnit.trim().toLowerCase() === lineUnit.trim().toLowerCase()
  ) {
    return base / material.contentPerUnit;
  }
  return base;
}

/** Unidades disponiveis para uma linha: a propria do insumo + a de conteudo (se houver). */
function unitOptions(material: Material): string[] {
  const opts = [material.unit];
  if (
    material.contentUnit &&
    material.contentUnit.trim() &&
    material.contentUnit.trim().toLowerCase() !== material.unit.trim().toLowerCase()
  ) {
    opts.push(material.contentUnit.trim());
  }
  return opts;
}

function lineCost(
  material: Material | undefined,
  quantity: string,
  unit: string,
): number {
  if (!material) return 0;
  const qty = parseFloat(quantity.replace(",", "."));
  if (Number.isNaN(qty)) return 0;
  return effectiveCostPerUnit(material, unit) * qty;
}

/** Editor das linhas de insumo de uma receita: seleciona insumo, quantidade e mostra custo. */
export function RecipeMaterialsEditor({
  lines,
  onChange,
  onTotalCost,
}: Readonly<{
  lines: RecipeLine[];
  onChange: (lines: RecipeLine[]) => void;
  onTotalCost?: (total: number) => void;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const materialLabel = experienceCopy.materialNoun.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
  const materialsTitle = experienceCopy.materialNounPlural;
  const guidanceUserId = useAuth((state) => state.userId);
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [createdMaterials, setCreatedMaterials] = useState<Material[]>([]);
  const { data, isLoading, error, refetch } = useMaterials();
  const materials = [
    ...(data?.items ?? []),
    ...createdMaterials.filter(
      (item) => !data?.items.some((saved) => saved.id === item.id),
    ),
  ];
  const byId = new Map(materials.map((m) => [m.id, m]));
  const [pickerLineIndex, setPickerLineIndex] = useState<number | null>(null);
  const [materialSearch, setMaterialSearch] = useState("");
  const normalizedSearch = materialSearch.trim().toLowerCase();
  const visibleMaterials = normalizedSearch
    ? materials.filter((material) =>
        material.name.toLowerCase().includes(normalizedSearch),
      )
    : materials;

  function updateLine(index: number, patch: Partial<RecipeLine>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function selectMaterial(index: number, material: Material) {
    updateLine(index, { materialId: material.id, unit: material.unit });
  }

  function openMaterialPicker(index: number) {
    setMaterialSearch("");
    setPickerLineIndex(index);
  }

  function closeMaterialPicker() {
    setPickerLineIndex(null);
    setMaterialSearch("");
  }

  function pickMaterial(material: Material) {
    if (pickerLineIndex === null) return;
    selectMaterial(pickerLineIndex, material);
    closeMaterialPicker();
  }

  function addLine() {
    onChange([...lines, emptyLine()]);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce(
    (sum, l) => sum + lineCost(byId.get(l.materialId), l.quantity, l.unit),
    0,
  );

  // Expõe o custo total ao pai (ex.: card de custo na edição) sem loop de render.
  const onTotalCostRef = useRef(onTotalCost);
  onTotalCostRef.current = onTotalCost;
  useEffect(() => {
    onTotalCostRef.current?.(total);
  }, [total]);

  const materialForm = creatingMaterial ? (
    <MaterialForm
      visible
      onClose={() => setCreatingMaterial(false)}
      onCreated={(material) => {
        setCreatedMaterials((current) => [...current, material]);
        const index =
          pickerLineIndex ??
          Math.max(
            0,
            lines.findIndex((line) => !line.materialId),
          );
        if (lines.length === 0)
          onChange([{ materialId: material.id, unit: material.unit, quantity: "" }]);
        else selectMaterial(index, material);
        setCreatingMaterial(false);
        closeMaterialPicker();
        if (guidanceUserId)
          guidanceEvent("recipes", "prerequisite_resumed", guidanceUserId);
      }}
    />
  ) : null;
  if (isLoading)
    return <Typography variant="body">Carregando {materialsTitle}...</Typography>;
  if (error)
    return (
      <View style={{ gap: spacing.md }}>
        <Typography variant="body">
          Não foi possível carregar os {materialsTitle}.
        </Typography>
        <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
          <Button
            title="Tentar novamente"
            variant="outline"
            onPress={() => void refetch()}
          />
        </View>
      </View>
    );
  if (materials.length === 0) {
    return (
      <View style={{ gap: spacing.md }}>
        {materialForm}
        <Typography variant="body" color={theme.colors.textSecondary}>
          Você ainda não cadastrou {experienceCopy.materialNounPlural}.
        </Typography>
        <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
          <Button
            title={`Cadastrar ${experienceCopy.materialNoun} e continuar`}
            variant="outline"
            icon={<AppIcon name="add" size={20} color={theme.colors.primaryStrong} />}
            onPress={() => setCreatingMaterial(true)}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      {materialForm}
      <View style={{ gap: spacing.lg }}>
        {lines.map((line, index) => {
          const material = byId.get(line.materialId);
          const cost = lineCost(material, line.quantity, line.unit);
          const units = material ? unitOptions(material) : [];
          const activeUnit =
            units.find(
              (u) => u.trim().toLowerCase() === line.unit.trim().toLowerCase(),
            ) ?? line.unit;
          return (
            <View
              key={index}
              style={{
                gap: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Typography variant="bodyBold" color={theme.colors.text}>
                  {materialLabel} {index + 1}
                </Typography>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
                >
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Custo{" "}
                    <Typography variant="captionBold" color={theme.colors.success}>
                      {formatMoney(cost)}
                    </Typography>
                  </Typography>
                  {lines.length > 1 ? (
                    <Pressable
                      onPress={() => removeLine(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${experienceCopy.materialNoun} ${index + 1}`}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        marginRight: -spacing.sm,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: radii.sm,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <AppIcon
                        name="trash-outline"
                        size={20}
                        color={theme.colors.alert}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <FormGrid>
                <FormField label={materialLabel}>
                  <SelectField
                    icon="basket-outline"
                    value={material?.name}
                    placeholder={`Selecionar ${experienceCopy.materialNoun}`}
                    onPress={() => openMaterialPicker(index)}
                    accessibilityLabel={
                      material
                        ? `Trocar ${experienceCopy.materialNoun}`
                        : `Selecionar ${experienceCopy.materialNoun}`
                    }
                  />
                </FormField>
                <FormField label="Quantidade">
                  <TextField
                    accessibilityLabel="Quantidade"
                    placeholder="Ex: 2"
                    suffix={material ? line.unit || material.unit : undefined}
                    value={line.quantity}
                    onChangeText={(v) => updateLine(index, { quantity: v })}
                    keyboardType="decimal-pad"
                    numericMode="decimal"
                  />
                </FormField>
                {units.length > 1 ? (
                  <FormField label="Usar em" span="full">
                    <ChoiceField
                      value={activeUnit}
                      accessibilityLabel="Usar em"
                      options={units.map((u) => ({ value: u, label: u }))}
                      onChange={(u) => updateLine(index, { unit: u })}
                    />
                  </FormField>
                ) : null}
              </FormGrid>
            </View>
          );
        })}

        <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
          <Button
            title={`Adicionar ${experienceCopy.materialNoun}`}
            variant="outline"
            icon={<AppIcon name="add" size={20} color={theme.colors.primaryStrong} />}
            onPress={addLine}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.md,
            paddingTop: spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Typography variant="body" style={{ flexShrink: 1 }}>
            Custo total — {experienceCopy.materialNounPlural}
          </Typography>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatMoney(total)}
          </Typography>
        </View>
      </View>

      <StandardModal
        visible={pickerLineIndex !== null && !creatingMaterial}
        onClose={closeMaterialPicker}
        title={`Selecionar ${experienceCopy.materialNoun}`}
        subtitle={
          pickerLineIndex === null ? undefined : `${materialLabel} ${pickerLineIndex + 1}`
        }
      >
        <View style={{ alignItems: isDesktop ? "flex-start" : "stretch" }}>
          <Button
            title={`Cadastrar ${experienceCopy.materialNoun} e continuar`}
            variant="outline"
            icon={<AppIcon name="add" size={20} color={theme.colors.primaryStrong} />}
            onPress={() => setCreatingMaterial(true)}
          />
        </View>
        <Input
          label={`Buscar ${experienceCopy.materialNoun}`}
          placeholder={`Digite o nome do ${experienceCopy.materialNoun}`}
          value={materialSearch}
          onChangeText={setMaterialSearch}
        />

        <View style={{ gap: spacing.sm }}>
          {visibleMaterials.map((materialOption) => {
            const active =
              pickerLineIndex !== null &&
              lines[pickerLineIndex]?.materialId === materialOption.id;
            return (
              <Pressable
                key={materialOption.id}
                onPress={() => pickMaterial(materialOption)}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar ${materialOption.name}`}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  minHeight: fieldMetrics.height,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingHorizontal: spacing.md - (active ? 1 : 0),
                  borderRadius: fieldMetrics.radius,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? theme.colors.primaryStrong : pal.border,
                  backgroundColor: active ? theme.colors.primaryBg : pal.fieldBgFocus,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <IngredientAvatar name={materialOption.name} size={28} />
                <Typography
                  variant="bodyBold"
                  color={active ? theme.colors.primaryStrong : theme.colors.text}
                  numberOfLines={1}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  {materialOption.name}
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {formatMoney(materialOption.costPerUnit ?? 0)} por {materialOption.unit}
                </Typography>
                {active ? (
                  <AppIcon
                    name="checkmark-circle"
                    size={fieldMetrics.iconSize}
                    color={theme.colors.primaryStrong}
                  />
                ) : null}
              </Pressable>
            );
          })}

          {visibleMaterials.length === 0 ? (
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center", paddingVertical: spacing.lg }}
            >
              Nenhum {experienceCopy.materialNoun} encontrado.
            </Typography>
          ) : null}
        </View>
      </StandardModal>
    </>
  );
}
