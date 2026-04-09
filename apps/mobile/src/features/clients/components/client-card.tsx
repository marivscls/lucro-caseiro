import type { Client } from "@lucro-caseiro/contracts";
import { Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React from "react";
import { View } from "react-native";

interface ClientCardProps {
  client: Client;
  onPress?: () => void;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function ClientCard({ client, onPress }: Readonly<ClientCardProps>) {
  const { theme } = useTheme();
  const initial = client.name.charAt(0).toUpperCase();

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        {/* Avatar circle */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.full,
            backgroundColor: theme.colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" color={theme.colors.textOnPrimary}>
            {initial}
          </Typography>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="bodyBold">{client.name}</Typography>
          {client.phone ? (
            <Typography variant="caption" numberOfLines={1}>
              {client.phone}
            </Typography>
          ) : (
            <Typography variant="caption">Sem telefone</Typography>
          )}
        </View>

        {client.totalSpent > 0 && (
          <View style={{ alignItems: "flex-end" }}>
            <Typography variant="bodyBold" color={theme.colors.success}>
              R${"\u00A0"}
              {formatCurrency(client.totalSpent).replace("R$ ", "")}
            </Typography>
          </View>
        )}
      </View>
    </Card>
  );
}
