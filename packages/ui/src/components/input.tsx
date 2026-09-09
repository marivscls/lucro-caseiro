import React from "react";
import {
  Platform,
  Text,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes, radii, spacing } from "../theme";
import { CenteredTextInput } from "./centered-text-input";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  multiline,
  ...props
}: Readonly<InputProps>) {
  const { theme } = useTheme();
  const errorId = React.useId();
  const [focused, setFocused] = React.useState(false);
  let borderColor = theme.colors.border;
  if (error) borderColor = theme.colors.alert;
  else if (focused) borderColor = theme.colors.primaryInteractive;
  const webAutofillSurface: TextStyle | undefined =
    Platform.OS === "web"
      ? { boxShadow: `inset 0 0 0 1000px ${theme.colors.surfaceElevated}` }
      : undefined;

  return (
    <View style={[{ gap: spacing.sm }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: fontSizes.sm,
            color: theme.colors.textSecondary,
            fontFamily: fonts.semiBold,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        }}
      >
        {icon}
        <CenteredTextInput
          placeholderTextColor={
            theme.mode === "dark"
              ? theme.colors.textSecondary
              : theme.colors.textSecondary + "80"
          }
          multiline={multiline}
          style={[
            {
              flex: 1,
              // Denso sem sacrificar o alvo de toque recomendado.
              height: 48,
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
