import type { Packaging, Product } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Input,
  Typography,
  fonts,
  fontSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import pricingCostsIcon from "../../../assets/pricing-costs-icon.png";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { useBrandIllustration } from "../../../shared/brand-illustrations";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { FieldLabel, TextFieldCard } from "../../../shared/components/form-field";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";
import { Skeleton } from "../../../shared/components/skeleton";
import { useAuth } from "../../../shared/hooks/use-auth";
import {
  desktopCompactField,
  desktopModalSurface,
  desktopSplitLayout,
  pageGutter,
} from "../../../shared/layout/desktop-density";
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
import { useBusinessCopy } from "../../subscription/business-copy";
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, minHeight: 0 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: theme.colors.overlay,
            justifyContent: isDesktop ? "center" : "flex-end",
            padding: isDesktop ? spacing.xl : 0,
          }}
        >
          <Pressable
            style={[
              {
                maxHeight: "82%",
                minHeight: 0,
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
                <Typography variant="h3" numberOfLines={1}>
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
                style={{ flexShrink: 1 }}
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
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.border,
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
      </KeyboardAvoidingView>
    </ResponsiveOverlayModal>
  );
}

function CostRow({
  label,
  value,
  color,
  iconSource,
}: Readonly<{
  label: string;
  value: number;
  color?: string;
  iconSource?: ImageSourcePropType;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.sm }}>
        {iconSource ? (
          <Image
            source={iconSource}
            resizeMode="contain"
            style={{ height: 23, width: 25 }}
            accessible={false}
          />
        ) : null}
        <Typography variant="body" color={theme.colors.textSecondary}>
          {label}
        </Typography>
      </View>
      <Typography variant="bodyBold" color={color}>
        {formatCurrency(value)}
      </Typography>
    </View>
  );
}

const ESTIMATE_LIME = "#DCE86A";
const ESTIMATE_LIME_SOFT = "#F1F4C3";
const ESTIMATE_INK = "#24181E";
const ESTIMATE_BURNT_PINK = "#B65F72";
const ESTIMATE_SOFT_PINK = "#F5E5E8";
const ESTIMATE_POSITIVE = "#2F855A";

function PricingResultRow({
  highlight = false,
  icon,
  info = false,
  label,
  onDark = false,
  value,
  valueColor,
}: Readonly<{
  highlight?: boolean;
  icon: AppIconName;
  info?: boolean;
  label: string;
  onDark?: boolean;
  value: number;
  valueColor?: string;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const mutedOnDark = "rgba(255,255,255,0.78)";
  const rowBorder = onDark ? "rgba(255,255,255,0.14)" : theme.colors.border;
  let iconColor = theme.colors.primaryStrong;
  if (onDark) iconColor = pal.rose;
  let labelColor = theme.colors.textSecondary;
  if (highlight) labelColor = ESTIMATE_INK;
  else if (onDark) labelColor = mutedOnDark;

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: highlight ? ESTIMATE_LIME_SOFT : "transparent",
        borderColor: highlight ? ESTIMATE_LIME : rowBorder,
        borderBottomColor: highlight ? ESTIMATE_LIME : rowBorder,
        borderBottomWidth: 1,
        borderRadius: highlight ? radii.md : 0,
        borderWidth: highlight ? 1 : 0,
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        marginBottom: highlight ? spacing.md : 0,
        marginHorizontal: highlight ? spacing.md : 0,
        marginTop: highlight ? spacing.sm : 0,
        minHeight: 44,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        style={{
          alignItems: "center",
          flex: 1,
          flexDirection: "row",
          gap: spacing.sm,
          minWidth: 0,
        }}
      >
        {highlight ? (
          <View
            style={{
              alignItems: "center",
              backgroundColor: ESTIMATE_SOFT_PINK,
              borderRadius: radii.full,
              height: 24,
              justifyContent: "center",
              width: 24,
            }}
          >
            <AppIcon name={icon} size={16} color={ESTIMATE_BURNT_PINK} />
          </View>
        ) : (
          <AppIcon name={icon} size={16} color={iconColor} />
        )}
        <Typography
          variant={highlight ? "captionBold" : "caption"}
          color={labelColor}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {label}
        </Typography>
        {info ? (
          <AppIcon
            name="information-circle-outline"
            size={14}
            color={onDark ? mutedOnDark : theme.colors.textSecondary}
          />
        ) : null}
      </View>
      {highlight ? (
        <Text
          style={{
            color: ESTIMATE_POSITIVE,
            fontFamily: fonts.extraBold,
            fontSize: fontSizes.xs,
            lineHeight: 18,
          }}
        >
          {formatCurrency(value)}
        </Text>
      ) : (
        <Typography
          variant="captionBold"
          color={valueColor ?? (onDark ? pal.onWine : undefined)}
        >
          {formatCurrency(value)}
        </Typography>
      )}
    </View>
  );
}

