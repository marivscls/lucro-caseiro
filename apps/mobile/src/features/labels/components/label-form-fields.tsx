import type { LabelData, Product } from "@lucro-caseiro/contracts";
import { Badge, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, Platform, Pressable, Switch, View, type ViewStyle } from "react-native";

import { AppIcon } from "../../../shared/components/app-icon";
import { DateField } from "../../../shared/components/date-field";
import {
  FieldLinkAction,
  FormField,
  TextField,
  fieldMetrics,
  useFieldPalette,
  type FormFieldProps,
} from "../../../shared/components/form-field";
import { FormBody, FormGrid } from "../../../shared/components/form-layout";
import { FormSection } from "../../../shared/components/form-section";
import { desktopSplitLayout } from "../../../shared/layout/desktop-density";
import { DesktopTag } from "../../../shared/layout/desktop-kit";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { LabelLayoutEditor } from "./label-layout-editor";
import { LabelPreview } from "./label-preview";
import { LabelProductPicker } from "./label-product-picker";
import { LabelStyleEditor } from "./label-style-editor";
import { TemplatePicker } from "./template-picker";

/**
 * Peças do formulário de etiqueta, compartilhadas pela criação (em etapas) e
 * pela edição (uma página só), para as duas terem os mesmos grupos e colunas.
 */

type Validation = FormFieldProps["validation"];
type UpdateField = <K extends keyof LabelData>(key: K, value: LabelData[K]) => void;

export const LABEL_FORM_STEPS = [
  { label: "Produto", title: "Produto e modelo" },
  { label: "Conteúdo", title: "Texto e datas" },
  { label: "Marca", title: "Contato e acabamento" },
] as const;

function ProfessionalTag() {
  const isDesktop = useDesktopLayout();
  return isDesktop ? (
    <DesktopTag label="Profissional" variant="premium" strong />
  ) : (
    <Badge label="Profissional" variant="premium" />
  );
}

/** Campos à esquerda e prévia fixa à direita no computador; só campos no celular. */
export function LabelFormFrame({
  children,
  preview,
}: Readonly<{ children: React.ReactNode; preview: React.ReactNode }>) {
  const isDesktop = useDesktopLayout();
  const split = desktopSplitLayout(isDesktop);
  if (!isDesktop) return <View style={{ width: "100%", minWidth: 0 }}>{children}</View>;
  const sticky =
    Platform.OS === "web"
      ? ({ position: "sticky", top: 0, alignSelf: "flex-start" } as unknown as ViewStyle)
      : ({ alignSelf: "flex-start" } as ViewStyle);
  return (
    <View style={split.row}>
      <View style={split.main}>{children}</View>
      <View style={[split.aside, sticky]}>{preview}</View>
    </View>
  );
}

export function LabelPreviewPanel({
  data,
  templateId,
  logoUrl,
  qrUrl,
}: Readonly<{
  data: LabelData;
  templateId: string;
  logoUrl?: string | null;
  qrUrl?: string;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ width: "100%", minWidth: 0, gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Typography variant="h3">Pré-visualização</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Atualiza sozinha conforme você preenche.
        </Typography>
      </View>
      <LabelPreview
        data={data}
        templateId={templateId}
        logoUrl={logoUrl}
        qrUrl={qrUrl}
        scale={1.1}
      />
    </View>
  );
}

function LabelNotice() {
  const { theme } = useTheme();
  return (
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
  );
}

/** Etapa 1: nome, produto, modelo e formato de impressão. */
export function LabelProductFields({
  name,
  onNameChange,
  namePlaceholder,
  nameValidation,
  productValidation,
  selectedProductId,
  onSelectProduct,
  onCreateProduct,
  productNotice,
  templateId,
  onTemplateChange,
  labelData,
  updateField,
  onLayoutValidityChange,
  locked,
  onLockedPress,
}: Readonly<{
  name: string;
  onNameChange: (value: string) => void;
  namePlaceholder?: string;
  nameValidation: Validation;
  productValidation: Validation;
  selectedProductId: string | null;
  onSelectProduct: (product: Product) => void;
  onCreateProduct?: () => void;
  productNotice?: string;
  templateId: string;
  onTemplateChange: (templateId: string) => void;
  labelData: LabelData;
  updateField: UpdateField;
  onLayoutValidityChange: (valid: boolean) => void;
  locked: boolean;
  onLockedPress: () => void;
}>) {
  return (
    <FormBody>
      <LabelNotice />
      <FormField label="Nome da etiqueta" validation={nameValidation}>
        <TextField
          placeholder={namePlaceholder}
          accessibilityLabel="Nome da etiqueta"
          value={name}
          onChangeText={onNameChange}
        />
      </FormField>
      {productNotice ? (
        <Typography variant="body" accessibilityLiveRegion="polite">
          {productNotice}
        </Typography>
      ) : null}
      <FormField validation={productValidation}>
        <LabelProductPicker
          onCreate={onCreateProduct}
          selectedId={selectedProductId}
          onSelect={onSelectProduct}
        />
      </FormField>
      <TemplatePicker selected={templateId} onSelect={onTemplateChange} />
      <FormSection
        title="Formato de impressão"
        subtitle="Tamanho exato e quantidade na folha A4"
        titleAccessory={<ProfessionalTag />}
      >
        <LabelLayoutEditor
          value={labelData.layout}
          onChange={(layout) => updateField("layout", layout)}
          onValidityChange={onLayoutValidityChange}
          locked={locked}
          onLockedPress={onLockedPress}
        />
      </FormSection>
    </FormBody>
  );
}

