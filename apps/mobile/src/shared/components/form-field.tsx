import {
  Typography,
  useTheme,
  fontSizes,
  fonts,
  iconSizes,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
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
  return {
    border: theme.colors.border,
    fieldBg: theme.colors.surface,
    placeholder: theme.colors.textSecondary + "B3",
    sheetBg: theme.colors.surfaceElevated,
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
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        style={{ fontSize: fontSizes.sm }}
      >
        {label}
      </Typography>
      {required ? (
        <Typography
          variant="bodyBold"
          color={theme.colors.primary}
          style={{ fontSize: fontSizes.sm }}
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

/** Campo de texto com ícone rosa à esquerda, no estilo dos formulários do app.
 *  Mesmas métricas canônicas do `Input` do ui (56px, radii.lg, borda do tema). */
export function TextFieldCard({ icon, inputStyle, ...inputProps }: TextFieldCardProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: 56,
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
      <Ionicons name={icon} size={iconSizes.sm} color={theme.colors.primary} />
      <TextInput
        placeholderTextColor={pal.placeholder}
        style={[
          {
            flex: 1,
            color: theme.colors.text,
            fontSize: fontSizes.md,
            fontFamily: fonts.regular,
            paddingVertical: spacing.md,
          },
          inputStyle,
        ]}
        {...inputProps}
      />
    </View>
  );
}
