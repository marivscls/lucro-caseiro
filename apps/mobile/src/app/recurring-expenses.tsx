import type { ExpenseCategory, RecurringExpense } from "@lucro-caseiro/contracts";
import { IconButton, colors } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import recurringHero from "../assets/recurring-expenses-hero.png";
import { showAlert } from "../shared/components/alert-store";
import { showToast } from "../shared/components/toast";
import {
  useCreateRecurring,
  useDeleteRecurring,
  useRecurringExpenses,
  useUpdateRecurring,
} from "../features/finance/hooks";
import { useProfile } from "../features/subscription/hooks";
import { usePaywall } from "../shared/hooks/use-paywall";
import { ApiError } from "../shared/utils/api-client";
import { alertError, alertValidation } from "../shared/utils/alerts";
import { maskCurrencyInput, parseCurrencyInput } from "../shared/utils/currency-input";

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

const BRAND_PINK = colors.primary;
const BRAND_PINK_BORDER = "rgba(196, 112, 126, 0.55)";
const BRAND_PINK_SOFT = "rgba(196, 112, 126, 0.14)";

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? "Outro";
}

function formatMoney(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function moneyInputValue(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function RecurringExpensesScreen() {
  const { data: items, isLoading } = useRecurringExpenses();
  const remove = useDeleteRecurring();
  const { data: profile } = useProfile();
  const isPremium = profile?.plan === "premium";
  const showPaywall = usePaywall((s) => s.show);
  const [showForm, setShowForm] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  function handleAddPress() {
    if (!isPremium) {
      showPaywall("recurring");
      return;
    }
    setSelectedExpense(null);
    setEditingExpense(null);
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
            setSelectedExpense(null);
            setEditingExpense(null);
          },
        },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.header}>
              <IconButton
                accessibilityLabel="Voltar"
                accessibilityRole="button"
                icon={<Ionicons name="arrow-back" size={24} color="#F7E7DF" />}
                onPress={() => router.back()}
                size={48}
                style={styles.backButton}
              />
              <Text style={styles.title}>Gastos fixos</Text>
            </View>

            <Text style={styles.subtitle}>
              Despesas que se repetem todo mês (aluguel, internet, gás...) caem sozinhas
              no seu caixa na data certa.
            </Text>

            <Image
              source={recurringHero}
              resizeMode="contain"
              style={styles.heroImage}
              accessibilityIgnoresInvertColors
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleAddPress}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar gasto fixo</Text>
          </Pressable>

          {showForm && (
            <RecurringForm
              key={editingExpense?.id ?? "new"}
              item={editingExpense}
              onClose={() => {
                setShowForm(false);
                setEditingExpense(null);
              }}
              onPaywall={() => {
                setShowForm(false);
                setEditingExpense(null);
                showPaywall("recurring");
              }}
              onSaved={(saved) => {
                setSelectedExpense(saved);
                setEditingExpense(null);
              }}
            />
          )}

          {isLoading && <Text style={styles.loadingText}>Carregando...</Text>}

          {!isLoading && (items?.length ?? 0) === 0 && <EmptyRecurringState />}

          {!isLoading &&
            (items ?? []).map((item) => (
              <React.Fragment key={item.id}>
                <Pressable
                  accessibilityLabel={`Ver detalhes de ${item.description}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelectedExpense(item);
                    setShowForm(false);
                    setEditingExpense(null);
                  }}
                  style={({ pressed }) => [
                    styles.expenseCard,
                    selectedExpense?.id === item.id && styles.expenseCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.expenseIcon}>
                    <Ionicons name="calendar-outline" size={20} color={BRAND_PINK} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseTitle}>{item.description}</Text>
                    <Text style={styles.expenseMeta}>
                      {categoryLabel(item.category)} · todo dia {item.dayOfMonth}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatMoney(item.amount)}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#CDB6A8" />
                </Pressable>

                {selectedExpense?.id === item.id && !showForm && (
                  <RecurringDetails
                    item={selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    onDelete={() =>
                      confirmDelete(selectedExpense.id, selectedExpense.description)
                    }
                    onEdit={() => {
                      setEditingExpense(selectedExpense);
                      setShowForm(true);
                    }}
                  />
                )}
              </React.Fragment>
            ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RecurringForm({
  item,
  onClose,
  onPaywall,
  onSaved,
}: Readonly<{
  item?: RecurringExpense | null;
  onClose: () => void;
  onPaywall: () => void;
  onSaved?: (item: RecurringExpense) => void;
}>) {
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const isEditing = !!item;
  const isSaving = create.isPending || update.isPending;
  const [description, setDescription] = useState(item?.description ?? "");
  const [amount, setAmount] = useState(item ? moneyInputValue(item.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(item?.category ?? "utility");
  const [day, setDay] = useState(String(item?.dayOfMonth ?? 1));

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
      const payload = {
        category,
        amount: parsedAmount,
        description: description.trim(),
        dayOfMonth: parsedDay,
      };
      const saved = item
        ? await update.mutateAsync({ id: item.id, data: payload })
        : await create.mutateAsync(payload);
      showToast(item ? "Gasto fixo atualizado!" : "Gasto fixo cadastrado!");
      onSaved?.(saved);
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
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.formHeaderLeft}>
          <Ionicons name="calendar-outline" size={24} color={BRAND_PINK} />
          <Text style={styles.formTitle}>
            {isEditing ? "Editar gasto fixo" : "Novo gasto fixo"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Fechar formulário"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="chevron-up" size={22} color="#F7D7CF" />
        </Pressable>
      </View>

      <FormField
        icon="receipt-outline"
        label="Descrição"
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Aluguel da cozinha"
        maxLength={120}
      />
      <FormField
        icon="cash-outline"
        label="Valor (R$)"
        value={amount}
        onChangeText={(v) => setAmount(maskCurrencyInput(v))}
        placeholder="Ex: 800,00"
        keyboardType="decimal-pad"
      />

      <View style={styles.fieldBlock}>
        <View style={styles.labelRow}>
          <Ionicons name="grid-outline" size={20} color={BRAND_PINK} />
          <Text style={styles.fieldLabel}>Categoria</Text>
        </View>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((c) => {
            const selected = c.key === category;
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                onPress={() => setCategory(c.key)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  selected && styles.categoryPillSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={c.icon}
                  size={17}
                  color={selected ? "#FFFFFF" : "#F4D8CC"}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.categoryText, selected && styles.categoryTextSelected]}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FormField
        icon="calendar-outline"
        label="Dia do mês (1–28)"
        value={day}
        onChangeText={(v) => setDay(v.replace(/\D/g, "").slice(0, 2))}
        placeholder="1"
        keyboardType="number-pad"
        maxLength={2}
      />

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.saveButton,
            isSaving && styles.disabled,
            pressed && !isSaving && styles.pressed,
          ]}
        >
          <Text style={styles.saveText}>{isSaving ? "Salvando..." : "Salvar"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormField({
  icon,
  label,
  ...inputProps
}: Readonly<
  React.ComponentProps<typeof TextInput> & {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
>) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={20} color={BRAND_PINK} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        {...inputProps}
        placeholderTextColor="rgba(246, 226, 216, 0.44)"
        style={styles.textInput}
      />
    </View>
  );
}

function RecurringDetails({
  item,
  onClose,
  onDelete,
  onEdit,
}: Readonly<{
  item: RecurringExpense;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}>) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.formHeader}>
        <View style={styles.formHeaderLeft}>
          <Ionicons name="receipt-outline" size={24} color={BRAND_PINK} />
          <Text style={styles.formTitle}>Detalhes do gasto</Text>
        </View>
        <Pressable
          accessibilityLabel="Fechar detalhes"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="close" size={22} color="#F7D7CF" />
        </Pressable>
      </View>

      <Text style={styles.detailTitle}>{item.description}</Text>

      <View style={styles.detailGrid}>
        <DetailItem icon="cash-outline" label="Valor" value={formatMoney(item.amount)} />
        <DetailItem
          icon="grid-outline"
          label="Categoria"
          value={categoryLabel(item.category)}
        />
        <DetailItem
          icon="calendar-outline"
          label="Dia do mês"
          value={`Todo dia ${item.dayOfMonth}`}
        />
        <DetailItem
          icon="checkmark-circle-outline"
          label="Status"
          value={item.active ? "Ativo" : "Inativo"}
        />
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
          <Text style={styles.cancelText}>Remover</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveText}>Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}>) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={18} color={BRAND_PINK} />
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyRecurringState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="receipt-outline" size={34} color={BRAND_PINK} />
      </View>
      <Text style={styles.emptyTitle}>Nenhum gasto fixo ainda</Text>
      <Text style={styles.emptyDescription}>
        Cadastre seus custos mensais e deixe o app lançar pra você.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 1,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: BRAND_PINK,
    borderColor: BRAND_PINK_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 49,
    justifyContent: "center",
    shadowColor: BRAND_PINK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 11,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(45, 38, 34, 0.76)",
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
    width: 48,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "rgba(58, 49, 44, 0.88)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 41,
    justifyContent: "center",
  },
  cancelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  categoryPill: {
    alignItems: "center",
    backgroundColor: "rgba(58, 49, 44, 0.78)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    height: 34,
    justifyContent: "center",
    minWidth: "30%",
    paddingHorizontal: 11,
  },
  categoryPillSelected: {
    backgroundColor: BRAND_PINK,
    borderColor: BRAND_PINK_BORDER,
  },
  categoryText: {
    color: "#F7E6DE",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingLeft: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 36,
    paddingHorizontal: 17,
    paddingTop: 11,
  },
  disabled: {
    opacity: 0.58,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(176, 69, 69, 0.9)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    height: 41,
    justifyContent: "center",
  },
  detailCard: {
    backgroundColor: "rgba(28, 24, 21, 0.88)",
    borderColor: BRAND_PINK_BORDER,
    borderRadius: 16,
    borderWidth: 1,
    gap: 15,
    paddingBottom: 17,
    paddingHorizontal: 21,
    paddingTop: 18,
  },
  detailGrid: {
    gap: 9,
  },
  detailItem: {
    alignItems: "center",
    backgroundColor: "rgba(58, 49, 44, 0.64)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  detailLabel: {
    color: "#CDB6A8",
    fontSize: 12,
    fontWeight: "600",
  },
  detailTextBlock: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    color: "#FFF2EE",
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "700",
  },
  detailValue: {
    color: "#FFF8F5",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyDescription: {
    color: "#D9BDAE",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 275,
    textAlign: "center",
  },
  emptyIconCircle: {
    alignItems: "center",
    backgroundColor: "rgba(52, 44, 40, 0.92)",
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    marginBottom: 1,
    width: 54,
  },
  emptyState: {
    alignItems: "center",
    gap: 7,
    justifyContent: "center",
    paddingHorizontal: 9,
    paddingTop: 0,
  },
  emptyTitle: {
    color: "#FFF2EE",
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  expenseAmount: {
    color: BRAND_PINK,
    fontSize: 14,
    fontWeight: "800",
  },
  expenseCard: {
    alignItems: "center",
    backgroundColor: "rgba(31, 26, 23, 0.93)",
    borderColor: "rgba(255, 236, 226, 0.12)",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10,
  },
  expenseCardSelected: {
    borderColor: BRAND_PINK_BORDER,
  },
  expenseIcon: {
    alignItems: "center",
    backgroundColor: BRAND_PINK_SOFT,
    borderRadius: 12,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  expenseInfo: {
    flex: 1,
    gap: 3,
  },
  expenseMeta: {
    color: "#CDB6A8",
    fontSize: 12,
  },
  expenseTitle: {
    color: "#FFF2EE",
    fontSize: 15,
    fontWeight: "800",
  },
  fieldBlock: {
    gap: 7,
  },
  fieldLabel: {
    color: "#D9BDAE",
    fontSize: 14,
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "rgba(28, 24, 21, 0.88)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 15,
    paddingBottom: 17,
    paddingHorizontal: 21,
    paddingTop: 18,
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formHeaderLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  hero: {
    minHeight: 150,
    position: "relative",
  },
  heroImage: {
    height: 111,
    position: "absolute",
    right: -10,
    top: 37,
    width: 130,
  },
  keyboardAvoider: {
    flex: 1,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: {
    color: "#D9BDAE",
    fontSize: 14,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  safeArea: {
    backgroundColor: "#11100E",
    flex: 1,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: BRAND_PINK,
    borderColor: BRAND_PINK_BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 41,
    justifyContent: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  subtitle: {
    color: "#D9BDAE",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 30,
    maxWidth: 245,
  },
  textInput: {
    backgroundColor: "rgba(58, 49, 44, 0.64)",
    borderColor: "rgba(255, 235, 225, 0.11)",
    borderRadius: 9,
    borderWidth: 1,
    color: "#FFF8F5",
    fontSize: 14,
    height: 42,
    paddingHorizontal: 31,
  },
  title: {
    color: "#FFF2EE",
    flex: 1,
    fontFamily: "serif",
    fontSize: 25,
    fontWeight: "700",
  },
});
