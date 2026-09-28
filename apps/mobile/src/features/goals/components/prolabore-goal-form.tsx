import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { ProlaboreGoal } from "@lucro-caseiro/contracts";
import { Button } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { FormField, TextField } from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { StandardModal } from "../../../shared/components/standard-modal";
import { useDeleteProlaboreGoal, useUpsertProlaboreGoal } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { showAlert } from "../../../shared/components/alert-store";
import { alertError } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";

interface ProlaboreGoalFormProps {
  readonly config: ProlaboreGoal | null;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

function parseMoney(value: string): number {
  return parseCurrencyInput(value);
}

function initial(value: number | null): string {
  return value != null ? currencyInput(value) : "";
}

export function ProlaboreGoalForm({
  config,
  visible,
  onClose,
  onSuccess,
}: ProlaboreGoalFormProps) {
  const [goal, setGoal] = useState(initial(config?.monthlyProlaboreGoal ?? null));
  const [costs, setCosts] = useState(initial(config?.estimatedMonthlyCosts ?? null));
  const [ticket, setTicket] = useState(initial(config?.avgTicketOverride ?? null));

  const upsert = useUpsertProlaboreGoal();
  const remove = useDeleteProlaboreGoal();

  const formValidation = useFormValidation(
    {
      goal:
        (!Number.isFinite(parseMoney(goal)) || parseMoney(goal) <= 0) &&
        "Informe quanto você quer ganhar por mês, com um valor maior que zero.",
    },
    visible,
  );

  async function handleSave() {
    if (!formValidation.validate()) return;
    const g = parseMoney(goal);
    const c = costs.trim() ? parseMoney(costs) : undefined;
    const t = ticket.trim() ? parseMoney(ticket) : undefined;

    try {
      await upsert.mutateAsync({
        monthlyProlaboreGoal: g,
        estimatedMonthlyCosts: c !== undefined && !isNaN(c) ? c : undefined,
        avgTicketOverride: t !== undefined && !isNaN(t) ? t : undefined,
      });
      showToast("Meta salva! Acompanhe na tela inicial.");
      onSuccess?.();
    } catch {
      alertError("Não foi possível salvar sua meta. Tente novamente.");
    }
  }

  function handleRemove() {
    showAlert({
      title: "Remover meta",
      message: "Tem certeza que deseja remover sua meta?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await remove.mutateAsync();
                onSuccess?.();
              } catch {
                alertError("Não foi possível remover a meta.");
              }
            })();
          },
        },
      ],
    });
  }

  return (
    <StandardModal
      title="Meta de pro-labore"
      subtitle="Diga quanto quer ganhar por mês e o app mostra quanto falta vender."
      size="form"
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          <Button title="Cancelar" variant="outline" onPress={onClose} />
          <Button
            title="Salvar meta"
            onPress={() => {
              void handleSave();
            }}
            loading={upsert.isPending}
          />
        </FormActions>
      }
    >
      <FormBody>
        <FormGrid>
          <FormField
            label="Quanto você quer ganhar por mês?"
            validation={formValidation.field("goal")}
            span="full"
          >
            <TextField
              prefix="R$"
              accessibilityLabel="Quanto você quer ganhar por mês, em reais"
              placeholder="Ex: 2.000,00"
              value={goal}
              onChangeText={(value) => setGoal(maskCurrencyInput(value))}
              keyboardType="numeric"
              autoFocus
            />
          </FormField>
          <FormField label="Custos fixos do mês" optional hint="Aluguel, gás, energia…">
            <TextField
              prefix="R$"
              accessibilityLabel="Custos fixos do mês, em reais"
              placeholder="0,00"
              value={costs}
              onChangeText={(value) => setCosts(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </FormField>
          <FormField
            label="Preço médio por venda"
            optional
            hint="Vazio: o app calcula sozinho."
          >
            <TextField
              prefix="R$"
              accessibilityLabel="Preço médio por venda, em reais"
              placeholder="0,00"
              value={ticket}
              onChangeText={(value) => setTicket(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </FormField>
        </FormGrid>
        {config ? (
          <View style={{ alignItems: "flex-start" }}>
            <Button
              title="Remover meta"
              variant="alertOutline"
              onPress={handleRemove}
              loading={remove.isPending}
            />
          </View>
        ) : null}
      </FormBody>
    </StandardModal>
  );
}
