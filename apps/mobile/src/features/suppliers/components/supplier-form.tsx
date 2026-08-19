import type {
  CreateSupplier,
  Supplier,
  SupplierCategory,
} from "@lucro-caseiro/contracts";
import { Input, Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import type { ImagePickerAsset } from "expo-image-picker";
import React, { useState } from "react";
import { Image, Platform, Pressable, ScrollView, Switch, View } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { showAlert } from "../../../shared/components/alert-store";
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

function interactionOpacity(
  disabled: boolean,
  pressed: boolean,
  pressedOpacity = 0.72,
): number {
  if (disabled) return 0.55;
  return pressed ? pressedOpacity : 1;
}

export const SupplierForm = React.forwardRef<SupplierFormHandle, SupplierFormProps>(
  function SupplierForm(
    { supplier, onSubmit, disabled = false, onSubmittingChange },
    ref,
  ) {
    const { theme } = useTheme();
    const colors = useBrandScreenPalette();
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
    const [errors, setErrors] = useState<ReturnType<typeof validateSupplierForm>>({});
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
      setCategory(next);
      setErrors((current) => ({ ...current, category: undefined }));
      if (uploadUri) return;
      setAvatarPresetId(supplierPresetAfterCategoryChange(next, avatarPresetId, false));
    }

    function openCategoryPicker() {
      if (controlsDisabled) return;
      showAlert({
        title: "Categoria",
        message: "Escolha a categoria do fornecedor.",
        buttons: [
          ...Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => ({
            text: label,
            onPress: () => chooseCategory(value as SupplierCategory),
          })),
          { text: "Cancelar", style: "cancel" as const },
        ],
      });
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

    async function handleSubmit() {
      const nextErrors = validateSupplierForm({
        name,
        category,
        phone,
        hasWhatsApp,
        email,
      });
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0 || submitLock.current) return;

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
      <View style={{ gap: spacing.xl }}>
        <Input
          label="Nome do fornecedor"
          placeholder="Ex.: Distribuidora Central"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
          maxLength={200}
          autoFocus={Platform.OS === "web"}
          editable={!controlsDisabled}
          accessibilityLabel="Nome do fornecedor"
        />

        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption" style={{ fontFamily: fonts.semiBold }}>
            Categoria
          </Typography>
          <Pressable
            onPress={openCategoryPicker}
            disabled={controlsDisabled}
            accessibilityRole="button"
            accessibilityLabel={`Categoria: ${SUPPLIER_CATEGORY_LABELS[category]}`}
            accessibilityHint="Abre as opções de categoria"
            style={({ pressed }) => ({
              minHeight: 52,
              borderRadius: radii.lg,
              borderWidth: errors.category ? 2 : 1,
              borderColor: errors.category ? theme.colors.alert : theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
              paddingHorizontal: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
              opacity: interactionOpacity(controlsDisabled, pressed, 0.75),
            })}
          >
            <Typography variant="body" style={{ flex: 1 }}>
              {SUPPLIER_CATEGORY_LABELS[category]}
            </Typography>
            <AppIcon name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Pressable>
          {errors.category ? (
            <Typography variant="caption" color={theme.colors.alert}>
              {errors.category}
            </Typography>
          ) : null}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Typography variant="caption" style={{ fontFamily: fonts.semiBold }}>
            Imagem do fornecedor (opcional)
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            accessibilityLiveRegion="polite"
          >
            Sugestões para {SUPPLIER_CATEGORY_LABELS[category]}
          </Typography>
          <ScrollView
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0, alignSelf: "stretch", height: 72 }}
            contentContainerStyle={{
              gap: 10,
              paddingTop: 2,
              paddingRight: spacing.xl,
              paddingBottom: 2,
            }}
          >
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
                    width: 68,
                    height: 68,
                    flexShrink: 0,
                    borderRadius: radii.lg,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? colors.rose : theme.colors.border,
                    backgroundColor: preset.backgroundColor,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: interactionOpacity(controlsDisabled, pressed),
                  })}
                >
                  <SupplierIllustration name={preset.illustration} />
                  {selected ? (
                    <View
                      accessibilityLabel="Selecionada"
                      style={{
                        position: "absolute",
                        right: -4,
                        top: -4,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
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
                        color={colors.onWine}
                        strokeWidth={3}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
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
                width: 68,
                height: 68,
                flexShrink: 0,
                borderRadius: radii.lg,
                borderWidth: uploadUri ? 2 : 1,
                borderColor: uploadUri ? colors.rose : theme.colors.border,
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
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
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      right: 2,
                      top: 2,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
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
                      color={colors.onWine}
                      strokeWidth={3}
                    />
                  </View>
                </>
              ) : (
                <>
                  <AppIcon name="cloud-upload-outline" size={23} color={colors.muted} />
                  <Typography variant="caption">Enviar</Typography>
                </>
              )}
            </Pressable>
          </ScrollView>
          {uploadUri ? (
            <Pressable
              onPress={() => {
                clearUpload();
                setAvatarPresetId(null);
                setImageError(null);
              }}
              disabled={controlsDisabled}
              accessibilityRole="button"
              accessibilityLabel="Remover imagem do fornecedor"
              style={({ pressed }) => ({
                minHeight: 44,
                alignSelf: "flex-start",
                justifyContent: "center",
                opacity: interactionOpacity(controlsDisabled, pressed),
              })}
            >
              <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                Remover imagem
              </Typography>
            </Pressable>
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
          <Typography variant="caption">
            A categoria define as sugestões exibidas.
          </Typography>
        </View>

        <Input
          label="Telefone / WhatsApp (opcional)"
          placeholder="Ex.: (11) 99999-9999"
          value={phone}
          onChangeText={(value) => {
            const masked = maskPhoneBR(value);
            setPhone(masked);
            if (!digitsOnly(masked)) setHasWhatsApp(false);
            setErrors((current) => ({ ...current, phone: undefined }));
          }}
          keyboardType="phone-pad"
          editable={!controlsDisabled}
          error={errors.phone}
        />
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
            onPress={() => setHasWhatsApp((value) => !value)}
            disabled={controlsDisabled}
            accessibilityRole="switch"
            accessibilityLabel="Tem WhatsApp"
            accessibilityState={{ checked: hasWhatsApp, disabled: controlsDisabled }}
            style={{
              flex: 1,
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Typography variant="bodyBold">Tem WhatsApp</Typography>
          </Pressable>
          <Switch
            value={hasWhatsApp}
            onValueChange={setHasWhatsApp}
            disabled={controlsDisabled}
            accessibilityLabel="Alternar WhatsApp"
            trackColor={{ false: theme.colors.border, true: colors.rose }}
            thumbColor={theme.colors.surfaceElevated}
          />
        </View>

        <Input
          label="Email (opcional)"
          placeholder="Ex.: contato@fornecedor.com"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={200}
          editable={!controlsDisabled}
          error={errors.email}
        />
        <Input
          label="Endereço (opcional)"
          placeholder="Ex.: Rua das Flores, 123"
          value={address}
          onChangeText={setAddress}
          maxLength={500}
          editable={!controlsDisabled}
        />
        <Input
          label="O que você compra aqui? (opcional)"
          placeholder="Ex.: farinha, chocolate e embalagens"
          value={purchaseDescription}
          onChangeText={setPurchaseDescription}
          maxLength={500}
          editable={!controlsDisabled}
          multiline
          numberOfLines={3}
          style={{ height: 88, paddingTop: spacing.md, textAlignVertical: "top" }}
        />

        <Pressable
          onPress={() => setIsPreferred((value) => !value)}
          disabled={controlsDisabled}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isPreferred, disabled: controlsDisabled }}
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: interactionOpacity(controlsDisabled, pressed),
            borderRadius: radii.sm,
          })}
        >
          <AppIcon
            name={isPreferred ? "checkbox" : "square-outline"}
            size={24}
            color={isPreferred ? colors.rose : theme.colors.textSecondary}
          />
          <Typography variant="bodyBold" style={{ flex: 1 }}>
            Marcar como fornecedor preferido
          </Typography>
        </Pressable>

        {submitting ? (
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            accessibilityLiveRegion="polite"
          >
            Salvando fornecedor…
          </Typography>
        ) : null}
      </View>
    );
  },
);
