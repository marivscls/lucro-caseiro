import type { SaleUnit } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import { Typography, useFeature, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadProductImage } from "../../../shared/utils/upload-image";
import { useCreateProduct, useProducts } from "../hooks";
import { useProfile } from "../../subscription/hooks";
import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "./component-picker";
import { validateProductDraft } from "../kit";
import { CompositeToggle } from "./composite-toggle";
import { SaleUnitToggle } from "./sale-unit-toggle";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { BarcodeScanner } from "../../../shared/components/barcode-scanner";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { ApiError } from "../../../shared/utils/api-client";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAuth } from "../../../shared/hooks/use-auth";

interface CreateProductFormProps {
  readonly onSuccess?: () => void;
  readonly initialSalePrice?: number;
  readonly analyticsSource?: "pricing";
}

/** Cores derivadas do tema para os campos (funciona em claro e escuro). */
function useFieldPalette() {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  return {
    border: isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)",
    fieldBg: isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface,
    placeholder: isDark ? "rgba(184, 160, 144, 0.7)" : "rgba(139, 115, 85, 0.7)",
    sheetBg: isDark ? "#2C2420" : theme.colors.surfaceElevated,
  };
}

function FieldLabel({
  label,
  required,
}: Readonly<{ label: string; required?: boolean }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4, marginBottom: spacing.sm }}>
      <Typography variant="bodyBold" color={theme.colors.text}>
        {label}
      </Typography>
      {required ? (
        <Typography variant="bodyBold" color={theme.colors.text}>
          *
        </Typography>
      ) : null}
    </View>
  );
}

type TextFieldCardProps = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  isDesktop?: boolean;
}> &
  TextInputProps;

function TextFieldCard({ icon, isDesktop = false, ...inputProps }: TextFieldCardProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: isDesktop ? 48 : 60,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
    >
      <Ionicons name={icon} size={22} color={theme.colors.textSecondary} />
      <TextInput
        placeholderTextColor={pal.placeholder}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: 16,
          paddingVertical: isDesktop ? spacing.sm : spacing.md,
        }}
        {...inputProps}
      />
    </View>
  );
}

function CategoryField({
  value,
  onChange,
  categories,
  isDesktop = false,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  isDesktop?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function confirm(category: string) {
    onChange(category.trim());
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Escolher categoria"
        style={{
          minHeight: isDesktop ? 48 : 60,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
      >
        <Ionicons name="grid-outline" size={22} color={theme.colors.textSecondary} />
        <Typography
          variant="body"
          color={value ? theme.colors.text : pal.placeholder}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {value || "Ex: Doces, Salgados, Bolos..."}
        </Typography>
        <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <ResponsiveOverlayModal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            onPress={() => setOpen(false)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: isDesktop ? "center" : "flex-end",
              alignItems: isDesktop ? "center" : undefined,
              padding: isDesktop ? spacing.xl : 0,
            }}
          >
            <Pressable
              style={{
                backgroundColor: pal.sheetBg,
                borderRadius: isDesktop ? radii["2xl"] : 0,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                width: "100%",
                maxWidth: isDesktop ? 720 : undefined,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
                paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom,
                maxHeight: "80%",
                gap: spacing.md,
              }}
            >
              <Typography variant="h3" color={theme.colors.text}>
                Categoria
              </Typography>

              <View
                style={{
                  minHeight: isDesktop ? 48 : 56,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: pal.border,
                  backgroundColor: pal.fieldBg,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.md,
                  gap: spacing.md,
                }}
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={theme.colors.textSecondary}
                />
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Digite uma categoria nova"
                  placeholderTextColor={pal.placeholder}
                  autoFocus
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: 16,
                    paddingVertical: spacing.md,
                  }}
                />
              </View>

              {categories.length > 0 ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 220 }}
                >
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
                  >
                    {categories.map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => confirm(cat)}
                        accessibilityRole="button"
                        style={{
                          minHeight: 40,
                          paddingHorizontal: spacing.md,
                          justifyContent: "center",
                          borderRadius: radii.full,
                          borderWidth: 1,
                          borderColor: pal.border,
                          backgroundColor: pal.fieldBg,
                        }}
                      >
                        <Typography variant="body" color={theme.colors.text}>
                          {cat}
                        </Typography>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : null}

              <Pressable
                onPress={() => confirm(draft)}
                disabled={!draft.trim()}
                accessibilityRole="button"
                style={({ pressed }) => {
                  let opacity = 1;
                  if (!draft.trim()) opacity = 0.5;
                  else if (pressed) opacity = 0.85;
                  return {
                    alignSelf: isDesktop ? "flex-end" : undefined,
                    width: isDesktop ? 180 : undefined,
                    minHeight: isDesktop ? 44 : 52,
                    borderRadius: radii.lg,
                    backgroundColor: theme.colors.primaryInteractive,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity,
                  };
                }}
              >
                <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
                  Usar categoria
                </Typography>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </ResponsiveOverlayModal>
    </>
  );
}

