import type { AssistantSaleDraft, PaymentMethod } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";

import { brandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { ChoiceField, FormField, TextField } from "../../../shared/components/form-field";
import { displayIngredientName } from "../../../shared/ingredient-image/resolve";
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
                  {item.quantity}x {displayIngredientName(item.name)}
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

function sendOpacity(enabled: boolean, pressed: boolean): number {
  if (!enabled) return 0.45;
  return pressed ? 0.85 : 1;
}

const EXAMPLES = ["“3 marmitas pra Dona Cida, fiado”", "“Um bolo de pote de 12 no pix”"];

/** Botão grande do microfone, com anéis em volta (cresce a área de toque). */
function MicButton({
  recording,
  busy,
  disabled,
  onPress,
}: Readonly<{
  recording: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  // Escuro: vinho some no fundo, então o botão usa o rosa. Gravando: lima nos dois temas.
  const idleFill = theme.mode === "dark" ? palette.rose : palette.wineFill;
  const fill = recording ? palette.lime : idleFill;
  const iconColor = recording ? palette.onLime : "#FFFFFF";
  let label = "Gravar a venda";
  if (recording) label = "Parar e anotar";
  if (busy) label = "Montando a venda";
  return (
    <View
      style={{
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: palette.softRose,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: palette.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: disabled || busy, busy }}
          disabled={disabled || busy}
          onPress={onPress}
          style={({ pressed }) => ({
            width: 124,
            height: 124,
            borderRadius: 62,
            backgroundColor: fill,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {busy ? (
            <ActivityIndicator color={iconColor} size="large" />
          ) : (
            <AppIcon
              name={recording ? "square-outline" : "mic-outline"}
              size={48}
              color={iconColor}
            />
          )}
        </Pressable>
      </View>
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
        Platform.OS === "web"
          ? "Este navegador não deixa gravar áudio aqui. Use o microfone do teclado ou escreva a venda."
          : "Esta versão do app ainda não grava áudio. Atualize o app, ou use o microfone do teclado.",
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

  if (draft) {
    return (
      <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
        <Typography variant="h3">Confira a venda</Typography>
        <DraftReview
          draft={draft}
          onDone={() => {
            setDraft(null);
            setText("");
          }}
        />
      </Card>
    );
  }

  const canSendText = !disabled && !recording && text.trim().length >= 3;
  let title = "Toque e fale a venda";
  if (recording) title = "Gravando… toque para parar";
  if (draftSale.isPending) title = "Montando a venda…";

  return (
    <View style={{ gap: spacing["2xl"] }}>
      <View
        style={{ alignItems: "center", gap: spacing.xl, paddingVertical: spacing.lg }}
      >
        <Typography variant="h2" color={palette.wine} style={{ textAlign: "center" }}>
          {title}
        </Typography>
        <MicButton
          recording={recording}
          busy={draftSale.isPending}
          disabled={disabled}
          onPress={() => void toggleRecording()}
        />
        <Typography
          variant="body"
          color={theme.colors.textSecondary}
          style={{ textAlign: "center" }}
        >
          Fale do seu jeito, por exemplo:
        </Typography>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          {EXAMPLES.map((example) => (
            <View
              key={example}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Typography variant="bodyBold">{example}</Typography>
            </View>
          ))}
        </View>
      </View>
      <FormField label="Prefere escrever?">
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <TextField
              accessibilityLabel="O que você vendeu"
              placeholder="Ex: 2 brigadeiros pra Ana, dinheiro"
              value={text}
              onChangeText={setText}
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (text.trim().length >= 3) void send({ text: text.trim() });
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Montar venda"
            disabled={
              disabled || recording || draftSale.isPending || text.trim().length < 3
            }
            onPress={() => void send({ text: text.trim() })}
            style={({ pressed }) => ({
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: palette.rose,
              alignItems: "center",
              justifyContent: "center",
              opacity: sendOpacity(canSendText, pressed),
            })}
          >
            <AppIcon name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </FormField>
    </View>
  );
}
