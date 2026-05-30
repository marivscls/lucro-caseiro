import type { Order } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

import { brToIso, isoToBR, maskDateBR } from "../../../shared/utils/date";
import { useCreateOrder, useUpdateOrder } from "../hooks";

interface OrderFormProps {
  readonly order?: Order | null;
  readonly onSuccess?: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function offsetIsoBr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function OrderForm({ order, onSuccess }: OrderFormProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(order?.title ?? "");
  const [dateText, setDateText] = useState(
    order?.deliveryDate ? isoToBR(order.deliveryDate) : offsetIsoBr(0),
  );
  const [time, setTime] = useState(order?.deliveryTime ?? "");
  const [amount, setAmount] = useState(
    order?.amount != null ? String(order.amount).replace(".", ",") : "",
  );
  const [notes, setNotes] = useState(order?.notes ?? "");

  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const isEditing = !!order;

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Opa!", "Dê um nome pra encomenda (ex.: Bolo de chocolate).");
      return;
    }
    const iso = brToIso(dateText);
    if (!iso) {
      Alert.alert("Opa!", "Data inválida. Use o formato DD/MM/AAAA.");
      return;
    }
    if (time.trim() && !/^\d{2}:\d{2}$/.test(time.trim())) {
      Alert.alert("Opa!", "Horário inválido. Use HH:MM (ex.: 14:30).");
      return;
    }
    const parsedAmount = amount.trim() ? parseFloat(amount.replace(",", ".")) : undefined;

    const data = {
      title: title.trim(),
      deliveryDate: iso,
      deliveryTime: time.trim() || undefined,
      amount:
        parsedAmount !== undefined && !isNaN(parsedAmount) ? parsedAmount : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEditing && order) {
        await updateOrder.mutateAsync({ id: order.id, data });
      } else {
        await createOrder.mutateAsync(data);
      }
      onSuccess?.();
    } catch {
      Alert.alert("Erro", "Não foi possível salvar a encomenda. Tente novamente.");
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h2">
        {isEditing ? "Editar encomenda" : "Nova encomenda"}
      </Typography>

      <Input
        label="O que é? (encomenda)"
        placeholder="Ex: Bolo de chocolate 2kg"
        value={title}
        onChangeText={setTitle}
        autoFocus={!isEditing}
      />

      <View style={{ gap: spacing.sm }}>
        <Typography variant="caption">Data de entrega</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {[
            { label: "Hoje", value: offsetIsoBr(0) },
            { label: "Amanhã", value: offsetIsoBr(1) },
          ].map((chip) => {
            const active = dateText === chip.value;
            return (
              <Pressable
                key={chip.label}
                onPress={() => setDateText(chip.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <Typography
                  variant="caption"
                  color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
                >
                  {chip.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
        <Input
          placeholder="DD/MM/AAAA"
          value={dateText}
          onChangeText={(v) => setDateText(maskDateBR(v))}
          keyboardType="number-pad"
        />
      </View>

      <Input
        label="Horário (opcional)"
        placeholder="Ex: 14:30"
        value={time}
        onChangeText={setTime}
        keyboardType="numbers-and-punctuation"
      />

      <Input
        label="Valor combinado (opcional)"
        placeholder="Ex: 120,00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      <Input
        label="Observações (opcional)"
        placeholder="Recheio, cor, detalhes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button
        title="Salvar encomenda"
        size="lg"
        onPress={() => {
          void handleSave();
        }}
        loading={createOrder.isPending || updateOrder.isPending}
      />
    </ScrollView>
  );
}
