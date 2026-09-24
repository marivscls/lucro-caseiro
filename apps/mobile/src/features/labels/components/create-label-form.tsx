import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { CreateProductForm } from "../../products/components/create-product-form";
import { guidanceEvent } from "../../../shared/guidance/guidance-events";
import { useAuth } from "../../../shared/hooks/use-auth";
import { hasActiveFeature, type LabelData } from "@lucro-caseiro/contracts";
import { Button, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
import { FormActions, FormBody } from "../../../shared/components/form-layout";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { uploadLabelLogo } from "../../../shared/utils/upload-image";
import { publicCatalogProductUrl } from "../../catalog/api";
import { useCatalogSettings } from "../../catalog/hooks";
import { useProfile } from "../../subscription/hooks";
import { businessCopyFor } from "../../subscription/business-copy";
import { brToIso } from "../dates";
import { labelPrintedName } from "../domain";
import { exportLabelPdfWithChoice } from "../label-export";
import { useCreateLabel, useLabels } from "../hooks";
import {
  LABEL_FORM_STEPS,
  LabelBrandFields,
  LabelContentFields,
  LabelFormFrame,
  LabelPreviewPanel,
  LabelProductFields,
} from "./label-form-fields";

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
  const { data: profile } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType);
  const showPaywall = usePaywall((state) => state.show);
  const isPremium =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "labelsPremium");
  const guidanceUserId = useAuth((state) => state.userId);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productCreated, setProductCreated] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("classico");
  const [labelData, setLabelData] = useState<LabelData>({ productName: "" });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productId ?? null,
  );
  const [includeQr, setIncludeQr] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [layoutValid, setLayoutValid] = useState(true);
  const [formStep, setFormStep] = useState(1);
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

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [visible]);

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

  const productValidation = useFormValidation(
    {
      name: !name.trim() && "Dê um nome para a etiqueta.",
      selectedProductId: !selectedProductId && "Escolha o produto da etiqueta.",
    },
    visible,
  );
  const contentValidation = useFormValidation(
    {
      productName:
        !labelPrintedName(labelData).trim() && "Informe o nome que será impresso.",
    },
    visible,
  );

  async function handleSubmit() {
    if (!productValidation.validate()) {
      setFormStep(1);
      return;
    }
    if (!contentValidation.validate()) {
      setFormStep(2);
      return;
    }
    if (!selectedProductId) return;
    if (!layoutValid) {
      alertValidation("Confira o tamanho e a quantidade de etiquetas por folha");
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
        message: "Agora você pode imprimir uma unidade ou a folha configurada.",
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
    if (!contentValidation.validate()) {
      setFormStep(2);
      return;
    }
    if (!layoutValid) {
      alertValidation("Confira o tamanho e a quantidade de etiquetas por folha");
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

  function selectProduct(product: { id: string; name: string }) {
    setProductCreated(true);
    setSelectedProductId(product.id);
    updateField("productName", product.name);
    if (!name.trim()) setName(`Etiqueta ${product.name}`);
  }

  function goToStep(step: number) {
    if (step > 1 && formStep === 1 && !productValidation.validate()) return;
    if (step > 2 && formStep <= 2 && !contentValidation.validate()) {
      setFormStep(2);
      return;
    }
    setFormStep(step);
  }

  function stepProps(step: number) {
    const current = formStep === step;
    return {
      style: { display: current ? ("flex" as const) : ("none" as const) },
      accessibilityElementsHidden: !current,
      importantForAccessibility: current
        ? ("auto" as const)
        : ("no-hide-descendants" as const),
    };
  }

  const preview = (
    <LabelPreviewPanel
      data={labelData}
      templateId={templateId}
      logoUrl={logoUri}
      qrUrl={qrUrl}
    />
  );

  const loading = createLabel.isPending || uploading;
  const lastStep = formStep === LABEL_FORM_STEPS.length;

  return (
    <>
      <StandardModal
        title="Nova etiqueta"
        visible={visible && !creatingProduct}
        onClose={onClose}
        wide
        footer={
          <FormActions stack={lastStep}>
            {formStep > 1 ? (
              <Button
                title="Voltar"
                variant="outline"
                disabled={loading}
                onPress={() => setFormStep(formStep - 1)}
              />
            ) : (
              <Button title="Cancelar" variant="outline" onPress={onClose} />
            )}
            {lastStep ? (
              <Button
                title="Baixar / Compartilhar"
                variant="outline"
                icon={
                  <AppIcon
                    name="download-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                }
                onPress={() => void handleExport()}
                loading={exporting}
              />
            ) : null}
            {lastStep ? (
              <Button
                title={uploading ? "Enviando logo..." : "Criar etiqueta"}
                onPress={() => void handleSubmit()}
                loading={loading}
              />
            ) : (
              <Button title="Continuar" onPress={() => goToStep(formStep + 1)} />
            )}
          </FormActions>
        }
      >
        <FormStepProgress
          current={formStep}
          steps={LABEL_FORM_STEPS}
          onStepPress={goToStep}
        />
        <LabelFormFrame preview={preview}>
          <View {...stepProps(1)}>
            <LabelProductFields
              name={name}
              onNameChange={setName}
              namePlaceholder={`Ex: ${experienceCopy.productExample}`}
              nameValidation={productValidation.field("name")}
              productValidation={productValidation.field("selectedProductId")}
              selectedProductId={selectedProductId}
              onSelectProduct={selectProduct}
              onCreateProduct={() => setCreatingProduct(true)}
              productNotice={
                productCreated
                  ? "Produto cadastrado e selecionado. Continue sua etiqueta abaixo."
                  : undefined
              }
              templateId={templateId}
              onTemplateChange={setTemplateId}
              labelData={labelData}
              updateField={updateField}
              onLayoutValidityChange={setLayoutValid}
              locked={!isPremium}
              onLockedPress={() => showPaywall("labels")}
            />
          </View>
          <View {...stepProps(2)}>
            <FormBody>
              {isDesktop ? null : preview}
              <LabelContentFields
                labelData={labelData}
                printedName={labelData.productName}
                updateField={updateField}
                placeholder={`Ex: ${experienceCopy.productExample}`}
                productNameValidation={contentValidation.field("productName")}
              />
            </FormBody>
          </View>
          <View {...stepProps(3)}>
            <LabelBrandFields
              labelData={labelData}
              updateField={updateField}
              businessNamePlaceholder={`Ex: ${experienceCopy.businessNameExample}`}
              logoUri={logoUri}
              onPickLogo={showPicker}
              onRemoveLogo={clearLogo}
              qr={
                catalogSettings && selectedProductId
                  ? {
                      value: includeQr,
                      onChange: setIncludeQr,
                      description: "Abre este produto diretamente no seu catálogo.",
                    }
                  : undefined
              }
              locked={!isPremium}
              onStyleLockedPress={() => {
                if (isPremium) return false;
                showPaywall("labels");
                return true;
              }}
            />
          </View>
        </LabelFormFrame>
      </StandardModal>
      {creatingProduct && visible ? (
        <CreateProductForm
          successFeedback="parent"
          modal={{
            visible: true,
            title: "Produto da etiqueta",
            onClose: () => setCreatingProduct(false),
          }}
          onSuccess={(product) => {
            selectProduct(product);
            setCreatingProduct(false);
            if (guidanceUserId)
              guidanceEvent("labels", "prerequisite_resumed", guidanceUserId);
          }}
        />
      ) : null}
    </>
  );
}
