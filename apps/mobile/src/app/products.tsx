import { formatCurrency } from "../shared/utils/format";
import type { Product, ProductVariationInput, SaleUnit } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Typography,
  useBrand,
  useFeature,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "../features/products/components/component-picker";
import { CompositeToggle } from "../features/products/components/composite-toggle";
import { CreateProductForm } from "../features/products/components/create-product-form";
import { ProductList } from "../features/products/components/product-list";
import { productInitial } from "../features/products/display";
import { SaleUnitToggle } from "../features/products/components/sale-unit-toggle";
import { VariationEditor } from "../features/products/components/variation-editor";
import {
  availableProductStock,
  summarizeLowStockProducts,
  totalVariationStock,
  validateVariations,
} from "../features/products/variations";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { useProfile } from "../features/subscription/hooks";
import { businessCopyFor } from "../features/subscription/business-copy";
import { showAlert } from "../shared/components/alert-store";
import { BarcodeScanner } from "../shared/components/barcode-scanner";
import { ScreenHeader } from "../shared/components/screen-header";
import { FAB } from "../shared/components/fab";
import { Skeleton, SkeletonCard } from "../shared/components/skeleton";
import { StandardModal } from "../shared/components/standard-modal";
import { FormSection } from "../shared/components/form-section";
import {
  useDeleteProduct,
  useAdjustProductStock,
  useAllProducts,
  useLowStockProducts,
  useProduct,
  useSalesVelocity,
  useStockMovements,
  useUpdateProduct,
} from "../features/products/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useNotificationEnabled } from "../shared/hooks/notification-prefs";
import catalogProductsIllustration from "../assets/catalog-products.png";
import { brandScreenPalette } from "../shared/brand-palette";
import { desktopStretch, desktopWidths } from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { NOTIFICATION_TYPES } from "../shared/hooks/notification-types";
import { uploadProductImage } from "../shared/utils/upload-image";
import { alertValidation, alertError } from "../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../shared/utils/currency-input";

type ProductTypeFilter = "all" | "product" | "kit";
type ProductStatusFilter = "all" | "stock" | "out" | "fast" | "slow";
type ProductSort = "name" | "price" | "stock";

const PRODUCT_STATUS_FILTERS: ReadonlyArray<{
  value: ProductStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Qualquer situação" },
  { value: "stock", label: "Repor" },
  { value: "out", label: "Sem estoque" },
  { value: "fast", label: "Venda rápida" },
  { value: "slow", label: "Venda lenta" },
];

const PRODUCT_SORT_LABELS: Record<ProductSort, string> = {
  name: "A–Z",
  price: "Maior preço",
  stock: "Menor estoque",
};

/** Preco de venda com sufixo "/kg" quando o produto e vendido por peso. */
function priceLabel(p: Product): string {
  return p.saleUnit === "kg"
    ? `${formatCurrency(p.salePrice)}/kg`
    : formatCurrency(p.salePrice);
}

function stockLabel(p: Product): string {
  const quantity = totalVariationStock(p.variations) ?? p.stockQuantity;
  if (quantity === null) return "Não controlado";
  if (quantity === 0) return "Sem estoque";
  return `${quantity} un.`;
}

function isLowStock(p: Product): boolean {
  if (p.stockAlertThreshold === null) return false;
  if (p.variations?.length) {
    return p.variations.some(
      (variation) =>
        variation.stockQuantity !== undefined &&
        variation.stockQuantity <= p.stockAlertThreshold!,
    );
  }
  return p.stockQuantity !== null && p.stockQuantity <= p.stockAlertThreshold;
}

function movementLabel(type: string): string {
  const labels: Record<string, string> = {
    sale: "Venda",
    purchase: "Compra",
    adjustment: "Ajuste",
    cancellation: "Cancelamento",
    production: "Produção",
  };
  return labels[type] ?? "Movimentação";
}

function StockValue({ product }: Readonly<{ product: Product }>) {
  const { theme } = useTheme();
  let color = theme.colors.success;
  if ((totalVariationStock(product.variations) ?? product.stockQuantity) === null)
    color = theme.colors.textSecondary;
  else if (isLowStock(product)) color = theme.colors.alert;

  return (
    <Typography variant="bodyBold" color={color}>
      {stockLabel(product)}
    </Typography>
  );
}

