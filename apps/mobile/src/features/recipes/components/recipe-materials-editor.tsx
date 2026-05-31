import { formatCurrency as formatMoney } from "../../../shared/utils/format";
import type { Material } from "@lucro-caseiro/contracts";
import { Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";

import { useMaterials } from "../../materials/hooks";

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
}: Readonly<{ lines: RecipeLine[]; onChange: (lines: RecipeLine[]) => void }>) {
  const { theme } = useTheme();
  const router = useRouter();
  const { data } = useMaterials();
  const materials = data?.items ?? [];
  const byId = new Map(materials.map((m) => [m.id, m]));

  function updateLine(index: number, patch: Partial<RecipeLine>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function selectMaterial(index: number, material: Material) {
    updateLine(index, { materialId: material.id, unit: material.unit });
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

  if (materials.length === 0) {
    return (
      <View style={{ gap: spacing.md }}>
        <Typography variant="h3">Insumos</Typography>
        <Pressable
          onPress={() => router.push("/materials")}
          style={{
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.surface,
            gap: spacing.xs,
          }}
        >
          <Typography variant="body">
            Você ainda não cadastrou insumos (matéria-prima).
          </Typography>
          <Typography variant="caption" color={theme.colors.primary}>
            Cadastrar insumos →
          </Typography>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Typography variant="h3">Insumos</Typography>

      {lines.map((line, index) => {
        const material = byId.get(line.materialId);
        const cost = lineCost(material, line.quantity, line.unit);
        const units = material ? unitOptions(material) : [];
        return (
          <View
            key={index}
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.surface,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption">Insumo {index + 1}</Typography>
              {lines.length > 1 && (
                <TouchableOpacity onPress={() => removeLine(index)}>
                  <Typography variant="caption" color={theme.colors.alert}>
                    Remover
                  </Typography>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
            >
              {materials.map((m) => {
                const active = m.id === line.materialId;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => selectMaterial(index, m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${m.name}`}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.full,
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.surfaceElevated,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color={active ? theme.colors.textOnPrimary : theme.colors.text}
                    >
                      {m.name}
                    </Typography>
                  </Pressable>
                );
              })}
            </ScrollView>

            {units.length > 1 && (
              <View style={{ gap: spacing.xs }}>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Usar em
                </Typography>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  {units.map((u) => {
                    const active =
                      u.trim().toLowerCase() === line.unit.trim().toLowerCase();
                    return (
                      <Pressable
                        key={u}
                        onPress={() => updateLine(index, { unit: u })}
                        accessibilityRole="button"
                        accessibilityLabel={`Usar em ${u}`}
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.full,
                          backgroundColor: active
                            ? theme.colors.primary
                            : theme.colors.surfaceElevated,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={active ? theme.colors.textOnPrimary : theme.colors.text}
                        >
                          {u}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View
              style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}
            >
              <View style={{ flex: 1 }}>
                <Input
                  label={
                    material ? `Quantidade (${line.unit || material.unit})` : "Quantidade"
                  }
                  placeholder="Ex: 2"
                  value={line.quantity}
                  onChangeText={(v) => updateLine(index, { quantity: v })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ paddingBottom: spacing.md }}>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Custo
                </Typography>
                <Typography variant="bodyBold" color={theme.colors.success}>
                  {formatMoney(cost)}
                </Typography>
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity
        onPress={addLine}
        style={{
          paddingVertical: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.success,
          borderStyle: "dashed",
          alignItems: "center",
        }}
      >
        <Typography variant="body" color={theme.colors.success}>
          + Adicionar insumo
        </Typography>
      </TouchableOpacity>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: spacing.xs,
        }}
      >
        <Typography variant="body">Custo total dos insumos</Typography>
        <Typography variant="bodyBold" color={theme.colors.success}>
          {formatMoney(total)}
        </Typography>
      </View>
    </View>
  );
}
