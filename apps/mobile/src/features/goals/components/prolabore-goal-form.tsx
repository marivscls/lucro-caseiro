import type { ProlaboreGoal } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { useDeleteProlaboreGoal, useUpsertProlaboreGoal } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface ProlaboreGoalFormProps {
  readonly config: ProlaboreGoal | null;
  readonly onSuccess?: () => void;
}

function parseMoney(value: string): number {
  return parseFloat(value.replace(",", "."));
}

function initial(value: number | null): string {
  return value != null ? String(value).replace(".", ",") : "";
}

export function ProlaboreGoalForm({ config, onSuccess }: ProlaboreGoalFormProps) {
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
    Alert.alert("Remover meta", "Tem certeza que deseja remover sua meta?", [
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
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h2">Meta de pro-labore</Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        Defina quanto você quer ganhar por mês e o app mostra quanto falta vender pra
        chegar la.
      </Typography>

      <Input
        label="Quanto você quer ganhar por mês? (R$)"
        placeholder="Ex: 2.000,00"
        value={goal}
        onChangeText={setGoal}
        keyboardType="decimal-pad"
        autoFocus
      />
      <Input
        label="Custos fixos do mês (opcional)"
        placeholder="Aluguel, gas, energia..."
        value={costs}
        onChangeText={setCosts}
        keyboardType="decimal-pad"
      />
      <Input
        label="Preço médio por venda (opcional)"
        placeholder="Deixe vazio para calcular automático"
        value={ticket}
        onChangeText={setTicket}
        keyboardType="decimal-pad"
      />

      <Button
        title="Salvar meta"
        size="lg"
        onPress={() => {
          void handleSave();
        }}
        loading={upsert.isPending}
      />
      {config && (
        <Button
          title="Remover meta"
          variant="secondary"
          onPress={handleRemove}
          loading={remove.isPending}
        />
      )}
    </ScrollView>
  );
}
