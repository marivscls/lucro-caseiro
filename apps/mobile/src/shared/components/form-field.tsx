import {
  Typography,
  useTheme,
  fontSizes,
  fonts,
  iconSizes,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
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
  icon: AppIconName;
  iconSurface?: boolean;
  prefix?: string;
  inputStyle?: StyleProp<TextStyle>;
}> &
  TextInputProps;

/** Campo de texto com ícone rosa à esquerda, no estilo dos formulários do app.
 *  Mesmas métricas canônicas do `Input` do ui (48px, radii.lg, borda do tema). */
export function TextFieldCard({
  icon,
  iconSurface = false,
  prefix,
  inputStyle,
  ...inputProps
}: TextFieldCardProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: 48,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.fieldBg,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        paddingHorizontal: iconSurface ? 0 : spacing.md,
        gap: iconSurface ? 0 : spacing.md,
      }}
    >
      {iconSurface ? (
        <View
          style={{
            alignItems: "center",
            alignSelf: "stretch",
            backgroundColor: theme.colors.primaryBg,
            justifyContent: "center",
            width: 44,
          }}
        >
          <AppIcon name={icon} size={iconSizes.sm} color={theme.colors.primary} />
        </View>
      ) : (
        <AppIcon name={icon} size={iconSizes.sm} color={theme.colors.primary} />
      )}
      <View
        style={{
          alignItems: "center",
          flex: 1,
          flexDirection: "row",
          gap: spacing.md,
          minWidth: 0,
          paddingLeft: iconSurface ? spacing.md : 0,
          paddingRight: iconSurface ? spacing.md : 0,
        }}
      >
        {prefix ? (
          <Typography variant="bodyBold" color={theme.colors.text}>
            {prefix}
          </Typography>
        ) : null}
        <TextInput
          placeholderTextColor={pal.placeholder}
          style={[
            {
              flex: 1,
              color: theme.colors.text,
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              paddingVertical: spacing.sm,
            },
            inputStyle,
          ]}
          {...inputProps}
        />
      </View>
    </View>
  );
}
