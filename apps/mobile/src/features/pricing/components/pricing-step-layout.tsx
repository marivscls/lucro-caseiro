import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  Pressable,
  View,
  type ScrollView,
} from "react-native";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
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
        <Typography variant="caption">Etapa {step} de 3</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {STEPS.map((item, index) => (
            <Pressable
              key={item.short}
              accessibilityRole="button"
              accessibilityLabel={`Etapa ${index + 1}: ${item.title}`}
              accessibilityState={{
                selected: step === index + 1,
                disabled: saving || index + 1 >= step,
              }}
              disabled={saving || index + 1 >= step}
              onPress={() => onStepChange((index + 1) as PricingStep)}
              style={{
                flex: 1,
                minHeight: 44,
                justifyContent: "center",
                borderTopWidth: 3,
                borderTopColor: index + 1 <= step ? palette.wine : theme.colors.border,
              }}
            >
              <Typography
                variant={step === index + 1 ? "captionBold" : "caption"}
                color={step === index + 1 ? palette.wine : theme.colors.textSecondary}
              >
                {item.short}
              </Typography>
            </Pressable>
          ))}
        </View>
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
