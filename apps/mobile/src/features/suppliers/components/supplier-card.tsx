import type { Supplier } from "@lucro-caseiro/contracts";
import { Card, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React from "react";
import { View } from "react-native";

interface SupplierCardProps {
  supplier: Supplier;
  onPress?: () => void;
}

export function SupplierCard({ supplier, onPress }: Readonly<SupplierCardProps>) {
  const { theme } = useTheme();
  const subtitle = supplier.phone ?? supplier.email ?? "Sem contato";

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
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
          <AppIcon name="business" size={22} color={theme.colors.textOnPrimary} />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="bodyBold" numberOfLines={1}>
            {supplier.name}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {subtitle}
          </Typography>
        </View>

        <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </Card>
  );
}
