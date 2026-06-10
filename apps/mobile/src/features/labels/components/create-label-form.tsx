import type { LabelData } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";

import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { uploadLabelLogo } from "../../../shared/utils/upload-image";
import { addDaysToBR, brToIso, maskDateBR } from "../dates";
import { exportLabelPdfWithChoice } from "../label-export";
import { cleanNutrition } from "../nutrition";
import { normalizeLink } from "../qr";
import { useCreateLabel } from "../hooks";
import { FormSection } from "../../../shared/components/form-section";
import { LabelPreview } from "./label-preview";
import { NutritionFields } from "./nutrition-fields";
import { TemplatePicker } from "./template-picker";

interface CreateLabelFormProps {
  productId?: string;
  onSuccess?: () => void;
}

export function CreateLabelForm({
  productId,
  onSuccess,
}: Readonly<CreateLabelFormProps>) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({
    productName: "",
  });
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrLink, setQrLink] = useState("");
  const [shelfDays, setShelfDays] = useState("");
  const { imageUri: logoUri, showPicker, clear: clearLogo } = useImagePicker();

  const qrUrl = normalizeLink(qrLink);
  const createLabel = useCreateLabel();

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((prev) => ({ ...prev, [key]: value }));
  }

  // Recalcula a validade (fabricação + dias) sempre que um dos dois muda.
  function recomputeExpiration(manufacturing: string, days: string) {
    const n = parseInt(days, 10);
    if (!manufacturing || Number.isNaN(n) || n <= 0) return;
    const expiration = addDaysToBR(manufacturing, n);
    if (expiration) updateField("expirationDate", expiration);
  }

  function handleManufacturingChange(value: string) {
    const masked = maskDateBR(value);
    updateField("manufacturingDate", masked);
    recomputeExpiration(masked, shelfDays);
  }

  function handleShelfDaysChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setShelfDays(digits);
    recomputeExpiration(labelData.manufacturingDate ?? "", digits);
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

    const manufacturingDate = brToIso(labelData.manufacturingDate ?? "");
    const expirationDate = brToIso(labelData.expirationDate ?? "");
    if (
      (labelData.manufacturingDate?.trim() && !manufacturingDate) ||
      (labelData.expirationDate?.trim() && !expirationDate)
    ) {
      Alert.alert("Data incompleta", "Confira as datas no formato DD/MM/AAAA.");
      return;
    }
    if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
      Alert.alert("Datas invertidas", "A validade não pode ser anterior à fabricação.");
      return;
    }

    // Sobe o logo (se houver) e usa a URL pública. Se falhar, salva sem o logo.
    let logoUrl: string | undefined;
    if (logoUri) {
      try {
        setUploading(true);
        logoUrl = await uploadLabelLogo(logoUri);
      } catch {
        Alert.alert(
          "Logo não enviado",
          "Não consegui enviar o logo agora. Vou salvar o rótulo sem ele — você pode adicionar depois.",
        );
      } finally {
        setUploading(false);
      }
    }

    try {
      await createLabel.mutateAsync({
        name: name.trim(),
        templateId,
        productId,
        logoUrl,
        qrCodeUrl: qrUrl,
        data: {
          ...labelData,
          manufacturingDate,
          expirationDate,
          nutrition: cleanNutrition(labelData.nutrition),
        },
      });
      Alert.alert("Rótulo criado!", "Seu rótulo esta pronto para imprimir");
      onSuccess?.();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error
          ? e.message
          : "Não foi possível criar o rótulo. Tente novamente.",
      );
    }
  }

  async function handleExport() {
    if (!labelData.productName.trim()) {
      Alert.alert("Opa!", "Preencha o nome do produto para baixar o rótulo");
      return;
    }
    setExporting(true);
    try {
      await exportLabelPdfWithChoice(labelData, templateId, logoUri, qrUrl);
    } catch {
      Alert.alert("Erro", "Não foi possível gerar o rótulo. Tente novamente.");
    } finally {
      setExporting(false);
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

      <FormSection
        title="Datas de validade"
        subtitle="Fabricação e validade do produto"
        icon="calendar-outline"
        initiallyOpen
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Input
            label="Fabricacao"
            placeholder="DD/MM/AAAA"
            value={labelData.manufacturingDate ?? ""}
            onChangeText={handleManufacturingChange}
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Validade"
            placeholder="DD/MM/AAAA"
            value={labelData.expirationDate ?? ""}
            onChangeText={(v) => updateField("expirationDate", maskDateBR(v))}
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
        </View>
        <Input
          label="Validade em dias (opcional)"
          placeholder="Ex: 7 — preenche a validade sozinho"
          value={shelfDays}
          onChangeText={handleShelfDaysChange}
          keyboardType="number-pad"
        />
      </FormSection>

      <FormSection
        title="Informação nutricional"
        subtitle="Opcional — tabela de nutrientes"
        icon="nutrition-outline"
      >
        <NutritionFields
          value={labelData.nutrition}
          onChange={(n) => updateField("nutrition", n)}
        />
      </FormSection>

      <FormSection
        title="Contato e marca"
        subtitle="Opcional — seu nome, telefone, QR Code e logo"
        icon="person-circle-outline"
      >
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
          onChangeText={(v) => updateField("producerPhone", maskPhoneBR(v))}
          keyboardType="phone-pad"
        />
        <Input
          label="Link do QR Code (opcional)"
          placeholder="Seu Instagram, cardápio ou WhatsApp"
          value={qrLink}
          onChangeText={setQrLink}
          autoCapitalize="none"
          keyboardType="url"
        />
        <View>
          <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
            Logo do negócio (opcional)
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Pressable
              onPress={showPicker}
              accessibilityRole="button"
              accessibilityLabel="Adicionar logo do negócio"
              style={{
                width: 80,
                height: 80,
                borderRadius: radii.lg,
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: 80, height: 80 }} />
              ) : (
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={theme.colors.textSecondary}
                />
              )}
            </Pressable>
            {logoUri && (
              <Pressable onPress={clearLogo} hitSlop={8}>
                <Typography variant="caption" color={theme.colors.primary}>
                  Remover logo
                </Typography>
              </Pressable>
            )}
          </View>
        </View>
      </FormSection>

      <View style={{ gap: 12 }}>
        <Typography variant="h3">Pré-visualização</Typography>
        <LabelPreview
          data={labelData}
          templateId={templateId}
          logoUrl={logoUri}
          qrUrl={qrUrl}
          scale={1.1}
        />
      </View>

      <View style={{ gap: 12 }}>
        <Button
          title="Baixar / Compartilhar"
          variant="outline"
          size="lg"
          icon={
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
          }
          onPress={() => {
            void handleExport();
          }}
          loading={exporting}
        />
        <Button
          title={uploading ? "Enviando logo..." : "Criar rótulo"}
          size="lg"
          onPress={() => {
            void handleSubmit();
          }}
          loading={createLabel.isPending || uploading}
        />
      </View>
    </ScrollView>
  );
}
