import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";

export type FormStep = Readonly<{
  label: string;
  title: string;
}>;

export function FormStepProgress({
  current,
  steps,
  onStepPress,
}: Readonly<{
  current: number;
  steps: readonly FormStep[];
  onStepPress?: (step: number) => void;
}>) {
  const { theme } = useTheme();
  const safeCurrent = Math.min(Math.max(current, 1), steps.length);
  const activeStep = steps[safeCurrent - 1];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Etapa {safeCurrent} de {steps.length}
        </Typography>
        <Typography variant="bodyBold" color={theme.colors.text}>
          {activeStep?.title}
        </Typography>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Etapa ${safeCurrent} de ${steps.length}: ${activeStep?.title ?? ""}`}
        accessibilityValue={{ min: 1, max: steps.length, now: safeCurrent }}
        style={{ flexDirection: "row", gap: spacing.sm }}
      >
        {steps.map((step, index) => {
          const number = index + 1;
          const completed = number < safeCurrent;
          const selected = number === safeCurrent;
          const enabled = completed && onStepPress !== undefined;
          const accessibilityLabel = completed
            ? `Voltar para etapa ${number}: ${step.title}`
            : `Etapa ${number}: ${step.title}`;

          return (
            <Pressable
              key={step.title}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              accessibilityState={{ selected, disabled: !enabled }}
              disabled={!enabled}
              onPress={() => onStepPress?.(number)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                minHeight: 48,
                gap: spacing.xs,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View
                style={{
                  height: 4,
                  borderRadius: radii.full,
                  backgroundColor:
                    completed || selected ? theme.colors.primary : theme.colors.border,
                }}
              />
              <Typography
                variant={selected ? "captionBold" : "caption"}
                color={
                  selected || completed
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.78}
              >
                {step.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
