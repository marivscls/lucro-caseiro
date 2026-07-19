import type { Product, Purchase } from "@lucro-caseiro/contracts";
import {
  Button,
  Chip,
  Input,
  Typography,
  radii,
  useFeature,
  useTheme,
  spacing,
} from "@lucro-caseiro/ui";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { brToIso, isoToBR, maskDateBR } from "../../../shared/utils/date";
import { PURCHASE_CATEGORIES, type PurchaseCategoryValue } from "../domain";
import { useCreatePurchase, useUpdatePurchase } from "../hooks";
import { useProducts } from "../../products/hooks";
import { AppIcon } from "../../../shared/components/app-icon";

type PurchaseItemDraft = {
  product: Pick<Product, "id" | "name" | "variations">;
  variationId?: string;
  quantity: string;
  unitCost: string;
};

interface CreatePurchaseFormProps {
  visible: boolean;
  onClose: () => void;
  purchase?: Purchase;
  onSuccess?: () => void;
}

function todayBR(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function purchaseItemDrafts(purchase?: Purchase): PurchaseItemDraft[] {
  return (
    purchase?.items.map((item) => ({
      product: {
        id: item.productId,
        name: item.productName,
        variations: item.variationId
          ? [
              {
                id: item.variationId,
                name: item.variationName ?? "Variação",
              },
            ]
          : [],
      },
      ...(item.variationId ? { variationId: item.variationId } : {}),
      quantity: String(item.quantity),
      unitCost: currencyInput(item.unitCost),
    })) ?? []
  );
}

function enrichItemProducts(
  items: PurchaseItemDraft[],
  products: Product[],
): PurchaseItemDraft[] {
  return items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.product.id);
    return product ? { ...item, product } : item;
  });
}

