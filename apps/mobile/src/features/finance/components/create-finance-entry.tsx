import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { compatibleEntryCategory } from "../entry-guidance";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAuth } from "../../../shared/hooks/use-auth";
import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
import {
  CenteredTextInput,
  Button,
  fonts,
  radii,
  Typography,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
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
import { alertError } from "../../../shared/utils/alerts";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useBusinessCopy } from "../../subscription/business-copy";
import { StandardModal } from "../../../shared/components/standard-modal";

interface CreateFinanceEntryProps {
  visible: boolean;
  initialType?: FinanceEntryType;
  onClose: () => void;
  onSuccess?: () => void;
}

// Cor definida em runtime a partir de theme.colors (ver CATEGORIES_WITH_TOKENS),
// nunca hex solto — o valor abaixo é só um placeholder de tipo.
const CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: AppIconName;
  color: string;
}[] = [
  { key: "material", label: "Material", icon: "cube-outline", color: "" },
  { key: "packaging", label: "Embalagem", icon: "file-tray-outline", color: "" },
  { key: "transport", label: "Transporte", icon: "car-outline", color: "" },
  { key: "fee", label: "Taxa", icon: "pricetag-outline", color: "" },
  { key: "utility", label: "Utilidade", icon: "flash-outline", color: "" },
  {
    key: "other",
    label: "Outro",
    icon: "ellipsis-horizontal-circle-outline",
    color: "",
  },
];

function useEntryStyles() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return { theme, styles };
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

