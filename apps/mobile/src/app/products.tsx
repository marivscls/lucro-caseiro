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
import React, { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "../features/products/components/component-picker";
import { CompositeToggle } from "../features/products/components/composite-toggle";
import { CreateProductForm } from "../features/products/components/create-product-form";
import { ProductList } from "../features/products/components/product-list";
import { SaleUnitToggle } from "../features/products/components/sale-unit-toggle";
import {
  useDeleteProduct,
  useLowStockProducts,
  useProduct,
  useUpdateProduct,
} from "../features/products/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";
import { uploadProductImage } from "../shared/utils/upload-image";

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
    setSalePrice(String(p.salePrice).replace(".", ","));
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
    const price = parseFloat(salePrice.replace(",", "."));
    if (!name.trim()) {
      Alert.alert("Opa!", "Coloque o nome do produto");
      return;
    }
    if (isNaN(price) || price <= 0) {
      Alert.alert("Opa!", "O preço precisa ser maior que zero");
      return;
    }

    const componentsPayload = isComposite ? draftsToComponents(components) : undefined;
    if (isComposite && (componentsPayload?.length ?? 0) === 0) {
      Alert.alert("Opa!", "Escolha pelo menos um produto para montar o kit");
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
      Alert.alert("Erro", "Não foi possível atualizar o produto.");
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
              Alert.alert("Erro", "Não foi possível excluir o produto.");
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
            justifyContent: "space-between",
            alignItems: "center",
            padding: spacing.lg,
          }}
        >
          <Pressable onPress={onClose}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Fechar
            </Typography>
          </Pressable>
          {product && !editing && (
            <Pressable onPress={() => startEditing(product)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Editar
              </Typography>
            </Pressable>
          )}
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
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h2">Editar produto</Typography>
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
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
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
          </ScrollView>
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

  if (!data || data.length === 0) return null;

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
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        <LowStockBanner />
        <ProductList
          onProductPress={(id) => setSelectedProductId(id)}
          onAddPress={() => setShowCreate(true)}
        />
      </View>

      {/* FAB - Novo produto */}
      <View style={{ position: "absolute", bottom: 100, right: 20 }}>
        <Button
          title="+ Novo produto"
          onPress={() => setShowCreate(true)}
          size="md"
          style={{
            borderRadius: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
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
              justifyContent: "flex-end",
              padding: spacing.lg,
            }}
          >
            <Pressable onPress={() => setShowCreate(false)}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
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
