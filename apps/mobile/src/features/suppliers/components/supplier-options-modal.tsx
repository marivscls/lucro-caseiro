import { Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";
import { AppIcon } from "../../../shared/components/app-icon";
import { fieldMetrics, useFieldPalette } from "../../../shared/components/form-field";
import { StandardModal } from "../../../shared/components/standard-modal";

interface SupplierOption {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/** Menu de ações de um fornecedor: uma linha por ação, no visual dos campos. */
export function SupplierOptionsModal({
  visible,
  title,
  options,
  onClose,
}: Readonly<{
  visible: boolean;
  title: string;
  options: readonly SupplierOption[];
  onClose: () => void;
}>) {
  const pal = useFieldPalette();
  const { theme } = useTheme();
  return (
    <StandardModal visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => {
          const color = option.destructive ? theme.colors.alert : theme.colors.text;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                option.onPress();
              }}
              style={({ pressed }) => ({
                minHeight: fieldMetrics.height,
                paddingHorizontal: fieldMetrics.paddingX,
                borderRadius: fieldMetrics.radius,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: pal.fieldBgFocus,
                borderWidth: 1,
                borderColor: option.destructive ? theme.colors.alert : pal.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Typography variant="bodyBold" style={{ flex: 1 }} color={color}>
                {option.label}
              </Typography>
              <AppIcon
                name="chevron-forward"
                size={fieldMetrics.iconSize}
                color={option.destructive ? theme.colors.alert : pal.icon}
              />
            </Pressable>
          );
        })}
      </View>
    </StandardModal>
  );
}
