import type { ExpenseCategory, RecurringExpense } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  fontSizes,
  fonts,
  iconSizes,
  radii,
  spacing,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
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
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { desktopContained } from "../shared/layout/desktop-density";
import { ScreenHeader } from "../shared/components/screen-header";

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

function useRecurringTheme() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles };
}

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
  const { theme, styles } = useRecurringTheme();
  const isDesktop = useDesktopLayout();
  const { data: items, isLoading } = useRecurringExpenses();
  const remove = useDeleteRecurring();
  const { data: profile } = useProfile();
  const canUseRecurringExpenses =
    !!profile &&
    hasActiveFeature(profile.plan, profile.planExpiresAt, "recurringExpenses");
  const showPaywall = usePaywall((s) => s.show);
  const [showForm, setShowForm] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<RecurringExpense | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);

  function handleAddPress() {
    if (!canUseRecurringExpenses) {
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
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          contentContainerStyle={[styles.content, desktopContained(isDesktop)]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {!isDesktop && (
              <ScreenHeader title="Gastos fixos" style={{ paddingHorizontal: 0 }} />
            )}

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

          {!canUseRecurringExpenses ? (
            <RecurringPremiumGate onUnlock={() => showPaywall("recurring")} />
          ) : (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={handleAddPress}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={iconSizes.sm}
                  color={theme.colors.textOnPrimary}
                />
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
                        <Ionicons
                          name="calendar-outline"
                          size={iconSizes.sm}
                          color={theme.colors.textSecondary}
                        />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{item.description}</Text>
                        <Text style={styles.expenseMeta}>
                          {categoryLabel(item.category)} · todo dia {item.dayOfMonth}
                        </Text>
                      </View>
                      <Text style={styles.expenseAmount}>{formatMoney(item.amount)}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={iconSizes.sm}
                        color={theme.colors.textSecondary}
                      />
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
            </>
          )}
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
  const { theme, styles } = useRecurringTheme();
  const isDesktop = useDesktopLayout();
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
      if (
        saved.description !== payload.description ||
        saved.amount !== payload.amount ||
        saved.category !== payload.category ||
        saved.dayOfMonth !== payload.dayOfMonth
      ) {
        throw new Error("A API não confirmou o gasto fixo enviado.");
      }
      showToast(item ? "Gasto fixo atualizado!" : "Gasto fixo cadastrado!");
      onSaved?.(saved);
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        onPaywall();
        return;
      }
      alertError(
        e instanceof ApiError && e.status === 400
          ? e.message
          : "Não foi possível salvar. Tente novamente.",
      );
    }
  }

  return (
    <View style={[styles.formCard, desktopContained(isDesktop, 720)]}>
      <View style={styles.formHeader}>
        <View style={styles.formHeaderLeft}>
          <Ionicons
            name="calendar-outline"
            size={iconSizes.md}
            color={theme.colors.textSecondary}
          />
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
          <Ionicons name="chevron-up" size={iconSizes.sm} color={theme.colors.text} />
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
          <Ionicons
            name="grid-outline"
            size={iconSizes.sm}
            color={theme.colors.textSecondary}
          />
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
                  size={iconSizes.xs}
                  color={
                    selected ? theme.colors.primaryStrong : theme.colors.textSecondary
                  }
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
        label="Dia do mês (1 a 28)"
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
  const { theme, styles } = useRecurringTheme();

  return (
    <View style={styles.fieldBlock}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={iconSizes.sm} color={theme.colors.textSecondary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <TextInput
        {...inputProps}
        placeholderTextColor={`${theme.colors.textSecondary}88`}
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
  const { theme, styles } = useRecurringTheme();

  return (
    <View style={styles.detailCard}>
      <View style={styles.formHeader}>
        <View style={styles.formHeaderLeft}>
          <Ionicons
            name="receipt-outline"
            size={iconSizes.md}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.formTitle}>Detalhes do gasto</Text>
        </View>
        <Pressable
          accessibilityLabel="Fechar detalhes"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Ionicons name="close" size={iconSizes.sm} color={theme.colors.text} />
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
          <Ionicons
            name="trash-outline"
            size={iconSizes.xs}
            color={theme.colors.textOnPrimary}
          />
          <Text style={styles.deleteText}>Remover</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Ionicons
            name="create-outline"
            size={iconSizes.xs}
            color={theme.colors.textOnPrimary}
          />
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
  const { theme, styles } = useRecurringTheme();

  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={iconSizes.xs} color={theme.colors.textSecondary} />
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Tela de apresentação do recurso pra quem está no plano gratuito: explica o que
 * Gastos fixos faz + CTA de upgrade, sem exibir o formulário (que não salvaria).
 */
function RecurringPremiumGate({ onUnlock }: Readonly<{ onUnlock: () => void }>) {
  const { theme, styles } = useRecurringTheme();
  const benefits = [
    "Aluguel, internet, gás e outros custos caem sozinhos no caixa todo mês.",
    "Você não esquece nenhuma conta — o app lança na data certa.",
    "Enxergue o lucro real, já com os custos fixos descontados.",
  ];

  return (
    <View style={styles.gateCard}>
      <View style={styles.gateBadge}>
        <Ionicons
          name="diamond-outline"
          size={iconSizes.xs}
          color={theme.colors.premium}
        />
        <Text style={styles.gateBadgeText}>Recurso Profissional</Text>
      </View>
      <Text style={styles.gateTitle}>Gastos fixos no automático</Text>
      <Text style={styles.gateSubtitle}>
        Cadastre uma vez e deixe o app lançar seus custos mensais sozinho, sempre na data
        certa.
      </Text>
      {benefits.map((benefit) => (
        <View key={benefit} style={styles.gateBullet}>
          <Ionicons
            name="checkmark-circle"
            size={iconSizes.sm}
            color={theme.colors.premium}
          />
          <Text style={styles.gateBulletText}>{benefit}</Text>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={onUnlock}
        style={({ pressed }) => [styles.gateCta, pressed && styles.pressed]}
      >
        <Ionicons
          name="lock-open-outline"
          size={iconSizes.sm}
          color={theme.colors.textOnPrimary}
        />
        <Text style={styles.gateCtaText}>Desbloquear no Profissional</Text>
      </Pressable>
    </View>
  );
}

function EmptyRecurringState() {
  const { theme, styles } = useRecurringTheme();

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons
          name="receipt-outline"
          size={iconSizes.lg}
          color={theme.colors.primaryStrong}
        />
      </View>
      <Text style={styles.emptyTitle}>Nenhum gasto fixo ainda</Text>
      <Text style={styles.emptyDescription}>
        Cadastre seus custos mensais e deixe o app lançar pra você.
      </Text>
    </View>
  );
}

function recurringPalette(theme: Theme) {
  return {
    background: theme.colors.background,
    backButton: theme.colors.surfaceElevated,
    border: theme.colors.border,
    card: theme.colors.surfaceElevated,
    cardStrong: theme.colors.surfaceElevated,
    input: theme.colors.surface,
    chip: theme.colors.surface,
    muted: theme.colors.textSecondary,
    text: theme.colors.text,
    title: theme.colors.text,
  };
}

function createStyles(theme: Theme) {
  const pal = recurringPalette(theme);
  // Rosa de marca derivado do tema: fill = fundo AA de botoes cheios.
  const brandFill = theme.colors.primaryInteractive;
  const brandBorder = `${theme.colors.primary}8C`;

  return StyleSheet.create({
    actionRow: {
      flexDirection: "row",
      gap: spacing.lg,
      marginTop: 1,
    },
    addButton: {
      alignItems: "center",
      backgroundColor: brandFill,
      borderColor: brandBorder,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      height: 48,
      justifyContent: "center",
    },
    addButtonText: {
      color: theme.colors.textOnPrimary,
      fontSize: fontSizes.md,
      fontFamily: fonts.extraBold,
    },
    cancelButton: {
      alignItems: "center",
      backgroundColor: pal.chip,
      borderColor: pal.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flex: 1,
      height: 44,
      justifyContent: "center",
    },
    cancelText: {
      color: pal.text,
      fontSize: fontSizes.sm,
      fontFamily: fonts.extraBold,
    },
    categoryPill: {
      alignItems: "center",
      backgroundColor: pal.chip,
      borderColor: pal.border,
      borderRadius: radii.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 44,
      justifyContent: "center",
      minWidth: "30%",
      paddingHorizontal: spacing.md,
    },
    categoryPillSelected: {
      backgroundColor: theme.colors.primaryBg,
      borderColor: brandBorder,
    },
    categoryText: {
      color: pal.text,
      fontSize: fontSizes.xs,
      fontFamily: fonts.semiBold,
    },
    categoryTextSelected: {
      color: theme.colors.primaryStrong,
      fontFamily: fonts.bold,
    },
    categoryWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      paddingLeft: 1,
    },
    content: {
      gap: spacing.xl,
      paddingBottom: spacing["3xl"],
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    disabled: {
      opacity: 0.58,
    },
    deleteButton: {
      alignItems: "center",
      backgroundColor: theme.colors.alert,
      borderColor: pal.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 44,
      justifyContent: "center",
    },
    deleteText: {
      color: theme.colors.textOnPrimary,
      fontSize: fontSizes.sm,
      fontFamily: fonts.extraBold,
    },
    detailCard: {
      backgroundColor: pal.card,
      borderColor: pal.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.lg,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
    },
    detailGrid: {
      gap: spacing.sm,
    },
    detailItem: {
      alignItems: "center",
      backgroundColor: pal.input,
      borderColor: pal.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    detailLabel: {
      color: pal.muted,
      fontSize: fontSizes.xs,
      fontFamily: fonts.semiBold,
    },
    detailTextBlock: {
      flex: 1,
      gap: 2,
    },
    detailTitle: {
      color: pal.title,
      fontFamily: fonts.displayBold,
      fontSize: fontSizes.xl,
    },
    detailValue: {
      color: pal.text,
      fontSize: fontSizes.md,
      fontFamily: fonts.extraBold,
    },
    emptyDescription: {
      color: pal.muted,
      fontSize: fontSizes.sm,
      lineHeight: 20,
      maxWidth: 275,
      textAlign: "center",
    },
    emptyIconCircle: {
      alignItems: "center",
      backgroundColor: pal.cardStrong,
      borderRadius: radii.full,
      height: 54,
      justifyContent: "center",
      marginBottom: 1,
      width: 54,
    },
    emptyState: {
      alignItems: "center",
      gap: spacing.sm,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
      paddingTop: 0,
    },
    emptyTitle: {
      color: pal.title,
      fontFamily: fonts.displayBold,
      fontSize: fontSizes.xl,
      textAlign: "center",
    },
    expenseAmount: {
      color: pal.text,
      fontSize: fontSizes.sm,
      fontFamily: fonts.extraBold,
    },
    expenseCard: {
      alignItems: "center",
      backgroundColor: pal.cardStrong,
      borderColor: pal.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
    },
    expenseCardSelected: {
      borderColor: brandBorder,
    },
    expenseIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: radii.md,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    expenseInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    expenseMeta: {
      color: pal.muted,
      fontSize: fontSizes.xs,
    },
    expenseTitle: {
      color: pal.text,
      fontSize: fontSizes.md,
      fontFamily: fonts.extraBold,
    },
    fieldBlock: {
      gap: spacing.sm,
    },
    fieldLabel: {
      color: pal.muted,
      fontSize: fontSizes.sm,
      fontFamily: fonts.semiBold,
    },
    formCard: {
      backgroundColor: pal.card,
      borderColor: pal.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.lg,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
    },
    formHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    formHeaderLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
    },
    formTitle: {
      color: pal.text,
      fontSize: fontSizes.lg,
      fontFamily: fonts.extraBold,
    },
    gateBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: theme.colors.premiumBg,
      borderRadius: radii.full,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    gateBadgeText: {
      color: theme.colors.premium,
      fontSize: fontSizes.xs,
      fontFamily: fonts.extraBold,
    },
    gateBullet: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.md,
    },
    gateBulletText: {
      color: pal.text,
      flex: 1,
      fontSize: fontSizes.sm,
      lineHeight: 20,
    },
    gateCard: {
      backgroundColor: pal.card,
      borderColor: theme.colors.premium,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.xl,
    },
    gateCta: {
      alignItems: "center",
      backgroundColor: theme.colors.premium,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.sm,
      height: 48,
      justifyContent: "center",
      marginTop: spacing.xs,
    },
    gateCtaText: {
      color: theme.colors.textOnPrimary,
      fontSize: fontSizes.md,
      fontFamily: fonts.extraBold,
    },
    gateSubtitle: {
      color: pal.muted,
      fontSize: fontSizes.sm,
      lineHeight: 20,
    },
    gateTitle: {
      color: pal.title,
      fontFamily: fonts.displayBold,
      fontSize: fontSizes.xl,
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
      gap: spacing.md,
    },
    loadingText: {
      color: pal.muted,
      fontSize: fontSizes.sm,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.82,
    },
    safeArea: {
      backgroundColor: pal.background,
      flex: 1,
    },
    saveButton: {
      alignItems: "center",
      backgroundColor: brandFill,
      borderColor: brandBorder,
      borderRadius: radii.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      height: 44,
      justifyContent: "center",
    },
    saveText: {
      color: theme.colors.textOnPrimary,
      fontSize: fontSizes.sm,
      fontFamily: fonts.extraBold,
    },
    subtitle: {
      color: pal.muted,
      fontSize: fontSizes.sm,
      lineHeight: 20,
      marginTop: spacing.sm,
      maxWidth: 245,
    },
    textInput: {
      backgroundColor: pal.input,
      borderColor: pal.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      color: pal.text,
      fontSize: fontSizes.sm,
      height: 44,
      paddingHorizontal: spacing["3xl"],
    },
  });
}
