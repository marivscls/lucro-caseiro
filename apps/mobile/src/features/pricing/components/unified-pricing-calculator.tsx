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
  draftForProduct,
  moneyValue,
  usePricingDraft,
} from "../use-pricing-draft";
import { currentProductCost, evaluateSalePrice, pricingReviews } from "../calc";
import { currencyInput } from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { desktopSplitLayout, pageGutter } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import {
  PricingChoice,
  PricingField,
  PricingPicker,
  PricingSection,
} from "./pricing-fields";
import { PricingFees, PricingLabor, PricingOverhead } from "./pricing-cost-details";
import { PricingSummary } from "./pricing-summary";
import { useBrandIllustration } from "../../../shared/brand-illustrations";

export function UnifiedPricingCalculator({
  initialIngredientCost,
  initialProductId,
  initialProduct,
  onSave,
  onCreateProduct,
}: Readonly<{
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
    "Origem: informado por você. Use o custo de uma unidade, não do lote.";
  if (draft.source === "recipe")
    ingredientHint = "Origem: receita atual, calculada com os insumos cadastrados.";
  if (draft.source === "product") ingredientHint = "Origem: custo cadastrado do produto.";
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
      (!Number.isFinite(moneyValue(draft.ingredient)) ||
        moneyValue(draft.ingredient) <= 0) &&
      "Informe o custo por unidade.",
    overhead:
      moneyValue(draft.fixed) > 0 &&
      draft.allocation === "unit" &&
      (!Number.isFinite(Number(draft.production.replace(",", "."))) ||
        Number(draft.production.replace(",", ".")) <= 0) &&
      "Informe a produção mensal para dividir as despesas.",
    profit:
      !draft.profit.trim() &&
      "Informe o ganho desejado. Use zero para simular sem ganho.",
  });

  async function saveSuggested() {
    if (!formValidation.validate()) return;
    if (!calculation.input || busy) return;
    try {
      await save.mutateAsync(calculation.input);
      onSave?.();
    } catch (error) {
      alertError(error);
    }
  }
  async function createProduct(price: number) {
    if (!formValidation.validate()) return;
    if (!calculation.input || busy) return;
    try {
      await save.mutateAsync(calculation.input);
      onCreateProduct(price, calculation.input.ingredientCost, initialProduct);
    } catch (error) {
      alertError(error);
    }
  }
  function confirmApply(price: number) {
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
  const result = calculation.input ? (
    <PricingSummary
      key={draft.productId}
      input={calculation.input}
      draft={draft}
      product={product}
      saving={blocked}
      onSave={() => void saveSuggested()}
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
          formValidation.validate();
        }}
      />
    </Card>
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{
        ...pageGutter(desktop),
        paddingVertical: spacing.lg,
        paddingBottom: spacing["3xl"],
        gap: spacing.lg,
      }}
    >
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Typography variant="h3" style={{ flex: 1, minWidth: 0 }}>
            Quanto cobrar pelo seu produto?
          </Typography>
          <Image
            source={pricingIllustration}
            resizeMode="contain"
            accessible={false}
            style={{ width: desktop ? 104 : 88, height: desktop ? 96 : 80 }}
          />
        </View>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Comece pelo custo por unidade. Abra os detalhes para incluir trabalho, despesas
          e taxas.
        </Typography>
      </View>
      {sources.isLoading ? (
        <Typography variant="caption">
          Carregando produtos e custos cadastrados… Você também pode preencher
          manualmente.
        </Typography>
      ) : null}
      {sources.data ? (
        <Button
          title="Atualizar custos cadastrados"
          variant="text"
          loading={sources.isFetching}
          onPress={() => void sources.refetch()}
        />
      ) : null}
      {sources.isError ? (
        <Card style={{ gap: spacing.sm }}>
          <Typography variant="body">
            Não foi possível conferir os cadastros e os alertas de custo. Os valores já
            preenchidos continuam disponíveis.
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
          initiallyOpen
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
      <View style={split.row}>
        <View style={[split.main, { gap: spacing.lg }]}>
          <Card style={{ gap: spacing.lg }}>
            <Typography variant="bodyBold">Produto e custo por unidade</Typography>
            <PricingPicker
              title="Produtos cadastrados"
              action={
                product
                  ? `Trocar produto: ${product.name}`
                  : "Escolher produto cadastrado"
              }
              items={products.map((item) => {
                const cost = currentProductCost(item, products, recipes);
                const origin = item.recipeId ? "Receita atual" : "Custo cadastrado";
                return {
                  id: item.id,
                  label: item.name,
                  detail:
                    cost == null
                      ? "Custo não disponível · preencha manualmente"
                      : `${origin}: ${formatCurrency(cost)}`,
                };
              })}
              onSelect={(id) => selectProduct(id)}
            />
            {product ? (
              <Button title="Fazer cálculo avulso" variant="text" onPress={reset} />
            ) : null}
            <ValidationField {...formValidation.field("ingredient")}>
              <PricingField
                label="Ingredientes / material por unidade"
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
              label="Embalagem por unidade"
              value={draft.packaging}
              onChange={(value) => update({ packaging: value, packagingIds: [] })}
              hint={
                draft.packagingIds.length
                  ? "Origem: embalagens selecionadas do cadastro (uma unidade de cada)."
                  : "Origem: informado por você. Digite 0 se não usa embalagem."
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
              action="Adicionar embalagem cadastrada"
              items={packaging
                .filter((item) => !draft.packagingIds.includes(item.id))
                .map((item) => ({
                  id: item.id,
                  label: item.name,
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
                title={`Remover ${packaging.find((item) => item.id === id)?.name ?? "embalagem excluída"}`}
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
          <PricingLabor draft={draft} update={update} />
          <ValidationField {...formValidation.field("overhead")}>
            <PricingOverhead draft={draft} update={update} professional={professional} />
          </ValidationField>
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
          <PricingFees draft={draft} update={update} professional={professional} />
          {!desktop ? result : null}
        </View>
        {desktop ? <View style={split.aside}>{result}</View> : null}
      </View>
      {calculations.some((item) => item.productId && !item.sourceSnapshot) ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Cálculos antigos sem origem registrada precisam de conferência manual. Novos
          cálculos vinculados a cadastros permitem acompanhar aumentos.
        </Typography>
      ) : null}
    </KeyboardAwareScrollView>
  );
}
