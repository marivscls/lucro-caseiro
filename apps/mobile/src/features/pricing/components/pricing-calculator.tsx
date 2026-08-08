import type { PricingChannelFee } from "@lucro-caseiro/contracts";
import { formatCurrency } from "../../../shared/utils/format";
import {
  Button,
  Typography,
  fonts,
  spacing,
  radii,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import type { AppIconName } from "../../../shared/components/app-icon";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalculatorModal } from "../../../shared/components/calculator-modal";
import { showAlert } from "../../../shared/components/alert-store";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useFieldPalette } from "../../../shared/components/form-field";
import { desktopSplitLayout, pageGutter } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { usePackagingList } from "../../packaging/hooks";
import { useProducts } from "../../products/hooks";
import { useRecurringExpenses } from "../../finance/hooks";
import { useProlaboreStatus } from "../../goals/hooks";
import { useBusinessCopy } from "../../subscription/business-copy";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAuth } from "../../../shared/hooks/use-auth";
import * as priceCalc from "../calc";
import {
  useCalculatePricing,
  usePricingPreferences,
  usePricingRevenueHistory,
  useUpdatePricingPreferences,
} from "../hooks";
import { PricingResult } from "./pricing-result";

type Step = 1 | 2 | 3 | 4 | 5 | "result";
type AllocationMode = "unit" | "revenue";
type CostSource = "manual" | "recurring";
type RevenueSource = "manual" | "history" | "goal";
const TOTAL_STEPS = 5;
const MARGIN_PRESETS = [30, 50, 80, 100, 150, 200];

function parseCurrency(text: string): number {
  return parseCurrencyInput(text) || 0;
}

function capitalize(value: string): string {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

interface PricingCalculatorProps {
  readonly onSave?: () => void;
  readonly onCreateProduct?: (salePrice: number) => void;
}

// ---- Componentes visuais ----

function StepProgress({ current }: Readonly<{ current: number }>) {
  const { theme } = useTheme();
  const border = theme.colors.border;
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
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: done || active ? theme.colors.primary : "transparent",
                borderWidth: done || active ? 0 : 1.5,
                borderColor: border,
              }}
            >
              {done ? (
                <AppIcon name="checkmark" size={18} color={theme.colors.textOnPrimary} />
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
      <Typography variant="h1" color={theme.colors.text}>
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
    <Typography variant="body" color={theme.colors.textSecondary}>
      {children}
    </Typography>
  );
}

