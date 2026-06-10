import type { Material } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { useCreateMaterial, useDeleteMaterial, useUpdateMaterial } from "../hooks";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface MaterialFormProps {
  readonly material?: Material | null;
  readonly onSuccess?: () => void;
}

// Inclui unidades de papelaria/artesanato: folha, metro e centimetro.
const UNITS = ["kg", "g", "L", "ml", "un", "dz", "folha", "m", "cm"];

function parseNum(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? undefined : n;
}

export function MaterialForm({ material, onSuccess }: MaterialFormProps) {
  const { theme } = useTheme();
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
    material?.costPerUnit != null ? String(material.costPerUnit).replace(".", ",") : "",
  );
  const [contentPerUnit, setContentPerUnit] = useState(
    material?.contentPerUnit != null
      ? String(material.contentPerUnit).replace(".", ",")
      : "",
  );
  const [contentUnit, setContentUnit] = useState(material?.contentUnit ?? "");
  const [notes, setNotes] = useState(material?.notes ?? "");

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const isEditing = !!material;

  async function handleSave() {
    if (!name.trim()) {
      alertValidation("Dê um nome ao insumo (ex.: Farinha de trigo).");
      return;
    }
    const contentValue = parseNum(contentPerUnit);
    const contentUnitTrimmed = contentUnit.trim();
    if ((contentValue != null) !== contentUnitTrimmed.length > 0) {
      Alert.alert(
        "Conteúdo por unidade",
        "Preencha a quantidade e a unidade do conteúdo (ex.: 350 e ml), ou deixe os dois em branco.",
      );
      return;
    }

    const data = {
      name: name.trim(),
      unit: unit.trim() || "un",
      stockQuantity: parseNum(stock) ?? 0,
      stockAlertThreshold: parseNum(alertThreshold),
      costPerUnit: parseNum(cost),
      contentPerUnit: contentValue ?? null,
      contentUnit: contentUnitTrimmed || null,
      notes: notes.trim() || undefined,
    };
    try {
      if (isEditing && material) {
        await updateMaterial.mutateAsync({ id: material.id, data });
      } else {
        await createMaterial.mutateAsync(data);
      }
      onSuccess?.();
    } catch {
      alertError("Não foi possível salvar o insumo. Tente novamente.");
    }
  }

  function handleDelete() {
    if (!material) return;
    Alert.alert("Excluir insumo", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          deleteMaterial.mutate(material.id, { onSuccess });
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Input
        label="Nome do insumo"
        placeholder="Ex: Farinha de trigo"
        value={name}
        onChangeText={setName}
        autoFocus={!isEditing}
      />

      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption">Unidade</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {UNITS.map((u) => {
            const active = unit === u;
            return (
              <Pressable
                key={u}
                onPress={() => setUnit(u)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                >
                  {u}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label="Quantidade em estoque"
        placeholder="Ex: 10"
        value={stock}
        onChangeText={setStock}
        keyboardType="decimal-pad"
      />
      <Input
        label="Alerta de estoque baixo (opcional)"
        placeholder="Ex: 3"
        value={alertThreshold}
        onChangeText={setAlertThreshold}
        keyboardType="decimal-pad"
      />
      <Input
        label="Custo por unidade (opcional)"
        placeholder="Ex: 4,50"
        value={cost}
        onChangeText={setCost}
        keyboardType="decimal-pad"
      />
      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption">Conteúdo por unidade (opcional)</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 2 }}>
            <Input
              label="Quantidade"
              placeholder="Ex: 350"
              value={contentPerUnit}
              onChangeText={setContentPerUnit}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Unidade"
              placeholder="Ex: ml"
              value={contentUnit}
              onChangeText={setContentUnit}
              autoCapitalize="none"
            />
          </View>
        </View>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Ex.: 1 {unit.trim() || "lata"} = 350 ml. Permite usar este insumo em g/ml nas
          receitas.
        </Typography>
      </View>

      <Input
        label="Observações (opcional)"
        placeholder="Marca, fornecedor..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
        style={{ height: 70, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button
        title="Salvar insumo"
        size="lg"
        onPress={() => {
          void handleSave();
        }}
        loading={createMaterial.isPending || updateMaterial.isPending}
      />
      {isEditing ? (
        <Button
          title="Excluir"
          variant="secondary"
          onPress={handleDelete}
          loading={deleteMaterial.isPending}
        />
      ) : null}
    </ScrollView>
  );
}
