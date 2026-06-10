import type { Client } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { brToIso, isoToBR, maskDateBR } from "../../../shared/utils/date";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useUpdateClient } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface EditClientFormProps {
  client: Client;
  onSuccess?: () => void;
}

export function EditClientForm({ client, onSuccess }: Readonly<EditClientFormProps>) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [birthday, setBirthday] = useState(isoToBR(client.birthday));
  const [notes, setNotes] = useState(client.notes ?? "");

  const updateClient = useUpdateClient();

  async function handleSubmit() {
    if (!name.trim()) {
      alertValidation("Coloque o nome do cliente.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
      alertValidation("Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
      return;
    }

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          name: name.trim(),
          phone: trimmedPhone || undefined,
          address: address.trim() || undefined,
          birthday: brToIso(birthday),
          notes: notes.trim() || undefined,
        },
      });
      showToast(`${name} atualizado!`);
      onSuccess?.();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar o cliente. Tente novamente.";
      alertError(message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
      >
        <Typography variant="h2" style={{ marginBottom: spacing.sm }}>
          Editar cliente
        </Typography>

        <Input
          label="Nome do cliente"
          placeholder="Ex: Maria Silva, João Pereira..."
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Input
          label="Telefone (opcional)"
          placeholder="Ex: (11) 99999-9999"
          value={phone}
          onChangeText={(v) => setPhone(maskPhoneBR(v))}
          keyboardType="phone-pad"
        />

        <Input
          label="Endereço (opcional)"
          placeholder="Ex: Rua das Flores, 123"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Data de nascimento (opcional)"
          placeholder="DD/MM/AAAA"
          value={birthday}
          onChangeText={(v) => setBirthday(maskDateBR(v))}
          keyboardType="number-pad"
        />

        <Input
          label="Observações (opcional)"
          placeholder="Anotações sobre o cliente..."
          value={notes}
          onChangeText={(value) => setNotes(value.slice(0, 200))}
          multiline
          numberOfLines={2}
          style={{ height: 78, textAlignVertical: "top", paddingTop: 12 }}
        />

        <View style={{ flex: 1 }} />

        <Button
          title="Salvar alterações"
          size="lg"
          onPress={() => {
            void handleSubmit();
          }}
          loading={updateClient.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
