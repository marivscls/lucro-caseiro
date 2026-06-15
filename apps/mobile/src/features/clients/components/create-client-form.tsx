import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert } from "react-native";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { brToIso, maskDateBR } from "../../../shared/utils/date";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useCreateClient } from "../hooks";
import { TagInput } from "./tag-input";
import { alertValidation, alertError } from "../../../shared/utils/alerts";

interface CreateClientFormProps {
  onSuccess?: () => void;
}

export function CreateClientForm({ onSuccess }: Readonly<CreateClientFormProps>) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const createClient = useCreateClient();
  const { checkAndBlock: checkClientLimit } = useLimitCheck("clients");

  async function handleSubmit() {
    if (checkClientLimit()) return;

    if (!name.trim()) {
      alertValidation("Coloque o nome do cliente");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
      alertValidation("Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
      return;
    }

    try {
      await createClient.mutateAsync({
        name: name.trim(),
        phone: trimmedPhone || undefined,
        address: address.trim() || undefined,
        birthday: brToIso(birthday),
        notes: notes.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      Alert.alert(
        "Cliente cadastrado!",
        `${name} foi adicionado a sua lista de clientes`,
      );
      onSuccess?.();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível cadastrar o cliente. Tente novamente.";
      alertError(message);
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }}
    >
      <Typography variant="h2">Novo cliente</Typography>

      <Input
        label="Nome do cliente"
        placeholder="Ex: Maria Silva, Joao..."
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
        placeholder="Anotacoes sobre o cliente..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
      />

      <TagInput tags={tags} onChange={setTags} />

      <Button
        title="Cadastrar cliente"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createClient.isPending}
      />
    </KeyboardAwareScrollView>
  );
}