function PhotoField({
  imageUri,
  onPress,
  isDesktop = false,
}: Readonly<{
  imageUri: string | null;
  onPress: () => void;
  isDesktop?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();

  return (
    <View>
      <FieldLabel label="Foto do produto" />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ marginTop: -spacing.xs, marginBottom: spacing.sm }}
      >
        Uma boa foto aumenta suas vendas!
      </Typography>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Adicionar foto"
        style={{
          borderRadius: radii.lg,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          overflow: "hidden",
          minHeight: 96,
          justifyContent: "center",
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: isDesktop ? 112 : 160 }}
          />
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: isDesktop ? spacing.md : spacing.lg,
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.md,
                backgroundColor: pal.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="camera-outline"
                size={28}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Adicionar foto
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                PNG, JPG até 5MB
              </Typography>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function DescriptionField({
  value,
  onChange,
  isDesktop = false,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  isDesktop?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const MAX = 300;

  return (
    <View>
      <FieldLabel label="Descrição (opcional)" />
      <View
        style={{
          minHeight: isDesktop ? 112 : 120,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={22}
          color={theme.colors.textSecondary}
        />
        <View style={{ flex: 1 }}>
          <TextInput
            value={value}
            onChangeText={(t) => onChange(t.slice(0, MAX))}
            placeholder="Fale um pouco sobre o produto, ingredientes, diferenciais..."
            placeholderTextColor={pal.placeholder}
            multiline
            maxLength={MAX}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 16,
              textAlignVertical: "top",
              padding: 0,
              minHeight: 72,
            }}
          />
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ alignSelf: "flex-end" }}
          >
            {value.length}/{MAX}
          </Typography>
        </View>
      </View>
    </View>
  );
}

/** Fotos extras (galeria) além da principal. Total = principal + MAX_EXTRA_PHOTOS. */
const MAX_EXTRA_PHOTOS = 2;

