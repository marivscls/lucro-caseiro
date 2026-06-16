import { Input, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, type ViewStyle } from "react-native";

import { brToIso, maskDateBR } from "../utils/date";
import { showAlert } from "./alert-store";

type DateTimePickerEvent = { type?: string };
type NativeDatePicker = React.ComponentType<{
  value: Date;
  mode: "date";
  display: "spinner" | "default";
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
}>;

function getNativeDatePicker(): NativeDatePicker | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-community/datetimepicker").default as NativeDatePicker;
  } catch {
    return null;
  }
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (br: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  containerStyle,
}: Readonly<DateFieldProps>) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const DateTimePicker = showPicker ? getNativeDatePicker() : null;

  const iso = brToIso(value);
  const pickerDate = iso ? new Date(`${iso}T12:00:00`) : new Date();

  function openPicker() {
    if (!getNativeDatePicker()) {
      showAlert({
        title: "Calendario indisponivel",
        message: "Digite a data no formato DD/MM/AAAA.",
      });
      return;
    }
    setShowPicker(true);
  }

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
            onPress={openPicker}
            accessibilityRole="button"
            accessibilityLabel={`Escolher ${label} no calendario`}
            hitSlop={12}
          >
            <Ionicons name="calendar-outline" size={22} color={theme.colors.primary} />
          </Pressable>
        }
      />
      {showPicker && DateTimePicker && (
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
