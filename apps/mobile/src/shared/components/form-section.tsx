import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface FormSectionProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: AppIconName;
  readonly initiallyOpen?: boolean;
  readonly children: React.ReactNode;
}

/**
 * Secao colapsavel para formularios longos: cabecalho tocavel (48dp) com
 * chevron, conteudo escondido ate o usuario abrir. Reduz a sobrecarga visual
 * de telas como o rotulo (40+ campos).
 */
export function FormSection({
  title,
  subtitle,
  icon,
  initiallyOpen = false,
  children,
}: FormSectionProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View
      style={{
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${open ? "Recolher" : "Expandir"} seção ${title}`}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            minHeight: 56,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {icon && <AppIcon name={icon} size={22} color={theme.colors.primary} />}
        <View style={{ flex: 1 }}>
          <Typography variant="bodyBold">{title}</Typography>
          {subtitle ? <Typography variant="caption">{subtitle}</Typography> : null}
        </View>
        <AppIcon
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {open && (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
            gap: spacing.md,
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
}
