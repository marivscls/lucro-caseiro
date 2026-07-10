import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
import { useTheme, type Theme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { brToIso, maskDateBR } from "../../../shared/utils/date";
import {
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { CalendarModal } from "../../../shared/components/calendar-modal";
import { useCreateFinanceEntry } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface CreateFinanceEntryProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { key: "material", label: "Material", icon: "cube-outline", color: "#D86BD9" },
  { key: "packaging", label: "Embalagem", icon: "file-tray-outline", color: "#7CB7FF" },
  { key: "transport", label: "Transporte", icon: "car-outline", color: "#F5A33D" },
  { key: "fee", label: "Taxa", icon: "pricetag-outline", color: "#EF6E88" },
  { key: "utility", label: "Utilidade", icon: "flash-outline", color: "#F0C04B" },
  {
    key: "other",
    label: "Outro",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#B8B0AE",
  },
];

function useEntryStyles() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles };
}

export function CreateFinanceEntry({
  onClose,
  onSuccess,
}: Readonly<CreateFinanceEntryProps>) {
  const { theme, styles } = useEntryStyles();
  const [type, setType] = useState<FinanceEntryType>("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [date, setDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const createEntry = useCreateFinanceEntry();

  async function handleSubmit() {
    const parsedAmount = parseCurrencyInput(amount);
    const normalizedDate = brToIso(date);
    const selectedCategory = category || (type === "income" ? "sale" : "");

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alertValidation("Informe um valor maior que zero.");
      return;
    }

    if (!description.trim()) {
      alertValidation("Adicione uma descrição.");
      return;
    }

    if (!selectedCategory) {
      alertValidation("Escolha uma categoria.");
      return;
    }

    if (date.trim() && !normalizedDate) {
      alertValidation("Informe a data no formato DD/MM/AAAA.");
      return;
    }

    try {
      await createEntry.mutateAsync({
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: selectedCategory,
        isFixed: false,
        date: normalizedDate || new Date().toISOString().split("T")[0],
      });

      showToast(`${type === "income" ? "Entrada" : "Saída"} de R$ ${amount} salva!`);
      onSuccess?.();
    } catch {
      alertError("Não foi possível registrar o lançamento. Tente novamente.");
    }
  }

  function focusDateField() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 180);
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoider}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.backButton}>
              <Ionicons name="arrow-back" size={32} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Novo lançamento</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle} numberOfLines={2}>
            Registre uma entrada ou saída para manter suas finanças organizadas.
          </Text>

          <View style={styles.typeSwitch}>
            <TypeButton
              icon="arrow-down-circle-outline"
              label="Entrada"
              selected={type === "income"}
              tone="green"
              onPress={() => setType("income")}
            />
            <TypeButton
              icon="arrow-up-circle-outline"
              label="Saída"
              selected={type === "expense"}
              tone="muted"
              onPress={() => setType("expense")}
            />
          </View>

          <FormCard label="Valor (R$)">
            <Field
              icon="cash-outline"
              placeholder="Ex: 25,00"
              value={amount}
              onChangeText={(value) => setAmount(maskCurrencyInput(value))}
              keyboardType="decimal-pad"
            />
          </FormCard>

          <FormCard label="Descrição">
            <Field
              icon="document-text-outline"
              placeholder="Ex: Venda de brigadeiros, Compra de leite condensado"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />
          </FormCard>

          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => setCategory(item.key)}
                  style={[
                    styles.categoryButton,
                    category === item.key && styles.categoryButtonSelected,
                  ]}
                >
                  <Ionicons name={item.icon} size={25} color={item.color} />
                  <Text
                    style={[
                      styles.categoryText,
                      category === item.key && styles.categoryTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <FormCard label="Data (opcional)">
            <Field
              icon="calendar-outline"
              placeholder="DD/MM/AAAA"
              value={date}
              onChangeText={(value) => setDate(maskDateBR(value))}
              onFocus={focusDateField}
              keyboardType="number-pad"
              trailingIcon="calendar-outline"
              onTrailingPress={() => setCalendarVisible(true)}
            />
          </FormCard>

          <Pressable
            accessibilityRole="button"
            disabled={createEntry.isPending}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !createEntry.isPending && styles.pressed,
              createEntry.isPending && styles.disabled,
            ]}
          >
            {createEntry.isPending ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={29}
                  color={theme.colors.textOnPrimary}
                />
                <Text style={styles.submitText}>Registrar lançamento</Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.viewEntries}
          >
            <Ionicons name="clipboard-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.viewEntriesText}>Ver lançamentos</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={calendarVisible}
        value={date}
        onClose={() => setCalendarVisible(false)}
        onSelect={(selectedDate) => {
          setDate(selectedDate);
          setCalendarVisible(false);
          focusDateField();
        }}
      />
    </>
  );
}

