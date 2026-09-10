import React, { forwardRef, useCallback, useLayoutEffect, useRef } from "react";
import { Platform, StyleSheet, TextInput, type TextInputProps } from "react-native";
import { centerWebTextInput } from "./text-input-alignment";
import { FieldInputContext } from "./validation-context";

/** Ref instance exposed by the wrapper, matching React Native's TextInput. */
export type CenteredTextInput = TextInput;

export interface CenteredTextInputProps extends TextInputProps {
  /** Restrict controlled, unmasked numbers; currency, date and phone masks keep their rules. */
  numericMode?: "integer" | "decimal" | "signed-decimal";
}

const numericPatterns = {
  integer: /^\d*$/,
  decimal: /^[\d,.]*$/,
  "signed-decimal": /^-?[\d,.]*$/,
};

/** Same input API/ref, with a shared vertical alignment for native and PWA forms. */
export const CenteredTextInput = forwardRef<TextInput, CenteredTextInputProps>(
  function CenteredTextInput(
    { style, onLayout, onChange, onChangeText, multiline, numericMode, ...props },
    ref,
  ) {
    const input = useRef<TextInput | null>(null);
    const lastAcceptedText = useRef(props.value ?? props.defaultValue ?? "");
    const acceptsText = (text: string) =>
      !numericMode ||
      (numericPatterns[numericMode].test(text) && text.split(/[,.]/).length <= 2);
    const numericInputMode = numericMode === "integer" ? "numeric" : "decimal";
    const field = React.useContext(FieldInputContext);
    const registerFieldInput = field?.register;
    const flattened = StyleSheet.flatten(style);
    const webMultiline = Platform.OS === "web" && multiline;
    const align = useCallback(() => {
      if (webMultiline) centerWebTextInput(input.current);
    }, [webMultiline]);
    const attachRef = useCallback(
      (node: TextInput | null) => {
        registerFieldInput?.(node, input.current, props.value);
        input.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref, registerFieldInput, props.value],
    );

    // Recalculate for controlled values, placeholders and changed typography.
    useLayoutEffect(align);
    useLayoutEffect(() => {
      if (props.value !== undefined) lastAcceptedText.current = props.value;
    }, [props.value]);

    return (
      <TextInput
        {...props}
        inputMode={props.inputMode ?? (numericMode ? numericInputMode : undefined)}
        {...(field?.error
          ? {
              "aria-invalid": true,
              "aria-describedby": field.errorId,
              accessibilityHint: field.error,
            }
          : {})}
        ref={attachRef}
        multiline={multiline}
        textAlignVertical="center"
        style={[
          { paddingVertical: 0, includeFontPadding: false },
          style,
          { textAlignVertical: "center" },
          webMultiline && {
            // A fixed border-box prevents centered padding from growing an
            // auto-height textarea on every layout event.
            height: flattened?.height ?? flattened?.minHeight ?? 48,
            lineHeight:
              flattened?.lineHeight ?? Math.ceil((flattened?.fontSize ?? 16) * 1.375),
          },
        ]}
        onLayout={(event) => {
          align();
          onLayout?.(event);
        }}
        onChange={(event) => {
          align();
          if (acceptsText(event.nativeEvent.text)) onChange?.(event);
        }}
        onChangeText={(text) => {
          if (!acceptsText(text)) {
            // React restores controlled DOM inputs; native inputs need their text restored.
            if (Platform.OS !== "web") {
              input.current?.setNativeProps({ text: lastAcceptedText.current });
            }
            return;
          }
          lastAcceptedText.current = text;
          onChangeText?.(text);
        }}
      />
    );
  },
);
