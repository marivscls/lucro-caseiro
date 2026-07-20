import { hasActiveFeature, type LabelData } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Image, Platform, Pressable, Switch, View, type ViewStyle } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { DateField } from "../../../shared/components/date-field";
import { FormSection } from "../../../shared/components/form-section";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { uploadLabelLogo } from "../../../shared/utils/upload-image";
import { publicCatalogProductUrl } from "../../catalog/api";
import { useCatalogSettings } from "../../catalog/hooks";
import { useProfile } from "../../subscription/hooks";
import { brToIso } from "../dates";
import { exportLabelPdfWithChoice } from "../label-export";
import { useCreateLabel, useLabels } from "../hooks";
import { LabelPreview } from "./label-preview";
import { LabelProductPicker } from "./label-product-picker";
import { LabelStyleEditor } from "./label-style-editor";
import { TemplatePicker } from "./template-picker";

interface CreateLabelFormProps {
  productId?: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLabelForm({
  productId,
  visible,
  onClose,
  onSuccess,
}: Readonly<CreateLabelFormProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const previewRailSticky =
    Platform.OS === "web"
      ? ({ position: "sticky", top: 0, alignSelf: "flex-start" } as unknown as ViewStyle)
      : ({ alignSelf: "flex-start" } as ViewStyle);
  const { data: profile } = useProfile();
  const showPaywall = usePaywall((state) => state.show);
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "labelsPremium");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({ productName: "" });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId ?? null,
  );
  const [includeQr, setIncludeQr] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { imageUri: logoUri, showPicker, clear: clearLogo } = useImagePicker();
  const { data: catalogSettings } = useCatalogSettings();
  const qrUrl =
    includeQr && catalogSettings && selectedProductId
      ? publicCatalogProductUrl(catalogSettings.slug, selectedProductId)
      : undefined;
  const createLabel = useCreateLabel();
  const { data: labelsData } = useLabels(
    selectedProductId ? { productId: selectedProductId } : undefined,
  );

  function updateField<K extends keyof LabelData>(key: K, value: LabelData[K]) {
    setLabelData((previous) => ({ ...previous, [key]: value }));
  }

  function validateDates(): {
    manufacturingDate?: string;
    expirationDate?: string;
  } | null {
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
      return null;
    }
    if (manufacturingDate && expirationDate && expirationDate < manufacturingDate) {
      showAlert({
        title: "Datas invertidas",
        message: "A validade não pode ser anterior à data de produção.",
      });
      return null;
    }
    return { manufacturingDate, expirationDate };
  }

  async function uploadLogo(): Promise<string | undefined> {
    if (!logoUri) return undefined;
    try {
      setUploading(true);
      return await uploadLabelLogo(logoUri);
    } catch {
      showAlert({
        title: "Logo não enviado",
        message:
          "Não consegui enviar o logo agora. Vou salvar a etiqueta sem ele. Você pode adicionar depois.",
      });
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      alertValidation("Dê um nome para a etiqueta");
      return;
    }
    if (!selectedProductId) {
      alertValidation("Escolha o produto da etiqueta");
      return;
    }
    if (!labelData.productName.trim()) {
      alertValidation("Preencha o nome que será impresso");
      return;
    }
    const dates = validateDates();
    if (!dates) return;

    const duplicatedLabel = labelsData?.items.some(
      (label) =>
        duplicateKey(label.name) === duplicateKey(name) &&
        label.templateId === templateId &&
        label.productId === selectedProductId,
    );
    if (duplicatedLabel) {
      const shouldContinue = await confirmPossibleDuplicate(
        "Etiqueta parecida",
        "Já existe uma etiqueta com esse nome, produto e modelo. Confira se não é melhor editar a existente.",
      );
      if (!shouldContinue) return;
    }

    const logoUrl = await uploadLogo();
    try {
      await createLabel.mutateAsync({
        name: name.trim(),
        templateId,
        productId: selectedProductId,
        logoUrl,
        qrCodeUrl: qrUrl,
        data: { ...labelData, ...dates },
      });
      showAlert({
        title: "Etiqueta criada!",
        message: "Agora você pode imprimir uma unidade ou uma folha completa.",
      });
      onSuccess?.();
    } catch (error) {
      showAlert({
        title: "Erro",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível criar a etiqueta. Tente novamente.",
      });
    }
  }

  async function handleExport() {
    if (!labelData.productName.trim()) {
      alertValidation("Preencha o nome que será impresso");
      return;
    }
    const dates = validateDates();
    if (!dates) return;
    setExporting(true);
    try {
      await exportLabelPdfWithChoice(
        { ...labelData, ...dates },
        templateId,
        logoUri,
        qrUrl,
      );
    } catch {
      alertError("Não foi possível gerar a etiqueta. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  const previewBlock = (
    <View style={{ width: "100%", minWidth: 0, gap: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Typography variant="h3">Pré-visualização</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Atualiza sozinha conforme você preenche.
        </Typography>
      </View>
      <LabelPreview
        data={labelData}
        templateId={templateId}
        logoUrl={logoUri}
        qrUrl={qrUrl}
        scale={1.1}
      />
    </View>
  );

  return (
    <StandardModal
      title="Nova etiqueta"
      visible={visible}
      onClose={onClose}
      wide
      footer={
        <View
          style={{
            flex: 1,
            flexDirection: isDesktop ? "row" : "column",
            gap: spacing.md,
          }}
        >
          <Button
            title="Baixar / Compartilhar"
            variant="outline"
            size="lg"
            compact
            icon={
              <AppIcon name="download-outline" size={20} color={theme.colors.primary} />
            }
            onPress={() => void handleExport()}
            loading={exporting}
            style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
          />
          <Button
            title={uploading ? "Enviando logo..." : "Criar etiqueta"}
            size="lg"
            compact
            onPress={() => void handleSubmit()}
            loading={createLabel.isPending || uploading}
            style={isDesktop ? { flex: 1 } : { alignSelf: "stretch" }}
          />
        </View>
      }
    >
      <View
        style={{
          width: "100%",
          minWidth: 0,
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? spacing["2xl"] : spacing.xl,
          alignItems: "flex-start",
        }}
      >
        <View
          style={[
            {
              minWidth: 0,
              alignSelf: "stretch",
              gap: isDesktop ? spacing["3xl"] : spacing["2xl"],
            },
            isDesktop ? { flex: 1 } : { width: "100%" },
          ]}
        >
          <View
            style={{
              borderRadius: radii.md,
              backgroundColor: theme.colors.surface,
              padding: spacing.md,
            }}
          >
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Etiqueta para identificar seu produto. Não substitui a rotulagem obrigatória
              quando aplicável.
            </Typography>
          </View>

          <Input
            label="Nome da etiqueta"
            placeholder="Ex: Brigadeiro tradicional"
            value={name}
            onChangeText={setName}
          />

          <LabelProductPicker
            selectedId={selectedProductId}
            onSelect={(product) => {
              setSelectedProductId(product.id);
              updateField("productName", product.name);
              if (!name.trim()) setName(`Etiqueta ${product.name}`);
            }}
          />

          <TemplatePicker selected={templateId} onSelect={setTemplateId} />
          {!isDesktop ? previewBlock : null}

          <Input
            label="Nome que será impresso"
            placeholder="Ex: Bolo de cenoura"
            value={labelData.productName}
            onChangeText={(value) => updateField("productName", value)}
          />
          <Input
            label="Observação (opcional)"
            placeholder="Ex: Manter refrigerado"
            value={labelData.note ?? ""}
            onChangeText={(value) => updateField("note", value)}
            multiline
            numberOfLines={3}
            style={{
              height: 88,
              lineHeight: 24,
              paddingTop: spacing["3xl"],
              paddingBottom: spacing["3xl"],
              textAlignVertical: "center",
            }}
          />

          <FormSection
            title="Datas (opcional)"
            subtitle="Imprima a produção e a validade se quiser"
            icon="calendar-outline"
          >
            <View style={{ gap: spacing.md }}>
              <DateField
                label="Feito em"
                value={labelData.manufacturingDate ?? ""}
                onChange={(value) => updateField("manufacturingDate", value)}
              />
              <DateField
                label="Validade"
                value={labelData.expirationDate ?? ""}
                onChange={(value) => updateField("expirationDate", value)}
              />
            </View>
          </FormSection>

          <FormSection
            title="Contato e marca"
            subtitle="Opcional: nome, telefone, logo e catálogo"
            icon="person-circle-outline"
          >
            <Input
              label="Seu nome / nome do negócio"
              placeholder="Ex: Doces da Maria"
              value={labelData.producerName ?? ""}
              onChangeText={(value) => updateField("producerName", value)}
            />
            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={labelData.producerPhone ?? ""}
              onChangeText={(value) => updateField("producerPhone", maskPhoneBR(value))}
              keyboardType="phone-pad"
            />
            <View>
              <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
                Logo do negócio (opcional)
              </Typography>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
              >
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
                    <AppIcon
                      name="image-outline"
                      size={28}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </Pressable>
                {logoUri ? (
                  <Pressable onPress={clearLogo} hitSlop={8}>
                    <Typography variant="caption" color={theme.colors.primary}>
                      Remover logo
                    </Typography>
                  </Pressable>
                ) : null}
              </View>
            </View>
            {catalogSettings && selectedProductId ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">Incluir QR Code do catálogo</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Abre este produto diretamente no seu catálogo.
                  </Typography>
                </View>
                <Switch
                  value={includeQr}
                  onValueChange={setIncludeQr}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                />
              </View>
            ) : null}
          </FormSection>

          <FormSection
            title="Personalizar"
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
        </View>

        {isDesktop ? (
          <View style={[{ width: 360, flexShrink: 0 }, previewRailSticky]}>
            {previewBlock}
          </View>
        ) : null}
      </View>
    </StandardModal>
  );
}
