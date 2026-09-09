import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { StandardModal } from "../../../shared/components/standard-modal";

interface SupplierOption {
  key: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  destructive?: boolean;
}

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
  const palette = useBrandScreenPalette();
  const { theme } = useTheme();
  return (
    <StandardModal visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => {
          let color = option.selected ? palette.wine : palette.muted;
          if (option.destructive) color = theme.colors.alert;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: option.selected }}
              onPress={() => {
                onClose();
                option.onPress();
              }}
              style={({ pressed }) => ({
                minHeight: 52,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radii.xl,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: option.selected ? palette.softRose : palette.white,
                borderWidth: 1,
                borderColor: option.selected ? palette.rose : palette.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Typography variant="bodyBold" style={{ flex: 1 }} color={color}>
                {option.label}
              </Typography>
              {option.selected ? (
                <AppIcon name="checkmark" size={20} color={palette.rose} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </StandardModal>
  );
}
