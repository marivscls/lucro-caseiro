import type { SaleUnit } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";

import { useImagePicker } from "../../../shared/hooks/use-image-picker";
import { uploadProductImage } from "../../../shared/utils/upload-image";
import { useCreateProduct } from "../hooks";
import {
  ComponentPicker,
  draftsToComponents,
  type ComponentDraft,
} from "./component-picker";
import { CompositeToggle } from "./composite-toggle";
import { SaleUnitToggle } from "./sale-unit-toggle";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface CreateProductFormProps {
  readonly onSuccess?: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [isComposite, setIsComposite] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const { imageUri, showPicker } = useImagePicker();
  const [uploading, setUploading] = useState(false);

  const createProduct = useCreateProduct();

  async function handleSubmit() {
    const price = parseFloat(salePrice.replace(",", "."));

    if (!name.trim()) {
      alertValidation("Coloque o nome do produto");
      return;
    }

    if (!category.trim()) {
      alertValidation("Escolha uma categoria");
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

    // Sobe a foto (se houver) e usa a URL pública. Se falhar, salva sem a foto.
    let photoUrl: string | undefined;
    if (imageUri) {
      try {
        setUploading(true);
        photoUrl = await uploadProductImage(imageUri);
      } catch {
        Alert.alert(
          "Foto não enviada",
          "Não consegui enviar a foto agora. Vou salvar o produto sem ela — você pode adicionar depois.",
        );
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
        // Estoque por unidades nao se aplica a venda por peso (kg).
        stockQuantity:
          saleUnit === "kg" || !stockQuantity ? undefined : parseInt(stockQuantity, 10),
        stockAlertThreshold:
          saleUnit === "kg" || !stockAlert ? undefined : parseInt(stockAlert, 10),
        isComposite,
        components: componentsPayload,
      });
      Alert.alert("Produto cadastrado!", `${name} foi adicionado ao seu catálogo`);
      onSuccess?.();
    } catch {
      alertError("Não foi possível cadastrar o produto. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
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

      <CompositeToggle value={isComposite} onChange={setIsComposite} />

      {isComposite && <ComponentPicker value={components} onChange={setComponents} />}

      {/* Venda por peso (kg) so faz sentido para produto simples. */}
      {!isComposite && <SaleUnitToggle value={saleUnit} onChange={setSaleUnit} />}

      <Input
        label={
          saleUnit === "kg" && !isComposite ? "Preço por kg (R$)" : "Preço de venda (R$)"
        }
        placeholder={saleUnit === "kg" && !isComposite ? "Ex: 80,00" : "Ex: 3,50"}
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
        placeholder="Fale um pouco sobre o produto..."
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
        title={uploading ? "Enviando foto..." : "Cadastrar produto"}
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createProduct.isPending || uploading}
      />
    </ScrollView>
  );
}
