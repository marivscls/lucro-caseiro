import {
  Button,
  Typography,
  useReducedMotion,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import React, { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, View, type ViewStyle } from "react-native";

import { useAppAlert, type AppAlertButton } from "./alert-store";

export { showAlert } from "./alert-store";

const OK_BUTTON: AppAlertButton[] = [{ text: "OK" }];

/**
 * Diálogo global na identidade do app — substitui o `Alert` nativo do sistema.
 * Montado uma vez no `_layout`, segue o tema (claro/escuro) automaticamente e
 * faz um "pop" sutil (spring) ao abrir. Respeita reduce-motion.
 */
export function AlertHost() {
  const { theme } = useTheme();
  const options = useAppAlert((s) => s.options);
  const hide = useAppAlert((s) => s.hide);
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!options || reduced) return;
    scale.setValue(0.92);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [options, reduced, scale]);

  if (!options) return null;

  const buttons =
    options.buttons && options.buttons.length > 0 ? options.buttons : OK_BUTTON;
  const stacked = buttons.length > 2;
  const cancelButton = buttons.find((b) => b.style === "cancel");

  const press = (button: AppAlertButton) => {
    hide();
    button.onPress?.();
  };

  // Toque fora do card e botão "voltar" do Android equivalem a cancelar.
  const dismiss = () => {
    hide();
    cancelButton?.onPress?.();
  };

  const buttonStyle = (button: AppAlertButton): ViewStyle => {
    const width: ViewStyle =
      buttons.length === 1 || stacked ? { width: "100%" } : { flex: 1 };
    return button.style === "destructive"
      ? { ...width, backgroundColor: theme.colors.alert }
      : width;
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable
        onPress={dismiss}
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Animated.View style={{ width: "100%", maxWidth: 360, transform: [{ scale }] }}>
          {/* Card: o onPress vazio impede que o toque "vaze" e feche o diálogo. */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.colors.surfaceElevated,
              borderRadius: radii.xl,
              padding: spacing["2xl"],
              gap: spacing.md,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <Typography variant="h3">{options.title}</Typography>
            {options.message ? (
              <Typography variant="body">{options.message}</Typography>
            ) : null}

            <View
              style={{
                flexDirection: stacked ? "column" : "row",
                justifyContent: "flex-end",
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              {buttons.map((button, i) => (
                <Button
                  key={`${button.text}-${i}`}
                  title={button.text}
                  variant={button.style === "cancel" ? "secondary" : "primary"}
                  onPress={() => press(button)}
                  style={buttonStyle(button)}
                />
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