function SubField({
  icon,
  label,
  children,
}: Readonly<{
  icon: AppIconName;
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
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={22} color={theme.colors.primary} />
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
  const isDesktop = useDesktopLayout();
  const pal = useFieldPalette();
  return (
    <View
      style={{
        minHeight: isDesktop ? 52 : 64,
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
      <Typography
        variant="bodyBold"
        color={theme.colors.text}
        style={{ fontSize: isDesktop ? 18 : 22 }}
      >
        R$
      </Typography>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={pal.placeholder}
        keyboardType="numeric"
        autoFocus={autoFocus}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: isDesktop ? 20 : 26,
          fontFamily: fonts.bold,
        }}
      />
      <Pressable
        onPress={onCalc}
        accessibilityRole="button"
        accessibilityLabel="Abrir calculadora"
        hitSlop={6}
        style={({ pressed }) => ({
          width: isDesktop ? 36 : 44,
          height: isDesktop ? 36 : 44,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AppIcon name="calculator-outline" size={22} color={theme.colors.primary} />
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
  const btnBg = theme.colors.surface;
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
        <AppIcon name="remove" size={22} color={theme.colors.text} />
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
        <Typography variant="h1" color={theme.colors.text}>
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
        <AppIcon name="add" size={22} color={theme.colors.text} />
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
  icon: AppIconName;
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
          borderRadius: radii.full,
          borderWidth: 1,
          borderColor: `${theme.colors.success}66`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={22} color={theme.colors.success} />
      </View>
      <View style={{ flex: 1 }}>
        <Typography variant="caption" color={theme.colors.success}>
          {label}
        </Typography>
        <Typography variant="h2" color={theme.colors.success}>
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
      <AppIcon
        name={tone === "green" ? "checkmark-circle-outline" : "bulb-outline"}
        size={20}
        color={color}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: Readonly<{ label: string; active: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primaryBg : theme.colors.surface,
      }}
    >
      <Typography
        variant="captionBold"
        color={active ? theme.colors.primaryStrong : theme.colors.textSecondary}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

export function PricingCalculator({ onSave, onCreateProduct }: PricingCalculatorProps) {
  const { theme } = useTheme();
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [startedTracked, setStartedTracked] = useState(false);

  const { data: productsData } = useProducts();
  const costedProducts = (productsData?.items ?? []).filter((p) => p.costPrice != null);
  const { data: packagingData } = usePackagingList();
  const packagingItems = packagingData?.items ?? [];
  const { data: recurringExpenses = [], isLoading: loadingRecurring } =
    useRecurringExpenses();
  const revenueHistory = usePricingRevenueHistory();
  const { data: prolaboreStatus } = useProlaboreStatus();
  const { data: pricingPreferences } = usePricingPreferences();
  const updatePricingPreferences = useUpdatePricingPreferences();

  const [productId, setProductId] = useState<string | null>(null);
  const [importedFromRecipe, setImportedFromRecipe] = useState(false);
  const [ingredientCost, setIngredientCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [laborMin, setLaborMin] = useState(0);
  const [laborUnits, setLaborUnits] = useState(0);
  const [laborHourlyRate, setLaborHourlyRate] = useState("");
  const [monthlyFixed, setMonthlyFixed] = useState("");
  const [monthlyProduction, setMonthlyProduction] = useState(0);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("unit");
  const [costSource, setCostSource] = useState<CostSource>("manual");
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [revenueSource, setRevenueSource] = useState<RevenueSource>("manual");
  const [manualRevenue, setManualRevenue] = useState("");
  const [marginPercent, setMarginPercent] = useState(50);
  const [channelFees, setChannelFees] = useState<PricingChannelFee[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("direct");
  const [calcApply, setCalcApply] = useState<((v: number) => void) | null>(null);

  const calculatePricing = useCalculatePricing();
  const selectedProduct = costedProducts.find((p) => p.id === productId) ?? null;

  const laborHourlyRateValue = parseCurrency(laborHourlyRate);
  const laborCost = priceCalc.laborCostPerUnit(
    laborMin,
    laborHourlyRateValue,
    laborUnits,
  );
  useEffect(() => {
    if (pricingPreferences) setChannelFees(pricingPreferences.channelFees);
  }, [pricingPreferences]);

  const activeRecurring = recurringExpenses.filter((item) => item.active);
  const selectedRecurringTotal = activeRecurring
    .filter((item) => selectedExpenseIds.includes(item.id))
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyFixedNum =
    costSource === "recurring" ? selectedRecurringTotal : parseCurrency(monthlyFixed);
  let revenueBasis = parseCurrency(manualRevenue);
  if (revenueSource === "history") revenueBasis = revenueHistory.averageRevenue;
  if (revenueSource === "goal") {
    revenueBasis = prolaboreStatus?.progress.requiredRevenue ?? 0;
  }
  const costingPercent =
    allocationMode === "revenue"
      ? priceCalc.overheadPercent(monthlyFixedNum, revenueBasis)
      : 0;
  const directCost = priceCalc.totalCost(
    parseCurrency(ingredientCost),
    parseCurrency(packagingCost),
    laborCost,
    0,
  );
  const revenueCosting = priceCalc.revenueCosting(
    directCost,
    marginPercent,
    costingPercent,
  );
  const fixedCostShare =
    allocationMode === "revenue"
      ? revenueCosting.overheadAmount
      : priceCalc.fixedCostShare(monthlyFixedNum, monthlyProduction);
  const totalCost =
    allocationMode === "revenue"
      ? revenueCosting.totalCost
      : priceCalc.totalCost(
          parseCurrency(ingredientCost),
          parseCurrency(packagingCost),
          laborCost,
          fixedCostShare,
        );
  const suggestedPrice =
    allocationMode === "revenue"
      ? revenueCosting.suggestedPrice
      : priceCalc.suggestedPrice(totalCost, marginPercent);
  const profitPerUnit = priceCalc.profitPerUnit(suggestedPrice, totalCost);
  const selectedChannel = channelFees.find((item) => item.id === selectedChannelId);
  const feesPercent = selectedChannel?.percent ?? 0;
  const { finalPrice, feesAmount } = priceCalc.finalPriceWithFees(
    suggestedPrice,
    feesPercent,
  );
  let costingSummary = "Nenhum rateio incluído";
  if (allocationMode === "revenue") {
    costingSummary =
      costingPercent > 0
        ? `${costingPercent.toFixed(1).replace(".", ",")}% sobre a venda · base ${formatCurrency(revenueBasis)}`
        : "Nenhum custeio incluído";
  } else if (monthlyProduction > 0) {
    costingSummary = `${formatCurrency(monthlyFixedNum)} ÷ ${monthlyProduction} unidades`;
  }

  const openCalc = useCallback((apply: (v: number) => void) => {
    setCalcApply(() => apply);
  }, []);

  const handleNext = useCallback(() => {
    if (step === 1 && parseCurrency(ingredientCost) <= 0) {
      alertValidation(
        `Informe o custo de ${experienceCopy.materialNounPlural} para continuar.`,
      );
      return;
    }
    const hasAnyLaborValue = laborMin > 0 || laborUnits > 0 || laborHourlyRateValue > 0;
    const hasCompleteLabor = laborMin > 0 && laborUnits > 0 && laborHourlyRateValue > 0;
    if (step === 3 && hasAnyLaborValue && !hasCompleteLabor) {
      alertValidation(
        "Para incluir seu trabalho, informe o tempo do lote, quantas unidades ele rende e o valor da sua hora.",
      );
      return;
    }
    if (
      step === 4 &&
      allocationMode === "unit" &&
      monthlyFixedNum > 0 &&
      monthlyProduction <= 0
    ) {
      alertValidation(
        "Para ratear os gastos fixos, informe quantas unidades você produz por mês.",
      );
      return;
    }
    if (step === 4 && allocationMode === "revenue") {
      if (monthlyFixedNum <= 0) {
        alertValidation("Selecione gastos cadastrados ou informe um total mensal.");
        return;
      }
      if (revenueBasis <= 0) {
        alertValidation("Escolha ou informe uma base de faturamento.");
        return;
      }
      if (costingPercent >= 95) {
        alertValidation("A taxa de custeio precisa ser menor que 95%.");
        return;
      }
    }
    if (step === 5 && feesPercent > 95) {
      alertValidation("A taxa do canal pode ser de no máximo 95%.");
      return;
    }
    if (!startedTracked) {
      setStartedTracked(true);
      void trackAnalyticsAction("pricing_started", useAuth.getState().token);
    }
    setStep((s) => (s === 5 ? "result" : ((Number(s) + 1) as Step)));
  }, [
    feesPercent,
    allocationMode,
    costingPercent,
    ingredientCost,
    laborHourlyRateValue,
    laborMin,
    laborUnits,
    monthlyFixedNum,
    monthlyProduction,
    revenueBasis,
    startedTracked,
    step,
  ]);
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

  function toggleExpense(id: string) {
    setCostSource("recurring");
    setSelectedExpenseIds((current) =>
      current.includes(id)
        ? current.filter((candidate) => candidate !== id)
        : [...current, id],
    );
  }

  function updateChannel(id: string, patch: Partial<PricingChannelFee>) {
    setChannelFees((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addChannel() {
    if (channelFees.length >= 8) {
      alertValidation("Você pode salvar até 8 canais.");
      return;
    }
    const id = `channel-${Date.now()}`;
    setChannelFees((current) => [
      ...current,
      { id, name: `Canal ${current.length + 1}`, percent: 0 },
    ]);
    setSelectedChannelId(id);
  }

  function removeChannel(id: string) {
    setChannelFees((current) => current.filter((item) => item.id !== id));
    if (selectedChannelId === id) setSelectedChannelId("direct");
  }

  async function saveChannelProfiles() {
    if (channelFees.some((item) => !item.name.trim())) {
      alertValidation("Dê um nome para todos os canais.");
      return;
    }
    if (channelFees.some((item) => item.percent < 0 || item.percent > 95)) {
      alertValidation("As taxas dos canais devem ficar entre 0% e 95%.");
      return;
    }
    try {
      await updatePricingPreferences.mutateAsync({ channelFees });
      showAlert({
        title: "Canais salvos",
        message: "As taxas estarão disponíveis nos próximos cálculos.",
      });
    } catch (error) {
      alertError(error);
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
        allocationMode,
        monthlyFixedCosts: allocationMode === "revenue" ? monthlyFixedNum : undefined,
        revenueBasis: allocationMode === "revenue" ? revenueBasis : undefined,
        channelName: selectedChannel?.name,
      });
      onSave?.();
    } catch (error) {
      alertError(error);
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
    allocationMode,
    monthlyFixedNum,
    revenueBasis,
    selectedChannel,
    onSave,
  ]);

  const handleCreateProduct = useCallback(async () => {
    onCreateProduct?.(finalPrice);
    try {
      await calculatePricing.mutateAsync({
        productId: productId ?? undefined,
        ingredientCost: parseCurrency(ingredientCost),
        packagingCost: parseCurrency(packagingCost),
        laborCost,
        fixedCostShare,
        marginPercent,
        feesPercent: feesPercent > 0 ? feesPercent : undefined,
        allocationMode,
        monthlyFixedCosts: allocationMode === "revenue" ? monthlyFixedNum : undefined,
        revenueBasis: allocationMode === "revenue" ? revenueBasis : undefined,
        channelName: selectedChannel?.name,
      });
    } catch (error) {
      alertError(error);
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
    allocationMode,
    monthlyFixedNum,
    revenueBasis,
    selectedChannel,
    finalPrice,
    onCreateProduct,
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
        monthlyUnits={allocationMode === "unit" ? monthlyProduction : 0}
        allocationMode={allocationMode}
        overheadPercent={costingPercent}
        monthlyFixedCosts={allocationMode === "revenue" ? monthlyFixedNum : undefined}
        revenueBasis={allocationMode === "revenue" ? revenueBasis : undefined}
        channelName={selectedChannel?.name}
        onRecalculate={handleRecalculate}
        onSave={() => {
          void handleSave();
        }}
        onCreateProduct={
          onCreateProduct && productId === null
            ? () => {
                void handleCreateProduct();
              }
            : undefined
        }
        isSaving={calculatePricing.isPending}
      />
    );
  }

  const stepNumber = step as number;

  return (
    <>
      <KeyboardAwareScrollView
        extraScrollHeight={spacing["4xl"]}
        contentContainerStyle={[
          {
            paddingTop: spacing.xl,
            paddingBottom: spacing["5xl"] + insets.bottom,
            gap: spacing.xl,
            width: "100%",
          },
          pageGutter(isDesktop),
          desktopSplitLayout(isDesktop).outer,
        ]}
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
              title={`Custo de ${experienceCopy.materialNounPlural}`}
              subtitle={`Informe quanto você gasta em ${experienceCopy.materialNounPlural} para entregar uma unidade.`}
            />
            {costedProducts.length > 0 && !selectedProduct ? (
              <View style={{ gap: spacing.sm }}>
                <FieldLabel>
                  {`Puxar o custo de um ${experienceCopy.productNoun} (vem da ${experienceCopy.formulaNoun}):`}
                </FieldLabel>
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
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}55`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon
                      name="basket-outline"
                      size={30}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {capitalize(experienceCopy.productNoun)} selecionado
                    </Typography>
                    <Typography variant="h2" color={theme.colors.text}>
                      {selectedProduct.name}
                    </Typography>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: pal.border }} />
                <View>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Custo da {experienceCopy.formulaNoun}
                  </Typography>
                  <Typography variant="money" color={theme.colors.primary}>
                    {formatCurrency(selectedProduct.costPrice ?? 0)}
                  </Typography>
                </View>
              </View>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>
                {`Valor de ${experienceCopy.materialNounPlural} (R$)`}
              </FieldLabel>
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
                  <AppIcon
                    name="checkmark-circle"
                    size={16}
                    color={theme.colors.success}
                  />
                  <Typography variant="caption" color={theme.colors.success}>
                    Valor importado da {experienceCopy.formulaNoun}
                  </Typography>
                </View>
              ) : null}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle
              title={`Custo de ${experienceCopy.packagingNoun}`}
              subtitle={`Informe o valor de ${experienceCopy.packagingNoun} por unidade.`}
            />
            {selectedProduct ? (
              <View style={cardStyle(theme, pal)}>
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
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: `${theme.colors.primary}55`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppIcon name="cube-outline" size={30} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {capitalize(experienceCopy.productNoun)} selecionado
                    </Typography>
                    <Typography variant="h2" color={theme.colors.text}>
                      {selectedProduct.name}
                    </Typography>
                  </View>
                </View>
              </View>
            ) : null}

            {packagingItems.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <FieldLabel>
                  {`Selecione no cadastro: ${experienceCopy.packagingNoun}`}
                </FieldLabel>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {packagingItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setPackagingCost(currencyInput(item.unitCost))}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${formatCurrency(item.unitCost)}`}
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
                        {item.name} · {formatCurrency(item.unitCost)}
                      </Typography>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>{`Valor de ${experienceCopy.packagingNoun} (R$)`}</FieldLabel>
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
                style={{ fontFamily: fonts.bold }}
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
              title="Mão de obra (estimativa opcional)"
              subtitle="Use o tempo e o rendimento médios de uma produção. Se ainda não souber, deixe os valores zerados."
            />
            <View style={cardStyle(theme, pal)}>
              <SubField icon="time-outline" label="Tempo médio de uma produção">
                <Stepper
                  value={laborMin}
                  onChange={setLaborMin}
                  step={5}
                  min={0}
                  suffix="min"
                />
              </SubField>
              <View style={{ height: 1, backgroundColor: pal.border }} />
              <SubField icon="cube-outline" label="Rendimento médio dessa produção">
                <Stepper
                  value={laborUnits}
                  onChange={setLaborUnits}
                  step={1}
                  min={0}
                  suffix="un"
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
                style={{ fontFamily: fonts.bold }}
              >
                Dica:{" "}
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Se não quiser incluir mão de obra, deixe os três valores zerados.
                </Typography>
              </Typography>
            </DicaBox>
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle
              title="Custos indiretos (estimativa opcional)"
              subtitle="Escolha um método e confirme cada valor antes de incluí-lo no preço."
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <ChoiceChip
                label="Por unidades"
                active={allocationMode === "unit"}
                onPress={() => setAllocationMode("unit")}
              />
              <ChoiceChip
                label="Por faturamento"
                active={allocationMode === "revenue"}
                onPress={() => setAllocationMode("revenue")}
              />
            </View>

            <View style={cardStyle(theme, pal)}>
              <FieldLabel>Origem dos gastos mensais</FieldLabel>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                <ChoiceChip
                  label="Informar manualmente"
                  active={costSource === "manual"}
                  onPress={() => setCostSource("manual")}
                />
                <ChoiceChip
                  label={`Gastos cadastrados (${activeRecurring.length})`}
                  active={costSource === "recurring"}
                  onPress={() => setCostSource("recurring")}
                />
              </View>

              {costSource === "manual" ? (
                <MoneyField
                  value={monthlyFixed}
                  onChangeText={(t) => setMonthlyFixed(maskCurrencyInput(t))}
                  placeholder="Ex: 300,00"
                  onCalc={() => openCalc((v) => setMonthlyFixed(currencyInput(v)))}
                />
              ) : (
                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      {loadingRecurring
                        ? "Carregando Gastos Fixos…"
                        : "Nada entra no cálculo até você selecionar."}
                    </Typography>
                    {activeRecurring.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          setSelectedExpenseIds(
                            selectedExpenseIds.length === activeRecurring.length
                              ? []
                              : activeRecurring.map((item) => item.id),
                          )
                        }
                      >
                        <Typography
                          variant="captionBold"
                          color={theme.colors.primaryStrong}
                        >
                          {selectedExpenseIds.length === activeRecurring.length
                            ? "Limpar"
                            : "Selecionar todos"}
                        </Typography>
                      </Pressable>
                    ) : null}
                  </View>
                  {activeRecurring.map((item) => {
                    const selected = selectedExpenseIds.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleExpense(item.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        style={{
                          minHeight: 48,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                          borderRadius: radii.md,
                          borderWidth: 1,
                          borderColor: selected ? theme.colors.primary : pal.border,
                          paddingHorizontal: spacing.md,
                          backgroundColor: selected
                            ? theme.colors.primaryBg
                            : pal.fieldBg,
                        }}
                      >
                        <AppIcon
                          name={selected ? "checkbox" : "square-outline"}
                          size={20}
                          color={
                            selected
                              ? theme.colors.primaryStrong
                              : theme.colors.textSecondary
                          }
                        />
                        <Typography variant="body" style={{ flex: 1 }} numberOfLines={1}>
                          {item.description}
                        </Typography>
                        <Typography variant="bodyBold">
                          {formatCurrency(item.amount)}
                        </Typography>
                      </Pressable>
                    );
                  })}
                  {activeRecurring.length === 0 && !loadingRecurring ? (
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Nenhum gasto recorrente ativo. Use o valor manual ou cadastre em
                      Gastos Fixos.
                    </Typography>
                  ) : null}
                </View>
              )}

              {allocationMode === "unit" ? (
                <SubField icon="cube-outline" label="Produção mensal estimada">
                  <Stepper
                    value={monthlyProduction}
                    onChange={setMonthlyProduction}
                    step={10}
                    min={0}
                    suffix="un"
                  />
                </SubField>
              ) : (
                <View style={{ gap: spacing.md }}>
                  <FieldLabel>Base de faturamento</FieldLabel>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
                  >
                    <ChoiceChip
                      label="Informar valor"
                      active={revenueSource === "manual"}
                      onPress={() => setRevenueSource("manual")}
                    />
                    {revenueHistory.averageRevenue > 0 ? (
                      <ChoiceChip
                        label={`Média de ${revenueHistory.periods.length} meses`}
                        active={revenueSource === "history"}
                        onPress={() => setRevenueSource("history")}
                      />
                    ) : null}
                    {(prolaboreStatus?.progress.requiredRevenue ?? 0) > 0 ? (
                      <ChoiceChip
                        label="Meta de pró-labore"
                        active={revenueSource === "goal"}
                        onPress={() => setRevenueSource("goal")}
                      />
                    ) : null}
                  </View>
                  {revenueSource === "manual" ? (
                    <MoneyField
                      value={manualRevenue}
                      onChangeText={(t) => setManualRevenue(maskCurrencyInput(t))}
                      placeholder="Faturamento mensal planejado"
                      onCalc={() => openCalc((v) => setManualRevenue(currencyInput(v)))}
                    />
                  ) : (
                    <ComputedCard
                      icon={
                        revenueSource === "history"
                          ? "analytics-outline"
                          : "trophy-outline"
                      }
                      label={
                        revenueSource === "history"
                          ? "Faturamento médio observado"
                          : "Faturamento necessário da meta"
                      }
                      value={formatCurrency(revenueBasis)}
                      sublabel={
                        revenueSource === "history"
                          ? revenueHistory.periods.join(" · ")
                          : "Origem: Meta de pró-labore"
                      }
                    />
                  )}
                  {revenueHistory.isError ? (
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Não foi possível carregar o histórico; o valor manual continua
                      disponível.
                    </Typography>
                  ) : null}
                </View>
              )}
            </View>
            <ComputedCard
              icon="pie-chart-outline"
              label={
                allocationMode === "revenue"
                  ? "Custos indiretos nesta unidade"
                  : "Custo fixo por unidade"
              }
              value={formatCurrency(fixedCostShare)}
              sublabel={costingSummary}
            />
            <DicaBox tone="blue">
              <Typography
                variant="caption"
                color={theme.colors.blue}
                style={{ fontFamily: fonts.bold }}
              >
                Dica:{" "}
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Nada é incluído automaticamente. Valores encontrados são apenas
                  referências até você selecionar a origem e o método.
                </Typography>
              </Typography>
            </DicaBox>
          </>
        )}

        {step === 5 && (
          <>
            <StepTitle
              title="Acréscimo de lucro"
              subtitle="Escolha quanto deseja acrescentar ao custo total e veja o preço final."
            />
            <View style={cardStyle(theme, pal)}>
              <FieldLabel>Selecione um acréscimo (%)</FieldLabel>
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
              label="Acréscimo selecionado"
              value={`${marginPercent}%`}
              sublabel={
                allocationMode === "revenue"
                  ? "O lucro é calculado sobre o custo direto; o custeio é reservado depois."
                  : `Preço base será ${marginPercent}% maior que o custo total.`
              }
            />

            <View style={{ gap: spacing.sm }}>
              <FieldLabel>Canal de venda</FieldLabel>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Escolha um canal por cálculo. Para taxas combinadas, crie um perfil
                próprio.
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                <ChoiceChip
                  label="Venda direta · 0%"
                  active={selectedChannelId === "direct"}
                  onPress={() => setSelectedChannelId("direct")}
                />
                {channelFees.map((item) => (
                  <ChoiceChip
                    key={item.id}
                    label={`${item.name} · ${String(item.percent).replace(".", ",")}%`}
                    active={selectedChannelId === item.id}
                    onPress={() => setSelectedChannelId(item.id)}
                  />
                ))}
              </View>
            </View>

            <View style={cardStyle(theme, pal)}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Typography variant="bodyBold">Perfis salvos</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Sincronizados entre Android e PWA.
                  </Typography>
                </View>
                <Pressable onPress={addChannel} accessibilityRole="button">
                  <Typography variant="captionBold" color={theme.colors.primaryStrong}>
                    + Adicionar
                  </Typography>
                </Pressable>
              </View>
              {channelFees.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <TextInput
                    value={item.name}
                    onChangeText={(name) => updateChannel(item.id, { name })}
                    placeholder="Nome do canal"
                    placeholderTextColor={pal.placeholder}
                    style={{
                      flex: 1.4,
                      minHeight: 48,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: pal.border,
                      backgroundColor: pal.fieldBg,
                      color: theme.colors.text,
                      paddingHorizontal: spacing.md,
                    }}
                  />
                  <View
                    style={{
                      flex: 0.8,
                      minHeight: 48,
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: pal.border,
                      backgroundColor: pal.fieldBg,
                      paddingHorizontal: spacing.md,
                    }}
                  >
                    <TextInput
                      value={String(item.percent).replace(".", ",")}
                      onChangeText={(text) =>
                        updateChannel(item.id, {
                          percent: Math.max(0, parseFloat(text.replace(",", ".")) || 0),
                        })
                      }
                      keyboardType="decimal-pad"
                      style={{ flex: 1, color: theme.colors.text }}
                    />
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      %
                    </Typography>
                  </View>
                  <Pressable
                    onPress={() => removeChannel(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir canal ${item.name}`}
                    hitSlop={8}
                  >
                    <AppIcon name="trash-outline" size={20} color={theme.colors.alert} />
                  </Pressable>
                </View>
              ))}
              <Button
                title="Salvar perfis de canal"
                variant="outline"
                loading={updatePricingPreferences.isPending}
                onPress={() => {
                  void saveChannelProfiles();
                }}
              />
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
                label="Acréscimo sobre o custo"
                value={`${marginPercent}% (${formatCurrency(profitPerUnit)})`}
                valueColor={theme.colors.success}
              />
              <SummaryRow
                icon="calculator-outline"
                iconColor={theme.colors.blue}
                label="Preço base (com acréscimo)"
                value={formatCurrency(suggestedPrice)}
              />
              {feesPercent > 0 ? (
                <SummaryRow
                  icon="card-outline"
                  iconColor={theme.colors.lavender}
                  label={
                    selectedChannel ? `Taxa · ${selectedChannel.name}` : "Taxa do canal"
                  }
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

        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            justifyContent: isDesktop ? "flex-end" : undefined,
          }}
        >
          {step !== 1 ? (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flex: isDesktop ? undefined : 1,
                width: isDesktop ? 180 : undefined,
                minHeight: 44,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: `${theme.colors.primary}66`,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppIcon name="chevron-back" size={20} color={theme.colors.primary} />
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Voltar
              </Typography>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleNext}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: isDesktop ? undefined : 1,
              width: isDesktop ? 180 : undefined,
              minHeight: 44,
              borderRadius: radii.md,
              backgroundColor: theme.colors.primaryInteractive,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {step === 5 ? (
              <AppIcon name="stats-chart" size={20} color={theme.colors.textOnPrimary} />
            ) : null}
            <Typography variant="bodyBold" color={theme.colors.textOnPrimary}>
              {step === 5 ? "Ver resultado" : "Próximo"}
            </Typography>
            {step !== 5 ? (
              <AppIcon
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
  icon: AppIconName;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <AppIcon name={icon} size={20} color={iconColor} />
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
