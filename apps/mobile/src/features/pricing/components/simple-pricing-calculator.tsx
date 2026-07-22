import type { Product } from "@lucro-caseiro/contracts";
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
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { trackAnalyticsAction } from "../../analytics/tracker";
import { useAllProducts } from "../../products/hooks";
import * as priceCalc from "../calc";
import { useCalculatePricing } from "../hooks";

interface SimplePricingCalculatorProps {
  readonly onSave?: () => void;
  readonly onCreateProduct?: (salePrice: number) => void;
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

function ProductCostPicker({
  visible,
  products,
  selectedId,
  loading,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  products: Product[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (product: Product) => void;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [products, search]);

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
                Usar custo de um produto
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                O valor vem do custo cadastrado no produto.
              </Typography>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar seleção de produto"
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
            placeholder="Buscar produto..."
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
              {visibleProducts.map((product) => {
                const selected = selectedId === product.id;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => onSelect(product)}
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
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        Custo cadastrado: {formatCurrency(product.costPrice ?? 0)}
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

              {visibleProducts.length === 0 ? (
                <Typography
                  variant="body"
                  color={theme.colors.textSecondary}
                  style={{ textAlign: "center", paddingVertical: spacing.xl }}
                >
                  {products.length === 0
                    ? "Nenhum produto com custo de receita disponível."
                    : "Nenhum produto encontrado."}
                </Typography>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </ResponsiveOverlayModal>
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
  const products = allProducts.filter((product) => product.costPrice != null);
  const calculatePricing = useCalculatePricing();
  const startedTracked = useRef(false);

  const [productId, setProductId] = useState<string | null>(null);
  const [costInput, setCostInput] = useState("");
  const [profitInput, setProfitInput] = useState("");
  const [feesInput, setFeesInput] = useState("");
  const [showFees, setShowFees] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [importedCost, setImportedCost] = useState(false);

  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const totalCost = money(costInput);
  const desiredProfit = money(profitInput);
  const feesPercent = percentage(feesInput);
  const markupPercent = priceCalc.profitMarkupPercent(totalCost, desiredProfit);
  const priceBeforeFees = totalCost + desiredProfit;
  const { finalPrice, feesAmount } = priceCalc.finalPriceWithFees(
    priceBeforeFees,
    feesPercent,
  );
  const canCalculate = totalCost > 0 && desiredProfit > 0;

  const trackStarted = useCallback(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    void trackAnalyticsAction("pricing_started", useAuth.getState().token);
  }, []);

  const pricingPayload = useCallback(() => {
    if (totalCost <= 0) {
      alertValidation("Informe quanto custa produzir uma unidade.");
      return null;
    }
    if (desiredProfit <= 0) {
      alertValidation("Informe quanto você quer ganhar por unidade.");
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
      ingredientCost: totalCost,
      packagingCost: 0,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: markupPercent,
      feesPercent: feesPercent > 0 ? feesPercent : undefined,
    };
  }, [desiredProfit, feesPercent, markupPercent, productId, totalCost]);

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

  function selectProduct(product: Product) {
    setProductId(product.id);
    setCostInput(currencyInput(product.costPrice ?? 0));
    setImportedCost(true);
    setPickerVisible(false);
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
            Você informa o custo e quanto quer ganhar. O preço sai na hora.
          </Typography>
        </View>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label="Produto (opcional)" />
          <Pressable
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Usar custo de um produto"
            style={({ pressed }) => ({
              minHeight: 56,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: selectedProduct ? theme.colors.primary : theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <AppIcon name="basket-outline" size={22} color={theme.colors.primary} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="bodyBold" numberOfLines={1}>
                {selectedProduct?.name ?? "Usar custo já cadastrado"}
              </Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {selectedProduct
                  ? `Custo cadastrado: ${formatCurrency(selectedProduct.costPrice ?? 0)}`
                  : "Escolha um produto com custo definido"}
              </Typography>
            </View>
            <AppIcon
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label="Quanto custa produzir uma unidade?" required />
          <TextFieldCard
            icon="cash-outline"
            value={costInput}
            onChangeText={(text) => {
              setCostInput(maskCurrencyInput(text));
              setImportedCost(false);
              trackStarted();
            }}
            keyboardType="numeric"
            placeholder="Ex: 12,50"
            inputStyle={{ fontFamily: fonts.bold, fontSize: 20 }}
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {importedCost
              ? "Custo importado do produto. Ajuste se precisar incluir embalagem, trabalho ou outros gastos."
              : "Some insumos, embalagem, seu trabalho e outros gastos por unidade."}
          </Typography>
        </View>

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
              PREÇO RECOMENDADO
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="body" color={theme.colors.textSecondary}>
                Custo da unidade
              </Typography>
              <Typography variant="bodyBold">{formatCurrency(totalCost)}</Typography>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="body" color={theme.colors.textSecondary}>
                Você ganha
              </Typography>
              <Typography variant="bodyBold" color={theme.colors.success}>
                {formatCurrency(desiredProfit)}
              </Typography>
            </View>
            {feesPercent > 0 && feesPercent <= 95 ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: spacing.md,
                }}
              >
                <Typography variant="body" color={theme.colors.textSecondary}>
                  Taxa ({feesPercent}%)
                </Typography>
                <Typography variant="bodyBold">{formatCurrency(feesAmount)}</Typography>
              </View>
            ) : null}
          </View>
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

      <ProductCostPicker
        visible={pickerVisible}
        products={products}
        selectedId={productId}
        loading={loadingProducts}
        onSelect={selectProduct}
        onClose={() => setPickerVisible(false)}
      />
    </>
  );
}
