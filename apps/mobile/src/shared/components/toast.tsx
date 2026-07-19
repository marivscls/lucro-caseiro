import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

/** Atalho para feedback de sucesso fora de componentes React. */
export function showToast(message: string) {
  useToast.getState().show(message);
}

const VISIBLE_MS = 2200;

/** Toast global de confirmação ("Salvo ✓"). Montado uma vez no _layout. */
export function ToastHost() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToast((s) => s.message);
  const hide = useToast((s) => s.hide);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => hide());
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, opacity, hide]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: spacing.xl,
        right: spacing.xl,
        bottom: insets.bottom + 90,
        opacity,
        alignItems: "center",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: theme.colors.surfaceElevated,
          borderRadius: radii.full,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          ...theme.shadows.md,
        }}
      >
        <AppIcon name="checkmark-circle" size={20} color={theme.colors.success} />
        <Typography variant="bodyBold" color={theme.colors.text}>
          {message}
        </Typography>
      </View>
    </Animated.View>
  );
}
