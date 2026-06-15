import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";

/** Cores derivadas do tema para os campos de formulário (claro e escuro). */
export function useFieldPalette() {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  return {
    border: isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)",
    fieldBg: isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface,
    placeholder: isDark ? "rgba(184, 160, 144, 0.7)" : "rgba(139, 115, 85, 0.7)",
    sheetBg: isDark ? "#2C2420" : theme.colors.surfaceElevated,
  };
}

/** Rótulo de campo (acima do campo), com "*" rosa quando obrigatório. */
export function FieldLabel({
  label,
  required,
}: Readonly<{ label: string; required?: boolean }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4, marginBottom: spacing.sm }}>
      <Typography variant="bodyBold" color={theme.colors.text} style={{ fontSize: 15 }}>
        {label}
      </Typography>
      {required ? (
        <Typography
          variant="bodyBold"
          color={theme.colors.primary}
          style={{ fontSize: 15 }}
        >
          *
        </Typography>
      ) : null}
    </View>
  );
}

export type TextFieldCardProps = Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  inputStyle?: StyleProp<TextStyle>;
}> &
  TextInputProps;

/** Campo de texto com ícone rosa à esquerda, no estilo dos formulários do app. */
export function TextFieldCard({ icon, inputStyle, ...inputProps }: TextFieldCardProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: 60,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.md,
      }}
    >
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <TextInput
        placeholderTextColor={pal.placeholder}
        style={[
          {
            flex: 1,
            color: theme.colors.text,
            fontSize: 16,
            paddingVertical: spacing.md,
          },
          inputStyle,
        ]}
        {...inputProps}
      />
    </View>
  );
}
