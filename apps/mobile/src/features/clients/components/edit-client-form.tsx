import type { Client } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { useUpdateClient } from "../hooks";
import { TagInput } from "./tag-input";

interface EditClientFormProps {
  client: Client;
  onSuccess?: () => void;
}

export function EditClientForm({ client, onSuccess }: Readonly<EditClientFormProps>) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [birthday, setBirthday] = useState(client.birthday ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [tags, setTags] = useState<string[]>(client.tags ?? []);

  const updateClient = useUpdateClient();

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Opa!", "Coloque o nome do cliente");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && trimmedPhone.length < 8) {
      Alert.alert("Opa!", "O telefone precisa ter pelo menos 8 digitos");
      return;
    }

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          name: name.trim(),
          phone: trimmedPhone || undefined,
          address: address.trim() || undefined,
          birthday: birthday.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        },
      });
      Alert.alert("Cliente atualizado!", `${name} foi atualizado`);
      onSuccess?.();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Nao foi possivel atualizar o cliente. Tente novamente.";
      Alert.alert("Erro", message);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Typography variant="h2">Editar cliente</Typography>

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
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Input
        label="Endereco (opcional)"
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
        label="Observacoes (opcional)"
        placeholder="Anotacoes sobre o cliente..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
      />

      <TagInput tags={tags} onChange={setTags} />

      <Button
        title="Salvar alteracoes"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={updateClient.isPending}
      />
    </ScrollView>
  );
}
