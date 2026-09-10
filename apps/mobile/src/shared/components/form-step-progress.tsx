import { Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Pressable, View } from "react-native";
import { AppIcon } from "./app-icon";

export type FormStep = Readonly<{
  label: string;
  title: string;
}>;

export function FormStepProgress({
  current,
  steps,
  onStepPress,
  compact = false,
}: Readonly<{
  current: number;
  steps: readonly FormStep[];
  onStepPress?: (step: number) => void;
  compact?: boolean;
}>) {
  const { theme } = useTheme();
  const safeCurrent = Math.min(Math.max(current, 1), steps.length);
  const activeStep = steps[safeCurrent - 1];
  const activeColor = theme.colors.primaryStrong;

  return (
    <View style={{ gap: spacing.md }}>
      {!compact ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Typography variant="bodyBold" color={theme.colors.text} style={{ flex: 1 }}>
            {activeStep?.title}
          </Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {safeCurrent} de {steps.length}
          </Typography>
        </View>
      ) : null}

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Etapa ${safeCurrent} de ${steps.length}: ${activeStep?.title ?? ""}`}
        accessibilityValue={{ min: 1, max: steps.length, now: safeCurrent }}
        style={{
          flexDirection: "row",
          flexWrap: compact ? "nowrap" : "wrap",
          gap: compact ? spacing.sm : spacing.xs,
          padding: compact ? 0 : spacing.xs,
          borderRadius: radii.md + spacing.xs,
          backgroundColor: compact ? undefined : theme.colors.surface,
        }}
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
                flexGrow: 1,
                flexBasis: compact ? 0 : "auto",
                flexShrink: compact ? 1 : 0,
                maxWidth: "100%",
                minWidth: 0,
                minHeight: compact ? 44 : 56,
                flexDirection: "column",
                alignItems: compact ? undefined : "center",
                justifyContent: compact ? undefined : "center",
                paddingHorizontal: compact ? 0 : spacing.xs,
                borderRadius: radii.md,
                backgroundColor:
                  !compact && selected ? theme.colors.surfaceElevated : undefined,
                gap: spacing.xs,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              {compact ? (
                <View
                  style={{
                    height: 4,
                    borderRadius: radii.full,
                    backgroundColor:
                      completed || selected ? theme.colors.primary : theme.colors.border,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      selected || completed
                        ? theme.colors.primaryInteractive
                        : theme.colors.border,
                  }}
                >
                  {completed ? (
                    <AppIcon
                      name="checkmark"
                      size={14}
                      color={theme.colors.textOnPrimary}
                    />
                  ) : (
                    <Typography
                      variant="captionBold"
                      color={
                        selected ? theme.colors.textOnPrimary : theme.colors.textSecondary
                      }
                      style={{ fontSize: 12 }}
                    >
                      {number}
                    </Typography>
                  )}
                </View>
              )}
              <Typography
                variant={selected ? "captionBold" : "caption"}
                color={selected || completed ? activeColor : theme.colors.textSecondary}
                style={compact ? undefined : { flexShrink: 1 }}
              >
                {compact ? `${number}. ${step.label}` : step.label}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
