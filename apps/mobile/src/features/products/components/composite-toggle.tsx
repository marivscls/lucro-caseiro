import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React from "react";
import { Pressable, View } from "react-native";

import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

interface CompositeToggleProps {
  /** true = produto composto (kit); false = produto simples. */
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  /**
   * Quando true, a opção "Produto composto (kit)" é exibida com um cadeado
   * (recurso Profissional). O toque ainda dispara `onChange(true)` — quem
   * chama decide se abre o paywall em vez de marcar a opção.
   */
  readonly locked?: boolean;
}

const OPTIONS: ReadonlyArray<{
  value: boolean;
  label: string;
  icon: AppIconName;
}> = [
  { value: false, label: "Produto simples", icon: "cube-outline" },
  { value: true, label: "Produto composto (kit)", icon: "gift-outline" },
];

/**
 * Alternador entre produto simples e produto composto (kit/caixinha).
 * Um kit e montado a partir de outros produtos; o custo total e a soma dos
 * componentes.
 */
export function CompositeToggle({
  value,
  onChange,
  locked = false,
}: CompositeToggleProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const border = theme.colors.border;
  const fieldBg = theme.colors.surface;

  return (
    <View
      style={{
        gap: spacing.sm,
        width: "100%",
        maxWidth: isDesktop ? 720 : undefined,
      }}
    >
      <Typography variant="bodyBold" color={theme.colors.text}>
        Que tipo de produto é?
      </Typography>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          const isLockedOption = locked && option.value === true;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={
                isLockedOption ? `${option.label} — recurso Profissional` : option.label
              }
              style={({ pressed }) => ({
                flex: 1,
                minHeight: isDesktop ? 48 : 72,
                flexDirection: isDesktop ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: isDesktop ? spacing.xs : spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : border,
                backgroundColor: selected ? theme.colors.primary : fieldBg,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AppIcon
                  name={option.icon}
                  size={22}
                  color={selected ? theme.colors.textOnPrimary : theme.colors.primary}
                />
                {isLockedOption && (
                  <AppIcon
                    name="lock-closed"
                    size={14}
                    color={selected ? theme.colors.textOnPrimary : theme.colors.premium}
                  />
                )}
              </View>
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.textOnPrimary : theme.colors.text}
                numberOfLines={2}
                style={{
                  fontSize: 14,
                  lineHeight: 18,
                  flexShrink: 1,
                  textAlign: "center",
                }}
              >
                {option.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
