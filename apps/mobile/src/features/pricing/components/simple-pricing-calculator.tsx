import type { Packaging, Product } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Input,
  Typography,
  fonts,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "../../../shared/components/app-icon";
import { FieldLabel, TextFieldCard } from "../../../shared/components/form-field";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";
import { Skeleton } from "../../../shared/components/skeleton";
import { useAuth } from "../../../shared/hooks/use-auth";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { usePackagingList } from "../../packaging/hooks";
import { useAllProducts } from "../../products/hooks";
import * as priceCalc from "../calc";
import { useCalculatePricing } from "../hooks";

interface SimplePricingCalculatorProps {
  readonly onSave?: () => void;
  readonly onCreateProduct?: (salePrice: number) => void;
}

interface CostSourceItem {
  readonly id: string;
  readonly name: string;
  readonly cost: number;
  readonly costLabel: string;
}

function money(text: string): number {
  return parseCurrencyInput(text) || 0;
}

function percentage(text: string): number {
  return parseFloat(text.replace(",", ".")) || 0;
}

function percentageInput(text: string): string {
  const cleaned = text.replace(/[^\d,.]/g, "").replace(".", ",");
  const [integer = "", ...decimals] = cleaned.split(",");
  return decimals.length > 0 ? `${integer},${decimals.join("").slice(0, 2)}` : integer;
}

function wholeNumberInput(text: string): string {
  return text.replace(/\D/g, "").slice(0, 7);
}

