import React from "react";
import {
  Platform,
  Text,
  View,
  type TextInput,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { desktopTypography, fonts, fontSizes, spacing } from "../theme";
import { fieldColors, fieldMetrics } from "../field-tokens";
import { CenteredTextInput, type CenteredTextInputProps } from "./centered-text-input";
import { useFieldOutlineError } from "./validation-context";

interface InputProps extends CenteredTextInputProps {
  label?: string;
  /** Mostra "(opcional)" discreto ao lado do rótulo. */
  optional?: boolean;
  /** Explicação curta entre o rótulo e o campo. */
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  /** Conteúdo à direita dentro da caixa do input (ex.: botão "mostrar senha"). */
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  /** Permite focar o próximo campo ao tocar em "Avançar" no teclado. */
  ref?: React.Ref<TextInput>;
}

/** Campo de texto padrão: rótulo de 15 px, caixa de 48 px, raio 12 e foco na cor de ação. */
export function Input({
  label,
  optional,
  hint,
  error,
  icon,
  rightIcon,
  containerStyle,
  style,
  multiline,
  ...props
}: Readonly<InputProps>) {
  const { theme } = useTheme();
  const field = fieldColors(theme);
  const errorId = React.useId();
  const validationError = useFieldOutlineError();
  const invalid = !!error || !!validationError;
  const [focused, setFocused] = React.useState(false);
  let borderColor = field.border;
  if (invalid) borderColor = field.borderError;
  else if (focused) borderColor = field.borderFocus;
  const background = focused ? field.fieldBgFocus : field.fieldBg;
  const webAutofillSurface: TextStyle | undefined =
    Platform.OS === "web"
      ? { boxShadow: `inset 0 0 0 1000px ${background}` }
      : undefined;

  return (
    <View style={[{ gap: fieldMetrics.labelGap, minWidth: 0 }, containerStyle]}>
      {label ? (
        <View style={{ gap: 2 }}>
          <Text
            style={{
              ...desktopTypography.fieldLabel,
              color: theme.colors.text,
            }}
          >
            {label}
            {optional ? (
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: fontSizes.sm,
                  color: theme.colors.textSecondary,
                }}
              >
                {" (opcional)"}
              </Text>
            ) : null}
          </Text>
          {hint ? (
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: fontSizes.sm,
                lineHeight: 20,
                color: theme.colors.textSecondary,
              }}
            >
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: multiline ? "flex-start" : "center",
            backgroundColor: background,
            borderRadius: fieldMetrics.radius,
            borderWidth: 1,
            borderColor,
            paddingHorizontal: fieldMetrics.paddingX,
            paddingVertical: multiline ? spacing.md : 0,
            gap: spacing.md,
          },
          Platform.OS === "web" && focused && !invalid
            ? ({ boxShadow: `0 0 0 3px ${field.focusRing}` } as ViewStyle)
            : null,
        ]}
      >
        {icon}
        <CenteredTextInput
          placeholderTextColor={field.placeholder}
          multiline={multiline}
          style={[
            {
              flex: 1,
              // Deixa o campo encolher para o ícone da direita caber (web).
              minWidth: 0,
              // Denso sem sacrificar o alvo de toque recomendado.
              height: multiline ? undefined : fieldMetrics.height - 2,
              minHeight: multiline ? fieldMetrics.multilineHeight - spacing.md * 2 - 2 : undefined,
              textAlignVertical: multiline ? "top" : "center",
              fontSize: fontSizes.md,
              fontFamily: fonts.regular,
              color: theme.colors.text,
            },
            webAutofillSurface,
            style,
          ]}
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          {...(Platform.OS === "web"
            ? ({
                "aria-invalid": !!error,
                "aria-describedby": error ? errorId : undefined,
              } as Record<string, unknown>)
            : {})}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {rightIcon}
      </View>
      {error && (
        <Text
          nativeID={errorId}
          accessibilityLiveRegion="polite"
          style={{
            fontSize: fontSizes.sm,
            fontFamily: fonts.regular,
            color: theme.colors.alert,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
