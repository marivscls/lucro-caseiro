import { Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { useNetwork } from "../hooks/use-network";
import { useOfflineQueue } from "../hooks/use-offline-queue";

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const pendingCount = useOfflineQueue((s) => s.operations.length);
  const { theme } = useTheme();

  if (isOnline) return null;

  const pendingMessage =
    pendingCount > 0
      ? ` ${pendingCount} venda(s) aguardando para enviar.`
      : " Dados podem estar desatualizados.";

  return (
    <View
      style={{
        backgroundColor: theme.colors.alertBg,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      <Typography
        variant="caption"
        style={{ color: theme.colors.alert, textAlign: "center" }}
      >
        Você esta offline.{pendingMessage}
      </Typography>
    </View>
  );
}
