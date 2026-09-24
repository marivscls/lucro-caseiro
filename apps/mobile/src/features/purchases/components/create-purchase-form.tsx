import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Product, Purchase } from "@lucro-caseiro/contracts";
import {
  Button,
  Typography,
  ValidationField,
  radii,
  useFeature,
  useTheme,
  spacing,
} from "@lucro-caseiro/ui";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { FormSection } from "../../../shared/components/form-section";
import {
  ChoiceField,
  FormField,
  TextField,
  useFieldPalette,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { DateField } from "../../../shared/components/date-field";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  isPositiveCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { brToIso, isoToBR } from "../../../shared/utils/date";
import { PURCHASE_CATEGORIES, type PurchaseCategoryValue } from "../domain";
import { useCreatePurchase, useUpdatePurchase } from "../hooks";
import { useProducts } from "../../products/hooks";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
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

/** Ficha no visual das categorias do produto (44 px, raio cheio). */
function OptionChip({
  label,
  selected = false,
  icon,
  onPress,
  accessibilityLabel,
  accessibilityRole = "radio",
}: Readonly<{
  label: string;
  selected?: boolean;
  icon?: AppIconName;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: "radio" | "button";
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={
        accessibilityRole === "radio" ? { selected, checked: selected } : undefined
      }
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        justifyContent: "center",
        borderRadius: radii.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.primaryStrong : pal.border,
        backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? (
        <AppIcon
          name={icon}
          size={18}
          color={selected ? theme.colors.primaryStrong : pal.icon}
        />
      ) : null}
      <Typography
        variant={selected ? "bodyBold" : "body"}
        color={selected ? theme.colors.primaryStrong : theme.colors.text}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function ChipRow({
  children,
  accessibilityLabel,
}: Readonly<{ children: React.ReactNode; accessibilityLabel?: string }>) {
  return (
    <View
      accessibilityRole={accessibilityLabel ? "radiogroup" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
    >
      {children}
    </View>
  );
}

function stepVisibility(visible: boolean) {
  return {
    style: { display: visible ? ("flex" as const) : ("none" as const) },
    accessibilityElementsHidden: !visible,
    importantForAccessibility: visible
      ? ("auto" as const)
      : ("no-hide-descendants" as const),
  };
}

function itemQuantityInvalid(item: PurchaseItemDraft) {
  const quantity = Number(item.quantity);
  return !Number.isInteger(quantity) || quantity <= 0;
}

export function CreatePurchaseForm({
  visible,
  onClose,
  purchase,
  prefill,
  onSuccess,
}: Readonly<CreatePurchaseFormProps>) {
  const { theme } = useTheme();
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
    source && (!stockPurchaseEnabled || source.items.length === 0)
      ? currencyInput(source.amount)
      : "",
  );
  const [category, setCategory] = useState<PurchaseCategoryValue>(
    (source?.category as PurchaseCategoryValue | undefined) ?? "material",
  );
  const [date, setDate] = useState(purchase ? isoToBR(purchase.purchasedAt) : todayBR());
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [stockRequested, setReceiveStock] = useState(
    source ? source.items.length > 0 : stockPurchaseEnabled,
  );
  const receiveStock = stockPurchaseEnabled && stockRequested;
  const incompatibleEdit = !!purchase?.items.length && !stockPurchaseEnabled;
  const [items, setItems] = useState<PurchaseItemDraft[]>(() =>
    purchaseItemDrafts(source),
  );
  const { data: productsData } = useProducts({ limit: 100 });
  const products = useMemo(() => productsData?.items ?? [], [productsData?.items]);

  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const isEditing = !!purchase;
  const saving = createPurchase.isPending || updatePurchase.isPending;

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

  // Uma validação por etapa: "Continuar" confere só os campos da etapa atual.
  const infoValidation = useFormValidation(
    { description: !description.trim() && "Descreva a compra (ex.: Farinha 25kg)." },
    visible,
  );
  const valuesValidation = useFormValidation<string>(
    {
      amount:
        !receiveStock &&
        !isPositiveCurrency(amount) &&
        "Informe um valor maior que zero.",
      items:
        receiveStock && items.length === 0 && "Adicione ao menos um produto recebido.",
      ...Object.fromEntries(
        items.flatMap((item, index) => [
          [
            `item-${index}-variation`,
            receiveStock &&
              !!item.product.variations?.length &&
              !item.variationId &&
              "Escolha a variação recebida.",
          ],
          [
            `item-${index}-quantity`,
            receiveStock && itemQuantityInvalid(item) && "Informe a quantidade recebida.",
          ],
          [
            `item-${index}-cost`,
            receiveStock && !item.unitCost.trim() && "Informe o custo unitário.",
          ],
        ]),
      ),
    },
    visible,
  );
  const finishValidation = useFormValidation(
    {
      date:
        !brToIso(date) &&
        (date.trim()
          ? "Data da compra inválida. Use DD/MM/AAAA."
          : "Informe a data da compra."),
    },
    visible,
  );
  const stepValidations = [infoValidation, valuesValidation, finishValidation];

  function goToStep(target: number) {
    // Voltar é livre; avançar confere as etapas no caminho.
    for (let current = formStep; current < target; current += 1) {
      if (!stepValidations[current - 1].validate()) {
        setFormStep(current);
        return;
      }
    }
    setFormStep(target);
  }

  async function handleSubmit() {
    if (incompatibleEdit) return;
    for (let index = 0; index < stepValidations.length; index += 1) {
      if (!stepValidations[index].validate()) {
        setFormStep(index + 1);
        return;
      }
    }
    const value = parseCurrencyInput(amount);
    const parsedItems = items.map((item) => ({
      productId: item.product.id,
      ...(item.variationId ? { variationId: item.variationId } : {}),
      quantity: Number(item.quantity),
      unitCost: parseCurrencyInput(item.unitCost),
    }));
    const purchasedAt = brToIso(date);
    if (!purchasedAt) return;

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

  if (incompatibleEdit) {
    return (
      <StandardModal
        title="Compra com estoque"
        visible={visible}
        onClose={onClose}
        footer={
          <FormActions>
            <Button title="Voltar" onPress={onClose} />
          </FormActions>
        }
      >
        <Typography variant="body">
          A edição desta compra com estoque não está disponível nesta versão do
          aplicativo. Os dados da compra foram preservados.
        </Typography>
      </StandardModal>
    );
  }

  const itemsTotal = items.reduce(
    (total, item) =>
      total + Number(item.quantity || 0) * parseCurrencyInput(item.unitCost || "0"),
    0,
  );

  let primaryAction = (
    <Button title="Continuar" disabled={saving} onPress={() => goToStep(formStep + 1)} />
  );
  if (formStep === PURCHASE_FORM_STEPS.length) {
    primaryAction = (
      <Button
        title={isEditing ? "Salvar alterações" : "Registrar compra"}
        onPress={() => {
          void handleSubmit();
        }}
        loading={saving}
      />
    );
  }

  return (
    <StandardModal
      title={isEditing ? "Editar compra" : "Nova compra"}
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          {formStep > 1 ? (
            <Button
              title="Voltar"
              variant="outline"
              disabled={saving}
              onPress={() => setFormStep(formStep - 1)}
            />
          ) : (
            <Button
              title="Cancelar"
              variant="outline"
              disabled={saving}
              onPress={onClose}
            />
          )}
          {primaryAction}
        </FormActions>
      }
    >
      <FormStepProgress
        current={formStep}
        steps={PURCHASE_FORM_STEPS}
        onStepPress={goToStep}
      />
      {!stockPurchaseEnabled && !!prefill?.items.length ? (
        <Typography variant="body">
          Esta nova compra será registrada somente como despesa, sem alterar o estoque.
          Confira o valor antes de registrar.
        </Typography>
      ) : null}

      <View {...stepVisibility(formStep === 1)}>
        <FormBody>
          <FormGrid>
            <FormField label="Descrição" validation={infoValidation.field("description")}>
              <TextField
                icon="document-text-outline"
                accessibilityLabel="Descrição"
                placeholder={
                  receiveStock ? "Ex: Reposição semanal" : "Ex: Energia, frete..."
                }
                value={description}
                onChangeText={setDescription}
                autoFocus
              />
            </FormField>
            <FormField label="Fornecedor" optional>
              <SupplierSelector value={supplierId} onChange={setSupplierId} />
            </FormField>
            {stockPurchaseEnabled ? (
              <FormField label="Tipo de compra" span="full">
                <ChoiceField
                  value={receiveStock ? "stock" : "expense"}
                  accessibilityLabel="Tipo de compra"
                  options={[
                    {
                      value: "stock",
                      label: "Entrada de estoque",
                      icon: "cube-outline",
                    },
                    {
                      value: "expense",
                      label: "Somente despesa",
                      icon: "receipt-outline",
                    },
                  ]}
                  onChange={(kind) => setReceiveStock(kind === "stock")}
                />
              </FormField>
            ) : null}
          </FormGrid>
        </FormBody>
      </View>

      <View {...stepVisibility(formStep === 2)}>
        {receiveStock ? (
          <FormBody>
            <FormSection
              collapsible={false}
              title="Produtos recebidos"
              subtitle="Toque em um produto para adicioná-lo à compra."
            >
              <ValidationField {...valuesValidation.field("items")}>
                <ChipRow>
                  {products.map((product) => (
                    <OptionChip
                      key={product.id}
                      label={product.name}
                      icon="add"
                      accessibilityRole="button"
                      accessibilityLabel={`Adicionar ${product.name}`}
                      onPress={() => addProduct(product)}
                    />
                  ))}
                </ChipRow>
                {products.length === 0 ? (
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Cadastre um produto antes de receber mercadoria.
                  </Typography>
                ) : null}
              </ValidationField>

              {items.map((item, index) => (
                <View
                  key={`${item.product.id}-${index}`}
                  style={{
                    gap: spacing.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: radii.lg,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Typography variant="bodyBold" style={{ flex: 1 }}>
                      {item.product.name}
                    </Typography>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remover ${item.product.name}`}
                      onPress={() => removeItem(index)}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        marginRight: -spacing.sm,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <AppIcon
                        name="trash-outline"
                        size={20}
                        color={theme.colors.alert}
                      />
                    </Pressable>
                  </View>
                  <FormGrid>
                    {item.product.variations?.length ? (
                      <FormField
                        label="Variação"
                        span="full"
                        validation={valuesValidation.field(`item-${index}-variation`)}
                      >
                        <ChipRow accessibilityLabel="Variação">
                          {item.product.variations.map((variation) => (
                            <OptionChip
                              key={variation.id}
                              label={variation.name}
                              selected={item.variationId === variation.id}
                              onPress={() =>
                                updateItem(index, { variationId: variation.id })
                              }
                            />
                          ))}
                        </ChipRow>
                      </FormField>
                    ) : null}
                    <FormField
                      label="Quantidade"
                      validation={valuesValidation.field(`item-${index}-quantity`)}
                    >
                      <TextField
                        accessibilityLabel="Quantidade"
                        placeholder="Ex: 10"
                        value={item.quantity}
                        keyboardType="number-pad"
                        numericMode="integer"
                        onChangeText={(quantity) => updateItem(index, { quantity })}
                      />
                    </FormField>
                    <FormField
                      label="Custo unitário"
                      validation={valuesValidation.field(`item-${index}-cost`)}
                    >
                      <TextField
                        prefix="R$"
                        accessibilityLabel="Custo unitário, em reais"
                        placeholder="0,00"
                        value={item.unitCost}
                        keyboardType="numeric"
                        onChangeText={(unitCost) =>
                          updateItem(index, { unitCost: maskCurrencyInput(unitCost) })
                        }
                      />
                    </FormField>
                  </FormGrid>
                </View>
              ))}

              {items.length ? (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                >
                  <Typography variant="body">Total</Typography>
                  <Typography variant="h3">
                    {itemsTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Typography>
                </View>
              ) : null}
            </FormSection>
          </FormBody>
        ) : (
          <FormBody>
            <FormGrid>
              <FormField label="Valor" validation={valuesValidation.field("amount")}>
                <TextField
                  prefix="R$"
                  accessibilityLabel="Valor, em reais"
                  placeholder="0,00"
                  value={amount}
                  onChangeText={(v) => setAmount(maskCurrencyInput(v))}
                  keyboardType="numeric"
                />
              </FormField>
            </FormGrid>
          </FormBody>
        )}
      </View>

      <View {...stepVisibility(formStep === 3)}>
        <FormBody>
          <FormGrid>
            <FormField label="Categoria" span="full">
              <ChipRow accessibilityLabel="Categoria">
                {purchaseCategories.map((c) => (
                  <OptionChip
                    key={c.value}
                    label={c.label}
                    selected={category === c.value}
                    onPress={() => setCategory(c.value)}
                  />
                ))}
              </ChipRow>
            </FormField>
            <ValidationField {...finishValidation.field("date")}>
              <DateField label="Data da compra" value={date} onChange={setDate} />
            </ValidationField>
            {isEditing ? null : (
              <FormField label="Pagamento" span="full">
                <ChoiceField
                  value={alreadyPaid ? "paid" : "pending"}
                  accessibilityLabel="Pagamento"
                  options={[
                    {
                      value: "pending",
                      label: "A pagar",
                      description: "Fica como conta a pagar até você marcar como paga.",
                    },
                    {
                      value: "paid",
                      label: "Já paguei",
                      description: "Entra como saída no seu caixa agora.",
                    },
                  ]}
                  onChange={(status) => setAlreadyPaid(status === "paid")}
                />
              </FormField>
            )}
          </FormGrid>
          {isEditing ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {purchase?.paymentStatus === "paid"
                ? "Esta compra está paga. As alterações também serão refletidas no caixa."
                : "Esta compra continua a pagar até você marcá-la como paga."}
            </Typography>
          ) : null}
        </FormBody>
      </View>
    </StandardModal>
  );
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}
