import { Button, Chip, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { desktopAction, desktopContained } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { SupplierSelector } from "../../suppliers/components/supplier-selector";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { brToIso, maskDateBR } from "../../../shared/utils/date";
import { PURCHASE_CATEGORIES, type PurchaseCategoryValue } from "../domain";
import { useCreatePurchase } from "../hooks";

interface CreatePurchaseFormProps {
  onSuccess?: () => void;
}

function todayBR(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function CreatePurchaseForm({ onSuccess }: Readonly<CreatePurchaseFormProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<PurchaseCategoryValue>("material");
  const [date, setDate] = useState(todayBR());
  const [alreadyPaid, setAlreadyPaid] = useState(false);

  const createPurchase = useCreatePurchase();

  async function handleSubmit() {
    if (!description.trim()) {
      alertValidation("Descreva a compra (ex.: Farinha 25kg).");
      return;
    }
    const value = parseCurrencyInput(amount);
    if (isNaN(value) || value <= 0) {
      alertValidation("O valor precisa ser maior que zero.");
      return;
    }
    const purchasedAt = brToIso(date);
    if (!purchasedAt) {
      alertValidation("Data da compra inválida. Use DD/MM/AAAA.");
      return;
    }

    try {
      await createPurchase.mutateAsync({
        supplierId,
        description: description.trim(),
        amount: value,
        category,
        paymentStatus: alreadyPaid ? "paid" : "pending",
        purchasedAt,
      });
      onSuccess?.();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível registrar a compra. Tente novamente.";
      alertError(message);
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        { padding: spacing.xl, paddingBottom: 80, gap: spacing.lg },
        desktopContained(isDesktop, 720),
      ]}
    >
      <Typography variant="h2">Nova compra</Typography>

      <View>
        <Typography variant="label" style={{ marginBottom: spacing.xs }}>
          FORNECEDOR (OPCIONAL)
        </Typography>
        <SupplierSelector value={supplierId} onChange={setSupplierId} />
      </View>

      <Input
        label="Descrição"
        placeholder="Ex: Farinha 25kg, Sacolas..."
        value={description}
        onChangeText={setDescription}
        autoFocus
      />

      <Input
        label="Valor (R$)"
        placeholder="0,00"
        value={amount}
        onChangeText={(v) => setAmount(maskCurrencyInput(v))}
        keyboardType="numeric"
      />

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

      <Button
        title="Registrar compra"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createPurchase.isPending}
        style={desktopAction(isDesktop)}
      />
    </KeyboardAwareScrollView>
  );
}
