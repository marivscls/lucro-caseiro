import React from "react";
import { Pressable, View } from "react-native";

import { spacing } from "../theme";
import { useTheme } from "../theme-context";
import { Typography } from "./typography";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  closeLabel?: string;
}

/** Header padrao dos modais fullscreen/pageSheet: titulo a esquerda, fechar a direita. */
export function ModalHeader({ title, onClose, closeLabel = "Fechar" }: ModalHeaderProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <Typography variant="h3" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Typography>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        hitSlop={12}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Typography variant="bodyBold" color={theme.colors.primary}>
          {closeLabel}
        </Typography>
      </Pressable>
    </View>
  );
}
