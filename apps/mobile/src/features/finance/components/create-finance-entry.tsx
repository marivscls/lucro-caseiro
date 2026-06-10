import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useCreateFinanceEntry } from "../hooks";
import { showToast } from "../../../shared/components/toast";

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

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function CreateFinanceEntry({
  onClose,
  onSuccess,
}: Readonly<CreateFinanceEntryProps>) {
  const [type, setType] = useState<FinanceEntryType>("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [date, setDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const scrollRef = useRef<ScrollView>(null);

  const createEntry = useCreateFinanceEntry();

  async function handleSubmit() {
    const parsedAmount = parseCurrencyInput(amount);
    const normalizedDate = brToIso(date);
    const selectedCategory = category || (type === "income" ? "sale" : "");

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Opa!", "Informe um valor maior que zero.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Opa!", "Adicione uma descrição.");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Opa!", "Escolha uma categoria.");
      return;
    }

    if (date.trim() && !normalizedDate) {
      Alert.alert("Opa!", "Informe a data no formato DD/MM/AAAA.");
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
      Alert.alert("Erro", "Não foi possível registrar o lançamento. Tente novamente.");
    }
  }

  function focusDateField() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 180);
  }

  function openCalendar() {
    setCalendarMonth(dateToCalendarMonth(date));
    setCalendarVisible(true);
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
              <Ionicons name="arrow-back" size={32} color="#F8ECE8" />
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
              iconTone="green"
              placeholder="Ex: 25,00"
              value={amount}
              onChangeText={(value) => setAmount(maskCurrencyInput(value))}
              keyboardType="decimal-pad"
            />
          </FormCard>

          <FormCard label="Descrição">
            <Field
              icon="document-text-outline"
              iconTone="green"
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
              iconTone="green"
              placeholder="DD/MM/AAAA"
              value={date}
              onChangeText={(value) => setDate(maskDateBR(value))}
              onFocus={focusDateField}
              keyboardType="number-pad"
              trailingIcon="calendar-outline"
              onTrailingPress={openCalendar}
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={29} color="#FFFFFF" />
                <Text style={styles.submitText}>Registrar lançamento</Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.viewEntries}
          >
            <Ionicons name="clipboard-outline" size={22} color="#D6748B" />
            <Text style={styles.viewEntriesText}>Ver lançamentos</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <CalendarModal
        visible={calendarVisible}
        month={calendarMonth}
        value={date}
        onChangeMonth={setCalendarMonth}
        onClose={() => setCalendarVisible(false)}
        onSelect={(selectedDate) => {
          setDate(formatDateBR(selectedDate));
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
  const activeBg = tone === "green" ? "#68D0A0" : "#CF6F88";
  const color = selected ? "#FFFFFF" : "#BBAAA3";

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
  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Field({
  icon,
  iconTone,
  trailingIcon,
  onTrailingPress,
  multiline,
  ...inputProps
}: Readonly<
  React.ComponentProps<typeof TextInput> & {
    icon: keyof typeof Ionicons.glyphMap;
    iconTone: "green";
    trailingIcon?: keyof typeof Ionicons.glyphMap;
    onTrailingPress?: () => void;
  }
>) {
  const color = iconTone === "green" ? "#68D0A0" : "#D6748B";

  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor="#8E807A"
        style={[styles.input, multiline && styles.multilineInput]}
      />
      {trailingIcon ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={12}
        >
          <Ionicons name={trailingIcon} size={25} color="#BBAAA3" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function CalendarModal({
  visible,
  month,
  value,
  onChangeMonth,
  onClose,
  onSelect,
}: Readonly<{
  visible: boolean;
  month: Date;
  value: string;
  onChangeMonth: (date: Date) => void;
  onClose: () => void;
  onSelect: (date: Date) => void;
}>) {
  const selectedIso = brToIso(value);
  const days = useMemo(() => buildCalendarDays(month), [month]);
  const title = `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;

  function changeMonth(offset: number) {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.calendarOverlay}>
        <Pressable style={styles.calendarBackdrop} onPress={onClose} />
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={27} color="#F8ECE8" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>{title}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={27} color="#F8ECE8" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {["D", "S", "T", "Q", "Q", "S", "S"].map((label, index) => (
              <Text key={`${label}-${index}`} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day) => {
              const iso = formatIsoDate(day.date);
              const selected = selectedIso === iso;
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  onPress={() => onSelect(day.date)}
                  style={[
                    styles.dayButton,
                    !day.inMonth && styles.dayMuted,
                    selected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !day.inMonth && styles.dayTextMuted,
                      selected && styles.dayTextSelected,
                    ]}
                  >
                    {day.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.calendarCloseButton}>
            <Text style={styles.calendarCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function maskCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";

  const cents = Number(digits);
  const fixed = (cents / 100).toFixed(2);
  const [intPart, decimalPart] = fixed.split(".");
  const withThousands = withThousandsSep(intPart);
  return `${withThousands},${decimalPart}`;
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number.parseFloat(normalized);
}

function dateToCalendarMonth(value: string) {
  const iso = brToIso(value);
  if (!iso) return new Date();
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      inMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function formatDateBR(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function withThousandsSep(intPart: string) {
  let out = "";
  for (let index = 0; index < intPart.length; index += 1) {
    if (index > 0 && (intPart.length - index) % 3 === 0) out += ".";
    out += intPart[index];
  }
  return out;
}

const styles = StyleSheet.create({
  backButton: {
    marginLeft: -4,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarCard: {
    backgroundColor: "rgba(44, 35, 32, 0.98)",
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 22,
    padding: 16,
  },
  calendarCloseButton: {
    alignItems: "center",
    backgroundColor: "#CF6F88",
    borderRadius: 15,
    height: 48,
    justifyContent: "center",
    marginTop: 12,
  },
  calendarCloseText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calendarOverlay: {
    backgroundColor: "rgba(0,0,0,0.62)",
    flex: 1,
    justifyContent: "center",
  },
  calendarTitle: {
    color: "#F8ECE8",
    fontSize: 20,
    fontWeight: "900",
  },
  categoryButton: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 46,
    paddingHorizontal: 12,
    width: "48.2%",
  },
  categoryButtonSelected: {
    backgroundColor: "rgba(207, 111, 136, 0.16)",
    borderColor: "#D6748B",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryText: {
    color: "#CDBBB4",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  categoryTextSelected: {
    color: "#F8ECE8",
  },
  closeText: {
    color: "#D6748B",
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
    color: "#F8ECE8",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: "rgba(44, 35, 32, 0.88)",
    borderColor: "rgba(255,255,255,0.10)",
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
    color: "#F8ECE8",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    minHeight: 40,
    padding: 0,
  },
  inputIcon: {
    alignItems: "center",
    backgroundColor: "rgba(84, 141, 104, 0.32)",
    borderRadius: 11,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.10)",
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
  dayButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: "14.28%",
  },
  dayMuted: {
    opacity: 0.32,
  },
  daySelected: {
    backgroundColor: "#CF6F88",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayText: {
    color: "#F8ECE8",
    fontSize: 16,
    fontWeight: "800",
  },
  dayTextMuted: {
    color: "#BBAAA3",
  },
  dayTextSelected: {
    color: "#FFFFFF",
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
    backgroundColor: "#CF6F88",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    height: 62,
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: "#CDBBB4",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
    width: "86%",
  },
  title: {
    color: "#F8ECE8",
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
    backgroundColor: "rgba(44, 35, 32, 0.9)",
    borderColor: "rgba(255,255,255,0.10)",
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
    color: "#D6748B",
    fontSize: 15,
    fontWeight: "900",
  },
  weekLabel: {
    color: "#D6748B",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    width: "14.28%",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
});
