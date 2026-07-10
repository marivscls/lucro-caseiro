import { Input, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, type ViewStyle } from "react-native";

import { maskDateBR } from "../utils/date";
import { CalendarModal } from "./calendar-modal";

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
      <CalendarModal
        visible={showPicker}
        value={value}
        onSelect={onChange}
        onClose={() => setShowPicker(false)}
      />
    </>
  );
}
