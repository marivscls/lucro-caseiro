import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "./app-icon";
import type { AppIconName } from "./app-icon";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface FormSectionProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: AppIconName;
  readonly titleAccessory?: React.ReactNode;
  readonly collapsible?: boolean;
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
  titleAccessory,
  initiallyOpen = false,
  collapsible = true,
  children,
}: FormSectionProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const expanded = !collapsible || open;
  const toggleLabel = `${open ? "Recolher" : "Expandir"} seção ${title}`;

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
        disabled={!collapsible}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole={collapsible ? "button" : "header"}
        accessibilityLabel={collapsible ? toggleLabel : title}
        accessibilityState={collapsible ? { expanded } : undefined}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            minHeight: 52,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {icon && <AppIcon name={icon} size={22} color={theme.colors.primary} />}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Typography
              variant="bodyBold"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={{ flexShrink: 1 }}
            >
              {title}
            </Typography>
            {titleAccessory}
          </View>
          {subtitle ? <Typography variant="caption">{subtitle}</Typography> : null}
        </View>
        {collapsible ? (
          <AppIcon
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textSecondary}
          />
        ) : null}
      </Pressable>
      {expanded && (
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
