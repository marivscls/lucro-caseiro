import type { Supplier } from "@lucro-caseiro/contracts";
import { Button, Input, Typography } from "@lucro-caseiro/ui";
import React, { useState } from "react";

import { KeyboardAwareScrollView } from "../../../shared/components/keyboard-aware-scroll-view";
import { useLimitCheck } from "../../../shared/hooks/use-limit-check";
import { usePaywall } from "../../../shared/hooks/use-paywall";
import { showAlert } from "../../../shared/components/alert-store";
import { ApiError } from "../../../shared/utils/api-client";
import { alertError, alertValidation } from "../../../shared/utils/alerts";
import { digitsOnly, duplicateKey } from "../../../shared/utils/duplicates";
import { isValidEmail } from "../../../shared/utils/email";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useCreateSupplier, useSuppliers } from "../hooks";

interface CreateSupplierFormProps {
  // Recebe o fornecedor criado para quem quiser auto-selecioná-lo (ex.: SupplierSelector).
  onSuccess?: (supplier?: Supplier) => void;
}

export function CreateSupplierForm({ onSuccess }: Readonly<CreateSupplierFormProps>) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const createSupplier = useCreateSupplier();
  const { checkAndBlock: checkSupplierLimit } = useLimitCheck("suppliers");
  const showPaywall = usePaywall((s) => s.show);
  const { data: matchingSuppliers } = useSuppliers({
    search: name.trim() || phone.trim() || "__sem_nome__",
  });

  async function handleSubmit() {
    if (checkSupplierLimit()) return;

    if (!name.trim()) {
      alertValidation("Coloque o nome do fornecedor");
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

    const normalizedName = duplicateKey(name);
    const phoneDigits = digitsOnly(trimmedPhone);
    const normalizedEmail = duplicateKey(trimmedEmail);
    const duplicate = matchingSuppliers?.items.find((supplier) => {
      const sameName = duplicateKey(supplier.name) === normalizedName;
      const samePhone = !!phoneDigits && digitsOnly(supplier.phone) === phoneDigits;
      const sameEmail =
        !!normalizedEmail && duplicateKey(supplier.email) === normalizedEmail;
      return sameName || samePhone || sameEmail;
    });
    if (duplicate) {
      showAlert({
        title: "Fornecedor já cadastrado",
        message:
          "Esse fornecedor já existe ou usa um contato já cadastrado. Abra o cadastro existente para editar.",
      });
      return;
    }

    try {
      const created = await createSupplier.mutateAsync({
        name: name.trim(),
        phone: trimmedPhone || undefined,
        email: trimmedEmail || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showAlert({
        title: "Fornecedor cadastrado!",
        message: `${name} foi adicionado à sua lista de fornecedores`,
      });
      onSuccess?.(created);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code === "LIMIT_EXCEEDED") {
        showPaywall("suppliers");
        return;
      }
      const message =
        e instanceof Error
          ? e.message
          : "Não foi possível cadastrar o fornecedor. Tente novamente.";
      alertError(message);
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }}
    >
      <Typography variant="h2">Novo fornecedor</Typography>

      <Input
        label="Nome do fornecedor"
        placeholder="Ex: Atacadão da Festa, Doce Sabor..."
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
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button
        title="Cadastrar fornecedor"
        size="lg"
        onPress={() => {
          void handleSubmit();
        }}
        loading={createSupplier.isPending}
      />
    </KeyboardAwareScrollView>
  );
}
