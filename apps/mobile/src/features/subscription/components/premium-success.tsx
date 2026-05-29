import { Button, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

interface PremiumSuccessProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function PremiumSuccess({ visible, onClose }: PremiumSuccessProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get("window");

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [visible, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            backgroundColor: theme.colors.surface,
            borderRadius: radii.xl,
            padding: spacing["2xl"],
            alignItems: "center",
            gap: spacing.lg,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: theme.colors.successBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>

          <Typography variant="h1" style={{ textAlign: "center" }}>
            Parabéns! 🎉
          </Typography>
          <Typography
            variant="body"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Você agora é Premium. Aproveite vendas e clientes ilimitados, relatórios
            completos e muito mais.
          </Typography>

          <Button
            title="Aproveitar agora"
            size="lg"
            onPress={onClose}
            style={{ alignSelf: "stretch" }}
          />
        </Animated.View>
      </View>

      {visible && (
        <ConfettiCannon
          count={160}
          origin={{ x: width / 2, y: -20 }}
          fadeOut
          autoStart
          fallSpeed={2800}
        />
      )}
    </Modal>
  );
}
