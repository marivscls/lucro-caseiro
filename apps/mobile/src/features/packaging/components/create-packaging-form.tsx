import { Button, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { useCreatePackaging } from "../hooks";

interface CreatePackagingFormProps {
  readonly onSuccess?: () => void;
}

const TYPES = [
  { value: "box", label: "Caixa" },
  { value: "bag", label: "Sacola" },
  { value: "pot", label: "Pote" },
  { value: "film", label: "Filme" },
  { value: "label", label: "Rotulo" },
  { value: "other", label: "Outro" },
] as const;

export function CreatePackagingForm({ onSuccess }: CreatePackagingFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("box");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");

  const createPackaging = useCreatePackaging();

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Opa!", "Coloque o nome da embalagem");
      return;
    }
    const cost = parseFloat(unitCost.replace(",", "."));
    if (isNaN(cost) || cost <= 0) {
      Alert.alert("Opa!", "O custo precisa ser maior que zero");
      return;
    }

    try {
      await createPackaging.mutateAsync({
        name: name.trim(),
        type: type as "box" | "bag" | "pot" | "film" | "label" | "other",
        unitCost: cost,
        supplier: supplier.trim() || undefined,
      });
      Alert.alert("Embalagem cadastrada!", `${name} foi adicionada`);
      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Tente novamente.";
      Alert.alert("Erro", msg);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h2">Nova embalagem</Typography>

      <Input
        label="Nome da embalagem"
        placeholder="Ex: Caixa kraft P, Sacola transparente..."
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption">Tipo</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setType(t.value)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: 20,
                backgroundColor:
                  type === t.value ? theme.colors.primary : theme.colors.surface,
              }}
            >
              <Typography
                variant="caption"
                color={
                  type === t.value
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary
                }
              >
                {t.label}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      <Input
        label="Custo unitario (R$)"
        placeholder="Ex: 1,50"
        value={unitCost}
        onChangeText={setUnitCost}
        keyboardType="decimal-pad"
      />

      <Input
        label="Fornecedor (opcional)"
        placeholder="Ex: Embalagens Brasil"
        value={supplier}
        onChangeText={setSupplier}
      />

      <Button
        title="Cadastrar embalagem"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createPackaging.isPending}
      />
    </ScrollView>
  );
}
