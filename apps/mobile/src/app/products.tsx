import { formatCurrency } from "../shared/utils/format";
import type { Product, ProductVariationInput, SaleUnit } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Chip,
  iconSizes,
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
import React, { useEffect, useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
import { totalVariationStock, validateVariations } from "../features/products/variations";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { useProfile } from "../features/subscription/hooks";
import { showAlert } from "../shared/components/alert-store";
import { BarcodeScanner } from "../shared/components/barcode-scanner";
import { ScreenHeader } from "../shared/components/screen-header";
import { StandardModal } from "../shared/components/standard-modal";
import {
  useDeleteProduct,
  useLowStockProducts,
  useProduct,
  useProducts,
  useUpdateProduct,
} from "../features/products/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useNotificationEnabled } from "../shared/hooks/notification-prefs";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { NOTIFICATION_TYPES } from "../shared/hooks/notification-types";
import { uploadProductImage } from "../shared/utils/upload-image";
import { alertValidation, alertError } from "../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../shared/utils/currency-input";

type ProductKindFilter = "all" | "product" | "kit";

const PRODUCT_KIND_FILTERS: ReadonlyArray<{
  value: ProductKindFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "product", label: "Produtos" },
  { value: "kit", label: "Kits" },
];

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
          <View style={{ flexShrink: 1, justifyContent: "center", alignItems: "center" }}>
            <Typography variant="caption">Carregando...</Typography>
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
                variant="h1"
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
                        <Typography variant="caption">Margem bruta estimada</Typography>
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
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
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
              <AppIcon name="scan-outline" size={24} color={theme.colors.textSecondary} />
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

function LowStockBanner() {
  const { theme } = useTheme();
  const stockEnabled = useFeature("estoque");
  const { data } = useLowStockProducts();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);

  // O aviso de estoque baixo respeita a preferência de "Estoque baixo" das
  // configurações: desligou, some também o alerta visual (não só a notificação).
  if (!stockEnabled || !enabled || !data || data.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginHorizontal: spacing.xl,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.alertBg,
      }}
    >
      <AppIcon name="alert-circle" size={20} color={theme.colors.alert} />
      <Typography variant="caption" color={theme.colors.text} style={{ flex: 1 }}>
        {data.length === 1
          ? "1 produto com estoque baixo"
          : `${data.length} produtos com estoque baixo`}
      </Typography>
    </View>
  );
}

export default function ProductsScreen() {
  const { theme } = useTheme();
  const { copy } = useBrand();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { from, create, salePrice } = useLocalSearchParams<{
    from?: string;
    create?: string;
    salePrice?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(create === "from-pricing");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<ProductKindFilter>("all");
  const showPaywall = usePaywall((s) => s.show);
  const { data: products } = useProducts();
  const hasProducts = (products?.total ?? 0) > 0;
  const backToHome = from === "onboarding" || !router.canGoBack();

  useEffect(() => {
    if (create === "from-pricing") setShowCreate(true);
  }, [create]);

  function handleBack() {
    if (backToHome) {
      router.replace("/tabs");
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title={copy.productNounPlural.replace(/^./, (letter) => letter.toUpperCase())}
        onBack={handleBack}
        backLabel={backToHome ? "Ir para o início" : "Voltar"}
        hideBack={isDesktop}
        right={
          <Pressable
            onPress={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearch("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            hitSlop={10}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="search" size={iconSizes.md} color={theme.colors.text} />
          </Pressable>
        }
      />

      {searchOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              minHeight: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: `${theme.colors.text}1f`,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <AppIcon name="search-outline" size={20} color={theme.colors.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`Buscar ${copy.productNoun}`}
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 16,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        {PRODUCT_KIND_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            selected={kindFilter === filter.value}
            onPress={() => setKindFilter(filter.value)}
          />
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="products"
          onUpgrade={() => showPaywall("products")}
          containerStyle={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}
        />
        <LowStockBanner />
        <ProductList
          search={search.trim() || undefined}
          isComposite={kindFilter === "all" ? undefined : kindFilter === "kit"}
          onProductPress={(id) => setSelectedProductId(id)}
          onAddPress={() => setShowCreate(true)}
        />
      </View>

      {hasProducts ? (
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm + insets.bottom,
          }}
        >
          <Pressable
            onPress={() => setShowCreate(true)}
            accessibilityRole="button"
            accessibilityLabel={`Novo ${copy.productNoun}`}
            style={({ pressed }) => ({
              alignSelf: isDesktop ? "flex-end" : undefined,
              width: isDesktop ? 180 : undefined,
              minHeight: isDesktop ? 44 : 56,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primaryInteractive,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon
              name="add"
              size={isDesktop ? 20 : 24}
              color={theme.colors.textOnPrimary}
            />
            <Typography
              variant={isDesktop ? "bodyBold" : "h3"}
              color={theme.colors.textOnPrimary}
            >
              Novo {copy.productNoun}
            </Typography>
          </Pressable>
        </View>
      ) : null}

      {/* Modal - criar item da marca */}
      <CreateProductForm
        key={`${create ?? "manual"}:${salePrice ?? ""}`}
        modal={{
          visible: showCreate,
          onClose: () => setShowCreate(false),
          title: `Novo ${copy.productNoun}`,
        }}
        initialSalePrice={
          create === "from-pricing" && salePrice ? Number(salePrice) : undefined
        }
        analyticsSource={create === "from-pricing" ? "pricing" : undefined}
        onSuccess={() => setShowCreate(false)}
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
