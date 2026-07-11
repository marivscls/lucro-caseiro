import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";

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
  icon: keyof typeof Ionicons.glyphMap;
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
  const isDark = theme.mode === "dark";
  const border = isDark ? "rgba(245, 225, 219, 0.12)" : "rgba(74, 50, 40, 0.12)";
  const fieldBg = isDark ? "rgba(58, 50, 45, 0.5)" : theme.colors.surface;

  return (
    <View style={{ gap: spacing.sm }}>
      <Typography variant="bodyBold" color={theme.colors.text} style={{ fontSize: 15 }}>
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
                minHeight: 72,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: selected ? theme.colors.primary : border,
                backgroundColor: selected ? theme.colors.primary : fieldBg,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={selected ? theme.colors.textOnPrimary : theme.colors.primary}
                />
                {isLockedOption && (
                  <Ionicons
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
