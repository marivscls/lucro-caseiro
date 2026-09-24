import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Product, ProductVariationInput, SaleUnit } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Button,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, View, TextInput } from "react-native";

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
  isPositiveCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { confirmPossibleDuplicate, duplicateKey } from "../../../shared/utils/duplicates";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormSection } from "../../../shared/components/form-section";
import {
  FieldLinkAction,
  FormField,
  SelectField,
  TextField,
  fieldMetrics,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
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
  readonly modal: {
    visible: boolean;
    onClose: () => void;
    title: string;
    returnAction?: { label: string; onPress: () => void };
  };
}

const PRODUCT_FORM_STEPS = [
  { label: "Nome e preço", title: "Informações e preço" },
  { label: "Detalhes", title: "Tipo, variações e apresentação" },
  { label: "Estoque", title: "Estoque e identificação" },
] as const;

function CategoryField({
  value,
  onChange,
  categories,
  focusRequest = 0,
  placeholder,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  categories: string[];
  focusRequest?: number;
  placeholder: string;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
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
      <SelectField
        icon="grid-outline"
        value={value}
        placeholder={placeholder}
        onPress={openSheet}
        accessibilityLabel="Escolher categoria"
      />

      <StandardModal
        visible={open}
        title="Categoria"
        subtitle="Escolha uma das suas ou digite uma nova."
        onClose={() => setOpen(false)}
        footer={
          <FormActions>
            <Button title="Cancelar" variant="outline" onPress={() => setOpen(false)} />
            <Button title="Usar categoria" onPress={() => confirm(draft)} />
          </FormActions>
        }
      >
        <FormField label="Nova categoria" validation={categoryValidation.field("draft")}>
          <TextField
            icon="create-outline"
            value={draft}
            onChangeText={setDraft}
            placeholder="Ex: Bolos"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => confirm(draft)}
          />
        </FormField>

        {categories.length > 0 ? (
          <FormField label="Suas categorias">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {categories.map((cat) => {
                const selected = cat === value;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => confirm(cat)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      paddingHorizontal: spacing.lg,
                      justifyContent: "center",
                      borderRadius: radii.full,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? theme.colors.primaryStrong : pal.border,
                      backgroundColor: selected
                        ? theme.colors.primaryBg
                        : pal.fieldBgFocus,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Typography
                      variant="body"
                      color={selected ? theme.colors.primaryStrong : theme.colors.text}
                    >
                      {cat}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </FormField>
        ) : null}
      </StandardModal>
    </>
  );
}

function PhotoField({
  imageUri,
  onPress,
}: Readonly<{
  imageUri: string | null;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();

  return (
    <FormField label="Foto principal" optional hint="Uma boa foto ajuda a vender.">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={imageUri ? "Trocar foto" : "Adicionar foto"}
        style={({ pressed }) => ({
          borderRadius: fieldMetrics.radius,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          overflow: "hidden",
          minHeight: 88,
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: 160 }} />
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.lg,
              gap: spacing.lg,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radii.md,
                backgroundColor: theme.colors.surfaceElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon
                name="camera-outline"
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Adicionar foto
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                PNG ou JPG, até 5 MB
              </Typography>
            </View>
          </View>
        )}
      </Pressable>
    </FormField>
  );
}

function DescriptionField({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  /** Lido pelo `FormGrid`: a descrição ocupa a linha inteira. */
  span?: "full";
}>) {
  const { theme } = useTheme();
  const MAX = 300;

  return (
    <FormField label="Descrição" optional span="full">
      <TextField
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX))}
        placeholder="O que é, sabores, tamanho, diferenciais…"
        multiline
        maxLength={MAX}
      />
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        style={{ alignSelf: "flex-end", marginTop: spacing.xs }}
      >
        {value.length}/{MAX}
      </Typography>
    </FormField>
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
}: Readonly<{
  uris: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  max: number;
  isPremium: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();

  return (
    <FormField
      label="Mais fotos"
      optional
      hint={
        isPremium
          ? `Mostre mais detalhes (até ${max + 1} fotos no total).`
          : `Com o Essencial, até ${max + 1} fotos por produto.`
      }
    >
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
            style={({ pressed }) => ({
              width: 80,
              height: 80,
              borderRadius: radii.md,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: pal.border,
              backgroundColor: pal.fieldBg,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name="add" size={24} color={theme.colors.textSecondary} />
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
    </FormField>
  );
}

/** Estimativa de ganho enquanto a pessoa preenche preço e custo. */
function GainEstimate({ gain, margin }: Readonly<{ gain: number; margin: number }>) {
  const { theme } = useTheme();
  const positive = gain >= 0;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        borderRadius: fieldMetrics.radius,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: positive ? theme.colors.successBg : theme.colors.alertBg,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <AppIcon
        name={positive ? "trending-up" : "trending-down-outline"}
        size={fieldMetrics.iconSize}
        color={positive ? theme.colors.success : theme.colors.alert}
      />
      <Typography variant="body" color={theme.colors.text} style={{ flex: 1 }}>
        {positive ? "Você ganha " : "Você perde "}
        <Typography
          variant="bodyBold"
          color={positive ? theme.colors.success : theme.colors.alert}
        >
          {Math.abs(gain).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </Typography>
        {` por venda (${margin.toFixed(1).replace(".", ",")}% do preço).`}
      </Typography>
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
  const nameInput = useRef<TextInput>(null);
  const priceInput = useRef<TextInput>(null);
  const [categoryFocus, setCategoryFocus] = useState(0);
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
      salePrice: !isPositiveCurrency(salePrice) && "Informe um preço maior que zero.",
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
    modal.visible,
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
      if (!name.trim() || !category.trim() || !isPositiveCurrency(salePrice)) {
        setFormStep(1);
      } else if (isComposite) {
        setFormStep(2);
      }
      return;
    }
    if (checkProductLimit()) return;

    const price = parseCurrencyInput(salePrice);
    const cost = costPrice ? parseCurrencyInput(costPrice) : undefined;

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
  const tracksUnitStock = saleUnit === "unit" && !isComposite;

  function stepProps(step: number) {
    const visible = formStep === step;
    return {
      style: { display: visible ? ("flex" as const) : ("none" as const) },
      accessibilityElementsHidden: !visible,
      importantForAccessibility: visible
        ? ("auto" as const)
        : ("no-hide-descendants" as const),
    };
  }

  const fields = (
    <>
      <View {...stepProps(1)}>
        <FormBody>
          <FormGrid>
            <FormField
              label={`Nome do ${experienceCopy.productNoun}`}
              validation={formValidation.field("name")}
            >
              <TextField
                icon="pricetag-outline"
                placeholder={`Ex: ${experienceCopy.productExample}`}
                inputRef={nameInput}
                accessibilityLabel={`Nome do ${experienceCopy.productNoun}`}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </FormField>
            <FormField label="Categoria" validation={formValidation.field("category")}>
              <CategoryField
                focusRequest={categoryFocus}
                value={category}
                onChange={setCategory}
                categories={categories}
                placeholder={`Ex: ${experienceCopy.categoryExample}`}
              />
            </FormField>
          </FormGrid>

          <FormSection
            collapsible={false}
            title="Preço e custo"
            subtitle="O ganho aparece enquanto você preenche."
          >
            <FormGrid>
              <FormField
                label={isKg ? "Preço por kg" : "Preço de venda"}
                validation={formValidation.field("salePrice")}
              >
                <TextField
                  prefix="R$"
                  placeholder={isKg ? "80,00" : "3,50"}
                  inputRef={priceInput}
                  accessibilityLabel={
                    isKg ? "Preço por kg, em reais" : "Preço de venda, em reais"
                  }
                  value={salePrice}
                  onChangeText={(value) => setSalePrice(maskCurrencyInput(value))}
                  keyboardType="numeric"
                />
              </FormField>
              {directCostEnabled && !isComposite ? (
                <FormField label={isKg ? "Custo por kg" : "Custo de cada um"} optional>
                  <TextField
                    prefix="R$"
                    placeholder={isKg ? "45,00" : "2,10"}
                    accessibilityLabel="Custo, em reais"
                    value={costPrice}
                    onChangeText={(value) => setCostPrice(maskCurrencyInput(value))}
                    keyboardType="numeric"
                  />
                </FormField>
              ) : null}
            </FormGrid>
            {estimatedGain !== null && marginOnPrice !== null ? (
              <GainEstimate gain={estimatedGain} margin={marginOnPrice} />
            ) : null}
            {/* Venda por peso (kg) so faz sentido para produto simples. */}
            {!isComposite && weightEnabled ? (
              <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />
            ) : null}
          </FormSection>
        </FormBody>
      </View>

      <View {...stepProps(2)}>
        <FormBody>
          {!simpleOnly || isComposite || variationsEnabled ? (
            <FormSection collapsible={false} title="Tipo e variações">
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
          ) : null}

          <FormSection collapsible={false} title="Fotos e descrição">
            <FormGrid>
              <PhotoField
                imageUri={imageUri ?? initialValues?.photoUrl ?? null}
                onPress={showPicker}
              />
              <ExtraPhotosField
                uris={extraUris}
                onAdd={() => void addExtraPhoto()}
                onRemove={removeExtraPhoto}
                max={MAX_EXTRA_PHOTOS}
                isPremium={canUseExtraPhotos}
              />
              <DescriptionField
                span="full"
                value={description}
                onChange={setDescription}
              />
            </FormGrid>
          </FormSection>
        </FormBody>
      </View>

      <View {...stepProps(3)}>
        <FormBody>
          <FormField
            label="Código de barras"
            optional
            hint="Para achar o produto com o leitor na hora da venda."
            labelAction={
              <FieldLinkAction
                label="Gerar código"
                icon="repeat-outline"
                accessibilityLabel="Gerar código interno"
                onPress={() => setCode(createInternalProductCode())}
              />
            }
          >
            <TextField
              icon="barcode-outline"
              placeholder="Ex: 7891234567890"
              value={code}
              onChangeText={setCode}
              right={
                <Pressable
                  onPress={() => setShowScanner(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Ler código com a câmera"
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    marginRight: -spacing.sm,
                    borderRadius: radii.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? theme.colors.primaryBg : "transparent",
                  })}
                >
                  <AppIcon
                    name="scan-outline"
                    size={fieldMetrics.iconSize}
                    color={theme.colors.primaryStrong}
                  />
                </Pressable>
              }
            />
          </FormField>

          {tracksUnitStock ? (
            <FormSection
              collapsible={false}
              title="Estoque"
              subtitle="Deixe em branco se você não controla estoque."
            >
              <FormGrid>
                {variations.length === 0 ? (
                  <FormField label="Quantidade agora" optional>
                    <TextField
                      icon="albums-outline"
                      placeholder="Ex: 50"
                      value={stockQuantity}
                      onChangeText={setStockQuantity}
                      keyboardType="number-pad"
                      numericMode="integer"
                    />
                  </FormField>
                ) : null}
                <FormField
                  label={
                    variations.length > 0
                      ? "Avisar por variação com"
                      : "Avisar quando tiver"
                  }
                  optional
                >
                  <TextField
                    icon="notifications-outline"
                    placeholder={variations.length > 0 ? "Ex: 3" : "Ex: 10"}
                    suffix="ou menos"
                    value={stockAlert}
                    onChangeText={setStockAlert}
                    keyboardType="number-pad"
                    numericMode="integer"
                  />
                </FormField>
              </FormGrid>
            </FormSection>
          ) : null}
        </FormBody>
      </View>
    </>
  );

  function goToNextStep() {
    if (formStep === 1 && !formValidation.validate()) return;
    setFormStep((current) => current + 1);
  }

  const submitTitle = uploading
    ? "Enviando foto…"
    : `Cadastrar ${experienceCopy.productNoun}`;

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

  const componentCreationModal = creatingComponent ? (
    <CreateProductForm
      simpleOnly
      modal={{
        visible: modal.visible,
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

  let secondaryAction = (
    <Button
      title="Cancelar"
      variant="outline"
      disabled={loading}
      onPress={() => {
        setCreatingComponent(false);
        modal.onClose();
      }}
    />
  );
  if (formStep > 1) {
    secondaryAction = (
      <Button
        title="Voltar"
        variant="outline"
        disabled={loading}
        onPress={() => setFormStep((current) => current - 1)}
      />
    );
  } else if (modal.returnAction) {
    secondaryAction = (
      <Button
        title={modal.returnAction.label}
        variant="outline"
        disabled={loading}
        onPress={modal.returnAction.onPress}
      />
    );
  }

  return (
    <>
      <StandardModal
        title={modal.title}
        size="form"
        visible={modal.visible && !creatingComponent}
        onClose={() => {
          setCreatingComponent(false);
          modal.onClose();
        }}
        footer={
          <FormActions>
            {secondaryAction}
            {formStep < PRODUCT_FORM_STEPS.length ? (
              <Button title="Continuar" disabled={loading} onPress={goToNextStep} />
            ) : (
              <Button
                title={submitTitle}
                loading={loading}
                onPress={() => {
                  void handleSubmit();
                }}
              />
            )}
          </FormActions>
        }
      >
        <FormStepProgress
          current={formStep}
          steps={PRODUCT_FORM_STEPS}
          onStepPress={(step) => {
            if (step > 1 && formStep === 1 && !formValidation.validate()) return;
            setFormStep(step);
          }}
        />
        {fields}
      </StandardModal>
      {componentCreationModal}
      {scanner}
    </>
  );
}
