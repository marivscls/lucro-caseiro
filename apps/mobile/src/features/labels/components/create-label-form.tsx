import type { LabelData } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { uploadLabelLogo } from "../../../shared/utils/upload-image";
import { addDaysToBR, brToIso, maskDateBR } from "../dates";
import { exportLabelPdfWithChoice } from "../label-export";
import { cleanNutrition } from "../nutrition";
import { normalizeLink } from "../qr";
import { useCreateLabel, useLabels } from "../hooks";
import { useProfile } from "../../subscription/hooks";
import { DateField } from "../../../shared/components/date-field";
import { FormSection } from "../../../shared/components/form-section";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { LabelStyleEditor } from "./label-style-editor";
import { LabelPreview } from "./label-preview";
import { NutritionFields } from "./nutrition-fields";
import { TemplatePicker } from "./template-picker";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface CreateLabelFormProps {
  productId?: string;
  onSuccess?: () => void;
}

export function CreateLabelForm({
  productId,
  onSuccess,
}: Readonly<CreateLabelFormProps>) {
  const { theme } = useTheme();
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((st) => st.show);
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "labelsPremium");
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
  const { data: labelsData } = useLabels(productId ? { productId } : undefined);

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
      alertValidation("De um nome para o rótulo");
      return;
    }
    if (!labelData.productName.trim()) {
      alertValidation("Preencha o nome do produto no rótulo");
      return;
    }

    const manufacturingDate = brToIso(labelData.manufacturingDate ?? "");
    const expirationDate = brToIso(labelData.expirationDate ?? "");
    if (
      (labelData.manufacturingDate?.trim() && !manufacturingDate) ||
      (labelData.expirationDate?.trim() && !expirationDate)
    ) {
      showAlert({
        title: "Data incompleta",
        message: "Confira as datas no formato DD/MM/AAAA.",
      });
      return;
    }
    if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
      showAlert({
        title: "Datas invertidas",
        message: "A validade não pode ser anterior à fabricação.",
      });
      return;
    }

    const duplicatedLabel = labelsData?.items.some(
      (label) =>
        duplicateKey(label.name) === duplicateKey(name) &&
        label.templateId === templateId &&
        (label.productId ?? null) === (productId ?? null),
    );
    if (duplicatedLabel) {
      const shouldContinue = await confirmPossibleDuplicate(
        "Rótulo parecido",
        "Já existe um rótulo com esse nome, produto e modelo. Confira se não é melhor editar o existente.",
      );
      if (!shouldContinue) return;
    }

    // Sobe o logo (se houver) e usa a URL pública. Se falhar, salva sem o logo.
    let logoUrl: string | undefined;
    if (logoUri) {
      try {
        setUploading(true);
        logoUrl = await uploadLabelLogo(logoUri);
      } catch {
        showAlert({
          title: "Logo não enviado",
          message:
            "Não consegui enviar o logo agora. Vou salvar o rótulo sem ele. Você pode adicionar depois.",
        });
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
      showAlert({
        title: "Rótulo criado!",
        message: "Seu rótulo esta pronto para imprimir",
      });
      onSuccess?.();
    } catch (e) {
      showAlert({
        title: "Erro",
        message:
          e instanceof Error
            ? e.message
            : "Não foi possível criar o rótulo. Tente novamente.",
      });
    }
  }

  async function handleExport() {
    if (!labelData.productName.trim()) {
      alertValidation("Preencha o nome do produto para baixar o rótulo");
      return;
    }
    setExporting(true);
    try {
      await exportLabelPdfWithChoice(labelData, templateId, logoUri, qrUrl);
    } catch {
      alertError("Não foi possível gerar o rótulo. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 20 }}
    >
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
        <View style={{ gap: 12 }}>
          <DateField
            label="Fabricação"
            value={labelData.manufacturingDate ?? ""}
            onChange={handleManufacturingChange}
          />
          <DateField
            label="Validade"
            value={labelData.expirationDate ?? ""}
            onChange={(v) => updateField("expirationDate", v)}
          />
        </View>
        <Input
          label="Validade em dias (opcional)"
          placeholder="Ex: 7, preenche a validade sozinho"
          value={shelfDays}
          onChangeText={handleShelfDaysChange}
          keyboardType="number-pad"
        />
      </FormSection>

      <FormSection
        title="Informação nutricional"
        subtitle="Opcional: tabela de nutrientes"
        icon="nutrition-outline"
      >
        <NutritionFields
          value={labelData.nutrition}
          onChange={(n) => updateField("nutrition", n)}
        />
      </FormSection>

      <FormSection
        title="Estilo do rótulo"
        subtitle="Profissional: cores, fonte, borda e cantos"
        icon="color-palette-outline"
      >
        <LabelStyleEditor
          value={labelData.style}
          onChange={(style) => updateField("style", style)}
          locked={!isPremium}
          onLockedPress={() => {
            if (isPremium) return false;
            showPaywall("labels");
            return true;
          }}
        />
      </FormSection>

      <FormSection
        title="Contato e marca"
        subtitle="Opcional: seu nome, telefone, QR Code e logo"
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
          placeholder="Ex: instagram.com/seunegocio"
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
    </KeyboardAwareScrollView>
  );
}
