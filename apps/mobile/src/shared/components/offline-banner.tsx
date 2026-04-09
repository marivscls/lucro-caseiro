import { Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

import { useNetwork } from "../hooks/use-network";

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const { theme } = useTheme();

  if (isOnline) return null;

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
        style={{ color: theme.colors.alert, fontSize: 14, textAlign: "center" }}
      >
        Voce esta offline. Dados podem estar desatualizados.
      </Typography>
    </View>
  );
}
