import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
} from "react-native";

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  keyboardVerticalOffset = 0,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  style,
  ...props
}: Readonly<KeyboardAwareScrollViewProps>) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
