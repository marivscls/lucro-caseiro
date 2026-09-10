import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import React from "react";
import { Image, View } from "react-native";
import type { CreatePricing, Product } from "@lucro-caseiro/contracts";
import { MAX_MONEY } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { currencyInput } from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { evaluateSalePrice, pricingQuote } from "../calc";
import { PricingField, PricingSection } from "./pricing-fields";
import { moneyValue, type PricingDraft } from "../use-pricing-draft";
import { useBrandIllustration } from "../../../shared/brand-illustrations";

export function PricingSummary({
  input,
  draft,
  product,
  saving,
  onApply,
  onCreate,
  onAlternativeChange,
}: Readonly<{
  input: CreatePricing;
  draft: PricingDraft;
  product?: Product;
  saving: boolean;
  onApply: (price: number) => void;
  onCreate: (price: number) => void;
  onAlternativeChange: (value: string) => void;
}>) {
  const { theme } = useTheme();
  const resultIllustration = useBrandIllustration("pricingResultHero");
  const alternative = draft.alternative;
  const setAlternative = onAlternativeChange;
  const quote = pricingQuote(input);
  const suggested = Math.ceil((quote.finalPrice - 1e-9) * 100) / 100;
  const price = alternative.trim() ? moneyValue(alternative) : suggested;
  const validPrice = Number.isFinite(price) && price > 0 && price <= MAX_MONEY;
  const result = evaluateSalePrice(input, validPrice ? price : 0);
  const missing = [
    !draft.packaging.trim() && "embalagem",
    !draft.labor.trim() && "seu trabalho",
    !draft.fixed.trim() && "despesas do negócio",
    !draft.fees.trim() && "taxas",
  ].filter(Boolean);
  const rows = [
    ["Ingredientes / material", input.ingredientCost],
    ["Embalagem", input.packagingCost],
    ["Seu trabalho", input.laborCost],
    ["Despesas por unidade", result.overhead],
    ["Taxas da venda", result.fees],
  ] as const;
  const formValidation = useFormValidation({
    alternative: !validPrice && "Informe um preço válido maior que zero.",
  });

  function handleChosenPrice() {
    if (!formValidation.validate()) return;
    if (product) onApply(price);
    else onCreate(price);
  }
  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Typography
            variant="captionBold"
            color={theme.colors.primaryStrong}
            style={{ flex: 1, minWidth: 0 }}
          >
            PREÇO SUGERIDO POR UNIDADE
          </Typography>
          <Image
            source={resultIllustration}
            resizeMode="contain"
            accessible={false}
            style={{ width: 96, height: 64 }}
          />
        </View>
        <Typography variant="moneyHero" numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(suggested)}
        </Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Estimativa com os custos informados, arredondada para cima no centavo.
        </Typography>
      </View>
      {missing.length ? (
        <Typography variant="caption" color={theme.colors.alert}>
          Ainda não informados: {missing.join(", ")}. Estes itens usam R$ 0 e podem
          reduzir seu ganho real.
        </Typography>
      ) : (
        <Typography variant="caption">
          Confira as premissas de produção e despesas antes de usar o preço.
        </Typography>
      )}
      <ValidationField {...formValidation.field("alternative")}>
        <PricingSection
          title="Simular outro preço"
          summary={
            alternative.trim()
              ? `Preço informado: ${formatCurrency(price)}`
              : "Opcional · compare com o preço sugerido"
          }
        >
          <PricingField
            label="Preço que você quer cobrar"
            value={alternative}
            onChange={setAlternative}
            hint={`Deixe vazio para usar ${formatCurrency(suggested)}. A composição abaixo acompanha este preço.`}
          />
          {product ? (
            <Button
              title={`Simular preço atual: ${formatCurrency(product.salePrice)}`}
              variant="secondary"
              onPress={() => setAlternative(currencyInput(product.salePrice))}
            />
          ) : null}
        </PricingSection>
      </ValidationField>
      <PricingSection
        title="Composição do preço"
        summary="Veja custos, trabalho, despesas e taxas"
      >
        {rows.map(([label, value]) => (
          <View
            key={label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Typography variant="caption" style={{ flex: 1 }}>
              {label}
            </Typography>
            <Typography variant="captionBold">{formatCurrency(value)}</Typography>
          </View>
        ))}
      </PricingSection>
      <View
        style={{
          borderTopWidth: 1,
          borderColor: theme.colors.border,
          paddingTop: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Typography variant="bodyBold">
          {result.profit < 0 ? "Prejuízo estimado" : "Ganho estimado por unidade"}
        </Typography>
        <Typography
          variant="moneyLg"
          color={result.profit < 0 ? theme.colors.alert : theme.colors.success}
        >
          {formatCurrency(result.profit)}
        </Typography>
        <Typography variant="caption">
          {result.margin.toFixed(1).replace(".", ",")}% sobre o preço de venda
          {draft.profitMode === "markup"
            ? ` · acréscimo escolhido: ${draft.profit}% sobre o custo`
            : ""}
          .
        </Typography>
      </View>
      {!validPrice ? (
        <Typography variant="caption" color={theme.colors.alert}>
          Informe um preço de venda maior que zero e dentro do limite permitido.
        </Typography>
      ) : null}
      {product ? (
        <>
          <Typography variant="caption">
            {product.name}: {formatCurrency(product.salePrice)} →{" "}
            {formatCurrency(validPrice ? price : 0)}
          </Typography>
          {(product.variations?.length ?? 0) > 0 ? (
            <Typography variant="caption">
              A alteração será no preço base. As variações mantêm seus preços próprios.
            </Typography>
          ) : null}
          <Button
            title="Aplicar ao produto"
            variant="ghost"
            disabled={saving}
            onPress={handleChosenPrice}
          />
        </>
      ) : (
        <Button
          title="Salvar e criar produto"
          variant="ghost"
          disabled={saving}
          onPress={handleChosenPrice}
        />
      )}
      <Typography variant="caption" color={theme.colors.textSecondary}>
        O histórico guarda o cálculo sugerido. O preço aplicado ao produto pode ser
        diferente.
      </Typography>
    </Card>
  );
}