function PricingFieldLabel({
  action,
  info = false,
  label,
  required = false,
}: Readonly<{
  action?: React.ReactNode;
  info?: boolean;
  label: string;
  required?: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: spacing.sm,
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          alignItems: "center",
          flex: 1,
          flexDirection: "row",
          gap: spacing.xs,
          minWidth: 0,
        }}
      >
        <Typography variant="captionBold" numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Typography>
        {info ? (
          <AppIcon
            name="information-circle-outline"
            size={14}
            color={theme.colors.textSecondary}
          />
        ) : null}
        {required ? (
          <Typography variant="captionBold" color={theme.colors.primary}>
            *
          </Typography>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function SimplePricingCalculator({
  onSave,
  onCreateProduct,
}: SimplePricingCalculatorProps) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const pricingCostsHero = useBrandIllustration("pricingCostsHero");
  const pricingResultHero = useBrandIllustration("pricingResultHero");
  const experienceCopy = useBusinessCopy();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const { data: allProducts = [], isLoading: loadingProducts } = useAllProducts();
  const { data: packagingData, isLoading: loadingPackaging } = usePackagingList();
  const calculatePricing = useCalculatePricing();
  const startedTracked = useRef(false);

  const products = allProducts.filter(
    (product) => product.recipeId != null && product.costPrice != null,
  );
  const packaging = packagingData?.items ?? [];
  const productItems = useMemo(() => products.map(productCostSource), [products]);
  const packagingItems = useMemo(() => packaging.map(packagingCostSource), [packaging]);

  const [productId, setProductId] = useState<string | null>(null);
  const [packagingId, setPackagingId] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState("");
  const [packagingInput, setPackagingInput] = useState("");
  const [profitInput, setProfitInput] = useState("");
  const [feesInput, setFeesInput] = useState("");
  const [showFees, setShowFees] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [packagingPickerVisible, setPackagingPickerVisible] = useState(false);
  const [importedIngredients, setImportedIngredients] = useState(false);

  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const selectedPackaging = packaging.find((item) => item.id === packagingId) ?? null;
  const ingredientCost = money(ingredientInput);
  const packagingCost = money(packagingInput);
  const totalCost = priceCalc.totalCost(ingredientCost, packagingCost, 0, 0);
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
      alertValidation(
        `Informe o custo de ${experienceCopy.materialNounPlural} ou escolha um ${experienceCopy.productNoun} com ${experienceCopy.formulaNoun}.`,
      );
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
      ingredientCost,
      packagingCost,
      laborCost: 0,
      fixedCostShare: 0,
      marginPercent: markupPercent,
      feesPercent: feesPercent > 0 ? feesPercent : undefined,
    };
  }, [
    desiredProfit,
    feesPercent,
    ingredientCost,
    markupPercent,
    packagingCost,
    productId,
    experienceCopy,
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

  const split = desktopSplitLayout(isDesktop);
  const compactField = desktopCompactField(isDesktop);
  const formattedFinalPrice = formatCurrency(canCalculate ? finalPrice : 0);
  const estimatePriceVariant = formattedFinalPrice.length > 9 ? "moneyLg" : "moneyHero";

  const estimatePanel = (
    <View style={{ gap: spacing.md, width: "100%" }}>
      <View
        style={{
          backgroundColor: pal.wineFill,
          borderRadius: radii["2xl"],
          overflow: "hidden",
        }}
      >
        <View
          style={{
            justifyContent: "center",
            minHeight: 132,
            overflow: "hidden",
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing.md,
          }}
        >
          <View style={{ gap: spacing.sm, zIndex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
                <Typography variant="label" color={pal.onWine}>
                  ESTIMATIVA DE PREÇO
                </Typography>
                <Typography
                  variant={estimatePriceVariant}
                  color={pal.onWine}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {formattedFinalPrice}
                </Typography>
              </View>
              <Image
                source={pricingResultHero}
                resizeMode="contain"
                style={{
                  width: 120,
                  height: 96,
                  marginRight: -spacing.sm,
                  marginBottom: -spacing.sm,
                }}
                accessible={false}
              />
            </View>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: ESTIMATE_LIME,
                borderRadius: radii.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: ESTIMATE_INK,
                  fontFamily: fonts.bold,
                  fontSize: fontSizes.xs,
                }}
              >
                Atualiza automaticamente
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingTop: spacing.xs }}>
          <PricingResultRow
            icon="cube-outline"
            label="Materiais"
            onDark
            value={totalCost}
          />
          {feesPercent > 0 && feesPercent <= 95 ? (
            <PricingResultRow
              icon="percent-outline"
              info
              label={`Taxas de venda (${String(feesPercent).replace(".", ",")}%)`}
              onDark
              value={feesAmount}
            />
          ) : null}
          <PricingResultRow
            icon="trending-up"
            label="Lucro desejado"
            onDark
            value={desiredProfit}
          />
          <PricingResultRow
            highlight
            icon="star"
            label="Você ganha por unidade"
            onDark
            value={desiredProfit}
          />
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: pal.white,
          borderColor: pal.border,
          borderRadius: radii.md,
          borderWidth: 1,
          flexDirection: "row",
          gap: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        }}
      >
        <AppIcon
          name="shield-checkmark-outline"
          size={20}
          color={theme.colors.primaryStrong}
        />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ flex: 1 }}
        >
          Baseada somente nos custos informados. Mão de obra e gastos mensais não estão
          incluídos. Confira os dados antes de usar este preço.
        </Typography>
      </View>
    </View>
  );

  return (
    <>
      <KeyboardAwareScrollView
        extraScrollHeight={spacing["4xl"]}
        contentContainerStyle={[
          {
            width: "100%",
            gap: spacing.xl,
            paddingTop: spacing.xl,
            paddingBottom: spacing["5xl"] + insets.bottom,
            ...pageGutter(isDesktop),
          },
          split.outer,
        ]}
      >
        <View style={isDesktop ? split.row : { width: "100%", gap: spacing.xl }}>
          <View style={isDesktop ? split.main : { width: "100%", gap: spacing.xl }}>
            <Card
              variant="elevated"
              shadow="sm"
              padding="lg"
              style={{ gap: spacing.lg, paddingHorizontal: spacing["2xl"] }}
            >
              <View
                style={{
                  alignItems: "flex-start",
                  flexDirection: "row",
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                  <Typography variant="h3">Custos da unidade</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Informe os dados abaixo; as somas e divisões ficam por nossa conta.
                  </Typography>
                </View>
                <Image
                  source={pricingCostsHero}
                  resizeMode="contain"
                  style={{ height: 96, marginRight: -spacing.xs, width: 108 }}
                  accessible={false}
                />
              </View>

              <View style={{ gap: spacing.sm }}>
                <PricingFieldLabel
                  label="Materiais da ficha técnica"
                  info
                  required
                  action={
                    products.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          selectedProduct
                            ? "Trocar ficha técnica"
                            : "Importar ficha técnica"
                        }
                        hitSlop={6}
                        onPress={() => setProductPickerVisible(true)}
                        style={({ pressed }) => ({
                          alignItems: "center",
                          flexDirection: "row",
                          gap: spacing.xs,
                          minHeight: 32,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <AppIcon
                          name="download-outline"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Typography
                          variant="captionBold"
                          color={theme.colors.primaryStrong}
                          numberOfLines={1}
                        >
                          {selectedProduct
                            ? "Trocar ficha técnica"
                            : "Importar ficha técnica"}
                        </Typography>
                      </Pressable>
                    ) : undefined
                  }
                />
                <View style={compactField}>
                  <TextFieldCard
                    icon="basket-outline"
                    iconSurface
                    prefix="R$"
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
                </View>
                <Typography variant="caption" color={theme.colors.textSecondary}>
                  {importedIngredients && selectedProduct
                    ? `Custo importado de ${selectedProduct.name}.`
                    : "Sem ficha técnica cadastrada, informe o valor de materiais."}
                </Typography>
              </View>

              <View style={{ gap: spacing.sm }}>
                <PricingFieldLabel label="Embalagem ou acabamento por unidade" info />
                <SourceButton
                  title={selectedPackaging?.name ?? "Selecionar no cadastro"}
                  subtitle={
                    selectedPackaging
                      ? `Custo aplicado: ${formatCurrency(selectedPackaging.unitCost)}`
                      : "Escolha embalagem ou acabamento para preencher o custo"
                  }
                  icon="cube-outline"
                  selected={selectedPackaging != null}
                  onPress={() => setPackagingPickerVisible(true)}
                />
                <View style={compactField}>
                  <TextFieldCard
                    icon="cash-outline"
                    iconSurface
                    prefix="R$"
                    value={packagingInput}
                    onChangeText={(text) => {
                      setPackagingInput(maskCurrencyInput(text));
                      setPackagingId(null);
                      trackStarted();
                    }}
                    keyboardType="numeric"
                    placeholder="Ou informe o custo de embalagem ou acabamento"
                  />
                </View>
              </View>

              <View
                style={{
                  borderStyle: "dashed",
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                  paddingTop: spacing.lg,
                }}
              >
                <CostRow
                  iconSource={pricingCostsIcon}
                  label="Custos informados"
                  value={totalCost}
                />
              </View>
            </Card>

            <View style={{ gap: spacing.sm }}>
              <PricingFieldLabel label="Quanto você quer ganhar por unidade?" required />
              <View style={compactField}>
                <TextFieldCard
                  icon="trending-up"
                  iconSurface
                  prefix="R$"
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
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Valor do seu lucro desejado por unidade.
              </Typography>
            </View>

            <View style={{ gap: spacing.sm }}>
              <Pressable
                onPress={() => setShowFees((current) => !current)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showFees }}
                style={({ pressed }) => ({
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderColor: theme.colors.border,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  backgroundColor: theme.colors.surface,
                  overflow: "hidden",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{
                    alignItems: "center",
                    alignSelf: "stretch",
                    backgroundColor: theme.colors.primaryBg,
                    justifyContent: "center",
                    width: 44,
                  }}
                >
                  <AppIcon
                    name="percent-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
                  <Typography variant="bodyBold">Tenho taxa de venda</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    Cartão, aplicativo ou marketplace
                  </Typography>
                </View>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                  }}
                >
                  <AppIcon
                    name={showFees ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Pressable>

              {showFees ? (
                <View style={{ gap: spacing.sm }}>
                  <FieldLabel label="Taxa total sobre a venda (%)" />
                  <View style={compactField}>
                    <TextFieldCard
                      icon="card-outline"
                      iconSurface
                      value={feesInput}
                      onChangeText={(text) => {
                        setFeesInput(percentageInput(text));
                        trackStarted();
                      }}
                      keyboardType="decimal-pad"
                      placeholder="Ex: 12"
                    />
                  </View>
                  {feesPercent > 95 ? (
                    <Typography variant="caption" color={theme.colors.alert}>
                      A taxa precisa ser de no máximo 95%.
                    </Typography>
                  ) : null}
                </View>
              ) : null}
            </View>

            {!isDesktop ? estimatePanel : null}

            <View
              style={{
                gap: isDesktop ? spacing.md : spacing.sm,
                flexDirection: isDesktop ? "row" : "column",
                alignItems: isDesktop ? "center" : "stretch",
                justifyContent: isDesktop ? "flex-start" : undefined,
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              {onCreateProduct && productId === null ? (
                <Button
                  title={`Salvar e criar ${experienceCopy.productNoun}`}
                  onPress={() => {
                    void handleCreateProduct();
                  }}
                  disabled={!canCalculate || feesPercent > 95}
                  size="lg"
                  style={
                    isDesktop
                      ? { minHeight: 48, minWidth: 220, paddingHorizontal: spacing.xl }
                      : { minHeight: 52, width: "100%" }
                  }
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
                style={
                  isDesktop
                    ? { minHeight: 48, minWidth: 180, paddingHorizontal: spacing.xl }
                    : { minHeight: 52, width: "100%" }
                }
              />
            </View>
          </View>

          {isDesktop ? <View style={split.aside}>{estimatePanel}</View> : null}
        </View>
      </KeyboardAwareScrollView>

      <CostSourcePicker
        visible={productPickerVisible}
        title={`Usar ${experienceCopy.productNoun} ou ${experienceCopy.formulaNoun}`}
        subtitle={`O custo de ${experienceCopy.materialNounPlural} vem do cadastro escolhido.`}
        items={productItems}
        emptyLabel={`Nenhum ${experienceCopy.productNoun} com custo calculado disponível.`}
        selectedId={productId}
        loading={loadingProducts}
        onSelect={selectProduct}
        onClose={() => setProductPickerVisible(false)}
      />

      <CostSourcePicker
        visible={packagingPickerVisible}
        title={`Usar ${experienceCopy.packagingNoun}`}
        subtitle="O custo por unidade vem do cadastro escolhido."
        items={packagingItems}
        emptyLabel="Nenhum custo adicional cadastrado."
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
    costLabel: product.recipeId ? "Custo calculado" : "Custo cadastrado",
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
  onPress,
}: Readonly<{
  title: string;
  subtitle: string;
  icon: "basket-outline" | "cube-outline";
  selected: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: theme.colors.surface,
        overflow: "hidden",
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View
        style={{
          alignItems: "center",
          alignSelf: "stretch",
          backgroundColor: theme.colors.primaryBg,
          justifyContent: "center",
          width: 44,
        }}
      >
        <AppIcon name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingHorizontal: spacing.md }}>
        <Typography variant="bodyBold" numberOfLines={1}>
          {title}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {subtitle}
        </Typography>
      </View>
      <View style={{ alignItems: "center", justifyContent: "center", width: 42 }}>
        <AppIcon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
  );
}
