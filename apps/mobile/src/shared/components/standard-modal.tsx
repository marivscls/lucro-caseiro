import { Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import React from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";

import { useScrollFocusedInputIntoView } from "./keyboard-aware-scroll-view";
import { ResponsiveModal } from "./responsive-modal-surface";

interface StandardModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
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
  right,
  footer,
  wide = false,
  scrollRef,
  children,
}: Readonly<StandardModalProps>) {
  const { theme } = useTheme();
  const internalScrollRef = React.useRef<ScrollView>(null);
  const { scrollFocusedInput, trackScroll } =
    useScrollFocusedInputIntoView(internalScrollRef, spacing.xl, visible);

  if (!visible) return null;

  return (
    <ResponsiveModal
      size="hug"
      desktopMaxWidth={wide ? 1040 : 560}
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Typography variant="h3" color={theme.colors.text} numberOfLines={1}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" numberOfLines={1}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
          {right}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <AppIcon name="close" size={24} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        {/* Conteúdo */}
        <ScrollView
          ref={(node) => {
            internalScrollRef.current = node;
            if (scrollRef) scrollRef.current = node;
          }}
          style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          scrollEventThrottle={16}
          onFocus={() => scrollFocusedInput()}
          onScroll={trackScroll}
        >
          {children}
        </ScrollView>

        {/* Footer */}
        {footer ? (
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              padding: spacing.xl,
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
