import { ValidationField } from "@lucro-caseiro/ui";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Input, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRecurringExpenses } from "../../finance/hooks";
import { useProlaboreStatus } from "../../goals/hooks";
import {
  usePricingPreferences,
  usePricingRevenueHistory,
  useUpdatePricingPreferences,
} from "../hooks";
import { laborCostPerUnit } from "../calc";
import { currencyInput } from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { alertError } from "../../../shared/utils/alerts";
import { showAlert } from "../../../shared/components/alert-store";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { type PricingDraft, decimalValue, moneyValue } from "../use-pricing-draft";
import { PricingChoice, PricingField, PricingSection } from "./pricing-fields";

type DetailsProps = Readonly<{
  draft: PricingDraft;
  update: (patch: Partial<PricingDraft>) => void;
  professional: boolean;
}>;

export function PricingLabor({ draft, update }: Omit<DetailsProps, "professional">) {
  const [minutes, setMinutes] = useState("");
  const [units, setUnits] = useState("");
  const [hourly, setHourly] = useState("");
  const cost = laborCostPerUnit(
    decimalValue(minutes),
    moneyValue(hourly),
    decimalValue(units),
  );
  const formValidation = useFormValidation({
    minutes:
      (!Number.isFinite(decimalValue(minutes)) || decimalValue(minutes) <= 0) &&
      "Informe o tempo do lote.",
    units:
      (!Number.isFinite(decimalValue(units)) || decimalValue(units) <= 0) &&
      "Informe quantas unidades o lote rende.",
    hourly:
      (!Number.isFinite(moneyValue(hourly)) || moneyValue(hourly) <= 0) &&
      "Informe o valor da sua hora.",
  });

  function handleUseLabor() {
    if (!formValidation.validate()) return;
    update({ labor: currencyInput(cost) });
  }
  return (
    <PricingSection
      title="Seu trabalho"
      summary={
        draft.labor
          ? `${formatCurrency(moneyValue(draft.labor))} por unidade`
          : "Não incluído · informe seu trabalho por unidade"
      }
    >
      <PricingField
        label="Trabalho por unidade"
        value={draft.labor}
        onChange={(labor) => update({ labor })}
        hint="Se seu pagamento já está nas despesas mensais, evite contar o mesmo valor duas vezes."
      />
      <PricingSection
        title="Calcular pelo tempo"
        summary="Tempo do lote, rendimento e valor da sua hora"
      >
        <ValidationField {...formValidation.field("minutes")}>
          <PricingField
            label="Tempo do lote (minutos)"
            money={false}
            value={minutes}
            onChange={setMinutes}
          />
        </ValidationField>
        <ValidationField {...formValidation.field("units")}>
          <PricingField
            label="Unidades por lote"
            money={false}
            value={units}
            onChange={setUnits}
          />
        </ValidationField>
        <ValidationField {...formValidation.field("hourly")}>
          <PricingField label="Valor da sua hora" value={hourly} onChange={setHourly} />
        </ValidationField>
        <Button
          title={`Usar ${formatCurrency(Number.isFinite(cost) ? cost : 0)} por unidade`}
          variant="secondary"
          onPress={handleUseLabor}
        />
      </PricingSection>
    </PricingSection>
  );
}

export function PricingOverhead({ draft, update, professional }: DetailsProps) {
  const expenses = useRecurringExpenses();
  const [selected, setSelected] = useState<string[]>([]);
  const [fromExpenses, setFromExpenses] = useState(false);
  const history = usePricingRevenueHistory();
  const goal = useProlaboreStatus();
  const allocationLabel =
    draft.allocation === "unit" ? "divididas pela produção" : "sobre o faturamento";
  const showPaywall = usePaywall((state) => state.show);
  function toggleExpense(id: string) {
    const ids = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    setSelected(ids);
    setFromExpenses(true);
    const amount = (expenses.data ?? [])
      .filter((item) => item.active && ids.includes(item.id))
      .reduce((sum, item) => sum + item.amount, 0);
    update({ fixed: currencyInput(amount) });
  }
  return (
    <PricingSection
      title="Despesas do negócio"
      summary={
        moneyValue(draft.fixed) > 0
          ? `${formatCurrency(moneyValue(draft.fixed))} por mês · ${allocationLabel}`
          : "Não incluídas · aluguel, energia e outras despesas"
      }
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <PricingChoice
          label="Dividir pela produção"
          selected={draft.allocation === "unit"}
          onPress={() => update({ allocation: "unit" })}
        />
        <PricingChoice
          label="Por faturamento · Pro"
          selected={draft.allocation === "revenue"}
          onPress={() =>
            professional
              ? update({ allocation: "revenue" })
              : showPaywall("advancedPricing")
          }
        />
      </View>
      <PricingField
        label="Despesas mensais"
        value={draft.fixed}
        onChange={(fixed) => {
          update({ fixed });
          setFromExpenses(false);
        }}
        hint={
          fromExpenses
            ? "Origem: despesas cadastradas selecionadas abaixo. Confira o total."
            : "Origem: informado por você. Inclua apenas a parte usada no negócio."
        }
      />
      <PricingSection
        title="Usar despesas cadastradas"
        summary="Escolha quais despesas entram neste preço"
      >
        {expenses.isLoading ? (
          <Typography variant="caption">Carregando despesas…</Typography>
        ) : null}
        {expenses.isError ? (
          <Button
            title="Tentar carregar despesas novamente"
            variant="secondary"
            onPress={() => void expenses.refetch()}
          />
        ) : null}
        {(expenses.data ?? [])
          .filter((item) => item.active)
          .map((item) => (
            <PricingChoice
              key={item.id}
              label={`${item.description} · ${formatCurrency(item.amount)}`}
              selected={fromExpenses && selected.includes(item.id)}
              onPress={() => toggleExpense(item.id)}
            />
          ))}
        {!expenses.isLoading &&
        !expenses.isError &&
        !(expenses.data ?? []).some((item) => item.active) ? (
          <Typography variant="caption">
            Nenhuma despesa recorrente cadastrada. Informe o total acima.
          </Typography>
        ) : null}
      </PricingSection>
      {draft.allocation === "unit" ? (
        <PricingField
          label="Produção mensal estimada (unidades)"
          money={false}
          value={draft.production}
          onChange={(production) => update({ production })}
          hint="Use uma estimativa realista. Vender menos pode deixar despesas descobertas."
        />
      ) : (
        <>
          <PricingField
            label="Faturamento mensal estimado"
            value={draft.revenue}
            onChange={(revenue) => update({ revenue })}
          />
          {professional && history.averageRevenue > 0 ? (
            <Button
              title={`Usar média registrada: ${formatCurrency(history.averageRevenue)}`}
              variant="secondary"
              onPress={() => update({ revenue: currencyInput(history.averageRevenue) })}
            />
          ) : null}
          {professional && (goal.data?.progress.requiredRevenue ?? 0) > 0 ? (
            <Button
              title="Usar faturamento da meta de pró-labore"
              variant="secondary"
              onPress={() =>
                update({ revenue: currencyInput(goal.data!.progress.requiredRevenue) })
              }
            />
          ) : null}
          <Typography variant="caption">
            A média considera os meses com faturamento positivo entre os três meses
            completos anteriores. A meta é uma projeção; confira se é alcançável.
          </Typography>
        </>
      )}
    </PricingSection>
  );
}