export function CreatePurchaseForm({
  visible,
  onClose,
  purchase,
  onSuccess,
}: Readonly<CreatePurchaseFormProps>) {
  const { theme } = useTheme();
  const stockPurchaseEnabled = useFeature("comprasComEstoque");
  const [supplierId, setSupplierId] = useState<string | null>(
    purchase?.supplierId ?? null,
  );
  const [description, setDescription] = useState(purchase?.description ?? "");
  const [amount, setAmount] = useState(
    purchase && purchase.items.length === 0 ? currencyInput(purchase.amount) : "",
  );
  const [category, setCategory] = useState<PurchaseCategoryValue>(
    (purchase?.category as PurchaseCategoryValue | undefined) ?? "material",
  );
  const [date, setDate] = useState(purchase ? isoToBR(purchase.purchasedAt) : todayBR());
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [receiveStock, setReceiveStock] = useState(
    purchase ? purchase.items.length > 0 : stockPurchaseEnabled,
  );
  const [items, setItems] = useState<PurchaseItemDraft[]>(() =>
    purchaseItemDrafts(purchase),
  );
  const { data: productsData } = useProducts({ limit: 100 });
  const products = useMemo(() => productsData?.items ?? [], [productsData?.items]);

  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const isEditing = !!purchase;

  useEffect(() => {
    if (products.length > 0) {
      setItems((current) => enrichItemProducts(current, products));
    }
  }, [products]);

  function addProduct(product: Product) {
    setItems((current) => [
      ...current,
      {
        product,
        quantity: "1",
        unitCost:
          product.costPrice == null
            ? ""
            : maskCurrencyInput(String(Math.round(product.costPrice * 100))),
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateItem(
    index: number,
    update: Partial<Omit<PurchaseItemDraft, "product">>,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...update } : item,
      ),
    );
  }

  async function handleSubmit() {
    if (!description.trim()) {
      alertValidation("Descreva a compra (ex.: Farinha 25kg).");
      return;
    }
    const value = parseCurrencyInput(amount);
    if (!receiveStock && (isNaN(value) || value <= 0)) {
      alertValidation("O valor precisa ser maior que zero.");
      return;
    }
    if (receiveStock && items.length === 0) {
      alertValidation("Adicione ao menos um produto recebido.");
      return;
    }
    const parsedItems = items.map((item) => ({
      productId: item.product.id,
      ...(item.variationId ? { variationId: item.variationId } : {}),
      quantity: Number(item.quantity),
      unitCost: parseCurrencyInput(item.unitCost),
    }));
    if (
      receiveStock &&
      parsedItems.some(
        (item, index) =>
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitCost) ||
          item.unitCost < 0 ||
          (!!items[index]?.product.variations?.length && !item.variationId),
      )
    ) {
      alertValidation("Confira variação, quantidade e custo de cada item.");
      return;
    }
    const purchasedAt = brToIso(date);
    if (!purchasedAt) {
      alertValidation("Data da compra inválida. Use DD/MM/AAAA.");
      return;
    }

    try {
      let purchaseItems: typeof parsedItems | undefined = parsedItems;
      if (!receiveStock) {
        purchaseItems = isEditing ? [] : undefined;
      }
      const purchaseData = {
        supplierId,
        description: description.trim(),
        amount: receiveStock ? undefined : value,
        items: purchaseItems,
        category,
        purchasedAt,
      };
      if (purchase) {
        const updated = await updatePurchase.mutateAsync({
          id: purchase.id,
          data: purchaseData,
        });
        if (updated.id !== purchase.id) {
          throw new Error("A API não confirmou a compra editada.");
        }
      } else {
        await createPurchase.mutateAsync({
          ...purchaseData,
          paymentStatus: alreadyPaid ? "paid" : "pending",
        });
      }
      onSuccess?.();
    } catch (e: unknown) {
      let fallbackMessage = "Não foi possível registrar a compra. Tente novamente.";
      if (isEditing) {
        fallbackMessage = "Não foi possível salvar a compra. Tente novamente.";
      }
      const message = e instanceof Error ? e.message : fallbackMessage;
      alertError(message);
    }
  }

  return (
    <StandardModal
      title={isEditing ? "Editar compra" : "Nova compra"}
      visible={visible}
      onClose={onClose}
      footer={
        <Button
          title={isEditing ? "Salvar alterações" : "Registrar compra"}
          size="lg"
          onPress={() => {
            void handleSubmit();
          }}
          loading={createPurchase.isPending || updatePurchase.isPending}
          style={{ flex: 1 }}
        />
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.lg }}>
        <View>
          <Typography variant="label" style={{ marginBottom: spacing.xs }}>
            FORNECEDOR (OPCIONAL)
          </Typography>
          <SupplierSelector value={supplierId} onChange={setSupplierId} />
        </View>

        <Input
          label="Descrição"
          placeholder={receiveStock ? "Ex: Reposição semanal" : "Ex: Energia, frete..."}
          value={description}
          onChangeText={setDescription}
          autoFocus
        />

        {stockPurchaseEnabled ? (
          <View style={{ gap: spacing.sm }}>
            <Typography variant="label">TIPO DE COMPRA</Typography>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Chip
                label="Entrada de estoque"
                selected={receiveStock}
                onPress={() => setReceiveStock(true)}
              />
              <Chip
                label="Somente despesa"
                selected={!receiveStock}
                onPress={() => setReceiveStock(false)}
              />
            </View>
          </View>
        ) : null}

        {receiveStock ? (
          <View style={{ gap: spacing.md }}>
            <View>
              <Typography variant="label">PRODUTOS RECEBIDOS</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Toque para adicionar um produto à compra.
              </Typography>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {products.map((product) => (
                <Chip
                  key={product.id}
                  label={product.name}
                  selected={false}
                  onPress={() => addProduct(product)}
                />
              ))}
            </ScrollView>
            {products.length === 0 ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Cadastre um produto antes de receber mercadoria.
              </Typography>
            ) : null}

            {items.map((item, index) => (
              <View
                key={`${item.product.id}-${index}`}
                style={{
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: radii.lg,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Typography variant="bodyBold" style={{ flex: 1 }}>
                    {item.product.name}
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${item.product.name}`}
                    onPress={() => removeItem(index)}
                  >
                    <AppIcon name="trash-outline" size={20} color={theme.colors.alert} />
                  </Pressable>
                </View>
                {item.product.variations?.length ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: spacing.sm }}
                  >
                    {item.product.variations.map((variation) => (
                      <Chip
                        key={variation.id}
                        label={variation.name}
                        selected={item.variationId === variation.id}
                        onPress={() => updateItem(index, { variationId: variation.id })}
                      />
                    ))}
                  </ScrollView>
                ) : null}
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Quantidade"
                      value={item.quantity}
                      keyboardType="number-pad"
                      onChangeText={(quantity) => updateItem(index, { quantity })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Custo unitário"
                      value={item.unitCost}
                      keyboardType="numeric"
                      onChangeText={(unitCost) =>
                        updateItem(index, { unitCost: maskCurrencyInput(unitCost) })
                      }
                    />
                  </View>
                </View>
              </View>
            ))}

            {items.length ? (
              <Typography variant="h3">
                Total:{" "}
                {items
                  .reduce(
                    (total, item) =>
                      total +
                      Number(item.quantity || 0) *
                        parseCurrencyInput(item.unitCost || "0"),
                    0,
                  )
                  .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Typography>
            ) : null}
          </View>
        ) : (
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            value={amount}
            onChangeText={(v) => setAmount(maskCurrencyInput(v))}
            keyboardType="numeric"
          />
        )}

        <View>
          <Typography variant="label" style={{ marginBottom: spacing.sm }}>
            CATEGORIA
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {PURCHASE_CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                selected={category === c.value}
                onPress={() => setCategory(c.value)}
              />
            ))}
          </View>
        </View>

        <Input
          label="Data da compra"
          placeholder="DD/MM/AAAA"
          value={date}
          onChangeText={(v) => setDate(maskDateBR(v))}
          keyboardType="number-pad"
        />

        {isEditing ? (
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {purchase?.paymentStatus === "paid"
              ? "Esta compra está paga. As alterações também serão refletidas no caixa."
              : "Esta compra continua a pagar até você marcá-la como paga."}
          </Typography>
        ) : (
          <View>
            <Typography variant="label" style={{ marginBottom: spacing.sm }}>
              PAGAMENTO
            </Typography>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Chip
                label="A pagar"
                selected={!alreadyPaid}
                onPress={() => setAlreadyPaid(false)}
              />
              <Chip
                label="Já paguei"
                selected={alreadyPaid}
                onPress={() => setAlreadyPaid(true)}
              />
            </View>
            <Typography
              variant="caption"
              color={theme.colors.textSecondary}
              style={{ marginTop: spacing.xs }}
            >
              {alreadyPaid
                ? "Entra como saída no seu caixa agora."
                : "Fica como conta a pagar até você marcar como paga."}
            </Typography>
          </View>
        )}
      </View>
    </StandardModal>
  );
}
