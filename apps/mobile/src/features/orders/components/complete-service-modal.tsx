import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Order, PaymentMethod } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { ChoiceField, FormField, TextField } from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { StandardModal } from "../../../shared/components/standard-modal";
import { alertError } from "../../../shared/utils/alerts";
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

/** Formas de receber na hora (o que falta vai para o Fiado). */
const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Pix", value: "pix" },
  { label: "Dinheiro", value: "cash" },
  { label: "Cartão", value: "card" },
  { label: "Transferência", value: "transfer" },
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

  const total = parseCurrencyInput(amount) || 0;
  const received = packageSession ? 0 : parseCurrencyInput(amountReceived) || 0;
  const outstanding = Math.max(total - received, 0);

  const formValidation = useFormValidation(
    {
      amount: total <= 0 && "Informe o valor total do atendimento.",
      amountReceived:
        total > 0 &&
        received > total &&
        "O valor recebido não pode ser maior que o valor cobrado.",
    },
    visible,
  );

  async function submit() {
    if (!formValidation.validate()) return;
    const cost = parseCurrencyInput(actualCost) || 0;
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

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Concluir atendimento"
      subtitle={order.serviceName ?? order.title}
      size="form"
      dismissDisabled={complete.isPending}
      footer={
        <FormActions>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            disabled={complete.isPending}
          />
          <Button
            title="Concluir atendimento"
            onPress={() => void submit()}
            loading={complete.isPending}
          />
        </FormActions>
      }
    >
      <FormBody>
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

        <FormGrid>
          <FormField label="Valor total" validation={formValidation.field("amount")}>
            <TextField
              prefix="R$"
              accessibilityLabel="Valor total do atendimento, em reais"
              placeholder="0,00"
              value={amount}
              onChangeText={(value) => setAmount(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </FormField>
          {packageSession ? null : (
            <FormField
              label="Quanto recebeu agora"
              validation={formValidation.field("amountReceived")}
            >
              <TextField
                prefix="R$"
                accessibilityLabel="Quanto recebeu agora, em reais"
                placeholder="0,00"
                value={amountReceived}
                onChangeText={(value) => setAmountReceived(maskCurrencyInput(value))}
                keyboardType="numeric"
              />
            </FormField>
          )}
          {!packageSession && received > 0 ? (
            <FormField label="Forma de pagamento" span="full">
              <ChoiceField
                value={paymentMethod}
                options={PAYMENT_METHODS}
                onChange={setPaymentMethod}
                accessibilityLabel="Forma de pagamento"
              />
            </FormField>
          ) : null}
          <FormField
            label="Custo real do atendimento"
            optional
            span={packageSession ? "one" : "full"}
          >
            <TextField
              prefix="R$"
              accessibilityLabel="Custo real do atendimento, em reais"
              placeholder="0,00"
              value={actualCost}
              onChangeText={(value) => setActualCost(maskCurrencyInput(value))}
              keyboardType="numeric"
            />
          </FormField>
        </FormGrid>

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
      </FormBody>
    </StandardModal>
  );
}
