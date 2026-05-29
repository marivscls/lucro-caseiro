import type { LabelData } from "@lucro-caseiro/contracts";
import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { useCreateLabel } from "../hooks";
import { LabelPreview } from "./label-preview";
import { TemplatePicker } from "./template-picker";

interface CreateLabelFormProps {
  productId?: string;
  onSuccess?: () => void;
}

export function CreateLabelForm({
  productId,
  onSuccess,
}: Readonly<CreateLabelFormProps>) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({
    productName: "",
  });

  const createLabel = useCreateLabel();

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((prev) => ({ ...prev, [key]: value }));
  }

  function toIsoDate(ddmmyyyy: string): string | undefined {
    if (!ddmmyyyy.trim()) return undefined;
    const parts = ddmmyyyy.split("/");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return ddmmyyyy;
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Opa!", "De um nome para o rótulo");
      return;
    }
    if (!labelData.productName.trim()) {
      Alert.alert("Opa!", "Preencha o nome do produto no rótulo");
      return;
    }

    try {
      await createLabel.mutateAsync({
        name: name.trim(),
        templateId,
        productId,
        data: {
          ...labelData,
          manufacturingDate: toIsoDate(labelData.manufacturingDate ?? ""),
          expirationDate: toIsoDate(labelData.expirationDate ?? ""),
        },
      });
      Alert.alert("Rótulo criado!", "Seu rótulo esta pronto para imprimir");
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Não foi possível criar o rótulo. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Typography variant="h2">Novo rótulo</Typography>

      <Input
        label="Nome do rótulo"
        placeholder="Ex: Rótulo Brigadeiro 50g"
        value={name}
        onChangeText={setName}
      />

      <TemplatePicker selected={templateId} onSelect={setTemplateId} />

      <View style={{ gap: 12 }}>
        <Typography variant="h3">Informações do rótulo</Typography>

        <Input
          label="Nome do produto"
          placeholder="Ex: Brigadeiro Gourmet"
          value={labelData.productName}
          onChangeText={(v) => updateField("productName", v)}
        />

        <Input
          label="Ingredientes"
          placeholder="Ex: Leite condensado, chocolate, manteiga..."
          value={labelData.ingredients ?? ""}
          onChangeText={(v) => updateField("ingredients", v)}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Input
            label="Fabricacao"
            placeholder="DD/MM/AAAA"
            value={labelData.manufacturingDate ?? ""}
            onChangeText={(v) => updateField("manufacturingDate", v)}
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Validade"
            placeholder="DD/MM/AAAA"
            value={labelData.expirationDate ?? ""}
            onChangeText={(v) => updateField("expirationDate", v)}
            containerStyle={{ flex: 1 }}
          />
        </View>

        <Input
          label="Seu nome / nome do negócio"
          placeholder="Ex: Doces da Maria"
          value={labelData.producerName ?? ""}
          onChangeText={(v) => updateField("producerName", v)}
        />

        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          value={labelData.producerPhone ?? ""}
          onChangeText={(v) => updateField("producerPhone", v)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={{ gap: 8 }}>
        <Typography variant="h3">Pre-visualizacao</Typography>
        <LabelPreview data={labelData} templateId={templateId} />
      </View>

      <Button
        title="Criar rótulo"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createLabel.isPending}
      />
    </ScrollView>
  );
}