export function CreateFinanceEntry({
  visible,
  initialType = "income",
  onClose,
  onSuccess,
}: Readonly<CreateFinanceEntryProps>) {
  const { theme, styles } = useEntryStyles();
  const isDesktop = useDesktopLayout();
  const compactField = desktopCompactField(isDesktop);
  const experienceCopy = useBusinessCopy();
  const CATEGORIES_WITH_TOKENS = useMemo(
    () =>
      CATEGORIES.map((item, index) => ({
        ...item,
        color: [
          theme.colors.lavender,
          theme.colors.blue,
          theme.colors.yellow,
          theme.colors.lavender,
          theme.colors.blue,
          theme.colors.textSecondary,
        ][index % 6],
      })),
    [theme],
  );
  const expenseChoices = CATEGORIES_WITH_TOKENS.map((item) => {
    if (item.key === "material") {
      return { ...item, label: capitalize(experienceCopy.materialNoun) };
    }
    if (item.key === "packaging") {
      return { ...item, label: capitalize(experienceCopy.packagingNoun) };
    }
    return item;
  });
  const [type, setType] = useState<FinanceEntryType>(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [date, setDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const createEntry = useCreateFinanceEntry();
  const [attempted, setAttempted] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState(false);
  const amountRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);
  const categoryOffset = useRef(0);
  const categories =
    type === "income"
      ? [
          {
            key: "sale" as const,
            label: "Venda / atendimento",
            icon: "cash-outline" as const,
            color: theme.colors.success,
          },
          {
            key: "other" as const,
            label: "Outra entrada",
            icon: "ellipsis-horizontal-circle-outline" as const,
            color: theme.colors.textSecondary,
          },
        ]
      : expenseChoices;
  const invalidAmount =
    !Number.isFinite(parseCurrencyInput(amount)) || parseCurrencyInput(amount) <= 0;
  function changeType(next: FinanceEntryType) {
    const compatible = compatibleEntryCategory(next, category);
    setCategoryNotice(!!category && !compatible);
    setCategory(compatible);
    setType(next);
  }
  function validation(
    name:
      | "amount_invalid"
      | "description_required"
      | "category_required"
      | "date_invalid",
  ) {
    void trackAnalyticsAction(`finance_${name}`, useAuth.getState().token);
  }

  const formValidation = useFormValidation(
    {
      amount: invalidAmount && "Informe um valor maior que zero.",
      description: !description.trim() && "Informe uma descrição.",
      category: !compatibleEntryCategory(type, category) && "Escolha uma categoria.",
    },
    visible,
  );

  async function handleSubmit() {
    if (
      !formValidation.validate((field) => {
        const events = {
          amount: "amount_invalid",
          description: "description_required",
          category: "category_required",
        } as const;
        validation(events[field]);
      })
    )
      return;
    const parsedAmount = parseCurrencyInput(amount);
    const normalizedDate = brToIso(date);
    setAttempted(true);
    const selectedCategory = compatibleEntryCategory(type, category);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      validation("amount_invalid");
      requestAnimationFrame(() => amountRef.current?.focus());
      return;
    }

    if (!description.trim()) {
      validation("description_required");
      requestAnimationFrame(() => descriptionRef.current?.focus());
      return;
    }

    if (!selectedCategory) {
      validation("category_required");
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ y: categoryOffset.current, animated: true }),
      );
      return;
    }

    if (date.trim() && !normalizedDate) {
      validation("date_invalid");
      requestAnimationFrame(() => dateRef.current?.focus());
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
      <StandardModal
        title="Novo lançamento"
        visible={visible}
        onClose={onClose}
        scrollRef={scrollRef}
        footer={
          <Button
            title="Registrar lançamento"
            size="lg"
            onPress={() => void handleSubmit()}
            loading={createEntry.isPending}
            icon={
              <AppIcon
                name="checkmark-circle-outline"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            }
            style={{ flex: isDesktop ? undefined : 1, ...desktopAction(isDesktop, 240) }}
          />
        }
      >
        <View style={{ flexShrink: 1, gap: 12 }}>
          <Typography variant="body" style={styles.subtitle} numberOfLines={2}>
            Registre uma entrada ou saída para manter suas finanças organizadas.
          </Typography>

          <View style={styles.typeSwitch}>
            <TypeButton
              icon="arrow-down-circle-outline"
              label="Entrada"
              selected={type === "income"}
              tone="green"
              onPress={() => changeType("income")}
            />
            <TypeButton
              icon="arrow-up-circle-outline"
              label="Saída"
              selected={type === "expense"}
              tone="muted"
              onPress={() => changeType("expense")}
            />
          </View>

          <FormCard label="Valor (R$)">
            {attempted && invalidAmount ? (
              <Typography variant="body" accessibilityRole="alert">
                Informe um valor maior que zero.
              </Typography>
            ) : null}
            <View style={compactField}>
              <ValidationField {...formValidation.field("amount")}>
                <Field
                  icon="cash-outline"
                  iconColor={
                    type === "income" ? theme.colors.success : theme.colors.alert
                  }
                  placeholder="Ex: 25,00"
                  inputRef={amountRef}
                  accessibilityLabel="Valor em reais"
                  value={amount}
                  onChangeText={(value) => setAmount(maskCurrencyInput(value))}
                  keyboardType="decimal-pad"
                />
              </ValidationField>
            </View>
          </FormCard>

          <FormCard label="Descrição">
            {attempted && !description.trim() ? (
              <Typography variant="body" accessibilityRole="alert">
                Descreva a origem da entrada ou o motivo da despesa.
              </Typography>
            ) : null}
            <ValidationField {...formValidation.field("description")}>
              <Field
                icon="document-text-outline"
                placeholder={`Ex: ${experienceCopy.financeEntryExample}`}
                inputRef={descriptionRef}
                accessibilityLabel="Descrição do lançamento"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </ValidationField>
          </FormCard>

          <ValidationField {...formValidation.field("category")}>
            <View
              style={styles.formCard}
              onLayout={(event) => {
                categoryOffset.current = event.nativeEvent.layout.y;
              }}
            >
              <Typography variant="bodyBold" style={styles.fieldLabel}>
                Categoria
              </Typography>
              {categoryNotice ? (
                <Typography variant="body" accessibilityRole="alert">
                  O tipo mudou. Escolha uma categoria compatível.
                </Typography>
              ) : null}
              {attempted && !category ? (
                <Typography variant="body" accessibilityRole="alert">
                  Escolha a categoria deste lançamento.
                </Typography>
              ) : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroller}
                contentContainerStyle={styles.categoryGrid}
              >
                {categories.map((item) => (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    onPress={() => {
                      setCategory(item.key);
                      setCategoryNotice(false);
                    }}
                    style={[
                      styles.categoryButton,
                      category === item.key && styles.categoryButtonSelected,
                    ]}
                  >
                    <AppIcon name={item.icon} size={25} color={item.color} />
                    <Typography
                      variant="captionBold"
                      color={
                        category === item.key
                          ? theme.colors.text
                          : theme.colors.textSecondary
                      }
                      numberOfLines={1}
                    >
                      {item.label}
                    </Typography>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ValidationField>

          <FormCard label="Data (opcional)">
            {attempted && date.trim() && !brToIso(date) ? (
              <Typography variant="body" accessibilityRole="alert">
                Use uma data válida no formato DD/MM/AAAA.
              </Typography>
            ) : null}
            <Field
              icon="calendar-outline"
              placeholder="DD/MM/AAAA"
              inputRef={dateRef}
              accessibilityLabel="Data, dia mês e ano"
              value={date}
              onChangeText={(value) => setDate(maskDateBR(value))}
              onFocus={focusDateField}
              keyboardType="number-pad"
              trailingIcon="calendar-outline"
              trailingLabel="Abrir calendário"
              onTrailingPress={() => setCalendarVisible(true)}
            />
          </FormCard>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.viewEntries}
          >
            <AppIcon
              name="clipboard-outline"
              size={22}
              color={theme.colors.primaryStrong}
            />
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              Ver lançamentos
            </Typography>
          </Pressable>
        </View>
      </StandardModal>

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
  icon: AppIconName;
  label: string;
  selected: boolean;
  tone: "green" | "muted";
  onPress: () => void;
}>) {
  const { theme, styles } = useEntryStyles();
  // Selecao = fundo semantico suave + texto forte (verde = entrada, vermelho =
  // saida); o rosa nao participa — cor semantica carrega o significado.
  const selectedBg = tone === "green" ? theme.colors.successBg : theme.colors.alertBg;
  const selectedFg = tone === "green" ? theme.colors.success : theme.colors.alert;
  const color = selected ? selectedFg : theme.colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.typeButton, selected && { backgroundColor: selectedBg }]}
    >
      <AppIcon name={icon} size={25} color={color} />
      <Typography variant="bodyBold" color={color}>
        {label}
      </Typography>
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
      <Typography variant="bodyBold" style={styles.fieldLabel}>
        {label}
      </Typography>
      {children}
    </View>
  );
}

