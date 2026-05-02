import type { Product } from "@lucro-caseiro/contracts";
import {
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

import { CreateProductForm } from "../features/products/components/create-product-form";
import { ProductList } from "../features/products/components/product-list";
import {
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
} from "../features/products/hooks";
import { useImagePicker } from "../shared/hooks/use-image-picker";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
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

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");

  function startEditing(p: Product) {
    setName(p.name);
    setCategory(p.category);
    setSalePrice(String(p.salePrice).replace(".", ","));
    setDescription(p.description ?? "");
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
      Alert.alert("Opa!", "O preco precisa ser maior que zero");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          name: name.trim(),
          category: category.trim(),
          salePrice: price,
          description: description.trim() || undefined,
        },
      });
      Alert.alert("Produto atualizado!");
      setEditing(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o produto.");
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
              Alert.alert("Erro", "Nao foi possivel excluir o produto.");
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
            <Typography variant="caption">Produto nao encontrado</Typography>
          </View>
        )}
        {!isLoading && product && editing && (
          <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
            <Typography variant="h2">Editar produto</Typography>
            <Input label="Nome do produto" value={name} onChangeText={setName} />
            <Input label="Categoria" value={category} onChangeText={setCategory} />
            <Input
              label="Preco de venda (R$)"
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
              label="Descricao (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
            />
            <Button
              title="Salvar"
              size="lg"
              onPress={() => {
                void handleSave();
              }}
              loading={updateProduct.isPending}
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
              <Typography variant="h1">{product.name}</Typography>
              <Typography variant="caption">{product.category}</Typography>
            </View>

            <Card>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="caption">Preco de venda</Typography>
                  <Typography variant="h3" color={theme.colors.success}>
                    {formatCurrency(product.salePrice)}
                  </Typography>
                </View>
                {product.description && (
                  <View style={{ gap: spacing.xs }}>
                    <Typography variant="caption">Descricao</Typography>
                    <Typography variant="body">{product.description}</Typography>
                  </View>
                )}
              </View>
            </Card>

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

export default function ProductsScreen() {
  const { theme } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
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
