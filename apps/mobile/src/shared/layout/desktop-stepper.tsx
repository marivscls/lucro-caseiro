import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

import { AppIcon } from "../components/app-icon";
import type { FormStep } from "../components/form-step-progress";

/**
 * Etapas de um fluxo no desktop: círculos numerados ligados por uma linha,
 * rótulos de 16px. Etapas já feitas voltam ao toque (mesma regra do
 * `FormStepProgress`). Use no lugar do `FormStepProgress` quando
 * `useDesktopLayout()` for verdadeiro; o título da etapa fica na tela.
 */
export function DesktopStepper({
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
  const [width, setWidth] = useState(0);
  // Coluna estreita (1024px): só a etapa atual mostra o rótulo.
  const compact = width > 0 && width < 150 * steps.length;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Etapa ${safeCurrent} de ${steps.length}: ${activeStep?.title ?? ""}`}
      accessibilityValue={{ min: 1, max: steps.length, now: safeCurrent }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
    >
      {steps.map((step, index) => {
        const number = index + 1;
        const completed = number < safeCurrent;
        const selected = number === safeCurrent;
        const enabled = completed && onStepPress !== undefined;
        let circleColor = "transparent";
        if (selected) circleColor = theme.colors.primaryInteractive;
        else if (completed) circleColor = theme.colors.primaryBg;
        let labelColor = theme.colors.textSecondary;
        if (selected) labelColor = theme.colors.text;
        else if (completed) labelColor = theme.colors.primaryStrong;

        return (
          <React.Fragment key={step.title}>
            {index > 0 ? (
              <View
                style={{
                  flex: 1,
                  minWidth: spacing.lg,
                  height: 2,
                  borderRadius: radii.full,
                  backgroundColor:
                    completed || selected
                      ? theme.colors.primaryStrong
                      : theme.colors.border,
                }}
              />
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                completed
                  ? `Voltar para etapa ${number}: ${step.title}`
                  : `Etapa ${number}: ${step.title}`
              }
              accessibilityState={{ selected, disabled: !enabled }}
              disabled={!enabled}
              onPress={() => onStepPress?.(number)}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingHorizontal: spacing.xs,
                borderRadius: radii.md,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: circleColor,
                  borderWidth: selected || completed ? 0 : 1.5,
                  borderColor: theme.colors.border,
                }}
              >
                {completed ? (
                  <AppIcon
                    name="checkmark"
                    size={18}
                    color={theme.colors.primaryStrong}
                  />
                ) : (
                  <Typography
                    variant="desktopBodyStrong"
                    color={
                      selected ? theme.colors.textOnPrimary : theme.colors.textSecondary
                    }
                  >
                    {number}
                  </Typography>
                )}
              </View>
              {compact && !selected ? null : (
                <Typography
                  variant={selected ? "desktopBodyStrong" : "desktopBody"}
                  color={labelColor}
                  numberOfLines={1}
                >
                  {step.label}
                </Typography>
              )}
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}
