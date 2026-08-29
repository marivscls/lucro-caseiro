import React from "react";
import {
  Platform,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../theme-context";
import { fonts, fontSizes, radii, spacing } from "../theme";

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
}: InputProps) {
  const { theme } = useTheme();
  const errorId = React.useId();
  const [focused, setFocused] = React.useState(false);
  const webAutofillSurface: TextStyle | undefined =
    Platform.OS === "web"
      ? { boxShadow: `inset 0 0 0 1000px ${theme.colors.surfaceElevated}` }
      : undefined;
  const multilineWebCenter: TextStyle | undefined =
    multiline && Platform.OS === "web"
      ? { paddingTop: 13, paddingBottom: 13, lineHeight: 22 }
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
          borderColor: error
            ? theme.colors.alert
            : focused
              ? theme.colors.primaryInteractive
              : theme.colors.border,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        }}
      >
        {icon}
        <TextInput
          placeholderTextColor={theme.colors.textSecondary + "80"}
          multiline={multiline}
          textAlignVertical={multiline ? "center" : "auto"}
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
            multilineWebCenter,
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