function CostSourcePicker({
  visible,
  title,
  subtitle,
  items,
  emptyLabel,
  selectedId,
  loading,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  title: string;
  subtitle: string;
  items: CostSourceItem[];
  emptyLabel: string;
  selectedId: string | null;
  loading: boolean;
  onSelect: (item: CostSourceItem) => void;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return items;
    return items.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(query));
  }, [items, search]);

  return (
    <ResponsiveOverlayModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: isDesktop ? "center" : "flex-end",
          padding: isDesktop ? spacing.xl : 0,
        }}
      >
        <Pressable
          style={[
            {
              maxHeight: "82%",
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.lg + insets.bottom,
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              backgroundColor: theme.colors.surfaceElevated,
            },
            desktopModalSurface(isDesktop, 720),
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h2" numberOfLines={1}>
                {title}
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {subtitle}
              </Typography>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar seleção"
              hitSlop={10}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="close" size={24} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <Input
            placeholder="Buscar..."
            value={search}
            onChangeText={setSearch}
            icon={
              <AppIcon
                name="search-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
          />

          {loading ? (
            <View style={{ gap: spacing.sm }}>
              <Skeleton height={56} borderRadius={radii.lg} />
              <Skeleton height={56} borderRadius={radii.lg} />
              <Skeleton height={56} borderRadius={radii.lg} />
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {visibleItems.map((item) => {
                const selected = selectedId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={({ pressed }) => ({
                      minHeight: 58,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.primaryBg
                        : theme.colors.surface,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="bodyBold" numberOfLines={1}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        {item.costLabel}: {formatCurrency(item.cost)}
                      </Typography>
                    </View>
                    {selected ? (
                      <AppIcon
                        name="checkmark-circle"
                        size={22}
                        color={theme.colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}

              {visibleItems.length === 0 ? (
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ textAlign: "center", paddingVertical: spacing.xl }}
                >
                  {items.length === 0 ? emptyLabel : "Nenhum item encontrado."}
                </Typography>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </ResponsiveOverlayModal>
  );
}

function CostRow({
  label,
  value,
  color,
}: Readonly<{ label: string; value: number; color?: string }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}
    >
      <Typography variant="body" color={theme.colors.textSecondary}>
        {label}
      </Typography>
      <Typography variant="bodyBold" color={color}>
        {formatCurrency(value)}
      </Typography>
    </View>
  );
}

export function SimplePricingCalculator({
  onSave,
  onCreateProduct,
}: SimplePricingCalculatorProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const { data: allProducts = [], isLoading: loadingProducts } = useAllProducts();
  const { data: packagingData, isLoading: loadingPackaging } = usePackagingList();
  const calculatePricing = useCalculatePricing();
  const startedTracked = useRef(false);

  const products = allProducts.filter((product) => product.costPrice != null);
  const packaging = packagingData?.items ?? [];
  const productItems = useMemo(() => products.map(productCostSource), [products]);
  const packagingItems = useMemo(() => packaging.map(packagingCostSource), [packaging]);

  const [productId, setProductId] = useState<string | null>(null);
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState("");
  const [packagingInput, setPackagingInput] = useState("");
  const [laborMinutesInput, setLaborMinutesInput] = useState("");
  const [hourlyRateInput, setHourlyRateInput] = useState("");
  const [monthlyFixedInput, setMonthlyFixedInput] = useState("");
  const [monthlyProductionInput, setMonthlyProductionInput] = useState("");
  const [profitInput, setProfitInput] = useState("");
  const [feesInput, setFeesInput] = useState("");
  const [showOtherCosts, setShowOtherCosts] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [packagingPickerVisible, setPackagingPickerVisible] = useState(false);
  const [importedIngredients, setImportedIngredients] = useState(false);

  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const selectedPackaging = packaging.find((item) => item.id === packagingId) ?? null;
  const ingredientCost = money(ingredientInput);
  const packagingCost = money(packagingInput);
  const laborMinutes = Number(laborMinutesInput) || 0;
  const hourlyRate = money(hourlyRateInput);
  const laborCost = priceCalc.laborCost(laborMinutes, hourlyRate);
  const monthlyFixed = money(monthlyFixedInput);
  const monthlyProduction = Number(monthlyProductionInput) || 0;
  const fixedCostShare = priceCalc.fixedCostShare(monthlyFixed, monthlyProduction);
  const totalCost = priceCalc.totalCost(
    ingredientCost,
    packagingCost,
    laborCost,
    fixedCostShare,
  );
  const otherCostsAmount = laborCost + fixedCostShare;
  const desiredProfit = money(profitInput);
  const feesPercent = percentage(feesInput);
  const markupPercent = priceCalc.profitMarkupPercent(totalCost, desiredProfit);
  const priceBeforeFees = totalCost + desiredProfit;
  const { finalPrice, feesAmount } = priceCalc.finalPriceWithFees(
    priceBeforeFees,
    feesPercent,
  );
  const canCalculate = ingredientCost > 0 && desiredProfit > 0;

  const trackStarted = useCallback(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    void trackAnalyticsAction("pricing_started", useAuth.getState().token);
  }, []);

  const pricingPayload = useCallback(() => {
    if (ingredientCost <= 0) {
      alertValidation("Informe o custo dos insumos ou escolha um produto com receita.");
      return null;
    }
    if (desiredProfit <= 0) {
      alertValidation("Informe quanto você quer ganhar por unidade.");
      return null;
    }
    if (monthlyFixed > 0 && monthlyProduction <= 0) {
      alertValidation("Informe quantas unidades você produz por mês.");
      return null;
    }
    if (feesPercent > 95) {
      alertValidation("A taxa de venda pode ser de no máximo 95%.");
      return null;
    }
    if (markupPercent > 1000) {
      alertValidation("O lucro desejado pode ser de no máximo 10 vezes o custo.");
      return null;
    }

    return {
      productId: productId ?? undefined,
      ingredientCost,
      packagingCost,
      laborCost,
      fixedCostShare,
      marginPercent: markupPercent,
      feesPercent: feesPercent > 0 ? feesPercent : undefined,
    };
  }, [
    desiredProfit,
    feesPercent,
    fixedCostShare,
    ingredientCost,
    laborCost,
    markupPercent,
    monthlyFixed,
    monthlyProduction,
    packagingCost,
    productId,
  ]);

  const handleSave = useCallback(async () => {
    const payload = pricingPayload();
    if (!payload) return;
    try {
      await calculatePricing.mutateAsync(payload);
      onSave?.();
    } catch (error) {
      alertError(error);
    }
  }, [calculatePricing, onSave, pricingPayload]);

  const handleCreateProduct = useCallback(async () => {
    const payload = pricingPayload();
    if (!payload) return;

    onCreateProduct?.(finalPrice);
    try {
      await calculatePricing.mutateAsync(payload);
    } catch (error) {
      alertError(error);
    }
  }, [calculatePricing, finalPrice, onCreateProduct, pricingPayload]);

  function selectProduct(item: CostSourceItem) {
    const product = products.find((candidate) => candidate.id === item.id);
    if (!product) return;
    setProductId(product.id);
    setIngredientInput(currencyInput(product.costPrice ?? 0));
    setImportedIngredients(true);
    setProductPickerVisible(false);
    trackStarted();
  }

  function selectPackaging(item: CostSourceItem) {
    const selected = packaging.find((candidate) => candidate.id === item.id);
    if (!selected) return;
    setPackagingId(selected.id);
    setPackagingInput(currencyInput(selected.unitCost));
    setPackagingPickerVisible(false);
    trackStarted();
  }

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={{
          width: "100%",
          maxWidth: isDesktop ? 760 : undefined,
          alignSelf: "center",
          gap: spacing.xl,
          padding: spacing.xl,
          paddingBottom: spacing["5xl"] + insets.bottom,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <Typography variant="h1">Descubra quanto cobrar</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Comece pela receita e embalagem. O aplicativo faz as contas para você.
          </Typography>
        </View>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label="Produto ou receita (opcional)" />
          <SourceButton
            title={selectedProduct?.name ?? "Usar uma receita já cadastrada"}
            subtitle={
              selectedProduct
                ? `Insumos calculados: ${formatCurrency(selectedProduct.costPrice ?? 0)}`
                : "O custo dos insumos será preenchido automaticamente"
            }
            icon="basket-outline"
            selected={selectedProduct != null}
            onPress={() => setProductPickerVisible(true)}
          />
        </View>

        <Card style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.xs }}>
            <Typography variant="h2">Custos da unidade</Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Você informa os dados; as somas e divisões ficam por nossa conta.
            </Typography>
          </View>

          <View style={{ gap: spacing.sm }}>
            <FieldLabel label="Insumos da receita" required />
            <TextFieldCard
              icon="basket-outline"
              value={ingredientInput}
              onChangeText={(text) => {
                setIngredientInput(maskCurrencyInput(text));
                setImportedIngredients(false);
                trackStarted();
              }}
              keyboardType="numeric"
              placeholder="Ex: 12,50"
              inputStyle={{ fontFamily: fonts.bold, fontSize: 20 }}
            />
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {importedIngredients
                ? "Preenchido pelo custo da receita cadastrada."
                : "Sem receita cadastrada, informe apenas o valor dos ingredientes."}
            </Typography>
          </View>

          <View style={{ gap: spacing.sm }}>
            <FieldLabel label="Embalagem por unidade" />
            <SourceButton
              title={selectedPackaging?.name ?? "Usar embalagem cadastrada"}
              subtitle={
                selectedPackaging
                  ? `Custo aplicado: ${formatCurrency(selectedPackaging.unitCost)}`
                  : "Escolha uma embalagem para preencher o custo"
              }
              icon="cube-outline"
              selected={selectedPackaging != null}
              onPress={() => setPackagingPickerVisible(true)}
              compact
            />
            <TextFieldCard
              icon="cash-outline"
              value={packagingInput}
              onChangeText={(text) => {
                setPackagingInput(maskCurrencyInput(text));
                setPackagingId(null);
                trackStarted();
              }}
              keyboardType="numeric"
              placeholder="Ou informe o custo da embalagem"
            />
          </View>

          <Pressable
            onPress={() => setShowOtherCosts((current) => !current)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showOtherCosts }}
            style={({ pressed }) => ({
              minHeight: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
              paddingVertical: spacing.sm,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="bodyBold">Incluir outros custos</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {otherCostsAmount > 0
                  ? `${formatCurrency(otherCostsAmount)} por unidade já incluídos`
                  : "Seu trabalho e uma parte dos gastos mensais"}
              </Typography>
            </View>
            <AppIcon
              name={showOtherCosts ? "chevron-up" : "chevron-down"}
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>

          {showOtherCosts ? (
            <>
              <View style={{ gap: spacing.sm }}>
                <FieldLabel label="Seu trabalho (opcional)" />
                <View
                  style={{
                    flexDirection: isDesktop ? "row" : "column",
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Minutos por unidade
                    </Typography>
                    <TextFieldCard
                      icon="time-outline"
                      value={laborMinutesInput}
                      onChangeText={(text) => {
                        setLaborMinutesInput(wholeNumberInput(text));
                        trackStarted();
                      }}
                      keyboardType="number-pad"
                      placeholder="Ex: 30"
                    />
                  </View>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Quanto vale sua hora
                    </Typography>
                    <TextFieldCard
                      icon="cash-outline"
                      value={hourlyRateInput}
                      onChangeText={(text) => {
                        setHourlyRateInput(maskCurrencyInput(text));
                        trackStarted();
                      }}
                      keyboardType="numeric"
                      placeholder="Ex: 20,00"
                    />
                  </View>
                </View>
                <ComputedValue label="Mão de obra por unidade" value={laborCost} />
              </View>

              <View style={{ gap: spacing.sm }}>
                <FieldLabel label="Gastos fixos (opcional)" />
                <View
                  style={{
                    flexDirection: isDesktop ? "row" : "column",
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Total de gastos no mês
                    </Typography>
                    <TextFieldCard
                      icon="calendar-outline"
                      value={monthlyFixedInput}
                      onChangeText={(text) => {
                        setMonthlyFixedInput(maskCurrencyInput(text));
                        trackStarted();
                      }}
                      keyboardType="numeric"
                      placeholder="Ex: 300,00"
                    />
                  </View>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Typography variant="caption" color={theme.colors.textSecondary}>
                      Unidades produzidas no mês
                    </Typography>
                    <TextFieldCard
                      icon="cube-outline"
                      value={monthlyProductionInput}
                      onChangeText={(text) => {
                        setMonthlyProductionInput(wholeNumberInput(text));
                        trackStarted();
                      }}
                      keyboardType="number-pad"
                      placeholder="Ex: 100"
                    />
                  </View>
                </View>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  Nada é incluído automaticamente. Preencha os dois valores somente se
                  quiser fazer esse rateio.
                </Typography>
                <ComputedValue label="Gastos fixos por unidade" value={fixedCostShare} />
              </View>
            </>
          ) : null}

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              paddingTop: spacing.lg,
            }}
          >
            <CostRow label="Custo total calculado" value={totalCost} />
          </View>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label="Quanto você quer ganhar por unidade?" required />
          <TextFieldCard
            icon="trending-up"
            value={profitInput}
            onChangeText={(text) => {
              setProfitInput(maskCurrencyInput(text));
              trackStarted();
            }}
            keyboardType="numeric"
            placeholder="Ex: 8,00"
            inputStyle={{ fontFamily: fonts.bold, fontSize: 20 }}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Pressable
            onPress={() => setShowFees((current) => !current)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showFees }}
            style={({ pressed }) => ({
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="bodyBold">Tenho taxa de venda</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Cartão, aplicativo ou marketplace
              </Typography>
            </View>
            <AppIcon
              name={showFees ? "chevron-up" : "chevron-down"}
              size={22}
              color={theme.colors.primary}
            />
          </Pressable>

          {showFees ? (
            <View style={{ gap: spacing.sm }}>
              <FieldLabel label="Taxa total sobre a venda (%)" />
              <TextFieldCard
                icon="card-outline"
                value={feesInput}
                onChangeText={(text) => {
                  setFeesInput(percentageInput(text));
                  trackStarted();
                }}
                keyboardType="decimal-pad"
                placeholder="Ex: 12"
              />
              {feesPercent > 95 ? (
                <Typography variant="caption" color={theme.colors.alert}>
                  A taxa precisa ser de no máximo 95%.
                </Typography>
              ) : null}
            </View>
          ) : null}
        </View>

        <Card
          style={{
            gap: spacing.lg,
            backgroundColor: canCalculate ? theme.colors.successBg : theme.colors.surface,
          }}
        >
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Typography
              variant="caption"
              color={canCalculate ? theme.colors.success : theme.colors.textSecondary}
            >
              ESTIMATIVA DE PREÇO
            </Typography>
            <Typography
              variant="moneyHero"
              color={canCalculate ? theme.colors.success : theme.colors.textSecondary}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
            >
              {formatCurrency(canCalculate ? finalPrice : 0)}
            </Typography>
          </View>

          <View style={{ gap: spacing.sm }}>
            <CostRow label="Insumos" value={ingredientCost} />
            {packagingCost > 0 ? (
              <CostRow label="Embalagem" value={packagingCost} />
            ) : null}
            {laborCost > 0 ? <CostRow label="Seu trabalho" value={laborCost} /> : null}
            {fixedCostShare > 0 ? (
              <CostRow label="Gastos fixos" value={fixedCostShare} />
            ) : null}
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <CostRow label="Custo total" value={totalCost} />
            <CostRow
              label="Você ganha"
              value={desiredProfit}
              color={theme.colors.success}
            />
            {feesPercent > 0 && feesPercent <= 95 ? (
              <CostRow label={`Taxa (${feesPercent}%)`} value={feesAmount} />
            ) : null}
          </View>
          <Typography
            variant="caption"
            color={theme.colors.textSecondary}
            style={{ textAlign: "center" }}
          >
            Baseada somente nos valores informados acima. Confira os dados antes de usar
            este preço.
          </Typography>
        </Card>

        <View style={{ gap: spacing.md }}>
          {onCreateProduct && productId === null ? (
            <Button
              title="Salvar e criar produto"
              onPress={() => {
                void handleCreateProduct();
              }}
              disabled={!canCalculate || feesPercent > 95}
              size="lg"
            />
          ) : null}
          <Button
            title="Salvar cálculo"
            variant={onCreateProduct && productId === null ? "outline" : "primary"}
            onPress={() => {
              void handleSave();
            }}
            loading={calculatePricing.isPending}
            disabled={!canCalculate || feesPercent > 95}
            size="lg"
          />
        </View>
      </KeyboardAwareScrollView>

      <CostSourcePicker
        visible={productPickerVisible}
        title="Usar produto ou receita"
        subtitle="O custo dos insumos vem do cadastro escolhido."
        items={productItems}
        emptyLabel="Nenhum produto com custo de receita disponível."
        selectedId={productId}
        loading={loadingProducts}
        onSelect={selectProduct}
        onClose={() => setProductPickerVisible(false)}
      />

      <CostSourcePicker
        visible={packagingPickerVisible}
        title="Usar embalagem"
        subtitle="O custo por unidade vem do cadastro escolhido."
        items={packagingItems}
        emptyLabel="Nenhuma embalagem cadastrada."
        selectedId={packagingId}
        loading={loadingPackaging}
        onSelect={selectPackaging}
        onClose={() => setPackagingPickerVisible(false)}
      />
    </>
  );
}

function productCostSource(product: Product): CostSourceItem {
  return {
    id: product.id,
    name: product.name,
    cost: product.costPrice ?? 0,
    costLabel: product.recipeId ? "Insumos da receita" : "Custo cadastrado",
  };
}

function packagingCostSource(packaging: Packaging): CostSourceItem {
  return {
    id: packaging.id,
    name: packaging.name,
    cost: packaging.unitCost,
    costLabel: "Custo por unidade",
  };
}

function SourceButton({
  title,
  subtitle,
  icon,
  selected,
  compact = false,
  onPress,
}: Readonly<{
  title: string;
  subtitle: string;
  icon: "basket-outline" | "cube-outline";
  selected: boolean;
  compact?: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        minHeight: compact ? 52 : 56,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <AppIcon name={icon} size={22} color={theme.colors.primary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="bodyBold" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {subtitle}
        </Typography>
      </View>
      <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </Pressable>
  );
}

function ComputedValue({ label, value }: Readonly<{ label: string; value: number }>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        padding: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: theme.colors.successBg,
      }}
    >
      <Typography variant="caption" color={theme.colors.success}>
        {label}
      </Typography>
      <Typography variant="bodyBold" color={theme.colors.success}>
        {formatCurrency(value)}
      </Typography>
    </View>
  );
}