function ProductDetailModal({
  productId,
  visible,
  onClose,
}: Readonly<{
  productId: string;
  visible: boolean;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  const { copy } = useBrand();
  const variationsEnabled = useFeature("catalogoCores");
  const directCostEnabled = useFeature("custoDireto");
  const weightEnabled = useFeature("vendaPorPeso");
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const adjustStock = useAdjustProductStock();
  const { data: stockMovements = [] } = useStockMovements(productId);
  const { imageUri, showPicker, setImageUri } = useImagePicker();
  const [uploading, setUploading] = useState(false);
  const { data: profile } = useProfile();
  const isPremium =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "compositeProducts");
  const showPaywall = usePaywall((s) => s.show);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [code, setCode] = useState("");
  const [variations, setVariations] = useState<ProductVariationInput[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockVariationId, setStockVariationId] = useState<string | null>(null);

  function handleAddStock() {
    const delta = Number.parseInt(stockDelta, 10);
    if (!Number.isInteger(delta) || delta <= 0) {
      alertValidation("Informe uma quantidade inteira maior que zero.");
      return;
    }
    if ((product?.variations?.length ?? 0) > 0 && !stockVariationId) {
      alertValidation("Escolha a variação que recebeu estoque.");
      return;
    }
    adjustStock.mutate(
      {
        productId,
        data: {
          delta,
          variationId: stockVariationId,
          reason: stockReason.trim() || "Reposição manual",
        },
      },
      {
        onSuccess: () => {
          setStockDelta("");
          setStockReason("");
        },
        onError: (error) => alertError(error),
      },
    );
  }

  function startEditing(p: Product) {
    setName(p.name);
    setCategory(p.category);
    setSalePrice(currencyInput(p.salePrice));
    setCostPrice(p.costPrice === null ? "" : currencyInput(p.costPrice));
    setSaleUnit(p.saleUnit);
    setDescription(p.description ?? "");
    setCode(p.code ?? "");
    setVariations(p.variations ?? []);
    setStockQuantity(p.stockQuantity !== null ? String(p.stockQuantity) : "");
    setStockAlert(p.stockAlertThreshold !== null ? String(p.stockAlertThreshold) : "");
    setIsComposite(p.isComposite);
    setComponents(
      (p.components ?? []).map((c) => ({
        componentProductId: c.componentProductId,
        quantity: String(c.quantity).replace(".", ","),
      })),
    );
    setImageUri(p.photoUrl ?? null);
    setEditing(true);
  }

  async function handleSave() {
    const price = parseCurrencyInput(salePrice);
    const cost = costPrice ? parseCurrencyInput(costPrice) : undefined;
    if (!name.trim()) {
      alertValidation("Coloque o nome do produto");
      return;
    }
    if (isNaN(price) || price <= 0) {
      alertValidation("O preço precisa ser maior que zero");
      return;
    }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      alertValidation("O custo não pode ser negativo");
      return;
    }
    const variationError = validateVariations(variations);
    if (variationsEnabled && variationError) {
      alertValidation(variationError);
      return;
    }

    const componentsPayload = isComposite ? draftsToComponents(components) : undefined;
    if (isComposite && (componentsPayload?.length ?? 0) === 0) {
      alertValidation("Escolha pelo menos um produto para montar o kit");
      return;
    }

    let stockReview = "Sem controle de estoque";
    if (saleUnit === "kg") stockReview = "Vendido por peso";
    else if (isComposite) stockReview = "Estoque calculado pelos componentes";
    else if (stockQuantity.trim()) stockReview = `${stockQuantity} em estoque`;
    const gainReview =
      cost === undefined
        ? "Custo não informado"
        : `Ganho bruto de ${formatCurrency(price - cost)}`;
    const confirmed = await new Promise<boolean>((resolve) => {
      showAlert({
        title: "Revisar alterações",
        message: [
          name.trim(),
          category.trim(),
          `Venda: ${formatCurrency(price)}`,
          gainReview,
          stockReview,
        ].join("\n"),
        buttons: [
          { text: "Voltar e editar", style: "cancel", onPress: () => resolve(false) },
          { text: "Salvar alterações", onPress: () => resolve(true) },
        ],
      });
    });
    if (!confirmed) return;

    // Foto: mantém a URL atual (http) ou sobe a nova (file://) pro storage.
    let photoUrl: string | undefined;
    if (imageUri) {
      if (imageUri.startsWith("http")) {
        photoUrl = imageUri;
      } else {
        try {
          setUploading(true);
          photoUrl = await uploadProductImage(imageUri);
        } catch {
          showAlert({
            title: "Foto não enviada",
            message:
              "Não consegui enviar a foto agora. As outras alterações serão salvas.",
          });
        } finally {
          setUploading(false);
        }
      }
    }

    try {
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          name: name.trim(),
          category: category.trim(),
          salePrice: price,
          saleUnit: weightEnabled ? saleUnit : "unit",
          costPrice: directCostEnabled ? cost : undefined,
          description: description.trim() || undefined,
          photoUrl,
          code: code.trim() || undefined,
          // Estoque por unidades nao se aplica a venda por peso (kg) nem a kits.
          stockQuantity:
            saleUnit === "kg" || isComposite || !stockQuantity.trim()
              ? undefined
              : parseInt(stockQuantity, 10),
          stockAlertThreshold:
            saleUnit === "kg" || isComposite || !stockAlert.trim()
              ? undefined
              : parseInt(stockAlert, 10),
          isComposite,
          components: componentsPayload,
          variations: variationsEnabled ? variations : undefined,
        },
      });
      showAlert({ title: "Produto atualizado!" });
      setEditing(false);
    } catch {
      alertError("Não foi possível atualizar o produto.");
    }
  }

  function handleDelete() {
    showAlert({
      title: "Excluir produto",
      message: "Tem certeza que deseja excluir este produto?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteProduct.mutateAsync(productId);
                onClose();
              } catch {
                alertError("Não foi possível excluir o produto.");
              }
            })();
          },
        },
      ],
    });
  }

  const parsedEditPrice = salePrice ? parseCurrencyInput(salePrice) : 0;
  const parsedEditCost = costPrice ? parseCurrencyInput(costPrice) : null;
  const editGain = parsedEditCost === null ? null : parsedEditPrice - parsedEditCost;
  const editMargin =
    editGain === null || parsedEditPrice <= 0 ? null : (editGain / parsedEditPrice) * 100;

  if (!editing) {
    return (
      <StandardModal
        visible={visible}
        onClose={onClose}
        title="Detalhes do produto"
        right={
          product ? (
            <Pressable
              onPress={() => startEditing(product)}
              accessibilityRole="button"
              accessibilityLabel="Editar produto"
              hitSlop={8}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <AppIcon
                name="create-outline"
                size={22}
                color={theme.colors.primaryStrong}
              />
            </Pressable>
          ) : null
        }
      >
        {isLoading ? (
          <View style={{ flexShrink: 1, gap: spacing.lg, alignItems: "center" }}>
            <Skeleton width={96} height={96} borderRadius={radii.full} />
            <Skeleton width="55%" height={20} />
            <SkeletonCard lines={3} style={{ alignSelf: "stretch" }} />
            <SkeletonCard lines={2} style={{ alignSelf: "stretch" }} />
          </View>
        ) : null}
        {!isLoading && !product ? (
          <View style={{ flexShrink: 1, justifyContent: "center", alignItems: "center" }}>
            <Typography variant="caption">Produto não encontrado</Typography>
          </View>
        ) : null}
        {!isLoading && product ? (
          <View style={{ flexShrink: 1, gap: spacing.lg }}>
            <View style={{ alignItems: "center", gap: spacing.md }}>
              {product.photoUrl ? (
                <Image
                  source={{ uri: product.photoUrl }}
                  style={{ width: 96, height: 96, borderRadius: radii.full }}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: radii.full,
                    backgroundColor: theme.colors.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="display" color={theme.colors.primaryStrong}>
                    {productInitial(product.name)}
                  </Typography>
                </View>
              )}
              <Typography
                variant="h3"
                style={{ alignSelf: "stretch", textAlign: "center" }}
              >
                {product.name}
              </Typography>
              {product.isComposite && <Badge label="Kit" variant="lavender" />}
              <Typography variant="caption">{product.category}</Typography>
            </View>

            <Card>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="caption">
                    {product.saleUnit === "kg" ? "Preço por kg" : "Preço de venda"}
                  </Typography>
                  <Typography variant="h3" color={theme.colors.success}>
                    {priceLabel(product)}
                  </Typography>
                </View>
                {product.isComposite && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="caption">Custo do kit</Typography>
                    <Typography variant="bodyBold">
                      {product.costPrice != null
                        ? formatCurrency(product.costPrice)
                        : "Sem custo"}
                    </Typography>
                  </View>
                )}
                {directCostEnabled && !product.isComposite && (
                  <>
                    <View
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">Custo unitário</Typography>
                      <Typography variant="bodyBold">
                        {product.costPrice == null
                          ? "Não informado"
                          : formatCurrency(product.costPrice)}
                      </Typography>
                    </View>
                    {product.costPrice != null ? (
                      <View
                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                      >
                        <Typography variant="caption">
                          Ganho bruto com o custo informado
                        </Typography>
                        <Typography variant="bodyBold" color={theme.colors.success}>
                          {formatCurrency(product.salePrice - product.costPrice)}
                        </Typography>
                      </View>
                    ) : null}
                  </>
                )}
                {product.saleUnit === "unit" && !product.isComposite && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="caption">{copy.stockLabel}</Typography>
                    <StockValue product={product} />
                  </View>
                )}
                {variationsEnabled && (product.variations?.length ?? 0) > 0 ? (
                  <View style={{ gap: spacing.xs }}>
                    <Typography variant="caption">Variações</Typography>
                    {product.variations?.map((variation) => (
                      <View
                        key={variation.id}
                        style={{ flexDirection: "row", justifyContent: "space-between" }}
                      >
                        <Typography variant="body">{variation.name}</Typography>
                        <Typography variant="caption">
                          {variation.stockQuantity === undefined
                            ? "Sem controle"
                            : `${variation.stockQuantity} un.`}
                        </Typography>
                      </View>
                    ))}
                  </View>
                ) : null}
                {product.saleUnit === "unit" &&
                  !product.isComposite &&
                  product.stockQuantity !== null &&
                  product.stockAlertThreshold !== null && (
                    <View
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <Typography variant="caption">Avisar quando atingir</Typography>
                      <Typography variant="caption">
                        {product.stockAlertThreshold} un.
                      </Typography>
                    </View>
                  )}
                {product.description && (
                  <View style={{ gap: spacing.xs }}>
                    <Typography variant="caption">Descrição</Typography>
                    <Typography variant="body">{product.description}</Typography>
                  </View>
                )}
              </View>
            </Card>

            {product.isComposite && product.components && (
              <Card>
                <View style={{ gap: spacing.sm }}>
                  <Typography variant="bodyBold">O que vem no kit</Typography>
                  {product.components.map((c) => (
                    <View
                      key={c.componentProductId}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="body"
                        style={{ flex: 1, minWidth: 0 }}
                        numberOfLines={2}
                      >
                        {c.quantity}x {c.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={theme.colors.textSecondary}
                        style={{ flexShrink: 0 }}
                      >
                        {c.costPrice != null
                          ? formatCurrency(c.costPrice * c.quantity)
                          : "Sem custo"}
                      </Typography>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {product.saleUnit === "unit" &&
            !product.isComposite &&
            (product.stockQuantity !== null || (product.variations?.length ?? 0) > 0) ? (
              <Card>
                <View style={{ gap: spacing.md }}>
                  <View>
                    <Typography variant="h3">Adicionar estoque</Typography>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Registre a reposição sem abrir a edição do produto.
                    </Typography>
                  </View>
                  {(product.variations?.length ?? 0) > 0 ? (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.sm,
                      }}
                    >
                      {product.variations?.map((variation) => (
                        <Chip
                          key={variation.id}
                          label={variation.name}
                          selected={stockVariationId === variation.id}
                          onPress={() => setStockVariationId(variation.id)}
                        />
                      ))}
                    </View>
                  ) : null}
                  <Input
                    label="Quantidade recebida"
                    value={stockDelta}
                    onChangeText={setStockDelta}
                    keyboardType="number-pad"
                    placeholder="Ex.: 12"
                  />
                  <Input
                    label="Motivo (opcional)"
                    value={stockReason}
                    onChangeText={setStockReason}
                    placeholder="Ex.: compra do fornecedor"
                  />
                  <Button
                    title="Adicionar ao estoque"
                    variant="secondary"
                    onPress={handleAddStock}
                    loading={adjustStock.isPending}
                  />
                </View>
              </Card>
            ) : null}

            {stockMovements.length > 0 ? (
              <Card>
                <View style={{ gap: spacing.md }}>
                  <Typography variant="h3">Histórico de movimentações</Typography>
                  {stockMovements.slice(0, 8).map((movement) => (
                    <View
                      key={movement.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Typography variant="bodyBold">
                          {movementLabel(movement.type)}
                        </Typography>
                        <Typography variant="caption" color={theme.colors.textSecondary}>
                          {new Date(movement.occurredAt).toLocaleDateString("pt-BR")}
                          {movement.reason ? ` · ${movement.reason}` : ""}
                        </Typography>
                      </View>
                      <Typography
                        variant="bodyBold"
                        color={
                          movement.delta > 0 ? theme.colors.success : theme.colors.alert
                        }
                      >
                        {movement.delta > 0 ? "+" : ""}
                        {movement.delta}
                      </Typography>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <Button
              title="Excluir produto"
              variant="secondary"
              onPress={handleDelete}
              loading={deleteProduct.isPending}
            />
          </View>
        ) : null}
      </StandardModal>
    );
  }

  return (
    <StandardModal
      title="Editar produto"
      visible={visible && editing}
      onClose={onClose}
      footer={
        <>
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={() => setEditing(false)}
            style={{ flex: 1 }}
          />
          <Button
            title={uploading ? "Enviando foto..." : "Salvar"}
            size="lg"
            onPress={() => {
              void handleSave();
            }}
            loading={updateProduct.isPending || uploading}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      {!isLoading && product ? (
        <View style={{ flexShrink: 1, gap: spacing.lg }}>
          <FormSection
            title="Informações básicas"
            subtitle="Nome, categoria e tipo do produto"
            icon="pricetag-outline"
            initiallyOpen
          >
            <Input label="Nome do produto" value={name} onChangeText={setName} />
            <Input label="Categoria" value={category} onChangeText={setCategory} />
            {variationsEnabled && !isComposite ? (
              <VariationEditor value={variations} onChange={setVariations} />
            ) : null}
            <CompositeToggle
              value={isComposite}
              onChange={(next) => {
                if (next && !isPremium) {
                  showPaywall("compositeProducts");
                  return;
                }
                setIsComposite(next);
              }}
              locked={!isPremium}
            />
            {isComposite && (
              <ComponentPicker
                value={components}
                onChange={setComponents}
                excludeProductId={productId}
              />
            )}
          </FormSection>
          <FormSection
            title="Preço e custo"
            subtitle="Confira o ganho antes de salvar"
            icon="cash-outline"
            initiallyOpen
          >
            {!isComposite && weightEnabled ? (
              <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />
            ) : null}
            <Input
              label={
                saleUnit === "kg" && !isComposite
                  ? "Preço por kg (R$)"
                  : "Preço de venda (R$)"
              }
              value={salePrice}
              onChangeText={(value) => setSalePrice(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
            {directCostEnabled && !isComposite ? (
              <Input
                label="Custo unitário (R$)"
                value={costPrice}
                onChangeText={(value) => setCostPrice(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            ) : null}
            {editGain !== null && editMargin !== null ? (
              <View
                style={{
                  borderRadius: radii.xl,
                  padding: spacing.lg,
                  gap: spacing.xs,
                  backgroundColor:
                    editGain >= 0 ? theme.colors.successBg : theme.colors.alertBg,
                }}
              >
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Estimativa com os custos informados
                </Typography>
                <Typography
                  variant="h3"
                  color={editGain >= 0 ? theme.colors.success : theme.colors.alert}
                >
                  Ganho bruto: {formatCurrency(editGain)}
                </Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Margem sobre o preço: {editMargin.toFixed(1).replace(".", ",")}%
                </Typography>
              </View>
            ) : null}
          </FormSection>
          <FormSection
            title="Foto e descrição"
            subtitle="Apresentação do produto no catálogo"
            icon="camera-outline"
          >
            <View>
              <Typography variant="caption" style={{ marginBottom: spacing.sm }}>
                Foto do produto
              </Typography>
              <Pressable
                onPress={showPicker}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: 100, height: 100 }} />
                ) : (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <AppIcon
                      name="camera-outline"
                      size={28}
                      color={theme.colors.textSecondary}
                    />
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Adicionar
                    </Typography>
                  </View>
                )}
              </Pressable>
            </View>
            <Input
              label="Descrição (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
            />
          </FormSection>
          <FormSection
            title="Estoque e identificação"
            subtitle="Código, quantidade disponível e alerta de reposição"
            icon="albums-outline"
            initiallyOpen
          >
            <View
              style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}
            >
              <View style={{ flex: 1 }}>
                <Input
                  label="Código de barras (opcional)"
                  placeholder="Ex: 789..."
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <Pressable
                onPress={() => setShowScanner(true)}
                accessibilityRole="button"
                accessibilityLabel="Escanear código"
                style={{
                  width: 56,
                  height: 52,
                  borderRadius: radii.md,
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
            {saleUnit === "unit" && !isComposite && variations.length === 0 && (
              <>
                <Input
                  label="Quantidade em estoque (opcional)"
                  placeholder="Ex: 50"
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  keyboardType="number-pad"
                />
                <Input
                  label="Alerta de estoque baixo (opcional)"
                  placeholder="Ex: 10"
                  value={stockAlert}
                  onChangeText={setStockAlert}
                  keyboardType="number-pad"
                />
              </>
            )}
            {saleUnit === "unit" && !isComposite && variations.length > 0 ? (
              <Input
                label="Alerta por variação (opcional)"
                placeholder="Ex: 3"
                value={stockAlert}
                onChangeText={setStockAlert}
                keyboardType="number-pad"
              />
            ) : null}
          </FormSection>
          <BarcodeScanner
            visible={showScanner}
            onClose={() => setShowScanner(false)}
            onScanned={(scanned) => {
              setShowScanner(false);
              setCode(scanned);
            }}
          />
        </View>
      ) : null}
    </StandardModal>
  );
}

function CatalogIndicator({
  icon,
  value,
  label,
  compact,
}: Readonly<{
  icon: "cube-outline" | "gift-outline";
  value: number;
  label: string;
  compact: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);

  if (compact) {
    return (
      <View style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: radii.full,
              backgroundColor: palette.lime,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name={icon} size={16} color={palette.onLime} />
          </View>
          <Typography variant="captionBold" color={palette.onWine}>
            {value}
          </Typography>
        </View>
        <Typography
          variant="homeMetricLabel"
          color={palette.onWine}
          numberOfLines={1}
          style={{ textAlign: "center" }}
        >
          {label}
        </Typography>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radii.full,
          backgroundColor: palette.lime,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <AppIcon name={icon} size={18} color={palette.onLime} />
      </View>
      <Typography
        variant="captionBold"
        color={palette.onWine}
        numberOfLines={2}
        style={{ flexShrink: 1 }}
      >
        {value} {label}
      </Typography>
    </View>
  );
}

function CatalogMetric({
  value,
  label,
  showDivider,
  compact,
}: Readonly<{
  value: number;
  label: string;
  showDivider?: boolean;
  compact: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: compact ? 82 : 88,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.xs,
        borderLeftWidth: showDivider ? 1 : 0,
        borderLeftColor: palette.softRose,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: radii.full,
          backgroundColor: palette.lime,
          marginBottom: spacing.xs,
        }}
      />
      <Typography variant={compact ? "h3" : "h2"} color={palette.ink} numberOfLines={1}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        color={palette.warmGray}
        numberOfLines={2}
        style={{ textAlign: "center" }}
      >
        {label}
      </Typography>
    </View>
  );
}

function CatalogOverview({
  totalItems,
  productCount,
  kitCount,
  stockUnits,
  productLabel,
  kitLabel,
  isDesktop,
}: Readonly<{
  totalItems: number;
  productCount: number;
  kitCount: number;
  stockUnits: number;
  productLabel: string;
  kitLabel: string;
  isDesktop: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const { width: viewportWidth } = useWindowDimensions();
  const compact = viewportWidth < 375;
  const compactIndicators = viewportWidth <= 430;
  const horizontalGutter = compact ? spacing.lg : spacing.xl;
  const availableWidth = viewportWidth - (isDesktop ? 0 : horizontalGutter * 2);
  const cardWidth = Math.min(720, Math.max(280, availableWidth));
  const heroHeight = Math.max(184, Math.min(240, cardWidth * 0.52));
  let illustrationRatio = 0.43;
  if (viewportWidth <= 430) illustrationRatio = 0.42;
  const illustrationSize = Math.min(
    300,
    cardWidth * illustrationRatio,
    heroHeight * 0.88,
  );
  let copyWidth: "48%" | "50%" | "52%" = "50%";
  if (compact) copyWidth = "52%";
  else if (viewportWidth <= 430) copyWidth = "48%";
  let titleVariant: "h1" | "h2" | "h3" = "h1";
  if (viewportWidth < 350) titleVariant = "h3";
  else if (viewportWidth <= 430) titleVariant = "h2";

  return (
    <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
      <View
        style={{
          height: heroHeight,
          borderRadius: radii["2xl"],
          backgroundColor: palette.wineFill,
          overflow: "hidden",
          padding: compact ? spacing.lg : spacing.xl,
        }}
      >
        <View
          style={{
            width: copyWidth,
            height: "100%",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <View style={{ gap: spacing.xs }}>
            <Typography variant={titleVariant} color={palette.onWine} numberOfLines={2}>
              {"Seu cat\u00e1logo"}
            </Typography>
            <Typography variant="body" color={palette.onWine} numberOfLines={2}>
              {totalItems} {totalItems === 1 ? "item organizado" : "itens organizados"}
            </Typography>
          </View>

          <View
            style={{
              minHeight: 52,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.24)",
              borderRadius: radii.lg,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }}
          >
            <CatalogIndicator
              icon="cube-outline"
              value={productCount}
              label={productLabel.toLocaleLowerCase("pt-BR")}
              compact={compactIndicators}
            />
            <View
              style={{
                width: 1,
                height: 28,
                marginHorizontal: spacing.xs,
                backgroundColor: "rgba(255,255,255,0.28)",
              }}
            />
            <CatalogIndicator
              icon="gift-outline"
              value={kitCount}
              label={kitLabel.toLocaleLowerCase("pt-BR")}
              compact={compactIndicators}
            />
          </View>
        </View>

        <Image
          source={catalogProductsIllustration}
          resizeMode="contain"
          accessible={false}
          style={{
            position: "absolute",
            right: compact ? spacing.sm : spacing.md,
            bottom: compact ? spacing.sm : spacing.md,
            width: illustrationSize,
            height: illustrationSize,
            objectFit: "contain",
          }}
        />
      </View>

      <View
        accessibilityLabel={`${productCount} produtos, ${kitCount} kits, ${stockUnits} unidades em estoque`}
        style={{
          width: "100%",
          marginTop: compact ? spacing.md : spacing.lg,
          flexDirection: "row",
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: palette.softRose,
          backgroundColor: palette.white,
          overflow: "hidden",
        }}
      >
        <CatalogMetric value={productCount} label="produtos" compact={compact} />
        <CatalogMetric value={kitCount} label="kits" compact={compact} showDivider />
        <CatalogMetric
          value={stockUnits}
          label="un. em estoque"
          compact={compact}
          showDivider
        />
      </View>
    </View>
  );
}

function LowStockBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  const { theme } = useTheme();
  const stockEnabled = useFeature("estoque");
  const { data } = useLowStockProducts();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);

  // O aviso de estoque baixo respeita a preferência de "Estoque baixo" das
  // configurações: desligou, some também o alerta visual (não só a notificação).
  if (!stockEnabled || !enabled || !data) return null;

  const summary = summarizeLowStockProducts(data);
  const attentionCount = summary.outOfStock + summary.lowStock;
  const isAllGood = attentionCount === 0;
  const attentionLabel =
    attentionCount === 1
      ? "1 item precisa de atenção"
      : `${attentionCount} itens precisam de atenção`;

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={{
        marginTop: spacing.sm,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: isAllGood
                ? theme.colors.successBg
                : theme.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name={isAllGood ? "checkmark-circle-outline" : "cube-outline"}
              size={22}
              color={isAllGood ? theme.colors.success : theme.colors.primaryStrong}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="bodyBold">Meu estoque</Typography>
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              numberOfLines={2}
            >
              {isAllGood ? "Tudo em dia por aqui" : attentionLabel}
            </Typography>
          </View>
        </View>
        {!isAllGood ? (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Ver itens para repor"
            style={{
              flexShrink: 0,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Ver itens
            </Typography>
            <AppIcon
              name="chevron-forward"
              size={18}
              color={theme.colors.primaryStrong}
            />
          </Pressable>
        ) : null}
      </View>

      {!isAllGood ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${summary.outOfStock} sem estoque`}
            style={{
              flex: 1,
              minHeight: 76,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.alertBg,
              padding: spacing.md,
              justifyContent: "center",
              gap: spacing.xs,
            }}
          >
            <Typography variant="h3" color={theme.colors.alert}>
              {summary.outOfStock}
            </Typography>
            <Typography variant="caption" color={theme.colors.text}>
              Sem estoque
            </Typography>
          </Pressable>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${summary.lowStock} com estoque baixo`}
            style={{
              flex: 1,
              minHeight: 76,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.yellowBg,
              padding: spacing.md,
              justifyContent: "center",
              gap: spacing.xs,
            }}
          >
            <Typography variant="h3" color={theme.colors.yellow}>
              {summary.lowStock}
            </Typography>
            <Typography variant="caption" color={theme.colors.text}>
              Estoque baixo
            </Typography>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

export default function ProductsScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const brand = useBrand();
  const { data: profile } = useProfile();
  const experienceCopy = businessCopyFor(profile?.businessType, brand.copy);
  const productTypeFilters: ReadonlyArray<{
    value: ProductTypeFilter;
    label: string;
  }> = [
    { value: "all", label: "Todos" },
    {
      value: "product",
      label: brand.copy.productNounPlural.replace(/^./, (letter) => letter.toUpperCase()),
    },
    {
      value: "kit",
      label:
        experienceCopy.profile === "services" || experienceCopy.profile === "beauty"
          ? "Pacotes"
          : "Kits",
    },
  ];
  const isDesktop = useDesktopLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const compactLayout = viewportWidth < 375;
  const contentGutter = compactLayout ? spacing.lg : spacing.xl;
  const listContentMaxWidth = isDesktop ? desktopWidths.wide : desktopWidths.standard;
  const router = useRouter();
  const { from, create, salePrice, stock } = useLocalSearchParams<{
    from?: string;
    create?: string;
    salePrice?: string;
    stock?: string;
  }>();
  const guidedCreate = create === "getting-started";
  const [showCreate, setShowCreate] = useState(create === "from-pricing" || guidedCreate);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const stockEnabled = useFeature("estoque");
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>(
    stock === "low" && stockEnabled ? "stock" : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<ProductSort>("name");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showPaywall = usePaywall((s) => s.show);
  const productsQuery = useAllProducts();
  const products = productsQuery.data ?? [];
  const catalogMetrics = useMemo(
    () =>
      products.reduce(
        (summary, product) => {
          if (product.isComposite) summary.kits += 1;
          else summary.products += 1;

          if (product.saleUnit === "kg") return summary;
          const availableStock = availableProductStock(product);
          if (availableStock !== null) summary.stockUnits += Math.max(0, availableStock);
          return summary;
        },
        { products: 0, kits: 0, stockUnits: 0 },
      ),
    [products],
  );
  const { data: velocity } = useSalesVelocity();
  const backToHome =
    from === "onboarding" || from === "getting-started" || !router.canGoBack();
  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [products],
  );
  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = products.filter((product) => {
      if (
        normalizedSearch &&
        !product.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      ) {
        return false;
      }
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (typeFilter === "product" && product.isComposite) return false;
      if (typeFilter === "kit" && !product.isComposite) return false;
      if (statusFilter === "stock" && !isLowStock(product)) return false;
      if (statusFilter === "out" && stockLabel(product) !== "Sem estoque") return false;
      if (statusFilter === "fast" && !velocity?.fast.includes(product.id)) return false;
      if (statusFilter === "slow" && !velocity?.slow.includes(product.id)) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "price") return b.salePrice - a.salePrice;
      if (sort === "stock") {
        const stockA = totalVariationStock(a.variations) ?? a.stockQuantity ?? -1;
        const stockB = totalVariationStock(b.variations) ?? b.stockQuantity ?? -1;
        return stockA - stockB;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [categoryFilter, products, search, sort, statusFilter, typeFilter, velocity]);

  const activeFilterCount =
    Number(statusFilter !== "all") +
    Number(categoryFilter !== null) +
    Number(sort !== "name");
  const selectedStatusLabel =
    PRODUCT_STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ??
    "Qualquer situação";

  useEffect(() => {
    if (create === "from-pricing" || guidedCreate) setShowCreate(true);
  }, [create, guidedCreate]);

  useEffect(() => {
    if (stock === "low" && stockEnabled) setStatusFilter("stock");
  }, [stock, stockEnabled]);

  function handleBack() {
    if (backToHome) {
      router.replace("/tabs");
      return;
    }
    router.back();
  }

  const catalogListHeader = (
    <View style={{ width: "100%", gap: compactLayout ? spacing.md : spacing.lg }}>
      <View
        style={{
          width: "100%",
          minHeight: compactLayout ? 52 : 56,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: palette.softRose,
          backgroundColor: palette.white,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          ...theme.shadows.sm,
        }}
      >
        <AppIcon name="search-outline" size={24} color={palette.ink} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Buscar ${brand.copy.productNoun}`}
          placeholderTextColor={palette.warmGray}
          style={{
            flex: 1,
            minWidth: 0,
            color: theme.colors.text,
            fontSize: compactLayout ? 15 : 16,
            paddingVertical: 0,
          }}
        />
      </View>

      <View
        accessibilityRole="tablist"
        style={{
          width: "100%",
          minHeight: 48,
          flexDirection: "row",
          alignItems: "stretch",
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: palette.softRose,
          backgroundColor: palette.white,
          overflow: "hidden",
        }}
      >
        {productTypeFilters.map((filter) => {
          const selected = typeFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setTypeFilter(filter.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 46,
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: spacing.xs,
                backgroundColor: selected ? palette.rose : "transparent",
                opacity: pressed ? 0.82 : 1,
              })}
            >
              <Typography
                variant="bodyBold"
                color={selected ? palette.onWine : palette.rose}
                numberOfLines={1}
              >
                {filter.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setFiltersOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilterCount > 0 ? `Filtros, ${activeFilterCount} ativos` : "Abrir filtros"
        }
        style={({ pressed }) => ({
          minHeight: compactLayout ? 44 : 48,
          alignSelf: "flex-start",
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: palette.rose,
          backgroundColor: activeFilterCount > 0 ? palette.softRose : "transparent",
          paddingHorizontal: spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: pressed ? 0.82 : 1,
        })}
      >
        <AppIcon name="options-outline" size={20} color={palette.rose} />
        <Typography variant="bodyBold" color={palette.rose}>
          {activeFilterCount > 0 ? `Filtros (${activeFilterCount})` : "Filtros"}
        </Typography>
      </Pressable>

      <CatalogOverview
        totalItems={products.length}
        productCount={catalogMetrics.products}
        kitCount={catalogMetrics.kits}
        stockUnits={catalogMetrics.stockUnits}
        productLabel={productTypeFilters[1]?.label ?? "Produtos"}
        kitLabel={productTypeFilters[2]?.label ?? "Kits"}
        isDesktop={isDesktop}
      />

      <LimitBanner resource="products" onUpgrade={() => showPaywall("products")} />
      <LowStockBanner onPress={() => setStatusFilter("stock")} />
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: palette.background,
      }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ flex: 1, ...desktopStretch(isDesktop, desktopWidths.data) }}>
        <ScreenHeader
          title={brand.copy.productNounPlural.replace(/^./, (letter) =>
            letter.toUpperCase(),
          )}
          subtitle={"Seu cat\u00e1logo, do seu jeito."}
          onBack={handleBack}
          backLabel={backToHome ? "Ir para o início" : "Voltar"}
          hideBack={isDesktop}
          style={{
            width: "100%",
            maxWidth: listContentMaxWidth,
            alignSelf: "center",
            paddingHorizontal: isDesktop ? 0 : contentGutter,
            paddingTop: spacing.xs,
            paddingBottom: spacing.md,
          }}
          right={
            <FAB
              icon="add"
              header
              accessibilityLabel={`Novo ${brand.copy.productNoun}`}
              onPress={() => setShowCreate(true)}
            />
          }
        />

        <StandardModal
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filtros"
          subtitle="Abra somente a opção que quiser mudar"
          footer={
            <>
              <Button
                title="Limpar"
                variant="secondary"
                onPress={() => {
                  setStatusFilter("all");
                  setCategoryFilter(null);
                  setSort("name");
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Ver produtos"
                onPress={() => setFiltersOpen(false)}
                style={{ flex: 1 }}
              />
            </>
          }
        >
          {stockEnabled ? (
            <FormSection
              title="Situação"
              subtitle={selectedStatusLabel}
              icon="trending-up-outline"
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {PRODUCT_STATUS_FILTERS.map((filter) => (
                  <Chip
                    key={filter.value}
                    label={filter.label}
                    selected={statusFilter === filter.value}
                    onPress={() => setStatusFilter(filter.value)}
                  />
                ))}
              </View>
            </FormSection>
          ) : null}

          <FormSection
            title="Categoria"
            subtitle={categoryFilter ?? "Todas"}
            icon="grid-outline"
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <Chip
                label="Todas"
                selected={categoryFilter === null}
                onPress={() => setCategoryFilter(null)}
              />
              {categories.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={categoryFilter === item}
                  onPress={() => setCategoryFilter(item)}
                />
              ))}
            </View>
          </FormSection>

          <FormSection
            title="Ordenação"
            subtitle={PRODUCT_SORT_LABELS[sort]}
            icon="swap-horizontal-outline"
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {(Object.entries(PRODUCT_SORT_LABELS) as Array<[ProductSort, string]>).map(
                ([value, label]) => (
                  <Chip
                    key={value}
                    label={label}
                    selected={sort === value}
                    onPress={() => setSort(value)}
                  />
                ),
              )}
            </View>
          </FormSection>
        </StandardModal>

        <View style={{ flex: 1 }}>
          <ProductList
            items={productsQuery.error ? [] : visibleProducts}
            onProductPress={(id) => setSelectedProductId(id)}
            onAddPress={() => setShowCreate(true)}
            addButtonTitle={`Novo ${brand.copy.productNoun}`}
            listHeader={catalogListHeader}
            listTitle="Todos os produtos"
            listEmptyState={
              productsQuery.error ? (
                <Card variant="elevated" style={{ marginVertical: spacing.lg }}>
                  <View style={{ gap: spacing.md }}>
                    <Typography variant="h3">
                      {"N\u00e3o foi poss\u00edvel carregar os produtos"}
                    </Typography>
                    <Typography variant="body" color={theme.colors.textSecondary}>
                      {"Verifique sua conex\u00e3o e tente novamente."}
                    </Typography>
                    <Button
                      title="Tentar novamente"
                      variant="secondary"
                      onPress={() => void productsQuery.refetch()}
                    />
                  </View>
                </Card>
              ) : undefined
            }
            contentMaxWidth={listContentMaxWidth}
            horizontalPadding={isDesktop ? 0 : contentGutter}
          />
        </View>
      </View>

      {/* Modal - criar item da marca */}
      <CreateProductForm
        key={`${create ?? "manual"}:${salePrice ?? ""}`}
        modal={{
          visible: showCreate,
          onClose: () => setShowCreate(false),
          title: `Novo ${brand.copy.productNoun}`,
        }}
        initialSalePrice={
          create === "from-pricing" && salePrice ? Number(salePrice) : undefined
        }
        analyticsSource={create === "from-pricing" ? "pricing" : undefined}
        onPriceInvite={
          guidedCreate || create === "from-pricing"
            ? undefined
            : () => router.push("/pricing")
        }
        onSuccess={() => {
          setShowCreate(false);
          if (guidedCreate) router.replace("/tabs");
        }}
      />

      {/* Modal - Detalhe do produto */}
      {selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          visible={true}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </SafeAreaView>
  );
}
