import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Product, ProductVariationInput, SaleUnit } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  CenteredTextInput,
  Button,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  fontSizes,
  fonts,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextInputProps,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadProductImage } from "../../../shared/utils/upload-image";
import { useCreateProduct, useProducts } from "../hooks";
import { useProfile } from "../../subscription/hooks";
import { businessCopyFor } from "../../subscription/business-copy";
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
import {
  desktopCompactField,
  desktopSplitLayout,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormSection } from "../../../shared/components/form-section";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { VariationEditor } from "./variation-editor";
import { validateVariations } from "../variations";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAuth } from "../../../shared/hooks/use-auth";
import { createInternalProductCode } from "../barcode";

interface CreateProductFormProps {
  readonly onSuccess?: (product: Product) => void;
  readonly onPriceInvite?: () => void;
  /** A tarefa de origem apresenta o sucesso ao retomar um cadastro dependente. */
  readonly successFeedback?: "alert" | "parent";
  readonly initialSalePrice?: number;
  /**
   * Custo total já calculado na precificação (materiais + embalagem), para
   * não pedir de novo o que a pessoa acabou de calcular (fluxo "sem
   * recadastro": precificação → produto).
   */
  readonly initialCostPrice?: number;
  readonly initialValues?: {
    name?: string;
    category?: string;
    salePrice?: number;
    costPrice?: number;
    code?: string;
    photoUrl?: string;
  };
  readonly analyticsSource?: "pricing";
  readonly simpleOnly?: boolean;
  readonly modal?: {
    visible: boolean;
    onClose: () => void;
    title: string;
    returnAction?: { label: string; onPress: () => void };
  };
}

const PRODUCT_FORM_STEPS = [
  { label: "Essencial", title: "Informações e preço" },
  { label: "Detalhes", title: "Tipo, variações e apresentação" },
  { label: "Estoque", title: "Estoque e identificação" },
] as const;

/** Cores derivadas do tema para os campos (funciona em claro e escuro). */
function useFieldPalette() {
  const { theme } = useTheme();
  return {
    border: theme.colors.border,
    fieldBg: theme.colors.surface,
    placeholder: theme.colors.textSecondary,
    sheetBg: theme.colors.surfaceElevated,
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
        <Typography variant="bodyBold" color={theme.colors.primary}>
          *
        </Typography>
      ) : null}
    </View>
  );
}

type TextFieldCardProps = Readonly<{
  icon: AppIconName;
  isDesktop?: boolean;
}> &
  TextInputProps;

