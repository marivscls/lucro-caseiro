import {
  Button,
  Card,
  Input,
  Typography,
  spacing,
  radii,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";

import { useCalculatePricing } from "../hooks";
import { PricingResult } from "./pricing-result";

type Step = 1 | 2 | 3 | 4 | 5 | "result";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

interface PricingCalculatorProps {
  readonly onSave?: () => void;
}

export function PricingCalculator({ onSave }: PricingCalculatorProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>(1);

  const [ingredientCost, setIngredientCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [laborMinutes, setLaborMinutes] = useState("");
  const [laborHourlyRate, setLaborHourlyRate] = useState("");
  const [fixedCostShare, setFixedCostShare] = useState("");
  const [marginPercent, setMarginPercent] = useState(50);

  const calculatePricing = useCalculatePricing();

  const laborCost =
    ((parseFloat(laborMinutes) || 0) / 60) * (parseCurrency(laborHourlyRate) || 0);

  const totalCost =
    parseCurrency(ingredientCost) +
    parseCurrency(packagingCost) +
    laborCost +
    parseCurrency(fixedCostShare);

  const suggestedPrice = totalCost * (1 + marginPercent / 100);
  const profitPerUnit = suggestedPrice - totalCost;

  const handleNext = useCallback(() => {
    if (step === 5) {
      setStep("result");
    } else if (step !== "result") {
      setStep((s) => (Number(s) + 1) as Step);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step === "result") {
      setStep(5);
    } else if (step !== 1) {
      setStep((s) => (Number(s) - 1) as Step);
    }
  }, [step]);

  const handleRecalculate = useCallback(() => {
    setStep(1);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await calculatePricing.mutateAsync({
        ingredientCost: parseCurrency(ingredientCost),
        packagingCost: parseCurrency(packagingCost),
        laborCost,
        fixedCostShare: parseCurrency(fixedCostShare),
        marginPercent,
      });
      onSave?.();
    } catch {
      // handled by mutation state
    }
  }, [
    calculatePricing,
    ingredientCost,
    packagingCost,
    laborCost,
    fixedCostShare,
    marginPercent,
    onSave,
  ]);

  if (step === "result") {
    return (
      <PricingResult
        ingredientCost={parseCurrency(ingredientCost)}
        packagingCost={parseCurrency(packagingCost)}
        laborCost={laborCost}
        fixedCostShare={parseCurrency(fixedCostShare)}
        totalCost={totalCost}
        marginPercent={marginPercent}
        suggestedPrice={suggestedPrice}
        profitPerUnit={profitPerUnit}
        onRecalculate={handleRecalculate}
        onSave={() => {
          void handleSave();
        }}
        isSaving={calculatePricing.isPending}
      />
    );
  }

  const stepNumber = step as number;
  const TOTAL_STEPS = 5;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        gap: spacing.xl,
      }}
    >
      {/* Progress indicator */}
      <View style={{ flexDirection: "row", gap: spacing.xs }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: radii.sm,
              backgroundColor:
                i < stepNumber ? theme.colors.primary : theme.colors.surface,
            }}
          />
        ))}
      </View>

      <Typography variant="caption">
        Passo {stepNumber} de {TOTAL_STEPS}
      </Typography>

      {step === 1 && (
        <Card style={{ gap: spacing.lg }}>
          <Typography variant="h2">Custo dos ingredientes</Typography>
          <Typography variant="body">
            Quanto voce gasta em ingredientes para produzir uma unidade?
          </Typography>
          <Input
            label="Valor (R$)"
            placeholder="Ex: 12,50"
            value={ingredientCost}
            onChangeText={setIngredientCost}
            keyboardType="decimal-pad"
            autoFocus
          />
        </Card>
      )}

      {step === 2 && (
        <Card style={{ gap: spacing.lg }}>
          <Typography variant="h2">Custo da embalagem</Typography>
          <Typography variant="body">Quanto custa a embalagem de uma unidade?</Typography>
          <Input
            label="Valor (R$)"
            placeholder="Ex: 2,00"
            value={packagingCost}
            onChangeText={setPackagingCost}
            keyboardType="decimal-pad"
            autoFocus
          />
        </Card>
      )}

      {step === 3 && (
        <Card style={{ gap: spacing.lg }}>
          <Typography variant="h2">Mao de obra</Typography>
          <Typography variant="body">
            Quanto tempo voce leva para produzir uma unidade e qual o valor da sua hora?
          </Typography>
          <Input
            label="Tempo gasto (minutos)"
            placeholder="Ex: 30"
            value={laborMinutes}
            onChangeText={setLaborMinutes}
            keyboardType="numeric"
            autoFocus
          />
          <Input
            label="Valor da hora (R$)"
            placeholder="Ex: 20,00"
            value={laborHourlyRate}
            onChangeText={setLaborHourlyRate}
            keyboardType="decimal-pad"
          />
          {parseFloat(laborMinutes) > 0 && parseCurrency(laborHourlyRate) > 0 && (
            <View
              style={{
                backgroundColor: theme.colors.successBg,
                borderRadius: radii.md,
                padding: spacing.md,
              }}
            >
              <Typography variant="caption" color={theme.colors.success}>
                Custo de mao de obra: {formatCurrency(laborCost)}
              </Typography>
            </View>
          )}
        </Card>
      )}

      {step === 4 && (
        <Card style={{ gap: spacing.lg }}>
          <Typography variant="h2">Custos fixos (rateio)</Typography>
          <Typography variant="body">
            Divida seus custos fixos mensais pelo numero de unidades que voce produz
          </Typography>
          <Input
            label="Valor por unidade (R$)"
            placeholder="Ex: 1,50"
            value={fixedCostShare}
            onChangeText={setFixedCostShare}
            keyboardType="decimal-pad"
            autoFocus
          />
        </Card>
      )}

      {step === 5 && (
        <Card style={{ gap: spacing.lg }}>
          <Typography variant="h2">Margem de lucro</Typography>
          <Typography variant="body">
            Escolha a margem de lucro desejada sobre o custo total
          </Typography>

          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3">{marginPercent}%</Typography>

            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              {[30, 50, 80, 100, 150, 200].map((v) => (
                <Button
                  key={v}
                  title={`${v}%`}
                  variant={marginPercent === v ? "primary" : "outline"}
                  size="sm"
                  onPress={() => setMarginPercent(v)}
                />
              ))}
            </View>

            <Input
              label="Ou digite um valor personalizado (%)"
              placeholder="Ex: 75"
              value={String(marginPercent)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num >= 0 && num <= 300) {
                  setMarginPercent(num);
                } else if (text === "") {
                  setMarginPercent(0);
                }
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Live preview */}
          <View
            style={{
              backgroundColor: theme.colors.successBg,
              borderRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <Typography variant="caption" color={theme.colors.success}>
              Custo total: {formatCurrency(totalCost)}
            </Typography>
            <Typography variant="moneyLg" color={theme.colors.success}>
              Preco sugerido: {formatCurrency(suggestedPrice)}
            </Typography>
            <Typography variant="caption" color={theme.colors.success}>
              Lucro por unidade: {formatCurrency(profitPerUnit)}
            </Typography>
          </View>
        </Card>
      )}

      {/* Navigation buttons */}
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {step !== 1 && (
          <Button
            title="Voltar"
            variant="outline"
            onPress={handleBack}
            style={{ flex: 1 }}
          />
        )}
        <Button
          title={step === 5 ? "Ver resultado" : "Proximo"}
          onPress={handleNext}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}
