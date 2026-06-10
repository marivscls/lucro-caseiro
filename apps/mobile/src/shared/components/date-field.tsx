import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Input, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, type ViewStyle } from "react-native";

import { brToIso, maskDateBR } from "../utils/date";

interface DateFieldProps {
  label: string;
  /** Data em DD/MM/AAAA (mesmo formato dos states existentes). */
  value: string;
  onChange: (br: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

/**
 * Campo de data com digitação mascarada (DD/MM/AAAA) e seletor nativo
 * pelo ícone de calendário — quem não enxerga bem ou não sabe digitar
 * a data consegue escolher tocando.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  containerStyle,
}: Readonly<DateFieldProps>) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const iso = brToIso(value);
  const pickerDate = iso ? new Date(`${iso}T12:00:00`) : new Date();

  function handlePicked(event: DateTimePickerEvent, date?: Date) {
    setShowPicker(Platform.OS === "ios");
    if (event.type === "dismissed" || !date) return;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    onChange(`${dd}/${mm}/${date.getFullYear()}`);
    if (Platform.OS === "ios") setShowPicker(false);
  }

  return (
    <>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={(v) => onChange(maskDateBR(v))}
        keyboardType="number-pad"
        maxLength={10}
        containerStyle={containerStyle}
        icon={
          <Pressable
            onPress={() => setShowPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={`Escolher ${label} no calendário`}
            hitSlop={12}
          >
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        }
      />
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePicked}
        />
      )}
    </>
  );
}
