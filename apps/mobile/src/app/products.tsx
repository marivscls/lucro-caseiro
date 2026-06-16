import { formatCurrency } from "../shared/utils/format";
import type { Product, SaleUnit } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  Input,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "../features/products/components/component-picker";
import { CompositeToggle } from "../features/products/components/composite-toggle";
import { CreateProductForm } from "../features/products/components/create-product-form";
import { ProductList } from "../features/products/components/product-list";
import { SaleUnitToggle } from "../features/products/components/sale-unit-toggle";
import { KeyboardAwareScrollView } from "../shared/components/keyboard-aware-scroll-view";
import {
  useDeleteProduct,
  useLowStockProducts,
  useProduct,
  useUpdateProduct,
} from "../features/products/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { useNotificationEnabled } from "../shared/hooks/notification-prefs";
import { NOTIFICATION_TYPES } from "../shared/hooks/notification-types";
import { uploadProductImage } from "../shared/utils/upload-image";
import { alertValidation, alertError } from "../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../shared/utils/currency-input";

/** Preco de venda com sufixo "/kg" quando o produto e vendido por peso. */
function priceLabel(p: Product): string {
  return p.saleUnit === "kg"
    ? `${formatCurrency(p.salePrice)}/kg`
    : formatCurrency(p.salePrice);
}

function stockLabel(p: Product): string {
  if (p.stockQuantity === null) return "Não controlado";
  if (p.stockQuantity === 0) return "Sem estoque";
  return `${p.stockQuantity} un.`;
}

function isLowStock(p: Product): boolean {
  return (
    p.stockQuantity !== null &&
    p.stockAlertThreshold !== null &&
    p.stockQuantity <= p.stockAlertThreshold
  );
}

function StockValue({ product }: Readonly<{ product: Product }>) {
  const { theme } = useTheme();
  let color = theme.colors.success;
  if (product.stockQuantity === null) color = theme.colors.textSecondary;
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
  const { data: product, isLoading } = useProduct(productId);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { imageUri, showPicker, setImageUri } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);

  function startEditing(p: Product) {
    setName(p.name);
    setCategory(p.category);
    setSalePrice(currencyInput(p.salePrice));
    setSaleUnit(p.saleUnit);
    setDescription(p.description ?? "");
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
    if (!name.trim()) {
      alertValidation("Coloque o nome do produto");
      return;
    }
    if (isNaN(price) || price <= 0) {
      alertValidation("O preço precisa ser maior que zero");
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
          Alert.alert(
            "Foto não enviada",
            "Não consegui enviar a foto agora. As outras alterações serão salvas.",
          );
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
          saleUnit,
          description: description.trim() || undefined,
          photoUrl,
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
        },
      });
      Alert.alert("Produto atualizado!");
      setEditing(false);
    } catch {
      alertError("Não foi possível atualizar o produto.");
    }
  }

  function handleDelete() {
    Alert.alert("Excluir produto", "Tem certeza que deseja excluir este produto?", [
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
    ]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <Typography variant="h3" style={{ flex: 1 }} numberOfLines={1}>
            {editing ? "Editar produto" : "Detalhes do produto"}
          </Typography>
          {product && !editing && (
            <Pressable
              onPress={() => startEditing(product)}
              accessibilityRole="button"
              hitSlop={12}
              style={{ minHeight: 48, justifyContent: "center" }}
            >
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Editar
              </Typography>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            hitSlop={12}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
        </View>

        {isLoading && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Typography variant="caption">Carregando...</Typography>
          </View>
        )}
        {!isLoading && !product && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Typography variant="caption">Produto não encontrado</Typography>
          </View>
        )}
        {!isLoading && product && editing && (
          <KeyboardAwareScrollView
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: spacing["3xl"],
              gap: spacing.lg,
            }}
          >
            <Input label="Nome do produto" value={name} onChangeText={setName} />
            <Input label="Categoria" value={category} onChangeText={setCategory} />
            <CompositeToggle value={isComposite} onChange={setIsComposite} />
            {isComposite && (
              <ComponentPicker
                value={components}
                onChange={setComponents}
                excludeProductId={productId}
              />
            )}
            {!isComposite && <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />}
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
                    <Ionicons
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
            {saleUnit === "unit" && !isComposite && (
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
            <Button
              title={uploading ? "Enviando foto..." : "Salvar"}
              size="lg"
              onPress={() => {
                void handleSave();
              }}
              loading={updateProduct.isPending || uploading}
            />
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={() => setEditing(false)}
            />
          </KeyboardAwareScrollView>
        )}
        {!isLoading && product && !editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
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
                    backgroundColor: theme.colors.primaryLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="display" color={theme.colors.textOnPrimary}>
                    {product.name.charAt(0).toUpperCase()}
                  </Typography>
                </View>
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Typography variant="h1">{product.name}</Typography>
                {product.isComposite && <Badge label="Kit" variant="lavender" />}
              </View>
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
                        : "—"}
                    </Typography>
                  </View>
                )}
                {product.saleUnit === "unit" && !product.isComposite && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="caption">Estoque</Typography>
                    <StockValue product={product} />
                  </View>
                )}
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
                      <Typography variant="body">
                        {c.quantity}x {c.name}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        {c.costPrice != null
                          ? formatCurrency(c.costPrice * c.quantity)
                          : "—"}
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
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function LowStockBanner() {
  const { theme } = useTheme();
  const { data } = useLowStockProducts();
  const enabled = useNotificationEnabled(NOTIFICATION_TYPES.LOW_STOCK);

  // O aviso de estoque baixo respeita a preferência de "Estoque baixo" das
  // configurações: desligou, some também o alerta visual (não só a notificação).
  if (!enabled || !data || data.length === 0) return null;

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
      <Ionicons name="alert-circle" size={20} color={theme.colors.alert} />
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={theme.colors.text}
          style={{ flex: 1, fontSize: 28, fontWeight: "800" }}
        >
          Produtos
        </Typography>
        <Pressable
          onPress={() => {
            setSearchOpen((v) => !v);
            if (searchOpen) setSearch("");
          }}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </Pressable>
      </View>

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
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar produto"
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

      <View style={{ flex: 1 }}>
        <LowStockBanner />
        <ProductList
          search={search.trim() || undefined}
          onProductPress={(id) => setSelectedProductId(id)}
          onAddPress={() => setShowCreate(true)}
        />
      </View>

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
          accessibilityLabel="Novo produto"
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={24} color={theme.colors.textOnPrimary} />
          <Typography
            variant="bodyBold"
            color={theme.colors.textOnPrimary}
            style={{ fontSize: 18 }}
          >
            Novo produto
          </Typography>
        </Pressable>
      </View>

      {/* Modal - Criar produto */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setShowCreate(false)}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              numberOfLines={1}
              style={{ flex: 1, fontSize: 24, fontWeight: "800" }}
            >
              Novo produto
            </Typography>
            <Pressable
              onPress={() => setShowCreate(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Typography
                variant="bodyBold"
                color={theme.colors.primary}
                style={{ fontSize: 17 }}
              >
                Fechar
              </Typography>
            </Pressable>
          </View>
          <CreateProductForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

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
