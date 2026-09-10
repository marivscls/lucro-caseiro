import React, { useEffect, useRef } from "react";
import { AccessibilityInfo, Keyboard, View, type ScrollView } from "react-native";
import { Button, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { FormStepProgress } from "../../../shared/components/form-step-progress";
import { pageGutter } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import type { PricingStep } from "../use-pricing-draft";

const STEPS = [
  { short: "Custos", title: "Produto e custos" },
  { short: "Despesas", title: "Trabalho e despesas" },
  { short: "Resultado", title: "Preço e resultado" },
] as const;

export function PricingStepLayout({
  step,
  onStepChange,
  onNext,
  saving,
  children,
}: Readonly<{
  step: PricingStep;
  onStepChange: (step: PricingStep) => void;
  onNext: () => void;
  saving: boolean;
  children: readonly React.ReactNode[];
}>) {
  const { theme } = useTheme();
  const palette = useBrandScreenPalette();
  const desktop = useDesktopLayout();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    Keyboard.dismiss();
    scroll.current?.scrollTo({ y: 0, animated: false });
    AccessibilityInfo.announceForAccessibility(
      `Etapa ${step} de 3: ${STEPS[step - 1].title}`,
    );
  }, [step]);
  return (
    <View
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        maxWidth: 1040,
        alignSelf: "center",
      }}
    >
      <View
        style={{
          ...pageGutter(desktop),
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
          gap: spacing.sm,
        }}
      >
        <FormStepProgress
          current={step}
          steps={STEPS.map((item) => ({ label: item.short, title: item.title }))}
          onStepPress={
            saving ? undefined : (target) => onStepChange(target as PricingStep)
          }
        />
      </View>
      <KeyboardAwareScrollView
        scrollRef={scroll}
        contentContainerStyle={{ ...pageGutter(desktop), paddingBottom: spacing.xl }}
      >
        {children.map((panel, index) => (
          <View
            key={STEPS[index].short}
            style={{ display: step === index + 1 ? "flex" : "none", gap: spacing.lg }}
            accessibilityElementsHidden={step !== index + 1}
            importantForAccessibility={
              step === index + 1 ? "auto" : "no-hide-descendants"
            }
          >
            {panel}
          </View>
        ))}
      </KeyboardAwareScrollView>
      <View
        style={{
          ...pageGutter(desktop),
          paddingVertical: spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          flexDirection: "row",
          gap: spacing.md,
        }}
      >
        {step > 1 ? (
          <Button
            title="Voltar"
            variant="ghost"
            disabled={saving}
            onPress={() => onStepChange((step - 1) as PricingStep)}
          />
        ) : null}
        <Button
          title={step === 3 ? "Salvar cálculo" : "Continuar"}
          onPress={onNext}
          loading={saving}
          size="lg"
          style={{
            flex: 1,
            borderRadius: radii.md,
            backgroundColor:
              theme.mode === "light" ? palette.wineFill : theme.colors.primaryInteractive,
          }}
        />
      </View>
    </View>
  );
}
