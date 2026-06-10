import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
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
          backgroundColor: theme.mode === "dark" ? "#3a302b" : "#3d2b22",
          borderRadius: radii.full,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="checkmark-circle" size={20} color="#6BBF96" />
        <Typography variant="bodyBold" color="#ffffff">
          {message}
        </Typography>
      </View>
    </Animated.View>
  );
}
