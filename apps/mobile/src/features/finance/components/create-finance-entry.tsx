import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { compatibleEntryCategory } from "../entry-guidance";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAuth } from "../../../shared/hooks/use-auth";
import type { ExpenseCategory, FinanceEntryType } from "@lucro-caseiro/contracts";
import { Button } from "@lucro-caseiro/ui";
import { type AppIconName } from "../../../shared/components/app-icon";
import React, { useState } from "react";

import { brToIso, localIsoDate } from "../../../shared/utils/date";
import {
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { CalendarModal } from "../../../shared/components/calendar-modal";
import { useCreateFinanceEntry } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertError } from "../../../shared/utils/alerts";
import { useBusinessCopy } from "../../subscription/business-copy";
import { StandardModal } from "../../../shared/components/standard-modal";
import {
  ChoiceField,
  FormField,
  SelectField,
  TextField,
  type ChoiceOption,
  ChipChoiceField,
} from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";

interface CreateFinanceEntryProps {
  visible: boolean;
  initialType?: FinanceEntryType;
  onClose: () => void;
  onSuccess?: () => void;
}

type EntryCategory = ExpenseCategory;

const TYPE_OPTIONS: readonly ChoiceOption<FinanceEntryType>[] = [
  { value: "income", label: "Entrada", icon: "arrow-down-circle-outline" },
  { value: "expense", label: "Saída", icon: "arrow-up-circle-outline" },
];

type CategoryOption = Readonly<{
  value: EntryCategory;
  label: string;
  icon: AppIconName;
}>;

const INCOME_CATEGORIES: readonly CategoryOption[] = [
  { value: "sale", label: "Venda / atendimento", icon: "cash-outline" },
  { value: "other", label: "Outra entrada", icon: "ellipsis-horizontal-circle-outline" },
];

const EXPENSE_CATEGORIES: readonly CategoryOption[] = [
  { value: "material", label: "Material", icon: "cube-outline" },
  { value: "packaging", label: "Embalagem", icon: "file-tray-outline" },
  { value: "transport", label: "Transporte", icon: "car-outline" },
  { value: "fee", label: "Taxa", icon: "pricetag-outline" },
  { value: "utility", label: "Utilidade", icon: "flash-outline" },
  { value: "other", label: "Outro", icon: "ellipsis-horizontal-circle-outline" },
];

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

type ValidationEvent =
  | "amount_invalid"
  | "description_required"
  | "category_required"
  | "date_invalid";

export function CreateFinanceEntry({
  visible,
  initialType = "income",
  onClose,
  onSuccess,
}: Readonly<CreateFinanceEntryProps>) {
  const experienceCopy = useBusinessCopy();
  const [type, setType] = useState<FinanceEntryType>(initialType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [date, setDate] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState(false);
  const createEntry = useCreateFinanceEntry();

  const categories: readonly CategoryOption[] =
    type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES.map((item) => {
          if (item.value === "material")
            return { ...item, label: capitalize(experienceCopy.materialNoun) };
          if (item.value === "packaging")
            return { ...item, label: capitalize(experienceCopy.packagingNoun) };
          return item;
        });

  const invalidAmount =
    !Number.isFinite(parseCurrencyInput(amount)) || parseCurrencyInput(amount) <= 0;

  function changeType(next: FinanceEntryType) {
    const compatible = compatibleEntryCategory(next, category);
    setCategoryNotice(!!category && !compatible);
    setCategory(compatible);
    setType(next);
  }

  function track(name: ValidationEvent) {
    void trackAnalyticsAction(`finance_${name}`, useAuth.getState().token);
  }

  const formValidation = useFormValidation(
    {
      amount: invalidAmount && "Informe um valor maior que zero.",
      description: !description.trim() && "Informe uma descrição.",
      category: !compatibleEntryCategory(type, category) && "Escolha uma categoria.",
      date: !!date.trim() && !brToIso(date) && "Use uma data válida.",
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
          date: "date_invalid",
        } as const;
        track(events[field]);
      })
    )
      return;

    try {
      await createEntry.mutateAsync({
        type,
        amount: parseCurrencyInput(amount),
        description: description.trim(),
        category: compatibleEntryCategory(type, category) as ExpenseCategory,
        isFixed: false,
        date: brToIso(date) || localIsoDate(),
      });

      showToast(`${type === "income" ? "Entrada" : "Saída"} de R$ ${amount} salva!`);
      onSuccess?.();
    } catch {
      alertError("Não foi possível registrar o lançamento. Tente novamente.");
    }
  }

  return (
    <>
      <StandardModal
        title="Novo lançamento"
        subtitle="Registre uma entrada ou saída para manter suas finanças organizadas."
        size="form"
        visible={visible}
        onClose={onClose}
        footer={
          <FormActions>
            <Button
              title="Cancelar"
              variant="outline"
              disabled={createEntry.isPending}
              onPress={onClose}
            />
            <Button
              title="Registrar lançamento"
              onPress={() => void handleSubmit()}
              loading={createEntry.isPending}
            />
          </FormActions>
        }
      >
        <FormBody>
          <FormGrid>
            <FormField label="Tipo" span="full">
              <ChoiceField
                accessibilityLabel="Tipo do lançamento"
                value={type}
                options={TYPE_OPTIONS}
                onChange={changeType}
              />
            </FormField>
            <FormField label="Valor" validation={formValidation.field("amount")}>
              <TextField
                prefix="R$"
                placeholder="25,00"
                accessibilityLabel="Valor em reais"
                value={amount}
                onChangeText={(value) => setAmount(maskCurrencyInput(value))}
                keyboardType="decimal-pad"
              />
            </FormField>
            <FormField label="Data" optional validation={formValidation.field("date")}>
              <SelectField
                icon="calendar-outline"
                value={date}
                placeholder="Hoje"
                accessibilityLabel="Escolher a data no calendário"
                onPress={() => setCalendarVisible(true)}
              />
            </FormField>
            <FormField
              label="Descrição"
              span="full"
              validation={formValidation.field("description")}
            >
              <TextField
                placeholder={`Ex: ${experienceCopy.financeEntryExample}`}
                accessibilityLabel="Descrição do lançamento"
                value={description}
                onChangeText={setDescription}
              />
            </FormField>
            <FormField
              label="Categoria"
              span="full"
              hint={
                categoryNotice
                  ? "O tipo mudou. Escolha uma categoria compatível."
                  : undefined
              }
              validation={formValidation.field("category")}
            >
              <ChipChoiceField
                accessibilityLabel="Categoria do lançamento"
                value={category}
                options={categories}
                onChange={(next) => {
                  setCategory(next);
                  setCategoryNotice(false);
                }}
              />
            </FormField>
          </FormGrid>
        </FormBody>
      </StandardModal>

      <CalendarModal
        visible={calendarVisible}
        value={date}
        onClose={() => setCalendarVisible(false)}
        onSelect={(selectedDate) => {
          setDate(selectedDate);
          setCalendarVisible(false);
        }}
      />
    </>
  );
}
