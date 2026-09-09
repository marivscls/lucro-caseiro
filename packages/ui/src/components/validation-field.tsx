import React, { useCallback, useContext, useEffect, useId, useMemo, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  Text,
  View,
  type TextInput,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme-context";
import { fonts, fontSizes, radii, spacing } from "../theme";
import { FieldInputContext, ValidationScrollContext } from "./validation-context";

export interface ValidationFieldProps {
  children: React.ReactNode;
  error?: string;
  summary?: string;
  registerFocus: (focus: () => void) => () => void;
  style?: StyleProp<ViewStyle>;
}

// Keep the native UI package independent of TypeScript's DOM library.
interface WebFieldTarget {
  focus: (options?: { preventScroll?: boolean }) => void;
}
interface WebFieldSurface {
  querySelectorAll: (selector: string) => ArrayLike<WebFieldTarget & { value: string }>;
  querySelector: (selector: string) => WebFieldTarget | null;
  scrollIntoView: (options: { block: "nearest"; behavior: "auto" }) => void;
}

/** Inline feedback with platform-aware focus; does not clear the form or open a modal. */
export function ValidationField({
  children,
  error,
  summary,
  registerFocus,
  style,
}: ValidationFieldProps) {
  const { theme } = useTheme();
  const errorId = useId();
  const root = useRef<View>(null);
  const inputs = useRef(new Map<TextInput, string>());
  const frame = useRef<number | null>(null);
  const scrollIntoView = useContext(ValidationScrollContext);
  const register = useCallback(
    (node: TextInput | null, previous: TextInput | null, value = "") => {
      if (previous) inputs.current.delete(previous);
      if (node) inputs.current.set(node, value);
    },
    [],
  );
  const context = useMemo(
    () => ({ register, error, errorId }),
    [register, error, errorId],
  );
  const focus = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (!root.current) return;
      if (Platform.OS === "web") {
        const element = root.current as unknown as WebFieldSurface;
        const fields = Array.from(
          element.querySelectorAll(
            "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
          ),
        );
        const target =
          fields.find((field) => !field.value.trim()) ??
          fields[0] ??
          element.querySelector(
            'button:not([disabled]), [role="button"]:not([aria-disabled="true"]), [tabindex="0"]',
          );
        target?.focus({ preventScroll: true });
        // Scroll the whole field so its notice and label remain visible too.
        element.scrollIntoView({ block: "nearest", behavior: "auto" });
      } else {
        const input =
          Array.from(inputs.current).find(([, value]) => !value.trim())?.[0] ??
          inputs.current.keys().next().value;
        input?.focus();
        scrollIntoView?.(root.current);
        if (!input) {
          const node = findNodeHandle(root.current);
          if (node) AccessibilityInfo.setAccessibilityFocus(node);
        }
      }
    });
  }, [scrollIntoView]);

  useEffect(() => registerFocus(focus), [registerFocus, focus]);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  return (
    <FieldInputContext.Provider value={context}>
      <View
        ref={root}
        collapsable={false}
        accessibilityHint={error}
        {...(Platform.OS === "web"
          ? { "aria-invalid": !!error, "aria-describedby": error ? errorId : undefined }
          : {})}
        style={[{ minWidth: 0, flexShrink: 1 }, style]}
      >
        {summary ? (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={{
              borderRadius: radii.md,
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.alert,
              borderWidth: 1,
              padding: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            <Text
              style={{
                color: theme.colors.alert,
                fontFamily: fonts.semiBold,
                fontSize: fontSizes.sm,
              }}
            >
              Atenção ao preenchimento
            </Text>
            <Text
              style={{
                color: theme.colors.text,
                fontFamily: fonts.regular,
                fontSize: fontSizes.sm,
                marginTop: spacing.xs,
              }}
            >
              {summary}
            </Text>
          </View>
        ) : null}
        <View
          style={
            error
              ? {
                  borderWidth: 1,
                  borderColor: theme.colors.alert,
                  borderRadius: radii.lg,
                  padding: 2,
                }
              : undefined
          }
        >
          {children}
        </View>
        {error ? (
          <Text
            nativeID={errorId}
            accessibilityLiveRegion="polite"
            style={{
              color: theme.colors.alert,
              fontFamily: fonts.regular,
              fontSize: fontSizes.sm,
              marginTop: spacing.xs,
            }}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </FieldInputContext.Provider>
  );
}
