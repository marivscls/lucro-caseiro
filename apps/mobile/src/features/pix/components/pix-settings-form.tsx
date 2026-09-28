import type { PixKeyType, PixSettings } from "@lucro-caseiro/contracts";
import { Button, Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { showAlert } from "../../../shared/components/alert-store";
import { ChoiceField, FormField, TextField } from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { SaleSuccessMark } from "../../../shared/components/motion-feedback";
import { showToast } from "../../../shared/components/toast";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import { alertError, errorMessage } from "../../../shared/utils/alerts";
import {
  PIX_KEY_KEYBOARDS,
  PIX_KEY_PLACEHOLDERS,
  hasPixKey,
  pixKeyError,
} from "../domain";
import { useUpdatePixSettings } from "../hooks";

const KEY_TYPES: PixKeyType[] = ["cpf_cnpj", "phone", "email", "random"];

/** Rótulos curtos para caberem dois por linha no celular ("Tipo de chave" já diz o resto). */
const KEY_TYPE_CHOICES: Record<PixKeyType, string> = {
  cpf_cnpj: "CPF ou CNPJ",
  phone: "Celular",
  email: "E-mail",
  random: "Aleatória",
};

/** Confirmação que aparece junto dos botões logo depois de salvar. */
function SavedNotice() {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingRight: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 16,
        backgroundColor: theme.colors.successBg,
      }}
    >
      <SaleSuccessMark />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="bodyBold" color={theme.colors.success}>
          Chave Pix salva!
        </Typography>
        <Typography variant="body" color={theme.colors.text}>
          Suas cobranças, recibos e orçamentos já saem com o Pix.
        </Typography>
      </View>
    </View>
  );
}

/** Cadastro da chave Pix usada nas cobranças, recibos e orçamentos. */
export function PixSettingsForm({
  settings,
  onSaved,
}: Readonly<{ settings: PixSettings | undefined; onSaved?: () => void }>) {
  const [keyType, setKeyType] = useState<PixKeyType>(settings?.pixKeyType ?? "cpf_cnpj");
  const [key, setKey] = useState(settings?.pixKey ?? "");
  const [city, setCity] = useState(settings?.pixCity ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const update = useUpdatePixSettings();

  useEffect(() => {
    if (!settings) return;
    setKeyType(settings.pixKeyType ?? "cpf_cnpj");
    setKey(settings.pixKey ?? "");
    setCity(settings.pixCity ?? "");
  }, [settings]);

  const validation = useFormValidation({ key: pixKeyError(keyType, key) });

  async function handleSave() {
    if (!validation.validate()) return;
    try {
      await update.mutateAsync({
        pixKeyType: keyType,
        pixKey: key.trim(),
        pixCity: city.trim() || null,
      });
      setSavedAt(Date.now());
      onSaved?.();
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  function handleRemove() {
    showAlert({
      title: "Remover chave Pix?",
      message: "As cobranças voltam a sair sem o Pix copia e cola.",
      buttons: [
        { text: "Voltar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => {
            update
              .mutateAsync({ pixKeyType: null, pixKey: null, pixCity: null })
              .then(() => {
                setKey("");
                setSavedAt(null);
                showToast("Chave Pix removida.");
              })
              .catch((error: unknown) => alertError(errorMessage(error)));
          },
        },
      ],
    });
  }

  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.xl }}>
      <FormBody>
        <FormField label="Tipo de chave">
          <ChoiceField
            value={keyType}
            accessibilityLabel="Tipo de chave Pix"
            columns={2}
            options={KEY_TYPES.map((value) => ({
              value,
              label: KEY_TYPE_CHOICES[value],
            }))}
            onChange={(value) => {
              setKeyType(value);
              setKey("");
              setSavedAt(null);
            }}
          />
        </FormField>
        <FormGrid>
          <FormField label="Sua chave Pix" validation={validation.field("key")}>
            <TextField
              icon="key-outline"
              accessibilityLabel="Sua chave Pix"
              placeholder={PIX_KEY_PLACEHOLDERS[keyType]}
              value={key}
              onChangeText={(text) => {
                setKey(text);
                setSavedAt(null);
              }}
              keyboardType={PIX_KEY_KEYBOARDS[keyType]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FormField>
          <FormField
            label="Sua cidade"
            optional
            hint="Aparece no app do banco de quem paga."
          >
            <TextField
              icon="location-outline"
              accessibilityLabel="Sua cidade"
              placeholder="Ex: Recife"
              value={city}
              onChangeText={setCity}
              maxLength={40}
            />
          </FormField>
        </FormGrid>
      </FormBody>
      {savedAt ? <SavedNotice key={savedAt} /> : null}
      <FormActions stack>
        {hasPixKey(settings) ? (
          <Button title="Remover chave" variant="outline" onPress={handleRemove} />
        ) : null}
        <Button
          title="Salvar chave Pix"
          loading={update.isPending}
          onPress={() => {
            void handleSave();
          }}
        />
      </FormActions>
    </Card>
  );
}