function ExtraPhotosField({
  uris,
  onAdd,
  onRemove,
  max,
  isPremium,
  isDesktop = false,
}: Readonly<{
  uris: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  max: number;
  isPremium: boolean;
  isDesktop?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();

  return (
    <View style={{ marginTop: isDesktop ? 0 : spacing.md }}>
      <FieldLabel label="Mais fotos" />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ marginTop: -spacing.xs, marginBottom: spacing.sm }}
      >
        {isPremium
          ? `Mostre seu produto de vários ângulos (até ${max + 1} fotos no total).`
          : `Adicione até ${max + 1} fotos por produto com o Profissional.`}
      </Typography>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        {uris.map((uri, index) => (
          <View key={uri} style={{ position: "relative" }}>
            <Image
              source={{ uri }}
              style={{ width: 80, height: 80, borderRadius: radii.md }}
            />
            <Pressable
              onPress={() => onRemove(index)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remover foto"
              style={{ position: "absolute", top: -8, right: -8 }}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.alert} />
            </Pressable>
          </View>
        ))}
        {uris.length < max && (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="Adicionar mais uma foto"
            style={{
              width: 80,
              height: 80,
              borderRadius: radii.md,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: pal.border,
              backgroundColor: pal.fieldBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="add" size={28} color={theme.colors.textSecondary} />
            {!isPremium && (
              <Ionicons
                name="lock-closed"
                size={12}
                color={theme.colors.premium}
                style={{ position: "absolute", top: 6, right: 6 }}
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function CreateProductForm({
  onSuccess,
  initialSalePrice,
  analyticsSource,
}: CreateProductFormProps) {
  const { theme } = useTheme();
  const variationsEnabled = useFeature("catalogoCores");
  const isDesktop = useDesktopLayout();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState(
    initialSalePrice === undefined ? "" : currencyInput(initialSalePrice),
  );
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [variationNames, setVariationNames] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);
  const extraPicker = useImagePicker();
  const [extraUris, setExtraUris] = useState<string[]>([]);
  const { data: profile } = useProfile();
  const canUseCompositeProducts =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "compositeProducts");
  const canUseExtraPhotos =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "extraPhotos");

  function handleCompositeChange(next: boolean) {
    // Kit/produto composto é recurso Profissional: nunca deixa marcar sem plano.
    if (next && !canUseCompositeProducts) {
      showPaywall("compositeProducts");
      return;
    }
    setIsComposite(next);
  }

  async function addExtraPhoto() {
    if (!canUseExtraPhotos) {
      showPaywall("productPhotos");
      return;
    }
    if (extraUris.length >= MAX_EXTRA_PHOTOS) return;
    const uri = await extraPicker.pickFromGallery();
    if (uri) setExtraUris((prev) => [...prev, uri].slice(0, MAX_EXTRA_PHOTOS));
  }

  function removeExtraPhoto(index: number) {
    setExtraUris((prev) => prev.filter((_, i) => i !== index));
  }

  const createProduct = useCreateProduct();
  const { checkAndBlock: checkProductLimit } = useLimitCheck("products");
  const showPaywall = usePaywall((s) => s.show);
  const { data: productsData } = useProducts();

  const categories = useMemo(() => {
    const set = new Set(
      (productsData?.items ?? []).map((p) => p.category).filter((c): c is string => !!c),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [productsData]);

  const isKg = saleUnit === "kg" && !isComposite;

  async function handleSubmit() {
    if (checkProductLimit()) return;

    const price = parseCurrencyInput(salePrice);

    const validationError = validateProductDraft({
      name,
      category,
      price,
      isComposite,
      components,
    });
    if (validationError) {
      alertValidation(validationError);
      return;
    }

    const duplicatedName = productsData?.items.some(
      (product) => duplicateKey(product.name) === duplicateKey(name),
    );
    if (duplicatedName) {
      const shouldContinue = await confirmPossibleDuplicate(
        "Produto parecido",
        "Já existe um produto com esse nome. Confira se não é melhor editar o existente.",
      );
      if (!shouldContinue) return;
    }

    const componentsPayload = isComposite ? draftsToComponents(components) : undefined;

    // Sobe a foto (se houver) e usa a URL pública. Se falhar, salva sem a foto.
    let photoUrl: string | undefined;
    if (imageUri) {
      try {
        setUploading(true);
        photoUrl = await uploadProductImage(imageUri);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message:
            "Não consegui enviar a foto agora. Vou salvar o produto sem ela. Você pode adicionar depois.",
        });
      } finally {
        setUploading(false);
      }
    }

    // Sobe as fotos extras (galeria). Mantém as que subirem; se nenhuma subir,
    // salva sem elas (o produto fica com a foto principal).
    let extraPhotos: string[] | undefined;
    if (extraUris.length > 0) {
      try {
        setUploading(true);
        const settled = await Promise.allSettled(
          extraUris.map((uri) => uploadProductImage(uri)),
        );
        const uploaded = settled
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value);
        extraPhotos = uploaded.length > 0 ? uploaded : undefined;
      } finally {
        setUploading(false);
      }
    }

    try {
      await createProduct.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        salePrice: price,
        saleUnit,
        description: description.trim() || undefined,
        photoUrl,
        extraPhotos,
        code: code.trim() || undefined,
        // Estoque por unidades nao se aplica a venda por peso (kg).
        stockQuantity:
          saleUnit === "kg" || !stockQuantity ? undefined : parseInt(stockQuantity, 10),
        stockAlertThreshold:
          saleUnit === "kg" || !stockAlert ? undefined : parseInt(stockAlert, 10),
        isComposite,
        components: componentsPayload,
        variations: variationsEnabled
          ? variationNames
              .split(",")
              .map((variation) => variation.trim())
              .filter(Boolean)
              .map((variation) => ({ name: variation }))
          : undefined,
      });
      showAlert({
        title: "Produto cadastrado!",
        message: `${name} foi adicionado ao seu catálogo`,
      });
      if (analyticsSource === "pricing") {
        void trackAnalyticsAction(
          "product_created_from_pricing",
          useAuth.getState().token,
        );
      }
      onSuccess?.();
    } catch (e) {
      // Limite do plano gratuito atingido → abre o paywall (em vez de erro genérico).
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("products");
        return;
      }
      alertError(
        e instanceof Error
          ? e.message
          : "Não foi possível cadastrar o produto. Tente novamente.",
      );
    }
  }

  const loading = createProduct.isPending || uploading;

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["5xl"],
          gap: isDesktop ? spacing.lg : spacing.xl,
          width: "100%",
          maxWidth: isDesktop ? 1040 : undefined,
          alignSelf: "center",
        }}
      >
        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? spacing.lg : spacing.xl,
          }}
        >
          <View style={isDesktop ? { flex: 1 } : undefined}>
            <FieldLabel label="Nome do produto" required />
            <TextFieldCard
              icon="pricetag-outline"
              placeholder="Ex: Brigadeiro, Bolo de chocolate..."
              value={name}
              onChangeText={setName}
              autoFocus
              isDesktop={isDesktop}
            />
          </View>

          <View style={isDesktop ? { flex: 1 } : undefined}>
            <FieldLabel label="Categoria" required />
            <CategoryField
              value={category}
              onChange={setCategory}
              categories={categories}
              isDesktop={isDesktop}
            />
          </View>
        </View>

        <CompositeToggle
          value={isComposite}
          onChange={handleCompositeChange}
          locked={!canUseCompositeProducts}
        />

        {isComposite && <ComponentPicker value={components} onChange={setComponents} />}

        {variationsEnabled && !isComposite ? (
          <View>
            <FieldLabel label="Variacoes de cor/tamanho (opcional)" />
            <TextFieldCard
              icon="color-palette-outline"
              placeholder="Ex: Azul / A4, Vermelha / A5"
              value={variationNames}
              onChangeText={setVariationNames}
              isDesktop={isDesktop}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Separe cada variacao por virgula.
            </Typography>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "flex-end" : undefined,
            gap: spacing.xl,
          }}
        >
          {/* Venda por peso (kg) so faz sentido para produto simples. */}
          {!isComposite && (
            <View style={isDesktop ? { flex: 1, maxWidth: 640 } : undefined}>
              <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />
            </View>
          )}

          <View style={isDesktop ? { width: 360 } : undefined}>
            <FieldLabel
              label={isKg ? "Preço por kg (R$)" : "Preço de venda (R$)"}
              required
            />
            <TextFieldCard
              icon="cash-outline"
              placeholder={isKg ? "Ex: 80,00" : "Ex: 3,50"}
              value={salePrice}
              onChangeText={(value) => setSalePrice(maskCurrencyInput(value))}
              keyboardType="numeric"
              isDesktop={isDesktop}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "flex-start" : undefined,
            gap: spacing.xl,
          }}
        >
          <View style={isDesktop ? { width: 480, gap: spacing.lg } : { gap: spacing.xl }}>
            <PhotoField imageUri={imageUri} onPress={showPicker} isDesktop={isDesktop} />

            <ExtraPhotosField
              uris={extraUris}
              onAdd={() => void addExtraPhoto()}
              onRemove={removeExtraPhoto}
              max={MAX_EXTRA_PHOTOS}
              isPremium={canUseExtraPhotos}
              isDesktop={isDesktop}
            />
          </View>

          <View style={isDesktop ? { flex: 1 } : undefined}>
            <DescriptionField
              value={description}
              onChange={setDescription}
              isDesktop={isDesktop}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "flex-end" : undefined,
            gap: isDesktop ? spacing.lg : spacing.xl,
          }}
        >
          <View style={isDesktop ? { flex: 1, maxWidth: 480 } : undefined}>
            <FieldLabel label="Código de barras (opcional)" />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TextFieldCard
                  icon="barcode-outline"
                  placeholder="Ex: 789..."
                  value={code}
                  onChangeText={setCode}
                  isDesktop={isDesktop}
                />
              </View>
              <Pressable
                onPress={() => setShowScanner(true)}
                accessibilityRole="button"
                accessibilityLabel="Escanear código"
                style={{
                  width: isDesktop ? 48 : 60,
                  minHeight: isDesktop ? 48 : 60,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="scan-outline"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {saleUnit === "unit" && !isComposite && (
            <>
              <View style={isDesktop ? { flex: 1, maxWidth: 260 } : undefined}>
                <FieldLabel label="Quantidade em estoque (opcional)" />
                <TextFieldCard
                  icon="albums-outline"
                  placeholder="Ex: 50"
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  keyboardType="number-pad"
                  isDesktop={isDesktop}
                />
              </View>

              <View style={isDesktop ? { flex: 1, maxWidth: 260 } : undefined}>
                <FieldLabel label="Alerta de estoque baixo (opcional)" />
                <TextFieldCard
                  icon="notifications-outline"
                  placeholder="Ex: 10"
                  value={stockAlert}
                  onChangeText={setStockAlert}
                  keyboardType="number-pad"
                  isDesktop={isDesktop}
                />
              </View>
            </>
          )}
        </View>

        <Pressable
          onPress={() => {
            void handleSubmit();
          }}
          disabled={loading}
          accessibilityRole="button"
          style={({ pressed }) => ({
            alignSelf: isDesktop ? "flex-end" : undefined,
            width: isDesktop ? 220 : undefined,
            minHeight: isDesktop ? 44 : 58,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed || loading ? 0.85 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={theme.colors.textOnPrimary}
            />
          )}
          <Typography
            variant={isDesktop ? "bodyBold" : "h3"}
            color={theme.colors.textOnPrimary}
          >
            {uploading ? "Enviando foto..." : "Cadastrar produto"}
          </Typography>
        </Pressable>
      </KeyboardAwareScrollView>
      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={(scanned) => {
          setShowScanner(false);
          setCode(scanned);
        }}
      />
    </>
  );
}
