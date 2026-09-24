import React, { useState } from "react";

import { CalendarModal } from "./calendar-modal";
import { FieldLinkAction, FormField, SelectField } from "./form-field";

/**
 * Data escolhida no calendário (DD/MM/AAAA), sem digitar. Opcional: mostra
 * "Limpar" ao lado do rótulo quando há data.
 */
export function CalendarDateField({
  label,
  value,
  onChange,
  accessibilityLabel,
  optional = false,
  hint,
  placeholder = "Escolher data",
  validation,
  span,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel?: string;
  optional?: boolean;
  hint?: string;
  placeholder?: string;
  validation?: React.ComponentProps<typeof FormField>["validation"];
  span?: "one" | "full";
}>) {
  const [calendarVisible, setCalendarVisible] = useState(false);
  return (
    <FormField
      label={label}
      optional={optional}
      hint={hint}
      validation={validation}
      span={span}
      labelAction={
        optional && value ? (
          <FieldLinkAction
            label="Limpar"
            accessibilityLabel={`Limpar ${label.toLowerCase()}`}
            onPress={() => onChange("")}
          />
        ) : undefined
      }
    >
      <SelectField
        icon="calendar-outline"
        value={value}
        placeholder={placeholder}
        onPress={() => setCalendarVisible(true)}
        accessibilityLabel={accessibilityLabel ?? label}
      />
      <CalendarModal
        visible={calendarVisible}
        value={value}
        onClose={() => setCalendarVisible(false)}
        onSelect={onChange}
      />
    </FormField>
  );
}
