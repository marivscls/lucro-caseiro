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

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Opa!", "De um nome para o rotulo");
      return;
    }
    if (!labelData.productName.trim()) {
      Alert.alert("Opa!", "Preencha o nome do produto no rotulo");
      return;
    }

    try {
      await createLabel.mutateAsync({
        name: name.trim(),
        templateId,
        productId,
        data: labelData,
      });
      Alert.alert("Rotulo criado!", "Seu rotulo esta pronto para imprimir");
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Nao foi possivel criar o rotulo. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Typography variant="h2">Novo rotulo</Typography>

      <Input
        label="Nome do rotulo"
        placeholder="Ex: Rotulo Brigadeiro 50g"
        value={name}
        onChangeText={setName}
      />

      <TemplatePicker selected={templateId} onSelect={setTemplateId} />

      <View style={{ gap: 12 }}>
        <Typography variant="h3">Informacoes do rotulo</Typography>

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
            placeholder="AAAA-MM-DD"
            value={labelData.manufacturingDate ?? ""}
            onChangeText={(v) => updateField("manufacturingDate", v)}
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Validade"
            placeholder="AAAA-MM-DD"
            value={labelData.expirationDate ?? ""}
            onChangeText={(v) => updateField("expirationDate", v)}
            containerStyle={{ flex: 1 }}
          />
        </View>

        <Input
          label="Seu nome / nome do negocio"
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
        title="Criar rotulo"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createLabel.isPending}
      />
    </ScrollView>
  );
}
