import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { CreateQuote, Product, Quote, QuoteItem } from "@lucro-caseiro/contracts";
import { Button, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { DateField } from "../../../shared/components/date-field";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { FormSection } from "../../../shared/components/form-section";
import {
  ChoiceField,
  FieldLinkAction,
  FormField,
  TextField,
  type ChoiceOption,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { ValidationField } from "@lucro-caseiro/ui";
import { showToast } from "../../../shared/components/toast";
import { formatCurrency } from "../../../shared/utils/format";
import { brToIso } from "../../../shared/utils/date";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import { ProductPicker } from "../../labels/components/label-product-picker";
import { computeQuotePricing } from "../calc";
import { useCreateQuote, useUpdateQuote } from "../hooks";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

interface ItemDraft {
  productId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  estimatedUnitCost: string;
}

interface QuoteFormProps {
  readonly quote?: Quote;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const QUOTE_FORM_STEPS = [
  { label: "Cliente", title: "Orçamento e cliente" },
  { label: "Itens", title: "Itens, valores e desconto" },
  { label: "Detalhes", title: "Prazo e observações" },
] as const;

type DiscountChoice = "none" | "fixed" | "percentage";

const DISCOUNT_OPTIONS: readonly ChoiceOption<DiscountChoice>[] = [
  { value: "none", label: "Sem desconto" },
  { value: "fixed", label: "Valor em R$" },
  { value: "percentage", label: "Porcentagem" },
];

function toDrafts(items: QuoteItem[]): ItemDraft[] {
  return items.map((item) => ({
    description: item.description,
    quantity: String(item.quantity).replace(".", ","),
    unitPrice: currencyInput(item.unitPrice),
    productId: item.productId,
    estimatedUnitCost:
      item.estimatedUnitCost === undefined ? "" : currencyInput(item.estimatedUnitCost),
  }));
}

function parseNumber(value: string): number {
  return parseFloat(value.replace(",", "."));
}

function invalidQuantity(value: string): boolean {
  const quantity = parseNumber(value);
  return !Number.isFinite(quantity) || quantity <= 0;
}

function invalidPrice(value: string): boolean {
  return !value.trim() || Number.isNaN(parseCurrencyInput(value));
}

function invalidCost(value: string): boolean {
  if (!value) return false;
  const cost = parseCurrencyInput(value);
  return !Number.isFinite(cost) || cost < 0;
}

function SummaryRow({
  label,
  value,
  color,
}: Readonly<{ label: string; value: string; color?: string }>) {
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}
    >
      <Typography variant="body">{label}</Typography>
      <Typography variant="bodyBold" color={color}>
        {value}
      </Typography>
    </View>
  );
}

export function QuoteForm({ quote, visible, onClose, onSuccess }: QuoteFormProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [title, setTitle] = useState(quote?.title ?? "");
  const [clientId, setClientId] = useState<string | null>(quote?.clientId ?? null);
  const [clientName, setClientName] = useState(quote?.clientName ?? "");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [validUntil, setValidUntil] = useState(
    quote?.validUntil ? quote.validUntil.split("-").reverse().join("/") : "",
  );
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | null>(
    quote?.discountType ?? null,
  );
  const [discountValue, setDiscountValue] = useState(
    quote?.discountValue ? String(quote.discountValue).replace(".", ",") : "",
  );
  const [items, setItems] = useState<ItemDraft[]>(
    quote
      ? toDrafts(quote.items)
      : [
          {
            description: "",
            quantity: "1",
            unitPrice: "",
            estimatedUnitCost: "",
          },
        ],
  );
  const [reviewData, setReviewData] = useState<CreateQuote | null>(null);
  const [formStep, setFormStep] = useState(1);
  const isSaving = createQuote.isPending || updateQuote.isPending;

  const pricing = computeQuotePricing(
    items.map((item) => ({
      quantity: parseNumber(item.quantity),
      unitPrice: parseCurrencyInput(item.unitPrice),
      estimatedUnitCost: item.estimatedUnitCost
        ? parseCurrencyInput(item.estimatedUnitCost)
        : undefined,
    })),
    discountType,
    parseNumber(discountValue) || 0,
  );
  const reviewPricing = reviewData
    ? computeQuotePricing(
        reviewData.items,
        reviewData.discountType ?? null,
        reviewData.discountValue ?? 0,
      )
    : null;

  useEffect(() => {
    if (visible) setFormStep(1);
  }, [quote?.id, visible]);

  function setItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "", estimatedUnitCost: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function addCatalogProduct(product: Product) {
    const draft: ItemDraft = {
      productId: product.id,
      description: product.name,
      quantity: "1",
      unitPrice: currencyInput(product.salePrice),
      estimatedUnitCost:
        product.costPrice === null ? "" : currencyInput(product.costPrice),
    };
    setItems((prev) => {
      const blankIndex = prev.findIndex(
        (item) => !item.description.trim() && !item.unitPrice.trim(),
      );
      if (blankIndex < 0) return [...prev, draft];
      return prev.map((item, index) => (index === blankIndex ? draft : item));
    });
    setShowProductPicker(false);
  }

  // Cada etapa valida só os próprios campos, com o erro no campo.
  const clientStepValidation = useFormValidation(
    { title: !title.trim() && "Dê um título ao orçamento." },
    visible,
  );

  const itemsStepValidation = useFormValidation<string>(
    Object.fromEntries(
      items.flatMap((item, index) => [
        [`item-${index}-description`, !item.description.trim() && "Descreva este item."],
        [
          `item-${index}-quantity`,
          invalidQuantity(item.quantity) && "Informe uma quantidade maior que zero.",
        ],
        [
          `item-${index}-price`,
          invalidPrice(item.unitPrice) && "Informe o preço deste item.",
        ],
        [
          `item-${index}-cost`,
          invalidCost(item.estimatedUnitCost) && "Confira o custo deste item.",
        ],
      ]),
    ),
    visible,
  );

  const detailsStepValidation = useFormValidation(
    {
      validUntil:
        !!validUntil.trim() &&
        !brToIso(validUntil) &&
        "Validade inválida. Use o formato DD/MM/AAAA.",
    },
    visible,
  );

  const stepValidations = [
    clientStepValidation,
    itemsStepValidation,
    detailsStepValidation,
  ] as const;

  function goToNextStep() {
    if (!stepValidations[formStep - 1].validate()) return;
    setFormStep(formStep + 1);
  }

  function buildQuoteData(): CreateQuote | null {
    const parsedItems: QuoteItem[] = [];
    for (const item of items) {
      if (!item.description.trim()) continue;
      parsedItems.push({
        productId: item.productId,
        description: item.description.trim(),
        quantity: parseNumber(item.quantity),
        unitPrice: parseCurrencyInput(item.unitPrice),
        estimatedUnitCost: item.estimatedUnitCost
          ? parseCurrencyInput(item.estimatedUnitCost)
          : undefined,
      });
    }
    if (parsedItems.length === 0) {
      alertValidation("Adicione pelo menos um item com descrição e preço.");
      return null;
    }

    return {
      title: title.trim(),
      clientId,
      clientName: clientName.trim() || null,
      items: parsedItems,
      discountType,
      discountValue: discountType ? parseNumber(discountValue) || 0 : 0,
      validUntil: validUntil.trim() ? (brToIso(validUntil) ?? null) : null,
      notes: notes.trim() || null,
    };
  }

  function handleReview() {
    for (const [index, validation] of stepValidations.entries()) {
      if (!validation.validate()) {
        setFormStep(index + 1);
        return;
      }
    }
    const data = buildQuoteData();
    if (data) setReviewData(data);
  }

  async function handleSave(data: CreateQuote) {
    try {
      if (quote) {
        await updateQuote.mutateAsync({ id: quote.id, data });
      } else {
        await createQuote.mutateAsync(data);
      }
      showToast(quote ? "Orçamento atualizado!" : "Orçamento criado!");
      setReviewData(null);
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o orçamento. Tente novamente.";
      alertError(message);
    }
  }

  function stepProps(step: number) {
    const stepVisible = formStep === step;
    return {
      style: { display: stepVisible ? ("flex" as const) : ("none" as const) },
      accessibilityElementsHidden: !stepVisible,
      importantForAccessibility: stepVisible
        ? ("auto" as const)
        : ("no-hide-descendants" as const),
    };
  }

  const filledItems = items.filter((item) => item.description.trim());

  return (
    <>
      <StandardModal
        title={quote ? "Editar orçamento" : "Novo orçamento"}
        visible={visible && reviewData === null}
        onClose={onClose}
        size="form"
        footer={
          <FormActions>
            {formStep > 1 ? (
              <Button
                title="Voltar"
                variant="outline"
                onPress={() => setFormStep(formStep - 1)}
              />
            ) : (
              <Button title="Cancelar" variant="outline" onPress={onClose} />
            )}
            {formStep < QUOTE_FORM_STEPS.length ? (
              <Button title="Continuar" onPress={goToNextStep} />
            ) : (
              <Button title="Revisar orçamento" onPress={handleReview} />
            )}
          </FormActions>
        }
      >
        <FormStepProgress
          current={formStep}
          steps={QUOTE_FORM_STEPS}
          onStepPress={setFormStep}
        />

        <View {...stepProps(1)}>
          <FormBody>
            <FormGrid>
              <FormField label="Título" validation={clientStepValidation.field("title")}>
                <TextField
                  icon="document-text-outline"
                  accessibilityLabel="Título do orçamento"
                  placeholder="Ex.: Kit festa Safari"
                  value={title}
                  onChangeText={setTitle}
                />
              </FormField>
              <FormField
                label="Cliente"
                optional
                labelAction={
                  <FieldLinkAction
                    label={clientId ? "Trocar cadastrado" : "Escolher cadastrado"}
                    icon="people-outline"
                    accessibilityLabel={
                      clientId
                        ? "Trocar cliente cadastrado"
                        : "Selecionar cliente cadastrado"
                    }
                    onPress={() => setShowClientPicker(true)}
                  />
                }
              >
                <TextField
                  icon="person-outline"
                  accessibilityLabel="Nome do cliente"
                  placeholder="Nome de quem pediu"
                  value={clientName}
                  onChangeText={(value) => {
                    setClientId(null);
                    setClientName(value);
                  }}
                />
              </FormField>
            </FormGrid>
          </FormBody>
          <ClientPickerModal
            visible={showClientPicker}
            onClose={() => setShowClientPicker(false)}
            onSelect={(client) => {
              setClientId(client?.id ?? null);
              setClientName(client?.name ?? "");
            }}
          />
        </View>

        <View {...stepProps(2)}>
          <FormBody>
            <FormSection
              collapsible={false}
              title="Itens"
              subtitle="O custo de cada item só aparece para você."
            >
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    gap: spacing.lg,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    padding: spacing.lg,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: 24,
                    }}
                  >
                    <Typography variant="bodyBold">Item {index + 1}</Typography>
                    {items.length > 1 ? (
                      <FieldLinkAction
                        label="Remover"
                        icon="trash-outline"
                        accessibilityLabel={`Remover item ${index + 1}`}
                        onPress={() => removeItem(index)}
                      />
                    ) : null}
                  </View>
                  <FormGrid columns={3} minColumnWidth={150}>
                    <FormField
                      label="Descrição"
                      span="full"
                      validation={itemsStepValidation.field(`item-${index}-description`)}
                    >
                      <TextField
                        accessibilityLabel={`Descrição do item ${index + 1}`}
                        placeholder="Ex.: Convite personalizado"
                        value={item.description}
                        onChangeText={(v) => setItem(index, { description: v })}
                      />
                    </FormField>
                    <FormField
                      label="Quantidade"
                      validation={itemsStepValidation.field(`item-${index}-quantity`)}
                    >
                      <TextField
                        accessibilityLabel={`Quantidade do item ${index + 1}`}
                        placeholder="1"
                        value={item.quantity}
                        onChangeText={(v) => setItem(index, { quantity: v })}
                        keyboardType="decimal-pad"
                        numericMode="decimal"
                      />
                    </FormField>
                    <FormField
                      label="Preço unitário"
                      validation={itemsStepValidation.field(`item-${index}-price`)}
                    >
                      <TextField
                        prefix="R$"
                        accessibilityLabel={`Preço unitário do item ${index + 1}, em reais`}
                        placeholder="0,00"
                        value={item.unitPrice}
                        onChangeText={(v) =>
                          setItem(index, { unitPrice: maskCurrencyInput(v) })
                        }
                        keyboardType="numeric"
                      />
                    </FormField>
                    <FormField
                      label="Seu custo"
                      optional
                      validation={itemsStepValidation.field(`item-${index}-cost`)}
                    >
                      <TextField
                        prefix="R$"
                        accessibilityLabel={`Custo unitário do item ${index + 1}, em reais`}
                        placeholder="0,00"
                        value={item.estimatedUnitCost}
                        onChangeText={(value) =>
                          setItem(index, {
                            estimatedUnitCost: maskCurrencyInput(value),
                          })
                        }
                        keyboardType="numeric"
                      />
                    </FormField>
                  </FormGrid>
                </View>
              ))}

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                <Button
                  title="Adicionar item"
                  variant="outline"
                  icon={
                    <AppIcon name="add" size={20} color={theme.colors.primaryStrong} />
                  }
                  onPress={addItem}
                />
                <Button
                  title="Adicionar do catálogo"
                  variant="outline"
                  icon={
                    <AppIcon
                      name="pricetag-outline"
                      size={20}
                      color={theme.colors.primaryStrong}
                    />
                  }
                  onPress={() => setShowProductPicker(true)}
                />
              </View>
            </FormSection>

            <FormSection collapsible={false} title="Desconto">
              <ChoiceField
                value={discountType ?? "none"}
                options={DISCOUNT_OPTIONS}
                accessibilityLabel="Tipo de desconto"
                onChange={(value) => {
                  if (value === "none") {
                    setDiscountType(null);
                    setDiscountValue("");
                    return;
                  }
                  setDiscountType(value);
                }}
              />
              {discountType ? (
                <FormGrid>
                  <FormField label="Valor do desconto">
                    <TextField
                      prefix={discountType === "fixed" ? "R$" : undefined}
                      suffix={discountType === "percentage" ? "%" : undefined}
                      accessibilityLabel={
                        discountType === "percentage"
                          ? "Desconto, em porcentagem"
                          : "Desconto, em reais"
                      }
                      placeholder={discountType === "percentage" ? "10" : "0,00"}
                      value={discountValue}
                      onChangeText={setDiscountValue}
                      keyboardType="decimal-pad"
                      numericMode="decimal"
                    />
                  </FormField>
                </FormGrid>
              ) : null}
            </FormSection>

            <View style={{ gap: spacing.lg }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: theme.colors.successBg,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                }}
              >
                <Typography variant="bodyBold">Total do orçamento</Typography>
                <Typography variant="moneyLg" color={theme.colors.success}>
                  {formatCurrency(pricing.total)}
                </Typography>
              </View>

              <View
                style={{
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                <Typography variant="bodyBold">Visão interna de lucro</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Estes valores não aparecem no documento do cliente.
                </Typography>
                <SummaryRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
                {pricing.discount > 0 ? (
                  <SummaryRow
                    label="Desconto"
                    value={`− ${formatCurrency(pricing.discount)}`}
                    color={theme.colors.success}
                  />
                ) : null}
                <SummaryRow
                  label="Custo estimado"
                  value={formatCurrency(pricing.estimatedCost)}
                />
                <SummaryRow
                  label="Ganho estimado"
                  value={formatCurrency(pricing.estimatedGain)}
                  color={
                    pricing.estimatedGain >= 0 ? theme.colors.success : theme.colors.alert
                  }
                />
                <SummaryRow
                  label="Margem estimada"
                  value={`${pricing.estimatedMargin.toFixed(1).replace(".", ",")}%`}
                />
              </View>
            </View>
          </FormBody>
        </View>

        <View {...stepProps(3)}>
          <FormBody>
            <FormGrid>
              <ValidationField {...detailsStepValidation.field("validUntil")}>
                <DateField
                  label="Válido até"
                  optional
                  value={validUntil}
                  onChange={setValidUntil}
                />
              </ValidationField>
              <FormField label="Observações" optional span="full">
                <TextField
                  placeholder="Condições, prazo de produção, retirada..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </FormField>
            </FormGrid>

            {isDesktop ? (
              <View
                style={{
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.xl,
                  gap: spacing.lg,
                }}
              >
                <View style={{ gap: spacing.xs }}>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Prévia do cliente
                  </Typography>
                  <Typography variant="h3">
                    {title.trim() || "Título do orçamento"}
                  </Typography>
                  <Typography variant="body" color={theme.colors.textSecondary}>
                    {clientName.trim() || "Cliente não informado"}
                  </Typography>
                </View>
                <View style={{ gap: spacing.md }}>
                  {filledItems.map((item, index) => (
                    <SummaryRow
                      key={`${item.description}-${index}`}
                      label={`${parseNumber(item.quantity) || 0}x ${item.description}`}
                      value={formatCurrency(
                        (parseNumber(item.quantity) || 0) *
                          parseCurrencyInput(item.unitPrice),
                      )}
                    />
                  ))}
                </View>
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    paddingTop: spacing.md,
                    gap: spacing.sm,
                  }}
                >
                  <SummaryRow label="Subtotal" value={formatCurrency(pricing.subtotal)} />
                  {pricing.discount > 0 ? (
                    <SummaryRow
                      label="Desconto"
                      value={`− ${formatCurrency(pricing.discount)}`}
                      color={theme.colors.success}
                    />
                  ) : null}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="h3">Total</Typography>
                    <Typography variant="moneyLg" color={theme.colors.success}>
                      {formatCurrency(pricing.total)}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Custos, ganho e margem ficam só na visão interna, na etapa de itens.
                </Typography>
              </View>
            ) : null}
          </FormBody>
        </View>
      </StandardModal>
      <StandardModal
        title="Revisar orçamento"
        subtitle="Confira antes de salvar e enviar ao cliente."
        visible={reviewData !== null}
        onClose={() => setReviewData(null)}
        footer={
          <FormActions>
            <Button
              title="Voltar e editar"
              variant="outline"
              onPress={() => setReviewData(null)}
            />
            <Button
              title={quote ? "Salvar alterações" : "Salvar orçamento"}
              onPress={() => {
                if (reviewData) void handleSave(reviewData);
              }}
              loading={isSaving}
            />
          </FormActions>
        }
      >
        {reviewData ? (
          <View style={{ flexShrink: 1, gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Orçamento
              </Typography>
              <Typography variant="h3">{reviewData.title}</Typography>
              <Typography variant="body" color={theme.colors.textSecondary}>
                {reviewData.clientName || "Sem cliente informado"}
              </Typography>
            </View>

            <View
              style={{
                borderColor: theme.colors.border,
                borderRadius: radii.lg,
                borderWidth: 1,
                gap: spacing.md,
                padding: spacing.lg,
              }}
            >
              {reviewData.items.map((item, index) => (
                <SummaryRow
                  key={`${item.description}-${index}`}
                  label={`${item.quantity}x ${item.description}`}
                  value={formatCurrency(item.quantity * item.unitPrice)}
                />
              ))}
              <View
                style={{
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: spacing.md,
                }}
              >
                <Typography variant="bodyBold">Total</Typography>
                <Typography variant="moneyLg" color={theme.colors.success}>
                  {formatCurrency(reviewPricing?.total ?? 0)}
                </Typography>
              </View>
            </View>

            {reviewPricing ? (
              <View
                style={{
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                <Typography variant="bodyBold">Só para você</Typography>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Custo {formatCurrency(reviewPricing.estimatedCost)} · ganho{" "}
                  {formatCurrency(reviewPricing.estimatedGain)} · margem{" "}
                  {reviewPricing.estimatedMargin.toFixed(1).replace(".", ",")}%
                </Typography>
              </View>
            ) : null}

            <Typography variant="caption" color={theme.colors.textSecondary}>
              O orçamento será salvo como Aguardando. Abrir o WhatsApp não altera o
              status.
            </Typography>
          </View>
        ) : null}
      </StandardModal>
      <StandardModal
        title="Adicionar produto"
        visible={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        footer={
          <FormActions>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={() => setShowProductPicker(false)}
            />
          </FormActions>
        }
      >
        <ProductPicker
          onSelect={addCatalogProduct}
          title="Produtos do catálogo"
          subtitle="O nome e o preço de venda entram no orçamento; você ainda pode ajustar."
        />
      </StandardModal>
    </>
  );
}
