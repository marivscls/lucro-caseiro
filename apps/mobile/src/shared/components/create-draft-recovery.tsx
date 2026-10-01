import { Button, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Platform, View } from "react-native";
import {
  createFormDrafts,
  useCreateDraftRecord,
} from "../form-drafts/use-create-form-draft";
import type { CreateDraftFeature } from "../form-drafts/schemas";

export function CreateDraftRecovery({
  feature,
  onResume,
  hidden = false,
}: Readonly<{
  feature: CreateDraftFeature;
  onResume: () => void;
  hidden?: boolean;
}>) {
  const { theme } = useTheme();
  const { userId, record } = useCreateDraftRecord(feature);
  if (hidden || !userId || !record) return null;
  return (
    <View
      style={{
        padding: spacing.md,
        gap: spacing.sm,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Typography variant="bodyBold">Você tem um cadastro não concluído</Typography>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Button title="Retomar cadastro" onPress={onResume} />
        <Button
          title="Descartar rascunho"
          variant="outline"
          onPress={() => createFormDrafts.discard(userId, feature)}
        />
      </View>
    </View>
  );
}

export function CreateDraftStatus({
  enabled = true,
  error,
  restored,
  onClear,
  hasPhoto = false,
}: Readonly<{
  enabled?: boolean;
  error: boolean;
  restored: boolean;
  onClear: () => void;
  hasPhoto?: boolean;
}>) {
  const { theme } = useTheme();
  if (!enabled) return null;
  const location =
    Platform.OS === "web" ? "Guardado só nesta aba" : "Guardado neste dispositivo";
  const resumed = restored ? "Rascunho retomado. " : "";
  let message = `${resumed}${location} por até 24 horas. Cancelar ou fechar descarta.`;
  if (hasPhoto) message += " Fotos precisam ser escolhidas novamente ao retomar.";
  if (error)
    message =
      "Não foi possível guardar o rascunho. Mantenha esta tela aberta até salvar.";
  return (
    <View style={{ paddingBottom: spacing.md, gap: spacing.sm }}>
      <Typography
        variant="caption"
        color={error ? theme.colors.alert : theme.colors.textSecondary}
      >
        {message}
      </Typography>
      <Button title="Limpar rascunho" variant="ghost" onPress={onClear} />
    </View>
  );
}
