import { Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable } from "react-native";

// Dica de "Você quis dizer ...?" para erros de digitação em domínios de e-mail
// (ver suggestEmailFix). Tocar aplica a correção. Não bloqueia o envio: quem tem
// domínio próprio simplesmente ignora e segue.
export function EmailTypoHint({
  suggestion,
  onAccept,
}: Readonly<{ suggestion?: string; onAccept: () => void }>) {
  const { theme } = useTheme();
  if (!suggestion) return null;

  return (
    <Pressable
      onPress={onAccept}
      accessibilityRole="button"
      accessibilityLabel={`Corrigir e-mail para ${suggestion}`}
      hitSlop={6}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.xs,
      }}
    >
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ fontSize: 14 }}
      >
        Você quis dizer
      </Typography>
      <Typography
        variant="bodyBold"
        color={theme.colors.primary}
        style={{ fontSize: 14 }}
      >
        {suggestion}?
      </Typography>
    </Pressable>
  );
}
