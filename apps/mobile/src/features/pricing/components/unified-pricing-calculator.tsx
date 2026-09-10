import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import React, { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import { hasActiveFeature, type Pricing } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/hooks/use-auth";
import { useProfile } from "../../subscription/hooks";
import { useUpdateProduct } from "../../products/hooks";
import { useCalculatePricing } from "../hooks";
import { usePricingSources } from "../use-pricing-sources";
import {
  draftCalculation,
  firstInvalidPricingStep,
  pricingStepError,
  type PricingStep,
  draftForProduct,
  moneyValue,
  usePricingDraft,
} from "../use-pricing-draft";
import { currentProductCost, evaluateSalePrice, pricingReviews } from "../calc";
import { currencyInput } from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { desktopSplitLayout } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  PricingChoice,
  PricingField,
  PricingPicker,
  PricingSection,
} from "./pricing-fields";
import { PricingFees, PricingLabor, PricingOverhead } from "./pricing-cost-details";
import { PricingSummary } from "./pricing-summary";
import { PricingStepLayout } from "./pricing-step-layout";
import { displayProductName } from "../../products/display";
import { useBrandIllustration } from "../../../shared/brand-illustrations";
import { AppIcon } from "../../../shared/components/app-icon";

export function UnifiedPricingCalculator({
  step,
  onStepChange,
  onBusyChange,
  initialIngredientCost,
  initialProductId,
  initialProduct,
  onSave,
  onCreateProduct,
}: Readonly<{
  step: PricingStep;
  onStepChange: (step: PricingStep) => void;
  onBusyChange: (busy: boolean) => void;
  initialProduct?: { name?: string; category?: string };
  initialIngredientCost?: number;
  initialProductId?: string;
  onSave?: () => void;
  onCreateProduct: (
    salePrice: number,
    costPrice: number,
    product?: { name?: string; category?: string },
  ) => void;
}>) {
  const { theme } = useTheme();
  const desktop = useDesktopLayout();
  const pricingIllustration = useBrandIllustration("pricingCostsHero");
  const split = desktopSplitLayout(desktop);
  const sources = usePricingSources();
  const { data: profile } = useProfile();
  const professional =
    !!profile && hasActiveFeature(profile.plan, profile.planExpiresAt, "advancedPricing");
  const userId = useAuth((state) => state.userId);
  const { draft, update, reset, hasSession } = usePricingDraft(
    initialIngredientCost,
    JSON.stringify([
      userId,
      initialIngredientCost,
      initialProductId,
      initialProduct?.name,
      initialProduct?.category,
    ]),
  );
  const save = useCalculatePricing(true);
  const apply = useUpdateProduct();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const applying = useRef(false);
  const initialLoaded = useRef(false);
  const {
    products = [],
    recipes = [],
    packaging = [],
    calculations = [],
  } = sources.data ?? {};
  const product = products.find((item) => item.id === draft.productId);
  const reviews = pricingReviews(calculations, products, recipes, packaging);
  let importedCost = product ? currentProductCost(product, products, recipes) : null;
  if (draft.source === "recipe")
    importedCost =
      recipes.find((item) => item.id === draft.recipeId)?.costPerUnit ?? null;
  const costChanged =
    draft.source !== "manual" &&
    importedCost != null &&
    Math.abs(importedCost - moneyValue(draft.ingredient)) >= 0.005;
  const currentPackaging = packaging
    .filter((item) => draft.packagingIds.includes(item.id))
    .reduce((sum, item) => sum + item.unitCost, 0);
  const packagingChanged =
    draft.packagingIds.length > 0 &&
    Math.abs(currentPackaging - moneyValue(draft.packaging)) >= 0.005;
  let sourceError: string | undefined;
  if (costChanged || packagingChanged)
    sourceError =
      "Os custos cadastrados mudaram. Atualize os valores abaixo para continuar.";
  if (draft.source !== "manual" && importedCost == null)
    sourceError =
      "A origem do custo não está disponível. Escolha um cadastro ou informe o custo manualmente.";
  let ingredientHint =
    "Informe o custo usado para produzir uma unidade, não o lote inteiro.";
  if (draft.source === "recipe")
    ingredientHint =
      "Preenchido pela receita atual. Você pode editar se precisar ajustar este cálculo.";
  if (draft.source === "product")
    ingredientHint =
      "Preenchido pelo cadastro do produto. Você pode editar se precisar ajustar este cálculo.";
  let productSelectionDetail = `Custo carregado: ${formatCurrency(importedCost ?? 0)} por unidade`;
  if (draft.source === "manual")
    productSelectionDetail = "Os custos abaixo foram ajustados manualmente.";
  else if (importedCost == null)
    productSelectionDetail = "O cadastro não possui um custo disponível.";
  const productPickerItems = products.map((item) => {
    const cost = currentProductCost(item, products, recipes);
    const origin = item.recipeId ? "Receita atual" : "Custo cadastrado";
    return {
      id: item.id,
      label: displayProductName(item.name),
      detail:
        cost == null
          ? "Custo não disponível · preencha manualmente"
          : `${origin}: ${formatCurrency(cost)}`,
    };
  });
  const calculation = sourceError
    ? { error: sourceError, input: undefined }
    : draftCalculation(draft, packaging);

  function selectProduct(id: string, saved?: Pricing) {
    const selected = products.find((item) => item.id === id);
    if (!selected) return;
    const next = draftForProduct(selected, products, recipes, packaging, saved);
    if (!professional && next.allocation === "revenue") {
      next.allocation = "unit";
      showAlert({
        title: "Confira as despesas",
        message:
          "Este cálculo usava rateio por faturamento. Informe a produção mensal para continuar com o rateio por unidades.",
      });
    }
    update(next);
  }
  useEffect(() => {
    if (
      !initialLoaded.current &&
      !hasSession &&
      initialProductId &&
      sources.data &&
      profile
    ) {
      initialLoaded.current = true;
      const selected = sources.data.products.find((item) => item.id === initialProductId);
      if (selected)
        update(
          draftForProduct(
            selected,
            sources.data.products,
            sources.data.recipes,
            sources.data.packaging,
          ),
        );
    }
  }, [initialProductId, sources.data, profile, update, hasSession]);

  const formValidation = useFormValidation({
    ingredient:
      step === 1 &&
      (!Number.isFinite(moneyValue(draft.ingredient)) ||
        moneyValue(draft.ingredient) <= 0) &&
      "Informe o custo por unidade.",
    overhead:
      step === 2 &&
      moneyValue(draft.fixed) > 0 &&
      draft.allocation === "unit" &&
      (!Number.isFinite(Number(draft.production.replace(",", "."))) ||
        Number(draft.production.replace(",", ".")) <= 0) &&
      "Informe a produção mensal para dividir as despesas.",
    profit:
      step === 3 &&
      !draft.profit.trim() &&
      "Informe o ganho desejado. Use zero para simular sem ganho.",
  });

  function changeStep(next: PricingStep) {
    if (blocked) return;
    setAttempted(false);
    formValidation.reset();
    onStepChange(next);
  }
  function validateAll() {
    const invalid = firstInvalidPricingStep(draft, packaging, sourceError);
    if (invalid) {
      if (invalid !== step) onStepChange(invalid);
      setAttempted(true);
      if (invalid === step) formValidation.validate();
      return false;
    }
    return formValidation.validate();
  }
  async function saveSuggested() {
    if (!validateAll()) return;
    if (!calculation.input || busy) return;
    try {
      await save.mutateAsync(calculation.input);
      onSave?.();
    } catch (error) {
      alertError(error);
    }
  }
  async function createProduct(price: number) {
    if (!validateAll()) return;
    if (!calculation.input || busy) return;
    try {
      await save.mutateAsync(calculation.input);
      onCreateProduct(price, calculation.input.ingredientCost, initialProduct);
    } catch (error) {
      alertError(error);
    }
  }
  function confirmApply(price: number) {
    if (!validateAll()) return;
    if (!product || !calculation.input || busy) return;
    const target = product;
    const input = calculation.input;
    const gain = evaluateSalePrice(input, price).profit;
    showAlert({
      title: "Aplicar novo preço?",
      message: `${target.name}\nPreço atual: ${formatCurrency(target.salePrice)}\nNovo preço: ${formatCurrency(price)}\n${gain < 0 ? "Prejuízo" : "Ganho"} estimado: ${formatCurrency(gain)} por unidade.`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aplicar preço",
          onPress: () => {
            if (applying.current) return;
            applying.current = true;
            setBusy(true);
            void (async () => {
              let saved = false;
              try {
                await save.mutateAsync(input);
                saved = true;
                await apply.mutateAsync({ id: target.id, data: { salePrice: price } });
                await queryClient.invalidateQueries({ queryKey: ["pricing-sources"] });
                showAlert({
                  title: "Preço atualizado",
                  message: `${target.name} agora tem preço base de ${formatCurrency(price)}.`,
                });
              } catch (error) {
                if (saved)
                  showAlert({
                    title: "O preço não foi atualizado",
                    message:
                      "O cálculo foi salvo no histórico, mas não foi possível alterar o produto. Tente aplicar novamente.",
                  });
                else alertError(error);
              } finally {
                applying.current = false;
                setBusy(false);
              }
            })();
          },
        },
      ],
    });
  }
  const blocked = busy || save.isPending || apply.isPending;
  useEffect(() => onBusyChange(blocked), [blocked, onBusyChange]);
  const result = calculation.input ? (
    <PricingSummary
      key={draft.productId}
      input={calculation.input}
      draft={draft}
      product={product}
      saving={blocked}
      onCreate={(price) => void createProduct(price)}
      onApply={confirmApply}
      onAlternativeChange={(alternative) => update({ alternative })}
    />
  ) : (
    <Card style={{ gap: spacing.sm }}>
      <Typography variant="h3">Seu preço começa pelos custos</Typography>
      <Typography variant="body" color={theme.colors.textSecondary}>
        {calculation.error}
      </Typography>
      <Button
        title="Conferir campos"
        variant="secondary"
        onPress={() => {
          validateAll();
        }}
      />
    </Card>
  );

  const currentStepError = pricingStepError(step, draft, packaging, sourceError);
  const notice =
    attempted && currentStepError ? (
      <View accessibilityRole="alert" style={{ gap: spacing.xs }}>
        <Typography variant="body" color={theme.colors.alert}>
          {currentStepError}
        </Typography>
      </View>
    ) : null;

  return (
    <PricingStepLayout
      step={step}
      onStepChange={changeStep}
      saving={blocked}
      onNext={() => {
        if (step === 3) {
          void saveSuggested();
          return;
        }
        setAttempted(true);
        formValidation.validate();
        if (!currentStepError) changeStep((step + 1) as PricingStep);
      }}
    >
      {[
        <React.Fragment key="costs">
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Typography variant="h3" style={{ flex: 1, minWidth: 0 }}>
                Produto e custos
              </Typography>
              <Image
                source={pricingIllustration}
                resizeMode="contain"
                accessible={false}
                style={{ width: desktop ? 104 : 88, height: desktop ? 96 : 80 }}
              />
            </View>
            <Typography variant="body" color={theme.colors.textSecondary}>
              Escolha um produto ou informe o custo de uma unidade e sua embalagem.
            </Typography>
          </View>
          {step === 1 ? notice : null}
          <Card style={{ gap: spacing.xl }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="bodyBold">Produto</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Selecione um cadastro para preencher os custos automaticamente.
              </Typography>
            </View>
            <PricingPicker
              title={product ? "Escolher outro produto" : "Produtos cadastrados"}
              action={product ? "Trocar produto" : "Selecionar produto cadastrado"}
              selectedLabel={product ? displayProductName(product.name) : undefined}
              items={productPickerItems}
              onSelect={(id) => selectProduct(id)}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon
                name={product ? "checkmark-circle" : "create-outline"}
                size={18}
                color={theme.colors.textSecondary}
              />
              <Typography
                variant="caption"
                color={theme.colors.textSecondary}
                style={{ flex: 1 }}
              >
                {product
                  ? productSelectionDetail
                  : "Ou preencha os valores abaixo para fazer um cálculo sem cadastro."}
              </Typography>
            </View>
            {product ? (
              <Button
                title="Calcular sem produto"
                variant="ghost"
                size="sm"
                compact
                style={{ alignSelf: "flex-start" }}
                onPress={reset}
              />
            ) : null}
            <View style={{ gap: spacing.xs }}>
              <Typography variant="bodyBold">Custos de uma unidade</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Revise os valores que entram no preço de cada unidade vendida.
              </Typography>
            </View>
            <ValidationField {...formValidation.field("ingredient")}>
              <PricingField
                label="Ingredientes ou material"
                value={draft.ingredient}
                onChange={(ingredient) =>
                  update({ ingredient, source: "manual", recipeId: undefined })
                }
                hint={ingredientHint}
              />
            </ValidationField>
            {costChanged && importedCost != null ? (
              <Button
                title={`Custo mudou. Usar ${formatCurrency(importedCost)}`}
                variant="secondary"
                onPress={() => update({ ingredient: currencyInput(importedCost) })}
              />
            ) : null}
            <PricingField
              label="Embalagem"
              value={draft.packaging}
              onChange={(value) => update({ packaging: value, packagingIds: [] })}
              hint={
                draft.packagingIds.length
                  ? "Uma unidade de cada embalagem selecionada."
                  : "Informe o custo de uma unidade. Deixe R$ 0 se não usar embalagem."
              }
            />
            {packagingChanged ? (
              <Button
                title={`Atualizar embalagens: ${formatCurrency(currentPackaging)}`}
                variant="secondary"
                onPress={() => update({ packaging: currencyInput(currentPackaging) })}
              />
            ) : null}
            <PricingPicker
              title="Embalagens cadastradas"
              action="Usar embalagem cadastrada"
              items={packaging
                .filter((item) => !draft.packagingIds.includes(item.id))
                .map((item) => ({
                  id: item.id,
                  label: displayProductName(item.name),
                  detail: formatCurrency(item.unitCost),
                }))}
              onSelect={(id) => {
                const ids = [...draft.packagingIds, id];
                update({
                  packagingIds: ids,
                  packaging: currencyInput(
                    packaging
                      .filter((item) => ids.includes(item.id))
                      .reduce((sum, item) => sum + item.unitCost, 0),
                  ),
                });
              }}
            />
            {draft.packagingIds.map((id) => (
              <Button
                key={id}
                variant="text"
                title={`Remover ${displayProductName(packaging.find((item) => item.id === id)?.name ?? "embalagem excluída")}`}
                onPress={() => {
                  const ids = draft.packagingIds.filter((item) => item !== id);
                  update({
                    packagingIds: ids,
                    packaging: currencyInput(
                      packaging
                        .filter((item) => ids.includes(item.id))
                        .reduce((sum, item) => sum + item.unitCost, 0),
                    ),
                  });
                }}
              />
            ))}
          </Card>
          {sources.isLoading ? (
            <Typography variant="caption">
              Carregando produtos e custos cadastrados… Você também pode preencher
              manualmente.
            </Typography>
          ) : null}
          {sources.isError ? (
            <Card style={{ gap: spacing.sm }}>
              <Typography variant="body">
                Não foi possível conferir os cadastros e os alertas de custo. Os valores
                já preenchidos continuam disponíveis.
              </Typography>
              <Button
                title="Tentar novamente"
                variant="secondary"
                onPress={() => void sources.refetch()}
              />
            </Card>
          ) : null}
          {reviews.length ? (
            <PricingSection
              title={`${reviews.length} ${reviews.length === 1 ? "preço precisa" : "preços precisam"} de revisão`}
              summary="Custos aumentaram ou uma origem deixou de existir"
            >
              {reviews.map((review) => (
                <View key={review.calculation.id} style={{ gap: spacing.sm }}>
                  <Typography variant="bodyBold">
                    {review.product.name}
                    {review.calculation.channelName
                      ? ` · ${review.calculation.channelName}`
                      : ""}
                  </Typography>
                  <Typography variant="caption">
                    {review.missingSource
                      ? "Uma origem do custo não está mais disponível. Confira antes de recalcular."
                      : `Aumento de ${formatCurrency(review.increasedBy)} nos custos por unidade desde este cálculo.`}
                  </Typography>
                  <Button
                    title={`Recalcular ${review.product.name}`}
                    variant="secondary"
                    onPress={() => selectProduct(review.product.id, review.calculation)}
                  />
                </View>
              ))}
            </PricingSection>
          ) : null}
          {calculations.some((item) => item.productId && !item.sourceSnapshot) ? (
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Cálculos antigos sem origem registrada precisam de conferência manual. Novos
              cálculos vinculados a cadastros permitem acompanhar aumentos.
            </Typography>
          ) : null}
        </React.Fragment>,
        <React.Fragment key="expenses">
          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3">Trabalho e despesas</Typography>
            <Typography variant="body">
              Abra cada detalhe para incluir os custos que se aplicam ao seu negócio.
            </Typography>
          </View>
          {step === 2 ? notice : null}
          <PricingLabor draft={draft} update={update} />
          <ValidationField {...formValidation.field("overhead")}>
            <PricingOverhead draft={draft} update={update} professional={professional} />
          </ValidationField>
          <PricingFees draft={draft} update={update} professional={professional} />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Valores não informados ficam fora da estimativa. Você pode voltar e completar
            depois.
          </Typography>
        </React.Fragment>,
        <React.Fragment key="result">
          <View style={{ gap: spacing.sm }}>
            <Typography variant="h3">Preço e resultado</Typography>
            <Typography variant="body">
              Defina seu ganho, confira a estimativa e salve o cálculo.
            </Typography>
          </View>
          {step === 3 ? notice : null}
          <View style={[split.row, { gap: spacing.lg }]}>
            <View style={split.main}>
              <Card style={{ gap: spacing.lg }}>
                <Typography variant="bodyBold">Quanto você quer ganhar?</Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  <PricingChoice
                    label="Valor em reais"
                    selected={draft.profitMode === "money"}
                    onPress={() => update({ profitMode: "money", profit: "" })}
                  />
                  <PricingChoice
                    label="Acréscimo sobre o custo"
                    selected={draft.profitMode === "markup"}
                    onPress={() => update({ profitMode: "markup", profit: "" })}
                  />
                </View>
                <ValidationField {...formValidation.field("profit")}>
                  <PricingField
                    label={
                      draft.profitMode === "money"
                        ? "Ganho desejado por unidade"
                        : "Acréscimo sobre o custo (%)"
                    }
                    money={draft.profitMode === "money"}
                    value={draft.profit}
                    onChange={(profit) => update({ profit })}
                    hint={
                      draft.profitMode === "markup"
                        ? "50% de acréscimo sobre R$ 10 dá R$ 15 antes das taxas. Isso é diferente de 50% de margem sobre a venda."
                        : "Este ganho depende de incluir todos os custos do negócio."
                    }
                  />
                </ValidationField>
              </Card>
            </View>
            <View style={split.aside}>{result}</View>
          </View>
        </React.Fragment>,
      ]}
    </PricingStepLayout>
  );
}