function TypeButton({
  icon,
  label,
  selected,
  tone,
  onPress,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  tone: "green" | "muted";
  onPress: () => void;
}>) {
  const { theme, styles } = useEntryStyles();
  const activeBg = tone === "green" ? theme.colors.success : theme.colors.primary;
  const color = selected ? "#FFFFFF" : theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.typeButton, selected && { backgroundColor: activeBg }]}
    >
      <Ionicons name={icon} size={25} color={color} />
      <Text style={[styles.typeText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function FormCard({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  const { styles } = useEntryStyles();
  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Field({
  icon,
  trailingIcon,
  onTrailingPress,
  multiline,
  ...inputProps
}: Readonly<
  React.ComponentProps<typeof TextInput> & {
    icon: keyof typeof Ionicons.glyphMap;
    trailingIcon?: keyof typeof Ionicons.glyphMap;
    onTrailingPress?: () => void;
  }
>) {
  const { theme, styles } = useEntryStyles();

  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <Ionicons name={icon} size={24} color={theme.colors.success} />
      </View>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, multiline && styles.multilineInput]}
      />
      {trailingIcon ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={12}
        >
          <Ionicons name={trailingIcon} size={25} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  const isDark = theme.mode === "dark";
  const border = isDark ? "rgba(255,255,255,0.10)" : "rgba(74,50,40,0.10)";
  const card = isDark ? "rgba(44, 35, 32, 0.88)" : theme.colors.surfaceElevated;
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : theme.colors.surface;

  return StyleSheet.create({
    backButton: {
      marginLeft: -4,
    },
    categoryButton: {
      alignItems: "center",
      borderColor: border,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: "row",
      gap: 8,
      height: 46,
      paddingHorizontal: 12,
      width: "48.2%",
    },
    categoryButtonSelected: {
      backgroundColor: `${theme.colors.primary}26`,
      borderColor: theme.colors.primary,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    categoryText: {
      color: theme.colors.textSecondary,
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
    },
    categoryTextSelected: {
      color: theme.colors.text,
    },
    closeText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: "900",
    },
    content: {
      gap: 12,
      paddingBottom: 18,
      paddingHorizontal: 22,
      paddingTop: 8,
    },
    disabled: {
      opacity: 0.6,
    },
    fieldLabel: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 10,
    },
    formCard: {
      backgroundColor: card,
      borderColor: border,
      borderRadius: 20,
      borderWidth: 1,
      padding: 13,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
    },
    input: {
      color: theme.colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      minHeight: 40,
      padding: 0,
    },
    inputIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.successBg,
      borderRadius: 11,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    inputWrap: {
      alignItems: "center",
      backgroundColor: inputBg,
      borderColor: border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      gap: 11,
      minHeight: 56,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    keyboardAvoider: {
      flex: 1,
    },
    multilineInput: {
      minHeight: 50,
      textAlignVertical: "center",
    },
    pressed: {
      opacity: 0.86,
    },
    submitButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      flexDirection: "row",
      gap: 10,
      height: 62,
      justifyContent: "center",
      marginTop: 4,
    },
    submitText: {
      color: theme.colors.textOnPrimary,
      fontSize: 18,
      fontWeight: "900",
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 4,
      width: "86%",
    },
    title: {
      color: theme.colors.text,
      flex: 1,
      fontSize: 25,
      fontWeight: "900",
    },
    typeButton: {
      alignItems: "center",
      borderRadius: 16,
      flex: 1,
      flexDirection: "row",
      gap: 10,
      height: 62,
      justifyContent: "center",
    },
    typeSwitch: {
      backgroundColor: card,
      borderColor: border,
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: "row",
      overflow: "hidden",
      padding: 4,
    },
    typeText: {
      fontSize: 17,
      fontWeight: "900",
    },
    viewEntries: {
      alignItems: "center",
      flexDirection: "row",
      gap: 9,
      justifyContent: "center",
    },
    viewEntriesText: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: "900",
    },
  });
}
