import type { ExpenseCategory } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showAlert } from "../shared/components/alert-store";
import { showToast } from "../shared/components/toast";
import { ApiError } from "../shared/utils/api-client";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { maskCurrencyInput, parseCurrencyInput } from "../shared/utils/currency-input";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useProfile } from "../features/subscription/hooks";
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurringExpenses,
} from "../features/finance/hooks";

const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "utility", label: "Utilidade", icon: "flash-outline" },
  { key: "material", label: "Material", icon: "cube-outline" },
  { key: "packaging", label: "Embalagem", icon: "file-tray-outline" },
  { key: "transport", label: "Transporte", icon: "car-outline" },
  { key: "fee", label: "Taxa", icon: "pricetag-outline" },
  { key: "other", label: "Outro", icon: "ellipsis-horizontal-circle-outline" },
];

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? "Outro";
}

function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function RecurringExpensesScreen() {
  const { theme } = useTheme();
  const { data: items, isLoading } = useRecurringExpenses();
  const remove = useDeleteRecurring();
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  const showPaywall = usePaywall((s) => s.show);
  const [showForm, setShowForm] = useState(false);

  function handleAddPress() {
    if (!isPremium) {
      showPaywall("recurring");
      return;
    }
    setShowForm(true);
  }

  function confirmDelete(id: string, description: string) {
    showAlert({
      title: "Remover gasto fixo?",
      message: `"${description}" não vai mais cair automaticamente no caixa. Os lançamentos já gerados continuam.`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            remove.mutate(id);
          },
        },
      ],
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        }}
      >
        <IconButton
          icon={<Ionicons name="arrow-back" size={24} color={theme.colors.text} />}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => router.back()}
        />
        <Typography variant="h2">Gastos fixos</Typography>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing["4xl"],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Typography variant="body" color={theme.colors.textSecondary}>
          Despesas que se repetem todo mês (aluguel, internet, gás…) caem sozinhas no seu
          caixa na data certa.
        </Typography>

        {showForm && (
          <RecurringForm
            onClose={() => setShowForm(false)}
            onPaywall={() => {
              setShowForm(false);
              showPaywall("recurring");
            }}
          />
        )}

        {!showForm && (
          <Button
            title="Adicionar gasto fixo"
            icon={
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            onPress={handleAddPress}
          />
        )}

        {isLoading && (
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Carregando…
          </Typography>
        )}

        {!isLoading && (items?.length ?? 0) === 0 && (
          <EmptyState
            icon={
              <Ionicons
                name="repeat-outline"
                size={48}
                color={theme.colors.textSecondary}
              />
            }
            title="Nenhum gasto fixo ainda"
            description="Cadastre seus custos mensais e deixe o app lançar pra você."
          />
        )}

        {!isLoading &&
          (items ?? []).map((item) => (
            <Card key={item.id} style={{ gap: spacing.xs }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">{item.description}</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {categoryLabel(item.category)} · todo dia {item.dayOfMonth}
                  </Typography>
                </View>
                <Typography variant="bodyBold" color={theme.colors.alert}>
                  {formatMoney(item.amount)}
                </Typography>
                <Pressable
                  onPress={() => confirmDelete(item.id, item.description)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover ${item.description}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function RecurringForm({
  onClose,
  onPaywall,
}: Readonly<{ onClose: () => void; onPaywall: () => void }>) {
  const { theme } = useTheme();
  const create = useCreateRecurring();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("utility");
  const [day, setDay] = useState("1");

  async function handleSave() {
    const parsedAmount = parseCurrencyInput(amount);
    const parsedDay = parseInt(day, 10);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alertValidation("Informe um valor maior que zero.");
      return;
    }
    if (!description.trim()) {
      alertValidation("Adicione uma descrição (ex.: Aluguel).");
      return;
    }
    if (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 28) {
      alertValidation("O dia deve estar entre 1 e 28.");
      return;
    }

    try {
      await create.mutateAsync({
        category,
        amount: parsedAmount,
        description: description.trim(),
        dayOfMonth: parsedDay,
      });
      showToast("Gasto fixo cadastrado!");
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        onPaywall();
        return;
      }
      alertError("Não foi possível salvar. Tente novamente.");
    }
  }

  return (
    <Card style={{ gap: spacing.md }}>
      <Typography variant="bodyBold">Novo gasto fixo</Typography>

      <Input
        label="Descrição"
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Aluguel da cozinha"
        maxLength={120}
      />
      <Input
        label="Valor (R$)"
        value={amount}
        onChangeText={(v) => setAmount(maskCurrencyInput(v))}
        placeholder="Ex: 800,00"
        keyboardType="decimal-pad"
      />

      <View>
        <Typography variant="caption" style={{ marginBottom: spacing.xs }}>
          Categoria
        </Typography>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {CATEGORIES.map((c) => {
            const selected = c.key === category;
            return (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                accessibilityRole="button"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  borderWidth: 1.5,
                  borderColor: selected ? theme.colors.primary : theme.colors.surface,
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surfaceElevated,
                }}
              >
                <Ionicons
                  name={c.icon}
                  size={16}
                  color={
                    selected ? theme.colors.textOnPrimary : theme.colors.textSecondary
                  }
                />
                <Typography
                  variant="caption"
                  color={selected ? theme.colors.textOnPrimary : theme.colors.text}
                >
                  {c.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label="Dia do mês (1–28)"
        value={day}
        onChangeText={(v) => setDay(v.replace(/\D/g, "").slice(0, 2))}
        placeholder="1"
        keyboardType="number-pad"
        maxLength={2}
      />

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={create.isPending ? "Salvando…" : "Salvar"}
            onPress={() => void handleSave()}
            disabled={create.isPending}
          />
        </View>
      </View>
    </Card>
  );
}
