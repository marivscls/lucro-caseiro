import type { Supplier } from "@lucro-caseiro/contracts";
import { Button, Input, spacing } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { View } from "react-native";

import { StandardModal } from "../../../shared/components/standard-modal";
import { showToast } from "../../../shared/components/toast";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { isValidEmail } from "../../../shared/utils/email";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useUpdateSupplier } from "../hooks";

interface EditSupplierFormProps {
  supplier: Supplier;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditSupplierForm({
  supplier,
  visible,
  onClose,
  onSuccess,
}: Readonly<EditSupplierFormProps>) {
  const [name, setName] = useState(supplier.name);
  const [phone, setPhone] = useState(supplier.phone ?? "");
  const [email, setEmail] = useState(supplier.email ?? "");
  const [address, setAddress] = useState(supplier.address ?? "");
  const [notes, setNotes] = useState(supplier.notes ?? "");

  const updateSupplier = useUpdateSupplier();

  async function handleSubmit() {
    if (!name.trim()) {
      alertValidation("Coloque o nome do fornecedor.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
      alertValidation("Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      alertValidation("Email inválido. Confira o endereço digitado.");
      return;
    }

    try {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        data: {
          name: name.trim(),
          phone: trimmedPhone || undefined,
          email: trimmedEmail || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      showToast(`${name} atualizado!`);
      onSuccess?.();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar o fornecedor. Tente novamente.";
      alertError(message);
    }
  }

  return (
    <StandardModal
      title="Editar fornecedor"
      visible={visible}
      onClose={onClose}
      footer={
        <Button
          title="Salvar alterações"
          size="lg"
          onPress={() => {
            void handleSubmit();
          }}
          loading={updateSupplier.isPending}
          style={{ flex: 1 }}
        />
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.md }}>
        <Input
          label="Nome do fornecedor"
          placeholder="Ex: Atacadão da Festa..."
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Input
          label="Telefone / WhatsApp (opcional)"
          placeholder="Ex: (11) 99999-9999"
          value={phone}
          onChangeText={(v) => setPhone(maskPhoneBR(v))}
          keyboardType="phone-pad"
        />

        <Input
          label="Email (opcional)"
          placeholder="Ex: contato@fornecedor.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Endereço (opcional)"
          placeholder="Ex: Rua das Flores, 123"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Observações (opcional)"
          placeholder="O que você compra deste fornecedor..."
          value={notes}
          onChangeText={(value) => setNotes(value.slice(0, 500))}
          multiline
          numberOfLines={2}
          style={{ height: 78, textAlignVertical: "top", paddingTop: 12 }}
        />
      </View>
    </StandardModal>
  );
}
