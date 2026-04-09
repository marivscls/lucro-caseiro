import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, spacing, radii, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { useCreateFinanceEntry } from "../hooks";

interface CreateFinanceEntryProps {
  onSuccess?: () => void;
}

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key: "material", label: "Material" },
  { key: "packaging", label: "Embalagem" },
  { key: "transport", label: "Transporte" },
  { key: "fee", label: "Taxa" },
  { key: "utility", label: "Utilidade" },
  { key: "other", label: "Outro" },
];

export function CreateFinanceEntry({ onSuccess }: Readonly<CreateFinanceEntryProps>) {
  const { theme } = useTheme();
  const [type, setType] = useState<FinanceEntryType>("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [date, setDate] = useState("");

  const createEntry = useCreateFinanceEntry();

  async function handleSubmit() {
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Opa!", "Informe um valor maior que zero");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Opa!", "Adicione uma descricao");
      return;
    }

    if (!category) {
      Alert.alert("Opa!", "Escolha uma categoria");
      return;
    }

    try {
      await createEntry.mutateAsync({
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: category,
        date: date.trim() || new Date().toISOString().split("T")[0],
      });
      Alert.alert(
        "Lancamento registrado!",
        `${type === "income" ? "Entrada" : "Saida"} de R$ ${amount} salva`,
      );
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Nao foi possivel registrar o lancamento. Tente novamente.");
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        gap: spacing.lg,
      }}
    >
      <Typography variant="h1">Novo lancamento</Typography>

      {/* Type selector */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <TouchableOpacity
          onPress={() => setType("income")}
          style={{
            flex: 1,
            paddingVertical: spacing.lg,
            borderRadius: radii.xl,
            alignItems: "center",
            backgroundColor:
              type === "income" ? theme.colors.success : theme.colors.surface,
          }}
        >
          <Typography
            variant="h3"
            color={
              type === "income" ? theme.colors.textOnPrimary : theme.colors.textSecondary
            }
          >
            Entrada
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setType("expense")}
          style={{
            flex: 1,
            paddingVertical: spacing.lg,
            borderRadius: radii.xl,
            alignItems: "center",
            backgroundColor:
              type === "expense" ? theme.colors.alert : theme.colors.surface,
          }}
        >
          <Typography
            variant="h3"
            color={
              type === "expense" ? theme.colors.textOnPrimary : theme.colors.textSecondary
            }
          >
            Saida
          </Typography>
        </TouchableOpacity>
      </View>

      <Input
        label="Valor (R$)"
        placeholder="Ex: 25,00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <Input
        label="Descricao"
        placeholder="Ex: Venda de brigadeiros, Compra de leite condensado..."
        value={description}
        onChangeText={setDescription}
      />

      {/* Category chips */}
      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption">Categoria</Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: radii.full,
                backgroundColor:
                  category === cat.key ? theme.colors.primary : theme.colors.surface,
              }}
            >
              <Typography
                variant="caption"
                color={
                  category === cat.key
                    ? theme.colors.textOnPrimary
                    : theme.colors.textSecondary
                }
              >
                {cat.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label="Data (opcional)"
        placeholder="DD/MM/AAAA"
        value={date}
        onChangeText={setDate}
      />

      <Button
        title="Registrar lancamento"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createEntry.isPending}
      />
    </ScrollView>
  );
}
