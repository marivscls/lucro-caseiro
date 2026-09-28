import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type {
  CreateSupplier,
  Supplier,
  SupplierCategory,
} from "@lucro-caseiro/contracts";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import type { ImagePickerAsset } from "expo-image-picker";
import React, { useState } from "react";
import { Image, Platform, Pressable, Switch, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  ChoiceField,
  FormField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormBody, FormGrid } from "../../../shared/components/form-layout";
import { FormSection } from "../../../shared/components/form-section";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { digitsOnly } from "../../../shared/utils/duplicates";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { uploadSupplierImage } from "../../../shared/utils/upload-image";
import {
  SUPPLIER_CATEGORY_LABELS,
  supplierImageValidationError,
  validateSupplierForm,
} from "../domain";
import {
  supplierPresetAfterCategoryChange,
  supplierPresets,
} from "../illustration-presets";
import { SupplierIllustration } from "./supplier-illustration";

type SubmitData = CreateSupplier;

export type SupplierFormHandle = { submit: () => Promise<void> };

type SupplierFormProps = Readonly<{
  supplier?: Supplier;
  onSubmit: (data: SubmitData) => Promise<void>;
  disabled?: boolean;
  onSubmittingChange?: (submitting: boolean) => void;
}>;

function selectedFile(asset: ImagePickerAsset): Blob | undefined {
  return asset.file ?? undefined;
}

function localPreviewFor(asset: ImagePickerAsset): {
  uri: string;
  objectUrl: string | null;
} {
  return { uri: asset.uri, objectUrl: null };
}

const CATEGORY_OPTIONS = (
  Object.entries(SUPPLIER_CATEGORY_LABELS) as [SupplierCategory, string][]
).map(([value, label]) => ({ value, label }));

function interactionOpacity(
  disabled: boolean,
  pressed: boolean,
  pressedOpacity = 0.72,
): number {
  if (disabled) return 0.55;
  return pressed ? pressedOpacity : 1;
}

/** Chave "tem WhatsApp", na linha inteira do `FormGrid`. */
function WhatsAppToggle({
  value,
  onChange,
  disabled,
}: Readonly<{
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
  /** Lido pelo `FormGrid`. */
  span?: "full";
}>) {
  const { theme } = useTheme();
  const colors = useBrandScreenPalette();
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <Pressable
        onPress={() => onChange(!value)}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityLabel="Tem WhatsApp"
        accessibilityState={{ checked: value, disabled }}
        style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
      >
        <Typography variant="bodyBold">Esse número tem WhatsApp</Typography>
      </Pressable>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel="Alternar WhatsApp"
        trackColor={{ false: theme.colors.border, true: colors.rose }}
        thumbColor={theme.colors.surfaceElevated}
      />
    </View>
  );
}

