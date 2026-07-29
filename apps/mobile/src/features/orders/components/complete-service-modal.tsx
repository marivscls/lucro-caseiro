import type { Order, PaymentMethod } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Chip,
  Input,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import {
  currencyInput,
  maskCurrencyInput,
  parseCurrencyInput,
} from "../../../shared/utils/currency-input";
import { formatCurrency } from "../../../shared/utils/format";
import { useCompleteServiceAppointment } from "../hooks";

interface CompleteServiceModalProps {
  readonly order: Order;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Pix", value: "pix" },
  { label: "Dinheiro", value: "cash" },
  { label: "Cartão", value: "card" },
  { label: "Transferência", value: "transfer" },
  { label: "Fiado", value: "credit" },
];

export function CompleteServiceModal({
  order,
  visible,
  onClose,
  onSuccess,
}: CompleteServiceModalProps) {
  const { theme } = useTheme();
  const complete = useCompleteServiceAppointment();
  const packageSession = !!order.servicePackagePurchaseId;
  const initialAmount = order.amount ?? 0;
  const initialReceived = packageSession
    ? 0
    : Math.max(initialAmount - (order.deposit ?? 0), 0);
  const [amount, setAmount] = useState(currencyInput(initialAmount));
  const [amountReceived, setAmountReceived] = useState(currencyInput(initialReceived));
  const [actualCost, setActualCost] = useState(
    order.actualCost ? currencyInput(order.actualCost) : "",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialReceived > 0 ? "pix" : "credit",
  );

  async function submit() {
    const total = parseCurrencyInput(amount) || 0;
    const received = packageSession ? 0 : parseCurrencyInput(amountReceived) || 0;
    const cost = parseCurrencyInput(actualCost) || 0;
    if (total <= 0) {
      alertValidation("Informe o valor total do atendimento.");
      return;
    }
    if (received > total) {
      alertValidation("O valor recebido não pode ser maior que o valor cobrado.");
      return;
    }
    try {
      await complete.mutateAsync({
        id: order.id,
        data: {
          amount: total,
          amountReceived: received,
          actualCost: cost,
          paymentMethod: received > 0 ? paymentMethod : undefined,
        },
      });
      onSuccess();
      onClose();
    } catch (error) {
      alertError(error);
    }
  }

  const total = parseCurrencyInput(amount) || 0;
  const received = packageSession ? 0 : parseCurrencyInput(amountReceived) || 0;
  const outstanding = Math.max(total - received, 0);

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Concluir atendimento"
      subtitle={order.serviceName ?? order.title}
      footer={
        <>
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={onClose}
            disabled={complete.isPending}
          />
          <Button
            title="Concluir"
            onPress={() => void submit()}
            loading={complete.isPending}
          />
        </>
      }
    >
      {packageSession ? (
        <Card
          style={{
            gap: spacing.xs,
            backgroundColor: theme.colors.primaryBg,
            borderColor: theme.colors.primary,
          }}
        >
          <Typography variant="bodyBold">Sessão incluída em pacote</Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            Ao concluir, uma sessão será consumida. Nenhuma nova cobrança será criada.
          </Typography>
        </Card>
      ) : null}

      <Input
        label="Valor total do atendimento"
        value={amount}
        onChangeText={(value) => setAmount(maskCurrencyInput(value))}
        keyboardType="numeric"
      />
      {!packageSession ? (
        <>
          <Input
            label="Quanto recebeu agora"
            value={amountReceived}
            onChangeText={(value) => setAmountReceived(maskCurrencyInput(value))}
            keyboardType="numeric"
          />
          {received > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Forma de pagamento
              </Typography>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {PAYMENT_METHODS.filter((method) => method.value !== "credit").map(
                  (method) => (
                    <Chip
                      key={method.value}
                      label={method.label}
                      selected={paymentMethod === method.value}
                      onPress={() => setPaymentMethod(method.value)}
                    />
                  ),
                )}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
      <Input
        label="Custo real do atendimento (opcional)"
        placeholder="R$ 0,00"
        value={actualCost}
        onChangeText={(value) => setActualCost(maskCurrencyInput(value))}
        keyboardType="numeric"
      />
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Typography variant="caption">Total</Typography>
          <Typography variant="bodyBold">{formatCurrency(total)}</Typography>
        </View>
        {!packageSession ? (
          <>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Typography variant="caption">Recebido agora</Typography>
              <Typography variant="bodyBold" color={theme.colors.success}>
                {formatCurrency(received)}
              </Typography>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Typography variant="caption">Vai para o Fiado</Typography>
              <Typography variant="bodyBold" color={theme.colors.alert}>
                {formatCurrency(outstanding)}
              </Typography>
            </View>
          </>
        ) : null}
      </Card>
    </StandardModal>
  );
}