export function PricingFees({ draft, update, professional }: DetailsProps) {
  const { theme } = useTheme();
  const profiles = usePricingPreferences(professional);
  const save = useUpdatePricingPreferences();
  const showPaywall = usePaywall((state) => state.show);
  async function saveChannel() {
    const name = draft.channelName.trim();
    const percent = decimalValue(draft.fees);
    if (
      !name ||
      !draft.fees.trim() ||
      !Number.isFinite(percent) ||
      percent < 0 ||
      percent > 95
    ) {
      showAlert({
        title: "Confira o canal",
        message: "Informe o nome e uma taxa de 0% a 95%.",
      });
      return;
    }
    const existing = profiles.data?.channelFees ?? [];
    const match = existing.find(
      (item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"),
    );
    const channel = { id: match?.id ?? `channel-${Date.now()}`, name, percent };
    try {
      await save.mutateAsync({
        channelFees: match
          ? existing.map((item) => (item.id === match.id ? channel : item))
          : [...existing, channel],
      });
      showAlert({
        title: "Canal salvo",
        message: "Esta taxa estará disponível nas próximas precificações.",
      });
    } catch (error) {
      alertError(error);
    }
  }
  return (
    <PricingSection
      title="Taxas e canal de venda"
      summary={
        draft.fees.trim()
          ? `${draft.channelName || "Taxa informada"} · ${draft.fees}%`
          : "Taxa não informada · a estimativa usa 0%"
      }
    >
      <PricingField
        label="Taxas sobre a venda (%)"
        money={false}
        value={draft.fees}
        onChange={(fees) => update({ fees })}
        hint="Some cartão, comissão e impostos que incidam sobre esta mesma venda. Não some canais que são alternativas."
      />
      <Button
        title="Confirmar venda sem taxa"
        variant="secondary"
        onPress={() => update({ fees: "0", channelName: "Venda direta" })}
      />
      {professional ? (
        <>
          <Input
            accessibilityLabel="Nome do canal"
            placeholder="Nome do canal (ex.: Cartão)"
            value={draft.channelName}
            onChangeText={(channelName) => update({ channelName })}
          />
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Perfis salvos na sua conta. Confira as taxas do seu contrato antes de usar.
          </Typography>
          {profiles.isError ? (
            <Button
              title="Tentar carregar canais novamente"
              variant="secondary"
              onPress={() => void profiles.refetch()}
            />
          ) : null}
          {(profiles.data?.channelFees ?? []).map((item) => (
            <PricingChoice
              key={item.id}
              selected={
                draft.channelName === item.name &&
                decimalValue(draft.fees) === item.percent
              }
              label={`${item.name} · ${item.percent}%${profiles.data?.updatedAt.startsWith("1970") ? " (configure sua taxa)" : ""}`}
              onPress={() =>
                update({
                  channelName: item.name,
                  fees: String(item.percent).replace(".", ","),
                })
              }
            />
          ))}
          <Button
            title="Salvar este canal"
            variant="secondary"
            loading={save.isPending}
            disabled={profiles.isLoading || profiles.isError}
            onPress={() => void saveChannel()}
          />
        </>
      ) : (
        <Button
          title="Perfis de taxas · Profissional"
          variant="secondary"
          onPress={() => showPaywall("advancedPricing")}
        />
      )}
    </PricingSection>
  );
}
