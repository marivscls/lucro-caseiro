import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { hasPixKey } from "../domain";
import { usePixSettings } from "../hooks";

/**
 * Convite para cadastrar a chave Pix, mostrado onde a pessoa cobra. Some
 * sozinho quando a chave já existe (ou enquanto carrega).
 */
export function PixNudge({ text }: Readonly<{ text: string }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const { data, isLoading } = usePixSettings();
  if (isLoading || !data || hasPixKey(data)) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: palette.softRose,
      }}
    >
      <AppIcon name="qr-code-outline" size={24} color={palette.wine} />
      <Typography variant="body" color={palette.wine} style={{ flex: 1, minWidth: 180 }}>
        {text}
      </Typography>
      <Button title="Cadastrar chave Pix" size="md" onPress={() => router.push("/pix")} />
    </View>
  );
}
