import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
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
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
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
import { useBusinessCopy } from "../../subscription/business-copy";

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
  prefill?: Pick<
    Purchase,
    "supplierId" | "description" | "amount" | "items" | "category"
  >;
  onSuccess?: () => void;
}

const PURCHASE_FORM_STEPS = [
  { label: "Compra", title: "Dados da compra" },
  { label: "Valores", title: "Produtos e valores" },
  { label: "Finalizar", title: "Categoria e pagamento" },
] as const;

function todayBR(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function purchaseItemDrafts(purchase?: Pick<Purchase, "items">): PurchaseItemDraft[] {
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
  prefill,
  onSuccess,
}: Readonly<CreatePurchaseFormProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const compactField = desktopCompactField(isDesktop);
  const experienceCopy = useBusinessCopy();
  const stockPurchaseEnabled = useFeature("comprasComEstoque");
  const purchaseCategories = PURCHASE_CATEGORIES.map((item) => {
    if (item.value === "material") {
      return { ...item, label: capitalize(experienceCopy.materialNoun) };
    }
    if (item.value === "packaging") {
      return { ...item, label: capitalize(experienceCopy.packagingNoun) };
    }
    return item;
  });
  const source = purchase ?? prefill;
  const [supplierId, setSupplierId] = useState<string | null>(source?.supplierId ?? null);
  const [description, setDescription] = useState(source?.description ?? "");
  const [amount, setAmount] = useState(
    source && source.items.length === 0 ? currencyInput(source.amount) : "",
  );
  const [category, setCategory] = useState<PurchaseCategoryValue>(
    (source?.category as PurchaseCategoryValue | undefined) ?? "material",
  );
  const [date, setDate] = useState(purchase ? isoToBR(purchase.purchasedAt) : todayBR());
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [receiveStock, setReceiveStock] = useState(
    source ? source.items.length > 0 : stockPurchaseEnabled,
  );
  const [items, setItems] = useState<PurchaseItemDraft[]>(() =>
    purchaseItemDrafts(source),
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

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [purchase?.id, visible]);

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

  const formValidation = useFormValidation<string>({
    description: !description.trim() && "Descreva a compra.",
    amount:
      !receiveStock &&
      (!Number.isFinite(parseCurrencyInput(amount)) || parseCurrencyInput(amount) <= 0) &&
      "Informe um valor maior que zero.",
    date: !date.trim() && "Informe a data da compra.",

    ...Object.fromEntries(
      items.flatMap((item, index) => [
        [
          `item-${index}-quantity`,
          receiveStock &&
            (!Number.isFinite(Number(item.quantity.replace(",", "."))) ||
              Number(item.quantity.replace(",", ".")) <= 0) &&
            "Informe a quantidade recebida.",
        ],
        [
          `item-${index}-cost`,
          receiveStock && !item.unitCost.trim() && "Informe o custo unitário.",
        ],
      ]),
    ),
  });

  async function handleSubmit() {
    if (!description.trim()) setFormStep(1);
    else if (
      (!receiveStock && parseCurrencyInput(amount) <= 0) ||
      (receiveStock &&
        (items.length === 0 ||
          items.some(
            (item) =>
              Number(item.quantity.replace(",", ".")) <= 0 || !item.unitCost.trim(),
          )))
    )
      setFormStep(2);
    else if (!brToIso(date)) setFormStep(3);
    if (!formValidation.validate()) return;
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
        <>
          {formStep > 1 ? (
            <Button
              title="Voltar"
              variant="ghost"
              onPress={() => setFormStep(formStep - 1)}
            />
          ) : null}
          {formStep < PURCHASE_FORM_STEPS.length ? (
            <Button
              title="Continuar"
              size="lg"
              onPress={() => {
                if (formStep === 1 && !description.trim()) {
                  alertValidation("Descreva a compra antes de continuar.");
                  return;
                }
                if (formStep === 2 && receiveStock && items.length === 0) {
                  alertValidation("Adicione ao menos um produto recebido.");
                  return;
                }
                if (formStep === 2 && !receiveStock && parseCurrencyInput(amount) <= 0) {
                  alertValidation("Informe um valor maior que zero.");
                  return;
                }
                setFormStep(formStep + 1);
              }}
              style={{
                flex: isDesktop ? undefined : 1,
                ...desktopAction(isDesktop, 240),
              }}
            />
          ) : (
            <Button
              title={isEditing ? "Salvar alterações" : "Registrar compra"}
              size="lg"
              onPress={() => void handleSubmit()}
              loading={createPurchase.isPending || updatePurchase.isPending}
              style={{
                flex: isDesktop ? undefined : 1,
                ...desktopAction(isDesktop, 240),
              }}
            />
          )}
        </>
      }
    >
      <FormStepProgress
        current={formStep}
        steps={PURCHASE_FORM_STEPS}
        onStepPress={setFormStep}
      />
      <View
        style={{ display: formStep === 1 ? "flex" : "none", gap: spacing.lg }}
        accessibilityElementsHidden={formStep !== 1}
        importantForAccessibility={formStep === 1 ? "auto" : "no-hide-descendants"}
      >
        <View>
          <Typography variant="label" style={{ marginBottom: spacing.xs }}>
            FORNECEDOR (OPCIONAL)
          </Typography>
          <SupplierSelector value={supplierId} onChange={setSupplierId} />
        </View>

        <ValidationField {...formValidation.field("description")}>
          <Input
            label="Descrição"
            placeholder={receiveStock ? "Ex: Reposição semanal" : "Ex: Energia, frete..."}
            value={description}
            onChangeText={setDescription}
            autoFocus
          />
        </ValidationField>

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
      </View>

      <View
        style={{ display: formStep === 2 ? "flex" : "none", gap: spacing.lg }}
        accessibilityElementsHidden={formStep !== 2}
        importantForAccessibility={formStep === 2 ? "auto" : "no-hide-descendants"}
      >
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
                  <View style={[{ flex: 1 }, compactField]}>
                    <ValidationField {...formValidation.field(`item-${index}-quantity`)}>
                      <Input
                        label="Quantidade"
                        value={item.quantity}
                        keyboardType="number-pad"
                        onChangeText={(quantity) => updateItem(index, { quantity })}
                      />
                    </ValidationField>
                  </View>
                  <View style={[{ flex: 1 }, compactField]}>
                    <ValidationField {...formValidation.field(`item-${index}-cost`)}>
                      <Input
                        label="Custo unitário"
                        value={item.unitCost}
                        keyboardType="numeric"
                        onChangeText={(unitCost) =>
                          updateItem(index, { unitCost: maskCurrencyInput(unitCost) })
                        }
                      />
                    </ValidationField>
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
          <View style={compactField}>
            <ValidationField {...formValidation.field("amount")}>
              <Input
                label="Valor (R$)"
                placeholder="0,00"
                value={amount}
                onChangeText={(v) => setAmount(maskCurrencyInput(v))}
                keyboardType="numeric"
              />
            </ValidationField>
          </View>
        )}
      </View>

      <View
        style={{ display: formStep === 3 ? "flex" : "none", gap: spacing.lg }}
        accessibilityElementsHidden={formStep !== 3}
        importantForAccessibility={formStep === 3 ? "auto" : "no-hide-descendants"}
      >
        <View>
          <Typography variant="label" style={{ marginBottom: spacing.sm }}>
            CATEGORIA
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {purchaseCategories.map((c) => (
              <Chip
                key={c.value}
                label={c.label}
                selected={category === c.value}
                onPress={() => setCategory(c.value)}
              />
            ))}
          </View>
        </View>

        <View style={compactField}>
          <ValidationField {...formValidation.field("date")}>
            <Input
              label="Data da compra"
              placeholder="DD/MM/AAAA"
              value={date}
              onChangeText={(v) => setDate(maskDateBR(v))}
              keyboardType="number-pad"
            />
          </ValidationField>
        </View>

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

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}
