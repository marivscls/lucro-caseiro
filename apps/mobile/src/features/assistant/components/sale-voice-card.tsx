import type { AssistantSaleDraft, PaymentMethod } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { ChoiceField, FormField, TextField } from "../../../shared/components/form-field";
import { FormActions } from "../../../shared/components/form-layout";
import { showToast } from "../../../shared/components/toast";
import { alertError, errorMessage } from "../../../shared/utils/alerts";
import { formatCurrency } from "../../../shared/utils/format";
import { useCreateSale } from "../../sales/hooks";
import { PAYMENT_OPTIONS, draftToSale, draftTotal, isReadyItem } from "../domain";
import { useDraftSale } from "../hooks";
import {
  startVoiceRecording,
  voiceRecordingSupported,
  type VoiceRecording,
} from "../voice-recorder";

function initialPayment(draft: AssistantSaleDraft): PaymentMethod {
  if (!draft.paymentMethod || draft.paymentMethod === "transfer") return "pix";
  return draft.paymentMethod;
}

function DraftReview({
  draft,
  onDone,
}: Readonly<{ draft: AssistantSaleDraft; onDone: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const createSale = useCreateSale();
  const [payment, setPayment] = useState<PaymentMethod>(initialPayment(draft));
  const result = draftToSale(draft, payment);

  async function handleRegister() {
    if (!result.ok) return;
    try {
      await createSale.mutateAsync(result.sale);
      showToast(payment === "credit" ? "Venda anotada no fiado." : "Venda registrada!");
      onDone();
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Entendi assim
        </Typography>
        <Typography variant="body">“{draft.transcript}”</Typography>
      </View>
      {draft.clientName ? (
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <AppIcon name="person-outline" size={20} color={theme.colors.textSecondary} />
          <Typography variant="bodyBold">
            {draft.clientName}
            {draft.clientId ? "" : " (cliente novo, cadastre na Nova venda)"}
          </Typography>
        </View>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {draft.items.map((item, index) => {
          const ready = isReadyItem(item);
          return (
            <View
              key={`${item.name}-${index}`}
              style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}
            >
              <View style={{ flex: 1 }}>
                <Typography variant="bodyBold">
                  {item.quantity}x {item.name}
                </Typography>
                {ready ? null : (
                  <Typography variant="caption" color={palette.rose}>
                    Não achei nos seus produtos
                  </Typography>
                )}
              </View>
              <Typography variant="body">
                {item.unitPrice != null
                  ? formatCurrency(item.unitPrice * item.quantity)
                  : "sem preço"}
              </Typography>
            </View>
          );
        })}
        <Typography variant="money" style={{ textAlign: "right" }}>
          {formatCurrency(draftTotal(draft.items))}
        </Typography>
      </View>
      <FormField label="Como foi pago?">
        <ChoiceField
          value={payment}
          accessibilityLabel="Forma de pagamento"
          options={PAYMENT_OPTIONS}
          onChange={setPayment}
        />
      </FormField>
      {result.ok ? null : (
        <Typography variant="body" color={theme.colors.textSecondary}>
          {result.reason === "empty"
            ? "Não encontrei itens nessa frase. Tente dizer o que vendeu e a quantidade."
            : `Para registrar, cadastre ${result.names.join(", ")} em Produtos ou monte a venda na Nova venda.`}
        </Typography>
      )}
      <FormActions>
        <Button title="Descartar" variant="outline" onPress={onDone} />
        {result.ok ? (
          <Button
            title="Registrar venda"
            loading={createSale.isPending}
            onPress={() => void handleRegister()}
          />
        ) : (
          <Button
            title="Abrir Nova venda"
            onPress={() => router.push("/tabs/new-sale")}
          />
        )}
      </FormActions>
    </View>
  );
}

/** Anotar uma venda falando (ou escrevendo do jeito que fala). */
export function SaleVoiceCard({ disabled }: Readonly<{ disabled: boolean }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<AssistantSaleDraft | null>(null);
  const recorder = useRef<VoiceRecording | null>(null);
  const draftSale = useDraftSale();

  async function send(body: Parameters<typeof draftSale.mutateAsync>[0]) {
    try {
      setDraft(await draftSale.mutateAsync(body));
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  async function toggleRecording() {
    if (recording) {
      setRecording(false);
      const current = recorder.current;
      recorder.current = null;
      if (!current) return;
      try {
        const audio = await current.stop();
        await send({ audio });
      } catch (error) {
        alertError(errorMessage(error));
      }
      return;
    }
    if (!voiceRecordingSupported) {
      alertError(
        "Este navegador não deixa gravar áudio aqui. Use o microfone do teclado ou escreva a venda.",
      );
      return;
    }
    try {
      recorder.current = await startVoiceRecording();
      setRecording(true);
    } catch {
      alertError(
        "Não consegui usar o microfone. Libere o acesso ao microfone e tente de novo, ou escreva a venda.",
      );
    }
  }

  const hint = "Escreva como você falaria, ou grave um áudio.";

  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="h3">Anotar uma venda</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          Diga o que vendeu, para quem e como foi pago. O app monta a venda para você
          conferir.
        </Typography>
      </View>
      {draft ? (
        <DraftReview
          draft={draft}
          onDone={() => {
            setDraft(null);
            setText("");
          }}
        />
      ) : (
        <>
          <FormField label="O que você vendeu?" hint={hint}>
            <TextField
              multiline
              accessibilityLabel="O que você vendeu"
              placeholder="Ex: 3 marmitas para a Dona Cida, no fiado"
              value={text}
              onChangeText={setText}
              maxLength={500}
            />
          </FormField>
          {recording ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: palette.rose,
                }}
              />
              <Typography variant="bodyBold" color={palette.wine}>
                Gravando… fale a venda e toque em Parar.
              </Typography>
            </View>
          ) : null}
          <FormActions stack>
            <Button
              title={recording ? "Parar e anotar" : "Gravar áudio"}
              variant="outline"
              disabled={disabled || draftSale.isPending}
              icon={<AppIcon name="mic-outline" size={20} color={palette.wine} />}
              onPress={() => void toggleRecording()}
            />
            <Button
              title="Montar venda"
              disabled={disabled || recording || text.trim().length < 3}
              loading={draftSale.isPending}
              onPress={() => void send({ text: text.trim() })}
            />
          </FormActions>
        </>
      )}
    </Card>
  );
}
