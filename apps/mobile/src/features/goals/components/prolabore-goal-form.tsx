import type { ProlaboreGoal } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import { useDeleteProlaboreGoal, useUpsertProlaboreGoal } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { showAlert } from "../../../shared/components/alert-store";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
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
  const { theme } = useTheme();
  const [goal, setGoal] = useState(initial(config?.monthlyProlaboreGoal ?? null));
  const [costs, setCosts] = useState(initial(config?.estimatedMonthlyCosts ?? null));
  const [ticket, setTicket] = useState(initial(config?.avgTicketOverride ?? null));

  const upsert = useUpsertProlaboreGoal();
  const remove = useDeleteProlaboreGoal();

  async function handleSave() {
    const g = parseMoney(goal);
    if (isNaN(g) || g <= 0) {
      alertValidation("Coloque quanto você quer ganhar por mês (maior que zero).");
      return;
    }
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
      visible={visible}
      onClose={onClose}
      footer={
        <>
          {config ? (
            <Button
              title="Remover meta"
              variant="secondary"
              onPress={handleRemove}
              loading={remove.isPending}
              style={{ flex: 1 }}
            />
          ) : null}
          <Button
            title="Salvar meta"
            size="lg"
            onPress={() => {
              void handleSave();
            }}
            loading={upsert.isPending}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.lg }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Defina quanto você quer ganhar por mês e o app mostra quanto falta vender pra
          chegar la.
        </Typography>

        <Input
          label="Quanto você quer ganhar por mês? (R$)"
          placeholder="Ex: 2.000,00"
          value={goal}
          onChangeText={(value) => setGoal(maskCurrencyInput(value))}
          keyboardType="numeric"
          autoFocus
        />
        <Input
          label="Custos fixos do mês (opcional)"
          placeholder="Aluguel, gas, energia..."
          value={costs}
          onChangeText={(value) => setCosts(maskCurrencyInput(value))}
          keyboardType="numeric"
        />
        <Input
          label="Preço médio por venda (opcional)"
          placeholder="Deixe vazio para calcular automático"
          value={ticket}
          onChangeText={(value) => setTicket(maskCurrencyInput(value))}
          keyboardType="numeric"
        />
      </View>
    </StandardModal>
  );
}
