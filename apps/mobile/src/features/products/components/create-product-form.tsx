import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";

import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { useCreateProduct } from "../hooks";

interface CreateProductFormProps {
  readonly onSuccess?: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const { imageUri, showPicker } = useImagePicker();

  const createProduct = useCreateProduct();

  async function handleSubmit() {
    const price = parseFloat(salePrice.replace(",", "."));

    if (!name.trim()) {
      Alert.alert("Opa!", "Coloque o nome do produto");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Opa!", "Escolha uma categoria");
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert("Opa!", "O preco precisa ser maior que zero");
      return;
    }

    try {
      await createProduct.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        salePrice: price,
        description: description.trim() || undefined,
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : undefined,
        stockAlertThreshold: stockAlert ? parseInt(stockAlert, 10) : undefined,
      });
      Alert.alert("Produto cadastrado!", `${name} foi adicionado ao seu catalogo`);
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Nao foi possivel cadastrar o produto. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Typography variant="h2">Novo produto</Typography>

      <Input
        label="Nome do produto"
        placeholder="Ex: Brigadeiro, Bolo de chocolate..."
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Input
        label="Categoria"
        placeholder="Ex: Doces, Salgados, Bolos..."
        value={category}
        onChangeText={setCategory}
      />

      <Input
        label="Preco de venda (R$)"
        placeholder="Ex: 3,50"
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
        placeholder="Fale um pouco sobre o produto..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
      />

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

      <Button
        title="Cadastrar produto"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createProduct.isPending}
      />
    </ScrollView>
  );
}
