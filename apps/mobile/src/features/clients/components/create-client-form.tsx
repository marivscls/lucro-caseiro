import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useCreateClient } from "../hooks";
import { TagInput } from "./tag-input";

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
      Alert.alert("Opa!", "Coloque o nome do cliente");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
      Alert.alert("Opa!", "Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
      return;
    }

    try {
      await createClient.mutateAsync({
        name: name.trim(),
        phone: trimmedPhone || undefined,
        address: address.trim() || undefined,
        birthday: birthday.trim() || undefined,
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
      Alert.alert("Erro", message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
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
        placeholder="AAAA-MM-DD"
        value={birthday}
        onChangeText={setBirthday}
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
    </ScrollView>
  );
}