/** Etapa 2: o que vai impresso (nome, observação e datas). */
export function LabelContentFields({
  labelData,
  printedName,
  updateField,
  placeholder,
  productNameValidation,
}: Readonly<{
  labelData: LabelData;
  printedName: string;
  updateField: UpdateField;
  placeholder?: string;
  productNameValidation: Validation;
}>) {
  return (
    <FormBody>
      <FormSection collapsible={false} title="Texto da etiqueta">
        <FormGrid>
          <FormField
            label="Nome que será impresso"
            span="full"
            validation={productNameValidation}
          >
            <TextField
              placeholder={placeholder}
              accessibilityLabel="Nome que será impresso"
              value={printedName}
              onChangeText={(value) => updateField("productName", value)}
            />
          </FormField>
          <FormField label="Observação" optional span="full">
            <TextField
              placeholder="Ex: Manter refrigerado"
              accessibilityLabel="Observação"
              value={labelData.note ?? ""}
              onChangeText={(value) => updateField("note", value)}
              multiline
            />
          </FormField>
        </FormGrid>
      </FormSection>
      <FormSection
        collapsible={false}
        title="Datas"
        subtitle="Opcional: imprima a produção e a validade."
      >
        <FormGrid minColumnWidth={200}>
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
        </FormGrid>
      </FormSection>
    </FormBody>
  );
}

function LogoField({
  logoUri,
  onPick,
  onRemove,
}: Readonly<{ logoUri: string | null; onPick: () => void; onRemove: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <FormField
      label="Logo do negócio"
      optional
      labelAction={
        logoUri ? (
          <FieldLinkAction label="Remover logo" icon="trash-outline" onPress={onRemove} />
        ) : undefined
      }
    >
      <Pressable
        onPress={onPick}
        accessibilityRole="button"
        accessibilityLabel={
          logoUri ? "Trocar logo do negócio" : "Adicionar logo do negócio"
        }
        style={({ pressed }) => ({
          width: 88,
          height: 88,
          borderRadius: fieldMetrics.radius,
          borderWidth: 1,
          borderStyle: logoUri ? "solid" : "dashed",
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={{ width: 88, height: 88 }} />
        ) : (
          <AppIcon name="image-outline" size={24} color={theme.colors.textSecondary} />
        )}
      </Pressable>
    </FormField>
  );
}

/** Etapa 3: contato, logo, QR e personalização. */
export function LabelBrandFields({
  labelData,
  updateField,
  businessNamePlaceholder,
  logoUri,
  onPickLogo,
  onRemoveLogo,
  qr,
  locked,
  onStyleLockedPress,
}: Readonly<{
  labelData: LabelData;
  updateField: UpdateField;
  businessNamePlaceholder?: string;
  logoUri: string | null;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  /** Só aparece quando há catálogo (ou um QR já salvo). */
  qr?: { value: boolean; onChange: (value: boolean) => void; description: string };
  locked: boolean;
  onStyleLockedPress: () => boolean;
}>) {
  const { theme } = useTheme();
  return (
    <FormBody>
      <FormSection
        collapsible={false}
        title="Contato e marca"
        subtitle="Opcional: nome, telefone, logo e catálogo."
      >
        <FormGrid minColumnWidth={200}>
          <FormField label="Seu nome ou do negócio" optional>
            <TextField
              placeholder={businessNamePlaceholder}
              accessibilityLabel="Seu nome ou do negócio"
              value={labelData.producerName ?? ""}
              onChangeText={(value) => updateField("producerName", value)}
            />
          </FormField>
          <FormField label="Telefone" optional>
            <TextField
              placeholder="(11) 99999-9999"
              accessibilityLabel="Telefone"
              value={labelData.producerPhone ?? ""}
              onChangeText={(value) => updateField("producerPhone", maskPhoneBR(value))}
              keyboardType="phone-pad"
            />
          </FormField>
          <LogoField logoUri={logoUri} onPick={onPickLogo} onRemove={onRemoveLogo} />
        </FormGrid>
        {qr ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="desktopFieldLabel" color={theme.colors.text}>
                Incluir QR Code do catálogo
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {qr.description}
              </Typography>
            </View>
            <Switch
              value={qr.value}
              onValueChange={qr.onChange}
              accessibilityLabel="Incluir QR Code do catálogo"
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        ) : null}
      </FormSection>

      <FormSection
        title="Personalizar"
        subtitle="Cores, borda e cantos"
        titleAccessory={<ProfessionalTag />}
      >
        <LabelStyleEditor
          value={labelData.style}
          onChange={(style) => updateField("style", style)}
          locked={locked}
          onLockedPress={onStyleLockedPress}
        />
      </FormSection>
    </FormBody>
  );
}
