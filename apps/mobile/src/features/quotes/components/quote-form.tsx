import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { CreateQuote, Product, Quote, QuoteItem } from "@lucro-caseiro/contracts";
import {
  Button,
  Chip,
  Input,
  Typography,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { showToast } from "../../../shared/components/toast";
import { formatCurrency } from "../../../shared/utils/format";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import { ProductPicker } from "../../labels/components/label-product-picker";
import { computeQuotePricing } from "../calc";
import { useCreateQuote, useUpdateQuote } from "../hooks";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  desktopAction,
  desktopCompactField,
  desktopSplitLayout,
} from "../../../shared/layout/desktop-density";
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

function maskDateBR(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function brToIso(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
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
  const split = desktopSplitLayout(isDesktop);
  const compactField = desktopCompactField(isDesktop);

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

  const formValidation = useFormValidation<string>(
    {
      title: !title.trim() && "Dê um título ao orçamento.",

      ...Object.fromEntries(
        items.flatMap((item, index) => [
          [
            `item-${index}-description`,
            !item.description.trim() && "Descreva este item.",
          ],
          [
            `item-${index}-quantity`,
            (!Number.isFinite(parseNumber(item.quantity)) ||
              parseNumber(item.quantity) <= 0) &&
              "Informe uma quantidade maior que zero.",
          ],
          [
            `item-${index}-price`,
            !item.unitPrice.trim() && "Informe o preço deste item.",
          ],
        ]),
      ),
    },
    visible,
  );

  function buildQuoteData(): CreateQuote | null {
    if (!formValidation.validate()) return null;
    if (!title.trim()) {
      alertValidation("Dê um título ao orçamento. Ex.: Kit festa Safari");
      return null;
    }
    const parsedItems: QuoteItem[] = [];
    for (const item of items) {
      if (!item.description.trim()) continue;
      const quantity = parseNumber(item.quantity);
      const unitPrice = parseCurrencyInput(item.unitPrice);
      if (Number.isNaN(quantity) || quantity <= 0 || Number.isNaN(unitPrice)) {
        showAlert({
          title: "Opa!",
          message: `Confira a quantidade e o preço do item "${item.description}".`,
        });
        return null;
      }
      const estimatedUnitCost = item.estimatedUnitCost
        ? parseCurrencyInput(item.estimatedUnitCost)
        : undefined;
      if (
        estimatedUnitCost !== undefined &&
        (!Number.isFinite(estimatedUnitCost) || estimatedUnitCost < 0)
      ) {
        alertValidation(`Confira o custo interno de "${item.description}".`);
        return null;
      }
      parsedItems.push({
        productId: item.productId,
        description: item.description.trim(),
        quantity,
        unitPrice,
        estimatedUnitCost,
      });
    }
    if (parsedItems.length === 0) {
      alertValidation("Adicione pelo menos um item com descrição e preço.");
      return null;
    }
    let validIso: string | null = null;
    if (validUntil.trim()) {
      validIso = brToIso(validUntil);
      if (!validIso) {
        alertValidation("Validade inválida. Use o formato DD/MM/AAAA.");
        return null;
      }
    }

    return {
      title: title.trim(),
      clientId,
      clientName: clientName.trim() || null,
      items: parsedItems,
      discountType,
      discountValue: discountType ? parseNumber(discountValue) || 0 : 0,
      validUntil: validIso,
      notes: notes.trim() || null,
    };
  }

  function handleReview() {
    if (!title.trim()) setFormStep(1);
    else if (
      items.some(
        (item) =>
          !item.description.trim() ||
          !Number.isFinite(parseNumber(item.quantity)) ||
          parseNumber(item.quantity) <= 0 ||
          !item.unitPrice.trim(),
      )
    )
      setFormStep(2);
    else if (validUntil.trim() && !brToIso(validUntil)) setFormStep(3);
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

  return (
    <>
      <StandardModal
        title={quote ? "Editar orçamento" : "Novo orçamento"}
        visible={visible && reviewData === null}
        onClose={onClose}
        wide={isDesktop}
        footer={
          <>
            {formStep > 1 ? (
              <Button
                title="Voltar"
                variant="ghost"
                onPress={() => setFormStep(formStep - 1)}
              />
            ) : null}
            {formStep < QUOTE_FORM_STEPS.length ? (
              <Button
                title="Continuar"
                size="lg"
                onPress={() => {
                  if (formStep === 1 && !title.trim()) {
                    alertValidation("Dê um título ao orçamento antes de continuar.");
                    return;
                  }
                  if (
                    formStep === 2 &&
                    items.some(
                      (item) =>
                        !item.description.trim() ||
                        parseNumber(item.quantity) <= 0 ||
                        !item.unitPrice.trim(),
                    )
                  ) {
                    alertValidation(
                      "Confira descrição, quantidade e preço de cada item.",
                    );
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
                title="Revisar orçamento"
                size="lg"
                onPress={handleReview}
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
          steps={QUOTE_FORM_STEPS}
          onStepPress={setFormStep}
        />
        <View style={isDesktop ? split.row : { flexShrink: 1, gap: spacing.xl }}>
          <View style={isDesktop ? split.main : { flexShrink: 1, gap: spacing.lg }}>
            <View
              style={{ display: formStep === 1 ? "flex" : "none", gap: spacing.lg }}
              accessibilityElementsHidden={formStep !== 1}
              importantForAccessibility={formStep === 1 ? "auto" : "no-hide-descendants"}
            >
              <ValidationField {...formValidation.field("title")}>
                <Input
                  label="Título"
                  placeholder="Ex.: Kit festa Safari"
                  value={title}
                  onChangeText={setTitle}
                />
              </ValidationField>
              <Input
                label="Cliente (opcional)"
                placeholder="Nome de quem pediu o orçamento"
                value={clientName}
                onChangeText={(value) => {
                  setClientId(null);
                  setClientName(value);
                }}
              />
              <Button
                title={
                  clientId ? "Trocar cliente cadastrado" : "Selecionar cliente cadastrado"
                }
                variant="outline"
                icon={
                  <AppIcon name="person-outline" size={20} color={theme.colors.primary} />
                }
                onPress={() => setShowClientPicker(true)}
              />
              <ClientPickerModal
                visible={showClientPicker}
                onClose={() => setShowClientPicker(false)}
                onSelect={(client) => {
                  setClientId(client?.id ?? null);
                  setClientName(client?.name ?? "");
                }}
              />
            </View>

            <View
              style={{ display: formStep === 2 ? "flex" : "none", gap: spacing.lg }}
              accessibilityElementsHidden={formStep !== 2}
              importantForAccessibility={formStep === 2 ? "auto" : "no-hide-descendants"}
            >
              <Typography variant="h3">Itens</Typography>
              <Button
                title="Adicionar do catálogo"
                variant="outline"
                icon={
                  <AppIcon
                    name="pricetag-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                }
                onPress={() => setShowProductPicker(true)}
              />
              {items.map((item, index) => (
                <View
                  key={index}
                  style={{
                    gap: spacing.sm,
                    borderRadius: radii.xl,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    padding: spacing.md,
                  }}
                >
                  <ValidationField {...formValidation.field(`item-${index}-description`)}>
                    <Input
                      placeholder={`Item ${index + 1}, ex.: Convite personalizado`}
                      value={item.description}
                      onChangeText={(v) => setItem(index, { description: v })}
                    />
                  </ValidationField>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <View style={compactField}>
                      <ValidationField
                        {...formValidation.field(`item-${index}-quantity`)}
                      >
                        <Input
                          placeholder="Qtd."
                          value={item.quantity}
                          onChangeText={(v) => setItem(index, { quantity: v })}
                          keyboardType="decimal-pad"
                        />
                      </ValidationField>
                    </View>
                    <View
                      style={[
                        compactField,
                        isDesktop ? { flex: 1, maxWidth: undefined } : { flex: 1.4 },
                      ]}
                    >
                      <ValidationField {...formValidation.field(`item-${index}-price`)}>
                        <Input
                          placeholder="Preço un."
                          value={item.unitPrice}
                          onChangeText={(v) =>
                            setItem(index, { unitPrice: maskCurrencyInput(v) })
                          }
                          keyboardType="numeric"
                        />
                      </ValidationField>
                    </View>
                    <Pressable
                      onPress={() => removeItem(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover item ${index + 1}`}
                      disabled={items.length === 1}
                      style={{
                        width: 48,
                        height: 48,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: items.length === 1 ? 0.35 : 1,
                      }}
                    >
                      <AppIcon
                        name="trash-outline"
                        size={22}
                        color={theme.colors.alert}
                      />
                    </Pressable>
                  </View>
                  <View style={compactField}>
                    <Input
                      label="Custo unitário estimado (só você vê)"
                      placeholder="R$ 0,00"
                      value={item.estimatedUnitCost}
                      onChangeText={(value) =>
                        setItem(index, { estimatedUnitCost: maskCurrencyInput(value) })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}

              <Button
                title="Adicionar item"
                variant="outline"
                icon={<AppIcon name="add" size={20} color={theme.colors.primary} />}
                onPress={addItem}
              />

              <View style={{ gap: spacing.sm }}>
                <Typography variant="bodyBold">Desconto</Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  <Chip
                    label="Sem desconto"
                    selected={discountType === null}
                    onPress={() => {
                      setDiscountType(null);
                      setDiscountValue("");
                    }}
                  />
                  <Chip
                    label="Valor em R$"
                    selected={discountType === "fixed"}
                    onPress={() => setDiscountType("fixed")}
                  />
                  <Chip
                    label="Porcentagem"
                    selected={discountType === "percentage"}
                    onPress={() => setDiscountType("percentage")}
                  />
                </View>
                {discountType ? (
                  <View style={compactField}>
                    <Input
                      label={
                        discountType === "percentage" ? "Desconto (%)" : "Desconto (R$)"
                      }
                      value={discountValue}
                      onChangeText={setDiscountValue}
                      keyboardType="decimal-pad"
                    />
                  </View>
                ) : null}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: theme.colors.successBg,
                  borderRadius: radii.xl,
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
                  borderRadius: radii.xl,
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
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="body">Subtotal</Typography>
                  <Typography variant="bodyBold">
                    {formatCurrency(pricing.subtotal)}
                  </Typography>
                </View>
                {pricing.discount > 0 ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="body">Desconto</Typography>
                    <Typography variant="bodyBold" color={theme.colors.success}>
                      − {formatCurrency(pricing.discount)}
                    </Typography>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="body">Custo estimado</Typography>
                  <Typography variant="bodyBold">
                    {formatCurrency(pricing.estimatedCost)}
                  </Typography>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="body">Ganho estimado</Typography>
                  <Typography
                    variant="bodyBold"
                    color={
                      pricing.estimatedGain >= 0
                        ? theme.colors.success
                        : theme.colors.alert
                    }
                  >
                    {formatCurrency(pricing.estimatedGain)}
                  </Typography>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Typography variant="body">Margem estimada</Typography>
                  <Typography variant="bodyBold">
                    {pricing.estimatedMargin.toFixed(1).replace(".", ",")}%
                  </Typography>
                </View>
              </View>
            </View>

            <View
              style={{ display: formStep === 3 ? "flex" : "none", gap: spacing.lg }}
              accessibilityElementsHidden={formStep !== 3}
              importantForAccessibility={formStep === 3 ? "auto" : "no-hide-descendants"}
            >
              <Input
                label="Válido até (opcional)"
                placeholder="DD/MM/AAAA"
                value={validUntil}
                onChangeText={(v) => setValidUntil(maskDateBR(v))}
                keyboardType="number-pad"
              />
              <Input
                label="Observações (opcional)"
                placeholder="Condições, prazo de produção, retirada..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: "center" }}
              />
            </View>
          </View>
          {isDesktop && formStep === 3 ? (
            <View style={split.aside}>
              <View
                style={{
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  padding: spacing.xl,
                  gap: spacing.lg,
                }}
              >
                <View style={{ gap: spacing.xs }}>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    PRÉVIA DO CLIENTE
                  </Typography>
                  <Typography variant="h3">
                    {title.trim() || "Título do orçamento"}
                  </Typography>
                  <Typography variant="body" color={theme.colors.textSecondary}>
                    {clientName.trim() || "Cliente não informado"}
                  </Typography>
                </View>
                <View style={{ gap: spacing.md }}>
                  {items
                    .filter((item) => item.description.trim())
                    .map((item, index) => (
                      <View
                        key={`${item.description}-${index}`}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: spacing.md,
                        }}
                      >
                        <Typography variant="body" style={{ flex: 1 }}>
                          {parseNumber(item.quantity) || 0}x {item.description}
                        </Typography>
                        <Typography variant="bodyBold">
                          {formatCurrency(
                            (parseNumber(item.quantity) || 0) *
                              parseCurrencyInput(item.unitPrice),
                          )}
                        </Typography>
                      </View>
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
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="body">Subtotal</Typography>
                    <Typography variant="bodyBold">
                      {formatCurrency(pricing.subtotal)}
                    </Typography>
                  </View>
                  {pricing.discount > 0 ? (
                    <View
                      style={{ flexDirection: "row", justifyContent: "space-between" }}
                    >
                      <Typography variant="body">Desconto</Typography>
                      <Typography variant="bodyBold" color={theme.colors.success}>
                        − {formatCurrency(pricing.discount)}
                      </Typography>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Typography variant="h3">Total</Typography>
                    <Typography variant="moneyLg" color={theme.colors.success}>
                      {formatCurrency(pricing.total)}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Custos, ganho e margem ficam somente na coluna interna do formulário.
                </Typography>
              </View>
            </View>
          ) : null}
        </View>
      </StandardModal>
      <StandardModal
        title="Revisar orçamento"
        subtitle="Confira antes de salvar e enviar ao cliente."
        visible={reviewData !== null}
        onClose={() => setReviewData(null)}
        footer={
          <View
            style={
              isDesktop
                ? {
                    flexDirection: "row",
                    gap: spacing.md,
                    justifyContent: "flex-end",
                    width: "100%",
                  }
                : { flexDirection: "row", gap: spacing.md, width: "100%" }
            }
          >
            <Button
              title="Voltar e editar"
              variant="ghost"
              onPress={() => setReviewData(null)}
              style={{
                flex: isDesktop ? undefined : 1,
                ...desktopAction(isDesktop, 220),
              }}
            />
            <Button
              title={quote ? "Salvar alterações" : "Salvar orçamento"}
              onPress={() => {
                if (reviewData) void handleSave(reviewData);
              }}
              loading={isSaving}
              style={{
                flex: isDesktop ? undefined : 1,
                ...desktopAction(isDesktop, 240),
              }}
            />
          </View>
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
                borderRadius: radii.xl,
                borderWidth: 1,
                gap: spacing.md,
                padding: spacing.lg,
              }}
            >
              {reviewData.items.map((item, index) => (
                <View
                  key={`${item.description}-${index}`}
                  style={{
                    alignItems: "center",
                    flexDirection: "row",
                    gap: spacing.md,
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body" style={{ flex: 1 }}>
                    {item.quantity}x {item.description}
                  </Typography>
                  <Typography variant="bodyBold">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </Typography>
                </View>
              ))}
              <View
                style={{
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
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
                  borderRadius: radii.xl,
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
