import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { useCreateProduct } from "../hooks";

interface CreateProductFormProps {
  readonly onSuccess?: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");

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

      <Button
        title="Adicionar foto (em breve)"
        variant="secondary"
        onPress={() =>
          Alert.alert(
            "Em breve!",
            "A funcao de adicionar foto estara disponivel em uma proxima atualizacao.",
          )
        }
      />

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
