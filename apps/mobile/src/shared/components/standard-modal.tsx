import { Typography, useReducedMotion, useTheme, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import React from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";

import { useScrollFocusedInputIntoView } from "./keyboard-aware-scroll-view";
import { ResponsiveModal } from "./responsive-modal-surface";
import { ValidationScrollContext } from "@lucro-caseiro/ui";
import { useDesktopLayout } from "../layout/use-desktop-layout";

interface StandardModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
  readonly closeAccessibilityLabel?: string;
  readonly dismissDisabled?: boolean;
  readonly right?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly wide?: boolean;
  readonly scrollRef?: React.RefObject<ScrollView | null>;
  readonly children: React.ReactNode;
}

/**
 * Modal padrão de detalhe: bottom sheet que abraça o conteúdo no mobile e
 * dialog centralizado no desktop (size="hug"). Header com título + ações + X,
 * conteúdo rolável que encolhe quando curto e footer opcional de ações.
 */
export function StandardModal({
  visible,
  onClose,
  title,
  subtitle,
  closeAccessibilityLabel = "Fechar",
  dismissDisabled = false,
  right,
  footer,
  wide = false,
  scrollRef,
  children,
}: Readonly<StandardModalProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const reducedMotion = useReducedMotion();
  const modalContentRef = React.useRef<View>(null);
  const internalScrollRef = React.useRef<ScrollView>(null);
  const { scrollFocusedInput, trackScroll, scrollValidationField } =
    useScrollFocusedInputIntoView(internalScrollRef, spacing.xl, visible);

  const requestClose = React.useCallback(() => {
    if (!dismissDisabled) onClose();
  }, [dismissDisabled, onClose]);

  React.useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    const root = modalContentRef.current as unknown as HTMLElement | null;
    if (!root) return;

    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        root!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keepFocusInside);
    return () => document.removeEventListener("keydown", keepFocusInside);
  }, [requestClose, visible]);

  if (!visible) return null;

  return (
    <ResponsiveModal
      size="hug"
      desktopMaxWidth={wide ? 1040 : 560}
      visible={visible}
      animationType={reducedMotion ? "none" : "slide"}
      presentationStyle="pageSheet"
      onRequestClose={requestClose}
    >
      <View
        ref={modalContentRef}
        role={Platform.OS === "web" ? "dialog" : undefined}
        accessibilityLabel={title}
        accessibilityViewIsModal
        style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: isDesktop ? spacing.xl : spacing.lg,
            paddingVertical: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
            <Typography variant="h3" color={theme.colors.text} numberOfLines={2}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
          {right}
          <Pressable
            onPress={requestClose}
            disabled={dismissDisabled}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}
            accessibilityState={{ disabled: dismissDisabled }}
            hitSlop={8}
            style={({ pressed }) => {
              let opacity = 1;
              if (dismissDisabled) opacity = 0.45;
              else if (pressed) opacity = 0.6;
              return {
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                backgroundColor: theme.colors.surface,
                opacity,
              };
            }}
          >
            <AppIcon name="close" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Conteúdo */}
        <ScrollView
          ref={(node) => {
            internalScrollRef.current = node;
            if (scrollRef) scrollRef.current = node;
          }}
          style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
          contentContainerStyle={{
            padding: isDesktop ? spacing.xl : spacing.lg,
            paddingBottom: spacing.xl,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.select({
            ios: "interactive",
            android: "on-drag",
            default: "none",
          } as const)}
          scrollEventThrottle={16}
          onFocus={() => scrollFocusedInput()}
          onScroll={trackScroll}
        >
          <ValidationScrollContext.Provider value={scrollValidationField}>
            {children}
          </ValidationScrollContext.Provider>
        </ScrollView>

        {/* Footer */}
        {footer ? (
          <View
            style={{
              flexDirection: "row",
              flexShrink: 0,
              gap: spacing.md,
              justifyContent: isDesktop ? "flex-end" : undefined,
              paddingHorizontal: isDesktop ? spacing.xl : spacing.lg,
              paddingVertical: spacing.md,
              backgroundColor: theme.colors.surfaceElevated,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </ResponsiveModal>
  );
}
