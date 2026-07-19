import type { CreateQuote, Quote, QuoteItem } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { StandardModal } from "../../../shared/components/standard-modal";
import { showToast } from "../../../shared/components/toast";
import { formatCurrency } from "../../../shared/utils/format";
import { ClientPickerModal } from "../../clients/components/client-picker-modal";
import { computeQuoteTotal } from "../calc";
import { useCreateQuote, useUpdateQuote } from "../hooks";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

interface ItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface QuoteFormProps {
  readonly quote?: Quote;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

function toDrafts(items: QuoteItem[]): ItemDraft[] {
  return items.map((item) => ({
    description: item.description,
    quantity: String(item.quantity).replace(".", ","),
    unitPrice: currencyInput(item.unitPrice),
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
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [title, setTitle] = useState(quote?.title ?? "");
  const [clientId, setClientId] = useState<string | null>(quote?.clientId ?? null);
  const [clientName, setClientName] = useState(quote?.clientName ?? "");
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [validUntil, setValidUntil] = useState(
    quote?.validUntil ? quote.validUntil.split("-").reverse().join("/") : "",
  );
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [items, setItems] = useState<ItemDraft[]>(
    quote ? toDrafts(quote.items) : [{ description: "", quantity: "1", unitPrice: "" }],
  );
  const isSaving = createQuote.isPending || updateQuote.isPending;

  const total = computeQuoteTotal(
    items.map((item) => ({
      quantity: parseNumber(item.quantity),
      unitPrice: parseCurrencyInput(item.unitPrice),
    })),
  );

  function setItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSave() {
    if (!title.trim()) {
      alertValidation("Dê um título ao orçamento. Ex.: Kit festa Safari");
      return;
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
        return;
      }
      parsedItems.push({ description: item.description.trim(), quantity, unitPrice });
    }
    if (parsedItems.length === 0) {
      alertValidation("Adicione pelo menos um item com descrição e preço.");
      return;
    }
    let validIso: string | null = null;
    if (validUntil.trim()) {
      validIso = brToIso(validUntil);
      if (!validIso) {
        alertValidation("Validade inválida. Use o formato DD/MM/AAAA.");
        return;
      }
    }

    const data: CreateQuote = {
      title: title.trim(),
      clientId,
      clientName: clientName.trim() || null,
      items: parsedItems,
      validUntil: validIso,
      notes: notes.trim() || null,
    };

    try {
      if (quote) {
        await updateQuote.mutateAsync({ id: quote.id, data });
      } else {
        await createQuote.mutateAsync(data);
      }
      showToast(quote ? "Orçamento atualizado!" : "Orçamento criado!");
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
    <StandardModal
      title={quote ? "Editar orçamento" : "Novo orçamento"}
      visible={visible}
      onClose={onClose}
      footer={
        <Button
          title={quote ? "Salvar alterações" : "Criar orçamento"}
          size="lg"
          onPress={() => void handleSave()}
          loading={isSaving}
          style={{ flex: 1 }}
        />
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.lg }}>
        <Input
          label="Título"
          placeholder="Ex.: Kit festa Safari"
          value={title}
          onChangeText={setTitle}
        />
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
          title={clientId ? "Trocar cliente cadastrado" : "Selecionar cliente cadastrado"}
          variant="outline"
          icon={<AppIcon name="person-outline" size={20} color={theme.colors.primary} />}
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

        <Typography variant="h3">Itens</Typography>
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
            <Input
              placeholder={`Item ${index + 1}, ex.: Convite personalizado`}
              value={item.description}
              onChangeText={(v) => setItem(index, { description: v })}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <Input
                placeholder="Qtd."
                value={item.quantity}
                onChangeText={(v) => setItem(index, { quantity: v })}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
              <Input
                placeholder="Preço un."
                value={item.unitPrice}
                onChangeText={(v) => setItem(index, { unitPrice: maskCurrencyInput(v) })}
                keyboardType="numeric"
                containerStyle={{ flex: 1.4 }}
              />
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
                <AppIcon name="trash-outline" size={22} color={theme.colors.alert} />
              </Pressable>
            </View>
          </View>
        ))}

        <Button
          title="Adicionar item"
          variant="outline"
          icon={<AppIcon name="add" size={20} color={theme.colors.primary} />}
          onPress={addItem}
        />

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
          <Typography variant="h2" color={theme.colors.success}>
            {formatCurrency(total)}
          </Typography>
        </View>

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
          style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
        />
      </View>
    </StandardModal>
  );
}
