import { formatCurrency } from "../../../shared/utils/format";
import { Typography, spacing, radii, useTheme, type Theme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalculatorModal } from "../../../shared/components/calculator-modal";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useFieldPalette } from "../../../shared/components/form-field";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { usePackagingList } from "../../packaging/hooks";
import { useProducts } from "../../products/hooks";
import * as priceCalc from "../calc";
import { useCalculatePricing } from "../hooks";
import { PricingResult } from "./pricing-result";

type Step = 1 | 2 | 3 | 4 | 5 | "result";
const TOTAL_STEPS = 5;
const MARGIN_PRESETS = [30, 50, 80, 100, 150, 200];

function parseCurrency(text: string): number {
  return parseCurrencyInput(text) || 0;
}

interface PricingCalculatorProps {
  readonly onSave?: () => void;
}

// ---- Componentes visuais ----

function StepProgress({ current }: Readonly<{ current: number }>) {
  const { theme } = useTheme();
  const border = theme.mode === "dark" ? "rgba(245,225,219,0.2)" : "rgba(74,50,40,0.2)";
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <React.Fragment key={n}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: done || active ? theme.colors.primary : "transparent",
                borderWidth: done || active ? 0 : 1.5,
                borderColor: border,
              }}
            >
              {done ? (
                <Ionicons name="checkmark" size={18} color={theme.colors.textOnPrimary} />
              ) : (
                <Typography
                  variant="bodyBold"
                  color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                >
                  {n}
                </Typography>
              )}
            </View>
            {n < TOTAL_STEPS ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: n < current ? theme.colors.primary : border,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function StepTitle({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Typography
        variant="h1"
        color={theme.colors.text}
        style={{ fontSize: 30, fontWeight: "800" }}
      >
        {title}
      </Typography>
      <Typography
        variant="body"
        color={theme.colors.textSecondary}
        style={{ lineHeight: 22 }}
      >
        {subtitle}
      </Typography>
    </View>
  );
}

function FieldLabel({ children }: Readonly<{ children: string }>) {
  const { theme } = useTheme();
  return (
    <Typography
      variant="body"
      color={theme.colors.textSecondary}
      style={{ fontSize: 15 }}
    >
      {children}
    </Typography>
  );
}

function SubField({
  icon,
  label,
  children,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <FieldLabel>{label}</FieldLabel>
        {children}
      </View>
    </View>
  );
}

function MoneyField({
  value,
  onChangeText,
  placeholder,
  onCalc,
  autoFocus,
}: Readonly<{
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  onCalc: () => void;
  autoFocus?: boolean;
}>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: 64,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: pal.fieldBg,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={pal.placeholder}
        keyboardType="numeric"
        autoFocus={autoFocus}
        style={{ flex: 1, color: theme.colors.text, fontSize: 26, fontWeight: "700" }}
      />
      <Pressable
        onPress={onCalc}
        accessibilityRole="button"
        accessibilityLabel="Abrir calculadora"
        hitSlop={6}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="calculator-outline" size={22} color={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min,
  suffix,
}: Readonly<{
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  suffix: string;
}>) {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const btnBg = isDark ? "rgba(255,255,255,0.06)" : theme.colors.surface;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        accessibilityRole="button"
        accessibilityLabel="Diminuir"
        style={({ pressed }) => ({
          width: 56,
          height: 48,
          borderRadius: radii.md,
          backgroundColor: btnBg,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="remove" size={22} color={theme.colors.text} />
      </Pressable>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "center",
          gap: spacing.xs,
        }}
      >
        <Typography variant="h2" color={theme.colors.text} style={{ fontSize: 26 }}>
          {value}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {suffix}
        </Typography>
      </View>
      <Pressable
        onPress={() => onChange(value + step)}
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        style={({ pressed }) => ({
          width: 56,
          height: 48,
          borderRadius: radii.md,
          backgroundColor: btnBg,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="add" size={22} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}

function cardStyle(theme: Theme, pal: ReturnType<typeof useFieldPalette>) {
  return {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: pal.border,
    backgroundColor: pal.fieldBg,
    padding: spacing.lg,
    gap: spacing.lg,
  } as const;
}

function ComputedCard({
  icon,
  label,
  value,
  sublabel,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sublabel?: string;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.success}40`,
        backgroundColor: `${theme.colors.success}14`,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: `${theme.colors.success}66`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={22} color={theme.colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="caption" color={theme.colors.success}>
          {label}
        </Typography>
        <Typography variant="h2" color={theme.colors.success} style={{ fontSize: 24 }}>
          {value}
        </Typography>
        {sublabel ? (
          <Typography variant="caption" color={theme.colors.success}>
            {sublabel}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

function DicaBox({
  tone,
  children,
}: Readonly<{ tone: "green" | "blue"; children: React.ReactNode }>) {
  const { theme } = useTheme();
  const color = tone === "green" ? theme.colors.success : theme.colors.blue;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}14`,
        padding: spacing.md,
      }}
    >
      <Ionicons
        name={tone === "green" ? "checkmark-circle-outline" : "bulb-outline"}
        size={20}
        color={color}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function PricingCalculator({ onSave }: PricingCalculatorProps) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);

  const { data: productsData } = useProducts();
  const costedProducts = (productsData?.items ?? []).filter((p) => p.costPrice != null);
  const { data: packagingData } = usePackagingList();
  const packagingItems = packagingData?.items ?? [];
  const packagingSuggestion =
    packagingItems.length > 0
      ? packagingItems.reduce((s, p) => s + (p.unitCost ?? 0), 0) / packagingItems.length
      : null;

  const [productId, setProductId] = useState<string | null>(null);
  const [importedFromRecipe, setImportedFromRecipe] = useState(false);
  const [ingredientCost, setIngredientCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [laborMin, setLaborMin] = useState(0);
  const [laborHourlyRate, setLaborHourlyRate] = useState("");
  const [monthlyFixed, setMonthlyFixed] = useState("");
  const [monthlyProduction, setMonthlyProduction] = useState(100);
  const [marginPercent, setMarginPercent] = useState(50);
  const [ifoodPercent, setIfoodPercent] = useState("");
  const [cardPercent, setCardPercent] = useState("");
  const [calcApply, setCalcApply] = useState<((v: number) => void) | null>(null);

  const calculatePricing = useCalculatePricing();
  const selectedProduct = costedProducts.find((p) => p.id === productId) ?? null;

  const laborCost = priceCalc.laborCost(laborMin, parseCurrency(laborHourlyRate));
  const monthlyFixedNum = parseCurrency(monthlyFixed);
  const fixedCostShare = monthlyProduction > 0 ? monthlyFixedNum / monthlyProduction : 0;
  const totalCost = priceCalc.totalCost(
    parseCurrency(ingredientCost),
    parseCurrency(packagingCost),
    laborCost,
    fixedCostShare,
  );
  const suggestedPrice = priceCalc.suggestedPrice(totalCost, marginPercent);
  const profitPerUnit = priceCalc.profitPerUnit(suggestedPrice, totalCost);
  const feesPercent =
    (parseFloat(ifoodPercent.replace(",", ".")) || 0) +
    (parseFloat(cardPercent.replace(",", ".")) || 0);
  const { finalPrice, feesAmount } = priceCalc.finalPriceWithFees(
    suggestedPrice,
    feesPercent,
  );

  const openCalc = useCallback((apply: (v: number) => void) => {
    setCalcApply(() => apply);
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => (s === 5 ? "result" : ((Number(s) + 1) as Step)));
  }, []);
  const handleBack = useCallback(() => {
    setStep((s) => (s === "result" ? 5 : ((Number(s) - 1) as Step)));
  }, []);
  const handleRecalculate = useCallback(() => setStep(1), []);

  function selectProduct(id: string, costPrice: number | null) {
    if (productId === id) {
      setProductId(null);
      setImportedFromRecipe(false);
      return;
    }
    setProductId(id);
    if (costPrice != null) {
      setIngredientCost(currencyInput(costPrice));
      setImportedFromRecipe(true);
    }
  }

  const handleSave = useCallback(async () => {
    try {
      await calculatePricing.mutateAsync({
        productId: productId ?? undefined,
        ingredientCost: parseCurrency(ingredientCost),
        packagingCost: parseCurrency(packagingCost),
        laborCost,
        fixedCostShare,
        marginPercent,
        feesPercent: feesPercent > 0 ? feesPercent : undefined,
      });
      onSave?.();
    } catch {
      // handled by mutation state
    }
  }, [
    calculatePricing,
    productId,
    ingredientCost,
    packagingCost,
    laborCost,
    fixedCostShare,
    marginPercent,
    feesPercent,
    onSave,
  ]);

  if (step === "result") {
    return (
      <PricingResult
        ingredientCost={parseCurrency(ingredientCost)}
        packagingCost={parseCurrency(packagingCost)}
        laborCost={laborCost}
        fixedCostShare={fixedCostShare}
        totalCost={totalCost}
        marginPercent={marginPercent}
        suggestedPrice={suggestedPrice}
        profitPerUnit={profitPerUnit}
        feesPercent={feesPercent}
        feesAmount={feesAmount}
        finalPrice={finalPrice}
        monthlyUnits={monthlyProduction}
        onRecalculate={handleRecalculate}
        onSave={() => {
          void handleSave();
        }}
        isSaving={calculatePricing.isPending}
      />
    );
  }

  const stepNumber = step as number;

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing["5xl"] + insets.bottom,
          gap: spacing.xl,
        }}
      >
        <StepProgress current={stepNumber} />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Etapa{" "}
          <Typography variant="caption" color={theme.colors.primary}>
            {stepNumber}
          </Typography>{" "}
          de {TOTAL_STEPS}
        </Typography>

        {step === 1 && (
          <>
            <StepTitle
              title="Custo dos insumos"
              subtitle="Informe quanto você gasta em insumos para produzir uma unidade."
            />
            {costedProducts.length > 0 && !selectedProduct ? (
              <View style={{ gap: spacing.sm }}>
                <FieldLabel>Puxar o custo de um produto (vem da receita):</FieldLabel>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {costedProducts.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => selectProduct(p.id, p.costPrice)}
                      accessibilityRole="button"
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: pal.border,
                        backgroundColor: pal.fieldBg,
                      }}
                    >
                      <Typography variant="caption" color={theme.colors.text}>
                        {p.name} · {formatCurrency(p.costPrice ?? 0)}
                      </Typography>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {selectedProduct ? (
              <View style={cardStyle(theme, pal)}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}55`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="basket-outline"
                      size={30}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Produto selecionado
                    </Typography>
                    <Typography
                      variant="h2"
                      color={theme.colors.text}
                      style={{ fontSize: 22 }}
                    >
                      {selectedProduct.name}
                    </Typography>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: pal.border }} />
                <View>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Custo da receita
                  </Typography>
                  <Typography
                    variant="h2"
                    color={theme.colors.primary}
                    style={{ fontSize: 24 }}
                  >
                    {formatCurrency(selectedProduct.costPrice ?? 0)}
                  </Typography>
                </View>
              </View>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>Valor dos insumos (R$)</FieldLabel>
              <MoneyField
                value={ingredientCost}
                onChangeText={(t) => {
                  setIngredientCost(maskCurrencyInput(t));
                  setImportedFromRecipe(false);
                }}
                placeholder="Ex: 12,50"
                onCalc={() => openCalc((v) => setIngredientCost(currencyInput(v)))}
                autoFocus
              />
              {importedFromRecipe ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.success}
                  />
                  <Typography variant="caption" color={theme.colors.success}>
                    Valor importado da receita
                  </Typography>
                </View>
              ) : null}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle
              title="Custo da embalagem"
              subtitle="Informe quanto custa a embalagem utilizada para cada unidade."
            />
            {selectedProduct || packagingSuggestion != null ? (
              <View style={cardStyle(theme, pal)}>
                {selectedProduct ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        borderWidth: 1,
                        borderColor: `${theme.colors.primary}55`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={30}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Produto selecionado
                      </Typography>
                      <Typography
                        variant="h2"
                        color={theme.colors.text}
                        style={{ fontSize: 22 }}
                      >
                        {selectedProduct.name}
                      </Typography>
                    </View>
                  </View>
                ) : null}
                {packagingSuggestion != null ? (
                  <>
                    {selectedProduct ? (
                      <View style={{ height: 1, backgroundColor: pal.border }} />
                    ) : null}
                    <View>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Sugestão baseada nas suas embalagens
                      </Typography>
                      <Typography
                        variant="h2"
                        color={theme.colors.success}
                        style={{ fontSize: 24 }}
                      >
                        {formatCurrency(packagingSuggestion)}
                      </Typography>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>Valor da embalagem (R$)</FieldLabel>
              <MoneyField
                value={packagingCost}
                onChangeText={(t) => setPackagingCost(maskCurrencyInput(t))}
                placeholder="Ex: 2,00"
                onCalc={() => openCalc((v) => setPackagingCost(currencyInput(v)))}
                autoFocus
              />
            </View>
            <DicaBox tone="green">
              <Typography
                variant="caption"
                color={theme.colors.success}
                style={{ fontWeight: "700" }}
              >
                Dica:{" "}
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Considere sacolas, fitas, etiquetas, caixas, descartáveis e outros
                  materiais.
                </Typography>
              </Typography>
            </DicaBox>
          </>
        )}

        {step === 3 && (
          <>
            <StepTitle
              title="Mão de obra"
              subtitle="Informe o tempo gasto para produzir uma unidade e o valor da sua hora de trabalho."
            />
            <View style={cardStyle(theme, pal)}>
              <SubField icon="time-outline" label="Tempo gasto por unidade">
                <Stepper
                  value={laborMin}
                  onChange={setLaborMin}
                  step={5}
                  min={0}
                  suffix="min"
                />
              </SubField>
              <View style={{ height: 1, backgroundColor: pal.border }} />
              <SubField icon="cash-outline" label="Valor da sua hora de trabalho (R$)">
                <MoneyField
                  value={laborHourlyRate}
                  onChangeText={(t) => setLaborHourlyRate(maskCurrencyInput(t))}
                  placeholder="Ex: 20,00"
                  onCalc={() => openCalc((v) => setLaborHourlyRate(currencyInput(v)))}
                />
              </SubField>
            </View>
            <ComputedCard
              icon="calculator-outline"
              label="Custo de mão de obra por unidade"
              value={formatCurrency(laborCost)}
            />
            <DicaBox tone="blue">
              <Typography
                variant="caption"
                color={theme.colors.blue}
                style={{ fontWeight: "700" }}
              >
                Dica:{" "}
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Considere todo o tempo envolvido no preparo, montagem, limpeza e
                  organização.
                </Typography>
              </Typography>
            </DicaBox>
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle
              title="Custos fixos (rateio)"
              subtitle="Informe o valor dos seus custos fixos mensais. Dividiremos pelo número de unidades produzidas."
            />
            <View style={cardStyle(theme, pal)}>
              <SubField icon="calendar-outline" label="Custos fixos mensais (R$)">
                <MoneyField
                  value={monthlyFixed}
                  onChangeText={(t) => setMonthlyFixed(maskCurrencyInput(t))}
                  placeholder="Ex: 300,00"
                  onCalc={() => openCalc((v) => setMonthlyFixed(currencyInput(v)))}
                />
              </SubField>
              <View style={{ height: 1, backgroundColor: pal.border }} />
              <SubField icon="cube-outline" label="Produção mensal estimada">
                <Stepper
                  value={monthlyProduction}
                  onChange={setMonthlyProduction}
                  step={10}
                  min={1}
                  suffix="un"
                />
              </SubField>
            </View>
            <ComputedCard
              icon="pie-chart-outline"
              label="Custo fixo por unidade"
              value={formatCurrency(fixedCostShare)}
              sublabel={`${formatCurrency(monthlyFixedNum)} ÷ ${monthlyProduction} unidades`}
            />
            <DicaBox tone="blue">
              <Typography
                variant="caption"
                color={theme.colors.blue}
                style={{ fontWeight: "700" }}
              >
                Dica:{" "}
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Inclua aluguel, água, luz, internet, contador, depreciação de
                  equipamentos, entre outros.
                </Typography>
              </Typography>
            </DicaBox>
          </>
        )}

        {step === 5 && (
          <>
            <StepTitle
              title="Margem de lucro"
              subtitle="Escolha a margem de lucro desejada sobre o custo total e veja o resultado do preço final."
            />
            <View style={cardStyle(theme, pal)}>
              <FieldLabel>Selecione uma margem (%)</FieldLabel>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {MARGIN_PRESETS.map((v) => {
                  const active = marginPercent === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setMarginPercent(v)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        width: "22%",
                        minHeight: 44,
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                        backgroundColor: active ? theme.colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="bodyBold"
                        color={active ? theme.colors.textOnPrimary : theme.colors.primary}
                      >
                        {v}%
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ gap: spacing.sm }}>
                <FieldLabel>Ou digite um valor personalizado (%)</FieldLabel>
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    backgroundColor: pal.fieldBg,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <TextInput
                    value={String(marginPercent)}
                    onChangeText={(t) => {
                      const num = parseInt(t, 10);
                      if (!isNaN(num) && num >= 0 && num <= 1000) setMarginPercent(num);
                      else if (t === "") setMarginPercent(0);
                    }}
                    keyboardType="numeric"
                    style={{ flex: 1, color: theme.colors.text, fontSize: 16 }}
                  />
                  <Typography variant="body" color={theme.colors.textSecondary}>
                    %
                  </Typography>
                </View>
              </View>
            </View>

            <ComputedCard
              icon="trending-up-outline"
              label="Margem selecionada"
              value={`${marginPercent}%`}
              sublabel={`Preço final será ${marginPercent}% maior que o custo total.`}
            />

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>Taxas de venda (opcional)</FieldLabel>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View
                  style={{
                    flex: 1,
                    minHeight: 52,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: pal.border,
                    backgroundColor: pal.fieldBg,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <TextInput
                    value={ifoodPercent}
                    onChangeText={setIfoodPercent}
                    placeholder="iFood %"
                    placeholderTextColor={pal.placeholder}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, color: theme.colors.text, fontSize: 16 }}
                  />
                </View>
                <View
                  style={{
                    flex: 1,
                    minHeight: 52,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: pal.border,
                    backgroundColor: pal.fieldBg,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <TextInput
                    value={cardPercent}
                    onChangeText={setCardPercent}
                    placeholder="Cartão %"
                    placeholderTextColor={pal.placeholder}
                    keyboardType="decimal-pad"
                    style={{ flex: 1, color: theme.colors.text, fontSize: 16 }}
                  />
                </View>
              </View>
            </View>

            <View style={cardStyle(theme, pal)}>
              <Typography variant="bodyBold" color={theme.colors.text}>
                Resumo do cálculo
              </Typography>
              <SummaryRow
                icon="basket-outline"
                iconColor={theme.colors.premium}
                label="Custo total"
                value={formatCurrency(totalCost)}
              />
              <SummaryRow
                icon="pricetag-outline"
                iconColor={theme.colors.success}
                label="Margem de lucro"
                value={`${marginPercent}% (${formatCurrency(profitPerUnit)})`}
                valueColor={theme.colors.success}
              />
              <SummaryRow
                icon="calculator-outline"
                iconColor={theme.colors.blue}
                label="Preço base (com margem)"
                value={formatCurrency(suggestedPrice)}
              />
              {feesPercent > 0 ? (
                <SummaryRow
                  icon="card-outline"
                  iconColor={theme.colors.lavender}
                  label="Taxas de venda"
                  value={`${feesPercent}% (${formatCurrency(feesAmount)})`}
                  valueColor={theme.colors.lavender}
                />
              ) : null}
              <View style={{ height: 1, backgroundColor: pal.border }} />
              <SummaryRow
                icon="cash-outline"
                iconColor={theme.colors.success}
                label="Preço final"
                value={formatCurrency(finalPrice)}
                valueColor={theme.colors.success}
                bold
              />
            </View>
          </>
        )}

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {step !== 1 ? (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 56,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}66`,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Voltar
              </Typography>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 56,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {step === 5 ? (
              <Ionicons name="stats-chart" size={20} color={theme.colors.textOnPrimary} />
            ) : null}
            <Typography
              variant="bodyBold"
              color={theme.colors.textOnPrimary}
              style={{ fontSize: 17 }}
            >
              {step === 5 ? "Ver resultado" : "Próximo"}
            </Typography>
            {step !== 5 ? (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.textOnPrimary}
              />
            ) : null}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <CalculatorModal
        visible={calcApply != null}
        onClose={() => setCalcApply(null)}
        onResult={(v) => {
          calcApply?.(v);
          setCalcApply(null);
        }}
      />
    </>
  );
}

function SummaryRow({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  bold,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Typography
        variant={bold ? "bodyBold" : "body"}
        color={theme.colors.text}
        style={{ flex: 1 }}
      >
        {label}
      </Typography>
      <Typography variant="bodyBold" color={valueColor ?? theme.colors.text}>
        {value}
      </Typography>
    </View>
  );
}