function Field({
  icon,
  iconColor,
  trailingIcon,
  inputRef,
  trailingLabel,
  onTrailingPress,
  multiline,
  ...inputProps
}: Readonly<
  React.ComponentProps<typeof TextInput> & {
    inputRef?: React.Ref<TextInput>;
    icon: AppIconName;
    /** Cor do ícone principal; padrão neutro — só use uma cor semântica (ex.
     * verde de sucesso) quando o campo realmente representa esse significado
     * (ex. valor em dinheiro), nunca em campos neutros como texto/data. */
    iconColor?: string;
    trailingIcon?: AppIconName;
    trailingLabel?: string;
    onTrailingPress?: () => void;
  }
>) {
  const { theme, styles } = useEntryStyles();

  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <AppIcon name={icon} size={24} color={iconColor ?? theme.colors.textSecondary} />
      </View>
      <CenteredTextInput
        ref={inputRef}
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, multiline && styles.multilineInput]}
      />
      {trailingIcon ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={trailingLabel}
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={12}
        >
          <AppIcon name={trailingIcon} size={25} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  const border = theme.colors.border;
  const card = theme.colors.surfaceElevated;
  const inputBg = theme.colors.surface;

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
      minHeight: 48,
      paddingHorizontal: 12,
    },
    categoryButtonSelected: {
      backgroundColor: theme.colors.primaryBg,
      borderColor: theme.colors.primary,
    },
    categoryGrid: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 13,
    },
    categoryScroller: {
      marginHorizontal: -13,
    },
    content: {
      gap: 12,
      paddingBottom: 18,
      paddingHorizontal: 22,
      paddingTop: 8,
    },
    fieldLabel: {
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
      fontFamily: fonts.bold,
      minHeight: 40,
      padding: 0,
    },
    inputIcon: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: radii.md,
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
      minHeight: 48,
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
    subtitle: {
      marginTop: 4,
      width: "86%",
    },
    title: {
      flex: 1,
    },
    typeButton: {
      alignItems: "center",
      borderRadius: 16,
      flex: 1,
      flexDirection: "row",
      gap: 10,
      height: 48,
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
    viewEntries: {
      alignItems: "center",
      flexDirection: "row",
      gap: 9,
      justifyContent: "center",
    },
  });
}