export const SupplierForm = React.forwardRef<SupplierFormHandle, SupplierFormProps>(
  function SupplierForm(
    { supplier, onSubmit, disabled = false, onSubmittingChange },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useBrandScreenPalette();
    const pal = useFieldPalette();
    const picker = useImagePicker();
    const initialCategory = supplier?.category ?? "supplies";
    let initialPreset: string | null = null;
    if (supplier?.avatarType === "preset") initialPreset = supplier.avatarPresetId;
    if (!supplier) initialPreset = supplierPresets(initialCategory)[0]?.id ?? null;

    const [name, setName] = useState(supplier?.name ?? "");
    const [category, setCategory] = useState<SupplierCategory>(initialCategory);
    const [phone, setPhone] = useState(maskPhoneBR(supplier?.phone ?? ""));
    const [hasWhatsApp, setHasWhatsApp] = useState(supplier?.hasWhatsApp ?? false);
    const [email, setEmail] = useState(supplier?.email ?? "");
    const [address, setAddress] = useState(supplier?.address ?? "");
    const [purchaseDescription, setPurchaseDescription] = useState(
      supplier?.purchaseDescription ?? "",
    );
    const [isPreferred, setIsPreferred] = useState(supplier?.isPreferred ?? false);
    const [avatarPresetId, setAvatarPresetId] = useState<string | null>(initialPreset);
    const [uploadUri, setUploadUri] = useState(
      supplier?.avatarType === "upload" ? supplier.avatarUrl : null,
    );
    const [uploadFile, setUploadFile] = useState<Blob | undefined>();
    const [uploadMimeType, setUploadMimeType] = useState<string | undefined>();
    const [uploadIsLocal, setUploadIsLocal] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const submitLock = React.useRef(false);
    const localObjectUrl = React.useRef<string | null>(null);

    const presets = supplierPresets(category);
    const controlsDisabled = disabled || submitting;

    const releaseLocalObjectUrl = React.useCallback(() => {
      if (localObjectUrl.current && typeof URL !== "undefined") {
        URL.revokeObjectURL(localObjectUrl.current);
        localObjectUrl.current = null;
      }
    }, []);

    React.useEffect(() => releaseLocalObjectUrl, [releaseLocalObjectUrl]);

    function setBusy(value: boolean) {
      setSubmitting(value);
      onSubmittingChange?.(value);
    }

    function clearUpload() {
      releaseLocalObjectUrl();
      setUploadUri(null);
      setUploadFile(undefined);
      setUploadMimeType(undefined);
      setUploadIsLocal(false);
    }

    function chooseCategory(next: SupplierCategory) {
      if (controlsDisabled) return;
      setCategory(next);
      if (uploadUri) return;
      setAvatarPresetId(supplierPresetAfterCategoryChange(next, avatarPresetId, false));
    }

    async function pickImage() {
      if (controlsDisabled) return;
      setImageError(null);
      const asset = await picker.pickFromGalleryAsset({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.82,
      });
      if (!asset) return;
      const validationError = supplierImageValidationError(asset);
      if (validationError) {
        setImageError(validationError);
        return;
      }

      const file = selectedFile(asset);
      releaseLocalObjectUrl();
      const preview = localPreviewFor(asset);
      localObjectUrl.current = preview.objectUrl;
      setUploadUri(preview.uri);
      setUploadFile(file);
      setUploadMimeType(asset.mimeType ?? undefined);
      setUploadIsLocal(true);
      setAvatarPresetId(null);
    }

    const fieldErrors = validateSupplierForm({
      name,
      category,
      phone,
      hasWhatsApp,
      email,
    });
    const formValidation = useFormValidation({
      name: fieldErrors.name,
      phone: fieldErrors.phone,
      email: fieldErrors.email,
    });

    async function handleSubmit() {
      if (!formValidation.validate()) return;
      if (Object.keys(fieldErrors).length > 0 || submitLock.current) return;

      submitLock.current = true;
      setBusy(true);
      try {
        let avatarUrl = uploadUri;
        if (uploadUri && uploadIsLocal) {
          try {
            avatarUrl = await uploadSupplierImage(uploadUri, uploadFile, uploadMimeType);
            releaseLocalObjectUrl();
            setUploadUri(avatarUrl);
            setUploadFile(undefined);
            setUploadMimeType(undefined);
            setUploadIsLocal(false);
          } catch (error) {
            setImageError(
              error instanceof Error
                ? error.message
                : "Não foi possível enviar a imagem.",
            );
            return;
          }
        }

        let avatarType: CreateSupplier["avatarType"] = "initials";
        if (avatarPresetId) avatarType = "preset";
        if (avatarUrl) avatarType = "upload";

        await onSubmit({
          name: name.trim(),
          category,
          phone: phone.trim() ? digitsOnly(phone) : null,
          hasWhatsApp,
          email: email.trim() || null,
          address: address.trim() || null,
          purchaseDescription: purchaseDescription.trim() || null,
          isPreferred,
          avatarType,
          avatarPresetId: avatarType === "preset" ? avatarPresetId : null,
          avatarUrl: avatarType === "upload" ? avatarUrl : null,
          needsFollowUp: supplier?.needsFollowUp ?? false,
          restockSoon: supplier?.restockSoon ?? false,
          notes: supplier?.notes ?? null,
        });
      } finally {
        submitLock.current = false;
        setBusy(false);
      }
    }

    React.useImperativeHandle(ref, () => ({ submit: handleSubmit }));

    return (
      <FormBody>
        <FormSection
          collapsible={false}
          title="Identificação"
          subtitle="Nome e categoria para encontrar seu fornecedor."
        >
          <FormField label="Nome do fornecedor" validation={formValidation.field("name")}>
            <TextField
              icon="business-outline"
              placeholder="Ex.: Distribuidora Central"
              value={name}
              onChangeText={setName}
              maxLength={200}
              autoFocus={Platform.OS === "web"}
              editable={!controlsDisabled}
              accessibilityLabel="Nome do fornecedor"
            />
          </FormField>

          <FormField label="Categoria">
            <ChoiceField
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={chooseCategory}
              accessibilityLabel="Categoria do fornecedor"
            />
          </FormField>

          <FormField
            label="Imagem do fornecedor"
            optional
            hint={`Sugestões para ${SUPPLIER_CATEGORY_LABELS[category]}`}
          >
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {presets.map((preset) => {
                  const selected = !uploadUri && avatarPresetId === preset.id;
                  return (
                    <Pressable
                      key={preset.id}
                      onPress={() => {
                        clearUpload();
                        setAvatarPresetId(preset.id);
                        setImageError(null);
                      }}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={preset.label}
                      accessibilityState={{ selected, disabled: controlsDisabled }}
                      aria-pressed={selected}
                      style={({ pressed }) => ({
                        flexBasis: "30%",
                        flexGrow: 1,
                        height: fieldMetrics.height,
                        flexShrink: 0,
                        borderRadius: fieldMetrics.radius,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? theme.colors.primaryStrong : pal.border,
                        backgroundColor:
                          theme.mode === "dark"
                            ? theme.colors.surfaceElevated
                            : preset.backgroundColor,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: interactionOpacity(controlsDisabled, pressed),
                      })}
                    >
                      <SupplierIllustration
                        name={preset.illustration}
                        size={26}
                        color={theme.colors.primaryStrong}
                      />
                      {selected ? (
                        <View
                          accessibilityLabel="Selecionada"
                          style={{
                            position: "absolute",
                            right: -3,
                            top: -3,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: colors.rose,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: colors.onWine,
                          }}
                        >
                          <AppIcon
                            name="checkmark"
                            size={12}
                            color={colors.onRose}
                            strokeWidth={3}
                          />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => {
                  void pickImage();
                }}
                disabled={controlsDisabled}
                accessibilityRole="button"
                accessibilityLabel={
                  uploadUri
                    ? "Substituir imagem do fornecedor"
                    : "Enviar imagem do fornecedor"
                }
                accessibilityState={{ selected: !!uploadUri, disabled: controlsDisabled }}
                style={({ pressed }) => ({
                  minHeight: fieldMetrics.height,
                  flexDirection: "row",
                  paddingHorizontal: fieldMetrics.paddingX,
                  paddingVertical: spacing.xs,
                  borderRadius: fieldMetrics.radius,
                  borderWidth: 1,
                  borderStyle: uploadUri ? "solid" : "dashed",
                  borderColor: pal.border,
                  backgroundColor: pal.fieldBg,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.md,
                  overflow: "hidden",
                  opacity: interactionOpacity(controlsDisabled, pressed),
                })}
              >
                {uploadUri ? (
                  <>
                    <Image
                      source={{ uri: uploadUri }}
                      resizeMode="cover"
                      accessibilityLabel="Pré-visualização da imagem do fornecedor"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radii.sm,
                        borderWidth: 1,
                        borderColor: pal.border,
                      }}
                    />
                    <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                      Trocar foto
                    </Typography>
                  </>
                ) : (
                  <>
                    <AppIcon
                      name="cloud-upload-outline"
                      size={fieldMetrics.iconSize}
                      color={pal.icon}
                    />
                    <Typography variant="bodyBold" color={theme.colors.text}>
                      Enviar foto
                    </Typography>
                  </>
                )}
              </Pressable>
              {uploadUri ? (
                <Button
                  title="Remover imagem"
                  variant="text"
                  size="sm"
                  accessibilityLabel="Remover imagem do fornecedor"
                  disabled={controlsDisabled}
                  onPress={() => {
                    clearUpload();
                    setAvatarPresetId(null);
                    setImageError(null);
                  }}
                  style={{ alignSelf: "flex-start" }}
                />
              ) : null}
              {imageError ? (
                <Typography
                  variant="caption"
                  color={theme.colors.alert}
                  accessibilityLiveRegion="assertive"
                >
                  {imageError}
                </Typography>
              ) : null}
            </View>
          </FormField>
        </FormSection>

        <FormSection
          collapsible={false}
          title="Contato"
          subtitle="Preencha os canais que você usa para fazer pedidos."
        >
          <FormGrid>
            <FormField
              label="Telefone / WhatsApp"
              optional
              validation={formValidation.field("phone")}
            >
              <TextField
                icon="call-outline"
                accessibilityLabel="Telefone / WhatsApp"
                placeholder="Ex.: (11) 99999-9999"
                value={phone}
                onChangeText={(value) => {
                  const masked = maskPhoneBR(value);
                  setPhone(masked);
                  if (!digitsOnly(masked)) setHasWhatsApp(false);
                }}
                keyboardType="phone-pad"
                editable={!controlsDisabled}
              />
            </FormField>
            <FormField label="Email" optional validation={formValidation.field("email")}>
              <TextField
                icon="mail-outline"
                accessibilityLabel="Email"
                placeholder="Ex.: contato@fornecedor.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={200}
                editable={!controlsDisabled}
              />
            </FormField>
            <WhatsAppToggle
              span="full"
              value={hasWhatsApp}
              onChange={setHasWhatsApp}
              disabled={controlsDisabled}
            />
            <FormField label="Endereço" optional span="full">
              <TextField
                icon="location-outline"
                accessibilityLabel="Endereço"
                placeholder="Ex.: Rua das Flores, 123"
                value={address}
                onChangeText={setAddress}
                maxLength={500}
                editable={!controlsDisabled}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection collapsible={false} title="Suas compras">
          <FormField label="O que você compra aqui?" optional>
            <TextField
              accessibilityLabel="O que você compra aqui?"
              placeholder="Ex.: farinha, chocolate e embalagens"
              value={purchaseDescription}
              onChangeText={setPurchaseDescription}
              maxLength={500}
              editable={!controlsDisabled}
              multiline
            />
          </FormField>

          <Pressable
            onPress={() => setIsPreferred((value) => !value)}
            disabled={controlsDisabled}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isPreferred, disabled: controlsDisabled }}
            style={({ pressed }) => ({
              minHeight: fieldMetrics.height,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: interactionOpacity(controlsDisabled, pressed),
              paddingHorizontal: fieldMetrics.paddingX - (isPreferred ? 1 : 0),
              borderRadius: fieldMetrics.radius,
              borderWidth: isPreferred ? 2 : 1,
              borderColor: isPreferred ? theme.colors.primaryStrong : pal.border,
              backgroundColor: isPreferred ? theme.colors.primaryBg : pal.fieldBgFocus,
            })}
          >
            <AppIcon
              name={isPreferred ? "checkbox" : "square-outline"}
              size={fieldMetrics.iconSize}
              color={isPreferred ? theme.colors.primaryStrong : pal.icon}
            />
            <Typography
              variant="bodyBold"
              color={isPreferred ? theme.colors.primaryStrong : theme.colors.text}
              style={{ flex: 1 }}
            >
              Marcar como fornecedor preferido
            </Typography>
          </Pressable>
        </FormSection>

        {submitting ? (
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            accessibilityLiveRegion="polite"
          >
            Salvando fornecedor…
          </Typography>
        ) : null}
      </FormBody>
    );
  },
);