function TextFieldCard({
  icon,
  isDesktop = false,
  inputRef,
  ...inputProps
}: TextFieldCardProps & { inputRef?: React.Ref<TextInput> }) {
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
      <AppIcon name={icon} size={22} color={theme.colors.textSecondary} />
      <CenteredTextInput
        ref={inputRef}
        accessibilityLabel={inputProps.accessibilityLabel ?? inputProps.placeholder}
        placeholderTextColor={pal.placeholder}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontFamily: fonts.regular,
          fontSize: fontSizes.md,
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
  focusRequest = 0,
  placeholder,
  isDesktop = false,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  focusRequest?: number;
  placeholder: string;
  isDesktop?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (focusRequest > 0) {
      setDraft(value);
      setOpen(true);
    }
  }, [focusRequest]);

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  const categoryValidation = useFormValidation({
    draft: !draft.trim() && "Digite uma categoria ou escolha uma das opções.",
  });

  function confirm(category: string) {
    if (!category.trim()) {
      categoryValidation.validate();
      return;
    }
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
        <AppIcon name="grid-outline" size={22} color={theme.colors.textSecondary} />
        <Typography
          variant="body"
          color={value ? theme.colors.text : pal.placeholder}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {value || placeholder}
        </Typography>
        <AppIcon name="chevron-down" size={20} color={theme.colors.textSecondary} />
      </Pressable>

      <ResponsiveOverlayModal
        visible={open}
        transparent
        animationType={Platform.OS === "web" ? "none" : "slide"}
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
              backgroundColor: theme.colors.overlay,
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

              <ValidationField {...categoryValidation.field("draft")}>
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
                  <AppIcon
                    name="create-outline"
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                  <CenteredTextInput
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
              </ValidationField>

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
                accessibilityRole="button"
                style={({ pressed }) => {
                  let opacity = 1;
                  if (pressed) opacity = 0.85;
                  return {
                    alignSelf: isDesktop ? "flex-end" : undefined,
                    width: isDesktop ? 180 : undefined,
                    minHeight: 44,
                    borderRadius: radii.md,
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
      <FieldLabel label="Foto principal" />
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
              <AppIcon
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
          alignItems: "center",
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <AppIcon
          name="document-text-outline"
          size={22}
          color={theme.colors.textSecondary}
        />
        <View style={{ flex: 1 }}>
          <CenteredTextInput
            value={value}
            onChangeText={(t) => onChange(t.slice(0, MAX))}
            placeholder="Descreva o que você vende, seus diferenciais e detalhes importantes..."
            placeholderTextColor={pal.placeholder}
            multiline
            maxLength={MAX}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 16,
              textAlignVertical: "center",
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
          ? `Mostre mais detalhes deste cadastro (até ${max + 1} fotos no total).`
          : `Adicione até ${max + 1} fotos por cadastro com o Essencial.`}
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
              <AppIcon name="close-circle" size={24} color={theme.colors.alert} />
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
            <AppIcon name="add" size={28} color={theme.colors.textSecondary} />
            {!isPremium && (
              <AppIcon
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
  onPriceInvite,
  successFeedback = "alert",
  initialSalePrice,
  initialCostPrice,
  initialValues,
  analyticsSource,
  simpleOnly = false,
  modal,
}: CreateProductFormProps) {
  const { theme } = useTheme();
  const brand = useBrand();
  const variationsEnabled = useFeature("catalogoCores");
  const directCostEnabled = useFeature("custoDireto");
  const weightEnabled = useFeature("vendaPorPeso");
  const isDesktop = useDesktopLayout();
  // No sheet hug (modal) o form usa sempre coluna única: as rows lado a lado com
  // larguras fixas foram pensadas para o uso inline em desktop (fluxo new-sale).
  const wideLayout = isDesktop && !modal;
  const split = desktopSplitLayout(wideLayout);
  const nameInput = useRef<TextInput>(null);
  const priceInput = useRef<TextInput>(null);
  const [categoryFocus, setCategoryFocus] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [salePrice, setSalePrice] = useState(
    initialValues?.salePrice === undefined && initialSalePrice === undefined
      ? ""
      : currencyInput(initialValues?.salePrice ?? initialSalePrice ?? 0),
  );
  const [costPrice, setCostPrice] = useState(
    initialValues?.costPrice === undefined && initialCostPrice === undefined
      ? ""
      : currencyInput(initialValues?.costPrice ?? initialCostPrice ?? 0),
  );
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState(initialValues?.code ?? "");
  const [variations, setVariations] = useState<ProductVariationInput[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [creatingComponent, setCreatingComponent] = useState(false);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);
  const extraPicker = useImagePicker();
  const [extraUris, setExtraUris] = useState<string[]>([]);
  const { data: profile } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType, brand.copy);
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
    const set = new Set([
      ...experienceCopy.categoryPresets,
      ...(productsData?.items ?? [])
        .map((product) => product.category)
        .filter((category): category is string => !!category),
    ]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [experienceCopy.categoryPresets, productsData]);

  const isKg = saleUnit === "kg" && !isComposite;

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome do produto.",
      category: !category.trim() && "Selecione ou informe uma categoria.",
      salePrice:
        (!Number.isFinite(parseCurrencyInput(salePrice)) ||
          parseCurrencyInput(salePrice) <= 0 ||
          !Number.isFinite(parseCurrencyInput(salePrice))) &&
        "Informe um preço maior que zero.",
      components:
        isComposite &&
        (components.length === 0 ||
          components.some(
            (item) =>
              !Number.isFinite(Number(item.quantity.replace(",", "."))) ||
              Number(item.quantity.replace(",", ".")) <= 0,
          )) &&
        "Adicione produtos ao kit e informe uma quantidade maior que zero para cada um.",
    },
    modal?.visible,
  );

  async function handleSubmit() {
    if (
      !formValidation.validate((field) => {
        const events = {
          name: "name_required",
          category: "category_required",
          salePrice: "price_invalid",
          components: "components_required",
        } as const;
        const event = events[field];
        void trackAnalyticsAction(`product_${event}`, useAuth.getState().token);
      })
    ) {
      if (!name.trim() || !category.trim() || parseCurrencyInput(salePrice) <= 0) {
        setFormStep(1);
      } else if (isComposite) {
        setFormStep(2);
      }
      return;
    }
    if (checkProductLimit()) return;

    const price = parseCurrencyInput(salePrice);
    const cost = costPrice ? parseCurrencyInput(costPrice) : undefined;

    setAttempted(true);
    const validationError = validateProductDraft({
      name,
      category,
      price,
      isComposite,
      components,
    });
    if (validationError) {
      let field:
        | "name_required"
        | "category_required"
        | "price_invalid"
        | "components_required" = "components_required";
      if (!name.trim()) field = "name_required";
      else if (!category.trim()) field = "category_required";
      else if (!Number.isFinite(price) || price <= 0) field = "price_invalid";
      void trackAnalyticsAction(`product_${field}`, useAuth.getState().token);
      if (field === "name_required")
        requestAnimationFrame(() => nameInput.current?.focus());
      else if (field === "category_required") setCategoryFocus((value) => value + 1);
      else if (field === "price_invalid")
        requestAnimationFrame(() => priceInput.current?.focus());
      else alertValidation(validationError);
      return;
    }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      alertValidation("O custo não pode ser negativo.");
      return;
    }
    const variationError = validateVariations(variations);
    if (variationsEnabled && variationError) {
      alertValidation(variationError);
      return;
    }

    const duplicatedName = productsData?.items.some(
      (product) => duplicateKey(product.name) === duplicateKey(name),
    );
    if (duplicatedName) {
      const shouldContinue = await confirmPossibleDuplicate(
        "Produto parecido",
        `Já existe um ${experienceCopy.productNoun} com esse nome. Confira se não é melhor editar o existente.`,
      );
      if (!shouldContinue) return;
    }

    let stockReview = "Sem controle de estoque";
    if (saleUnit === "kg") stockReview = "Vendido por peso";
    else if (stockQuantity) stockReview = `${stockQuantity} em estoque`;
    const gainReview =
      cost === undefined
        ? "Custo não informado"
        : `Ganho bruto de ${(price - cost).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}`;
    const confirmed = await new Promise<boolean>((resolve) => {
      showAlert({
        title: `Revisar ${experienceCopy.productNoun}`,
        message: [
          name.trim(),
          category.trim(),
          `Venda: ${price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}`,
          gainReview,
          stockReview,
        ].join("\n"),
        buttons: [
          { text: "Voltar e editar", style: "cancel", onPress: () => resolve(false) },
          { text: "Cadastrar", onPress: () => resolve(true) },
        ],
      });
    });
    if (!confirmed) return;

    const componentsPayload = isComposite ? draftsToComponents(components) : undefined;

    // Sobe a foto (se houver) e usa a URL pública. Se falhar, salva sem a foto.
    let photoUrl: string | undefined = initialValues?.photoUrl;
    if (imageUri) {
      try {
        setUploading(true);
        photoUrl = await uploadProductImage(imageUri);
      } catch {
        showAlert({
          title: "Foto não enviada",
          message: `Não consegui enviar a foto agora. Vou salvar o ${experienceCopy.productNoun} sem ela. Você pode adicionar depois.`,
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
      const product = await createProduct.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        salePrice: price,
        saleUnit: weightEnabled ? saleUnit : "unit",
        costPrice: directCostEnabled ? cost : undefined,
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
        variations: variationsEnabled ? variations : undefined,
      });
      if (successFeedback === "alert")
        showAlert({
          title: "Produto cadastrado!",
          message: `${name} foi adicionado à sua lista`,
          buttons: onPriceInvite
            ? [
                { text: "Agora não", style: "cancel" },
                {
                  text: "Calcular se dá lucro",
                  onPress: onPriceInvite,
                },
              ]
            : undefined,
        });
      if (analyticsSource === "pricing") {
        void trackAnalyticsAction(
          "product_created_from_pricing",
          useAuth.getState().token,
        );
      }
      onSuccess?.(product);
    } catch (e) {
      // Limite do plano gratuito atingido → abre o paywall (em vez de erro genérico).
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("products");
        return;
      }
      alertError(
        e instanceof Error
          ? e.message
          : `Não foi possível cadastrar o ${experienceCopy.productNoun}. Tente novamente.`,
      );
    }
  }

  const loading = createProduct.isPending || uploading;
  const parsedSalePrice = salePrice ? parseCurrencyInput(salePrice) : 0;
  const parsedCostPrice = costPrice ? parseCurrencyInput(costPrice) : null;
  const estimatedGain =
    parsedCostPrice === null ? null : parsedSalePrice - parsedCostPrice;
  const marginOnPrice =
    estimatedGain === null || parsedSalePrice <= 0
      ? null
      : (estimatedGain / parsedSalePrice) * 100;

  const fields = (
    <>
      <View
        style={{ display: !modal || formStep === 1 ? "flex" : "none", gap: spacing.xl }}
        accessibilityElementsHidden={!!modal && formStep !== 1}
        importantForAccessibility={
          !modal || formStep === 1 ? "auto" : "no-hide-descendants"
        }
      >
        <FormSection
          collapsible={false}
          title="Informações básicas"
          subtitle={`Nome, categoria e tipo do ${experienceCopy.productNoun}`}
          icon="pricetag-outline"
          initiallyOpen
        >
          <View
            style={{
              flexDirection: wideLayout ? "row" : "column",
              gap: wideLayout ? spacing.lg : spacing.xl,
            }}
          >
            <View style={wideLayout ? { flex: 1 } : undefined}>
              {attempted && !name.trim() ? (
                <Typography variant="body" accessibilityRole="alert">
                  Informe o nome do que você vende.
                </Typography>
              ) : null}
              <FieldLabel label={`Nome do ${experienceCopy.productNoun}`} required />
              <ValidationField {...formValidation.field("name")}>
                <TextFieldCard
                  icon="pricetag-outline"
                  placeholder={`Ex: ${experienceCopy.productExample}`}
                  inputRef={nameInput}
                  accessibilityLabel={`Nome do ${experienceCopy.productNoun}, obrigatório`}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  isDesktop={isDesktop}
                />
              </ValidationField>
            </View>

            <View style={wideLayout ? { flex: 1 } : undefined}>
              {attempted && !category.trim() ? (
                <Typography variant="body" accessibilityRole="alert">
                  Escolha uma categoria para organizar o produto.
                </Typography>
              ) : null}
              <FieldLabel label="Categoria" required />
              <ValidationField {...formValidation.field("category")}>
                <CategoryField
                  focusRequest={categoryFocus}
                  value={category}
                  onChange={setCategory}
                  categories={categories}
                  placeholder={`Ex: ${experienceCopy.categoryExample}...`}
                  isDesktop={isDesktop}
                />
              </ValidationField>
            </View>
          </View>
        </FormSection>

        <FormSection
          collapsible={false}
          title="Preço e custo"
          subtitle="Veja o ganho estimado enquanto preenche"
          icon="cash-outline"
          initiallyOpen={!modal || isDesktop}
        >
          <View
            style={{
              flexDirection: wideLayout ? "row" : "column",
              alignItems: wideLayout ? "flex-end" : undefined,
              gap: spacing.xl,
            }}
          >
            <View style={isDesktop ? desktopCompactField(isDesktop) : undefined}>
              {attempted &&
              (!Number.isFinite(parseCurrencyInput(salePrice)) ||
                parseCurrencyInput(salePrice) <= 0) ? (
                <Typography variant="body" accessibilityRole="alert">
                  Informe um preço maior que zero. Exemplo: 25,00.
                </Typography>
              ) : null}
              <FieldLabel
                label={isKg ? "Preço por kg (R$)" : "Preço de venda (R$)"}
                required
              />
              <ValidationField {...formValidation.field("salePrice")}>
                <TextFieldCard
                  icon="cash-outline"
                  placeholder={isKg ? "Ex: 80,00" : "Ex: 3,50"}
                  inputRef={priceInput}
                  accessibilityLabel="Preço de venda em reais, obrigatório"
                  value={salePrice}
                  onChangeText={(value) => setSalePrice(maskCurrencyInput(value))}
                  keyboardType="numeric"
                  isDesktop={isDesktop}
                />
              </ValidationField>
            </View>

            {directCostEnabled && !isComposite ? (
              <View style={isDesktop ? desktopCompactField(isDesktop) : undefined}>
                <FieldLabel label="Custo unitário (R$)" />
                <TextFieldCard
                  icon="wallet-outline"
                  placeholder="Ex: 2,10"
                  value={costPrice}
                  onChangeText={(value) => setCostPrice(maskCurrencyInput(value))}
                  keyboardType="numeric"
                  isDesktop={isDesktop}
                />
              </View>
            ) : null}
          </View>
          {/* Venda por peso (kg) so faz sentido para produto simples. */}
          {!isComposite && weightEnabled && (
            <View style={wideLayout ? { flex: 1, maxWidth: 640 } : undefined}>
              <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />
            </View>
          )}
          {estimatedGain !== null && marginOnPrice !== null && !wideLayout ? (
            <View
              style={{
                borderRadius: radii.xl,
                padding: spacing.lg,
                gap: spacing.xs,
                backgroundColor:
                  estimatedGain >= 0 ? theme.colors.successBg : theme.colors.alertBg,
              }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Estimativa com os custos informados
              </Typography>
              <Typography
                variant="h3"
                color={estimatedGain >= 0 ? theme.colors.success : theme.colors.alert}
              >
                Ganho bruto:{" "}
                {estimatedGain.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Margem sobre o preço: {marginOnPrice.toFixed(1).replace(".", ",")}%
              </Typography>
            </View>
          ) : null}
        </FormSection>
      </View>

      <View
        style={{ display: !modal || formStep === 2 ? "flex" : "none", gap: spacing.xl }}
        accessibilityElementsHidden={!!modal && formStep !== 2}
        importantForAccessibility={
          !modal || formStep === 2 ? "auto" : "no-hide-descendants"
        }
      >
        <FormSection
          title="Tipo e variações"
          subtitle="Kit, componentes e opções do produto"
          icon="cube-outline"
          initiallyOpen={isComposite}
          collapsible={!isComposite}
        >
          {!simpleOnly ? (
            <CompositeToggle
              value={isComposite}
              onChange={handleCompositeChange}
              locked={!canUseCompositeProducts}
            />
          ) : null}

          {isComposite ? (
            <ValidationField {...formValidation.field("components")}>
              <ComponentPicker
                value={components}
                onChange={setComponents}
                onCreateSimpleProduct={() => setCreatingComponent(true)}
              />
            </ValidationField>
          ) : null}

          {variationsEnabled && !isComposite ? (
            <VariationEditor value={variations} onChange={setVariations} />
          ) : null}
        </FormSection>

        <FormSection
          title="Fotos e descrição"
          subtitle={`Apresentação do ${experienceCopy.productNoun} no catálogo`}
          icon="camera-outline"
        >
          <View
            style={{
              flexDirection: wideLayout ? "row" : "column",
              alignItems: wideLayout ? "flex-start" : undefined,
              gap: spacing.xl,
            }}
          >
            <View
              style={wideLayout ? { width: 480, gap: spacing.lg } : { gap: spacing.xl }}
            >
              <PhotoField
                imageUri={imageUri ?? initialValues?.photoUrl ?? null}
                onPress={showPicker}
                isDesktop={isDesktop}
              />

              <ExtraPhotosField
                uris={extraUris}
                onAdd={() => void addExtraPhoto()}
                onRemove={removeExtraPhoto}
                max={MAX_EXTRA_PHOTOS}
                isPremium={canUseExtraPhotos}
                isDesktop={isDesktop}
              />
            </View>

            <View style={wideLayout ? { flex: 1 } : undefined}>
              <DescriptionField
                value={description}
                onChange={setDescription}
                isDesktop={isDesktop}
              />
            </View>
          </View>
        </FormSection>
      </View>

      <View
        style={{ display: !modal || formStep === 3 ? "flex" : "none", gap: spacing.xl }}
        accessibilityElementsHidden={!!modal && formStep !== 3}
        importantForAccessibility={
          !modal || formStep === 3 ? "auto" : "no-hide-descendants"
        }
      >
        <FormSection
          title="Estoque e identificação"
          subtitle="Código, quantidade disponível e alerta de reposição"
          icon="albums-outline"
          initiallyOpen={!modal || isDesktop}
        >
          <View
            style={{
              flexDirection: wideLayout ? "row" : "column",
              alignItems: wideLayout ? "flex-end" : undefined,
              gap: wideLayout ? spacing.lg : spacing.xl,
            }}
          >
            <View style={wideLayout ? { flex: 1, maxWidth: 480 } : undefined}>
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
                  <AppIcon
                    name="scan-outline"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
              <Pressable
                onPress={() => setCode(createInternalProductCode())}
                accessibilityRole="button"
                accessibilityLabel="Gerar código interno"
                style={{
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  paddingTop: spacing.sm,
                }}
              >
                <AppIcon
                  name="repeat-outline"
                  size={18}
                  color={theme.colors.primaryStrong}
                />
                <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                  Gerar código interno
                </Typography>
              </Pressable>
            </View>

            {saleUnit === "unit" && !isComposite && variations.length === 0 && (
              <>
                <View style={wideLayout ? { flex: 1, maxWidth: 260 } : undefined}>
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

                <View style={wideLayout ? { flex: 1, maxWidth: 260 } : undefined}>
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
            {saleUnit === "unit" && !isComposite && variations.length > 0 ? (
              <View style={wideLayout ? { flex: 1, maxWidth: 260 } : undefined}>
                <FieldLabel label="Alerta por variação (opcional)" />
                <TextFieldCard
                  icon="notifications-outline"
                  placeholder="Ex: 3"
                  value={stockAlert}
                  onChangeText={setStockAlert}
                  keyboardType="number-pad"
                  isDesktop={isDesktop}
                />
              </View>
            ) : null}
          </View>
        </FormSection>
      </View>
    </>
  );

  function renderSubmitButton(footerStyle?: object) {
    return (
      <Pressable
        onPress={() => {
          void handleSubmit();
        }}
        disabled={loading}
        accessibilityRole="button"
        style={({ pressed }) => ({
          alignSelf: isDesktop ? "flex-end" : undefined,
          width: isDesktop ? 220 : undefined,
          minHeight: isDesktop ? 44 : 48,
          borderRadius: radii.md,
          backgroundColor: theme.colors.primaryInteractive,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed || loading ? 0.85 : 1,
          ...footerStyle,
        })}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.textOnPrimary} />
        ) : (
          <AppIcon
            name="checkmark-circle-outline"
            size={24}
            color={theme.colors.textOnPrimary}
          />
        )}
        <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
          {uploading ? "Enviando foto..." : `Cadastrar ${experienceCopy.productNoun}`}
        </Typography>
      </Pressable>
    );
  }

  function renderWizardFooter() {
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: spacing.md }}>
        {formStep > 1 ? (
          <Button
            title="Voltar"
            variant="ghost"
            disabled={loading}
            onPress={() => setFormStep((current) => current - 1)}
          />
        ) : null}
        {formStep < PRODUCT_FORM_STEPS.length ? (
          <Button
            title="Continuar"
            disabled={loading}
            onPress={() => setFormStep((current) => current + 1)}
            style={{ flex: 1 }}
          />
        ) : (
          renderSubmitButton({ flex: 1, alignSelf: "stretch", width: undefined })
        )}
      </View>
    );
  }

  const scanner = (
    <BarcodeScanner
      visible={showScanner}
      onClose={() => setShowScanner(false)}
      onScanned={(scanned) => {
        setShowScanner(false);
        setCode(scanned);
      }}
    />
  );

  const priceSummaryAside = wideLayout ? (
    <>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: radii.xl,
          borderWidth: 1,
          overflow: "hidden",
        }}
      >
        <View style={{ gap: 2, padding: spacing.xl }}>
          <Typography variant="label">PREÇO DE VENDA</Typography>
          <Typography
            variant="moneyHero"
            color={
              parsedSalePrice > 0
                ? theme.colors.primaryStrong
                : theme.colors.textSecondary
            }
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {parsedSalePrice.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Typography>
        </View>
        {estimatedGain !== null && marginOnPrice !== null ? (
          <View
            style={{
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              gap: spacing.sm,
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Ganho bruto
              </Typography>
              <Typography
                variant="bodyBold"
                color={estimatedGain >= 0 ? theme.colors.success : theme.colors.alert}
              >
                {estimatedGain.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Typography>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Margem sobre o preço
              </Typography>
              <Typography variant="bodyBold">
                {marginOnPrice.toFixed(1).replace(".", ",")}%
              </Typography>
            </View>
          </View>
        ) : (
          <View
            style={{
              borderTopColor: theme.colors.border,
              borderTopWidth: 1,
              padding: spacing.lg,
            }}
          >
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Informe o custo unitário para ver o ganho estimado.
            </Typography>
          </View>
        )}
      </View>
      {renderSubmitButton({ alignSelf: "stretch", width: "100%", minHeight: 48 })}
    </>
  ) : null;

  const componentCreationModal = creatingComponent ? (
    <CreateProductForm
      simpleOnly
      modal={{
        visible: modal?.visible ?? true,
        title: "Novo produto simples",
        onClose: () => setCreatingComponent(false),
        returnAction: {
          label: "Voltar ao kit",
          onPress: () => setCreatingComponent(false),
        },
      }}
      onSuccess={(product) => {
        setComponents((current) => [
          ...current.filter((component) => component.componentProductId !== product.id),
          { componentProductId: product.id, quantity: "1" },
        ]);
        setCreatingComponent(false);
      }}
    />
  ) : null;

  if (modal) {
    const returnButton = modal.returnAction ? (
      <Pressable
        onPress={modal.returnAction.onPress}
        accessibilityRole="button"
        accessibilityLabel={modal.returnAction.label}
        style={({ pressed }) => ({
          flex: isDesktop ? 1 : undefined,
          width: isDesktop ? undefined : "100%",
          minHeight: 48,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <AppIcon name="arrow-back" size={20} color={theme.colors.primaryStrong} />
        <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
          {modal.returnAction.label}
        </Typography>
      </Pressable>
    ) : null;

    return (
      <>
        <StandardModal
          title={modal.title}
          visible={modal.visible && !creatingComponent}
          onClose={() => {
            setCreatingComponent(false);
            modal.onClose();
          }}
          footer={
            <View
              style={{
                flex: 1,
                flexDirection: isDesktop ? "row" : "column",
                justifyContent: isDesktop ? "flex-end" : undefined,
                gap: spacing.md,
              }}
            >
              {formStep === 1 ? returnButton : null}
              {renderWizardFooter()}
            </View>
          }
        >
          <View style={{ flexShrink: 1, gap: isDesktop ? spacing.lg : spacing.xl }}>
            <FormStepProgress
              current={formStep}
              steps={PRODUCT_FORM_STEPS}
              onStepPress={setFormStep}
            />
            {fields}
          </View>
        </StandardModal>
        {componentCreationModal}
        {scanner}
      </>
    );
  }

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          {
            padding: spacing.xl,
            paddingBottom: spacing["5xl"],
            gap: spacing.xl,
          },
          split.outer,
        ]}
      >
        {wideLayout ? (
          <View style={split.row}>
            <View style={split.main}>{fields}</View>
            <View style={split.aside}>{priceSummaryAside}</View>
          </View>
        ) : (
          <>
            {fields}
            {renderSubmitButton()}
          </>
        )}
      </KeyboardAwareScrollView>
      {componentCreationModal}
      {scanner}
    </>
  );
}
