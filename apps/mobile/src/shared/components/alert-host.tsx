import {
  Button,
  Typography,
  useReducedMotion,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  View,
  type ImageSourcePropType,
  type ViewStyle,
} from "react-native";

import { useAppAlert, type AppAlertButton } from "./alert-store";
import successBrigadeiro from "../../assets/success-brigadeiro.png";
import successChecklist from "../../assets/success-checklist.png";
import successGrowth from "../../assets/success-growth.png";
import successModalFrame from "../../assets/success-modal-frame.png";

export { showAlert } from "./alert-store";

const OK_BUTTON: AppAlertButton[] = [{ text: "OK" }];

const SUCCESS_FEATURES: Array<{
  label: string;
  image: ImageSourcePropType;
}> = [
  { label: "Organize suas\nvendas", image: successChecklist },
  { label: "Acompanhe seus\npedidos", image: successBrigadeiro },
  { label: "Veja seu\nlucro crescer", image: successGrowth },
];

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

  if (options.variant === "account-created") {
    const continueButton = options.buttons?.[0] ?? { text: "Continuar" };

    return (
      <Modal
        transparent
        visible
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <Pressable
          onPress={() => {}}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.66)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl,
          }}
        >
          <Animated.View
            style={{
              width: "120%",
              maxWidth: 396,
              alignItems: "center",
              transform: [{ scale }],
            }}
          >
            <Pressable
              onPress={() => {}}
              style={{
                width: "100%",
              }}
            >
              <ImageBackground
                source={successModalFrame}
                resizeMode="contain"
                style={{ width: "100%", aspectRatio: 1122 / 1402 }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 42,
                    right: 42,
                    top: "34%",
                    alignItems: "center",
                    transform: [{ translateY: 8 }],
                  }}
                >
                  <Typography
                    variant="h1"
                    style={{
                      color: "#FFF2EB",
                      textAlign: "center",
                      fontSize: 20,
                      lineHeight: 24,
                    }}
                  >
                    Conta criada com{"\n"}sucesso! 🎉
                  </Typography>
                  <Typography
                    variant="body"
                    style={{
                      color: "#E8CABB",
                      textAlign: "center",
                      fontSize: 12,
                      lineHeight: 16,
                      marginTop: 3,
                      maxWidth: 246,
                    }}
                  >
                    Tudo pronto para você organizar, vender e lucrar mais com o que faz de
                    melhor.
                  </Typography>
                </View>

                <View
                  style={{
                    position: "absolute",
                    left: 64,
                    right: 64,
                    top: "57%",
                    minHeight: 70,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255, 226, 213, 0.12)",
                    backgroundColor: "rgba(64, 47, 39, 0.88)",
                    flexDirection: "row",
                    overflow: "hidden",
                  }}
                >
                  {SUCCESS_FEATURES.map((feature, index) => (
                    <View
                      key={feature.label}
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 2,
                        borderLeftWidth: index === 0 ? 0 : 1,
                        borderLeftColor: "rgba(255, 226, 213, 0.12)",
                      }}
                    >
                      <Image
                        source={feature.image}
                        resizeMode="contain"
                        style={{ width: 30, height: 30, marginBottom: 1 }}
                      />
                      <Typography
                        variant="caption"
                        style={{
                          color: "#FFF2EB",
                          textAlign: "center",
                          fontSize: 8,
                          lineHeight: 10,
                        }}
                      >
                        {feature.label}
                      </Typography>
                    </View>
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => press(continueButton)}
                  style={{
                    position: "absolute",
                    left: 64,
                    right: 64,
                    bottom: "8%",
                    minHeight: 44,
                    borderRadius: 16,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: spacing.sm,
                  }}
                >
                  <Typography
                    variant="h2"
                    style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      lineHeight: 22,
                    }}
                  >
                    Continuar
                  </Typography>
                  <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
                </Pressable>
              </ImageBackground>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  }

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
