import { fonts, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

type DesktopPaginationProps = Readonly<{
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}>;

function PageButton({
  label,
  icon,
  disabled,
  onPress,
}: Readonly<{
  label: string;
  icon: "chevron-back" | "chevron-forward";
  disabled: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled) opacity = 0.35;
        else if (pressed) opacity = 0.72;

        return {
          width: 38,
          height: 38,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceElevated,
          alignItems: "center",
          justifyContent: "center",
          opacity,
        };
      }}
    >
      <Ionicons name={icon} size={18} color={theme.colors.text} />
    </Pressable>
  );
}

export function DesktopPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: DesktopPaginationProps) {
  const { theme } = useTheme();

  if (totalPages <= 1) return null;

  return (
    <View
      style={{
        minHeight: 62,
        paddingHorizontal: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.lg,
      }}
    >
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {total} registro{total === 1 ? "" : "s"}
      </Typography>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <PageButton
          label="Página anterior"
          icon="chevron-back"
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
        />
        <Typography
          variant="caption"
          color={theme.colors.text}
          style={{ minWidth: 92, textAlign: "center", fontFamily: fonts.semiBold }}
        >
          Página {page} de {totalPages}
        </Typography>
        <PageButton
          label="Próxima página"
          icon="chevron-forward"
          disabled={page >= totalPages}
          onPress={() => onPageChange(page + 1)}
        />
      </View>
    </View>
  );
}
