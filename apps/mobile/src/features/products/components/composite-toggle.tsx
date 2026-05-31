import { Typography, useTheme, radii, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

interface CompositeToggleProps {
  /** true = produto composto (kit); false = produto simples. */
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}

const OPTIONS: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: false, label: "Produto simples" },
  { value: true, label: "Produto composto (kit)" },
];

/**
 * Alternador entre produto simples e produto composto (kit/caixinha).
 * Um kit e montado a partir de outros produtos; o custo total e a soma dos
 * componentes.
 */
export function CompositeToggle({ value, onChange }: CompositeToggleProps) {
  const { theme } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Typography variant="caption">Que tipo de produto é?</Typography>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.colors.surface,
          borderRadius: radii.lg,
          padding: spacing.xs,
          gap: spacing.xs,
        }}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: selected ? theme.colors.primary : "transparent",
              }}
            >
              <Typography
                variant="bodyBold"
                color={selected ? theme.colors.textOnPrimary : theme.colors.text}
                style={{ textAlign: "center" }}
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
