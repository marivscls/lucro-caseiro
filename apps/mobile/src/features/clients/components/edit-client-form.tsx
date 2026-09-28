import { CalendarDateField } from "../../../shared/components/calendar-date-field";
import { ClientFormFields } from "./client-form-fields";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Client } from "@lucro-caseiro/contracts";
import { Button } from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";

import { brToIso, isoToBR } from "../../../shared/utils/date";
import { phoneDuplicateKey } from "../../../shared/utils/duplicates";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useClients, useUpdateClient } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { ApiError } from "../../../shared/utils/api-client";
import { StandardModal } from "../../../shared/components/standard-modal";
import { FormField, TextField } from "../../../shared/components/form-field";
import { FormActions, FormBody, FormGrid } from "../../../shared/components/form-layout";
import { FormSection } from "../../../shared/components/form-section";

interface EditClientFormProps {
  client: Client;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditClientForm({
  client,
  visible,
  onClose,
  onSuccess,
}: Readonly<EditClientFormProps>) {
  const hasNextContact = !!(
    client.nextContactAt ||
    client.nextContactReason ||
    client.nextContactNotes
  );
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(maskPhoneBR(client.phone ?? ""));
  const [address, setAddress] = useState(client.address ?? "");
  const [birthday, setBirthday] = useState(isoToBR(client.birthday));
  const [notes, setNotes] = useState(client.notes ?? "");
  const [nextContactAt, setNextContactAt] = useState(isoToBR(client.nextContactAt));
  const [nextContactReason, setNextContactReason] = useState(
    client.nextContactReason ?? "",
  );
  const [nextContactNotes, setNextContactNotes] = useState(client.nextContactNotes ?? "");
  const submittingRef = useRef(false);

  const updateClient = useUpdateClient();
  const { data: matchingClients, refetch: refetchMatchingClients } = useClients({
    search: phone.trim() || "__sem_telefone__",
  });

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome do cliente.",
      phone:
        !!phone.trim() &&
        !isValidBrazilPhone(phone.trim()) &&
        "Use DDD + número, ex: (11) 99999-9999.",
    },
    visible,
  );

  async function handleSubmit() {
    if (!formValidation.validate()) return;
    if (submittingRef.current || updateClient.isPending) return;
    submittingRef.current = true;

    try {
      const trimmedPhone = phone.trim();

      const phoneDigits = phoneDuplicateKey(trimmedPhone);
      let duplicateCandidates = matchingClients?.items ?? [];
      if (phoneDigits) {
        const refreshedClients = await refetchMatchingClients();
        duplicateCandidates = refreshedClients.data?.items ?? duplicateCandidates;
      }
      const duplicate = duplicateCandidates.find(
        (item) => item.id !== client.id && phoneDuplicateKey(item.phone) === phoneDigits,
      );
      if (duplicate) {
        alertValidation(
          "Esse telefone já está cadastrado em outro cliente. Abra o cadastro existente para editar.",
        );
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
            nextContactAt: brToIso(nextContactAt),
            nextContactReason: nextContactReason.trim() || null,
            nextContactNotes: nextContactNotes.trim() || null,
          },
        });
        showToast(`${name} atualizado!`);
        onSuccess?.();
      } catch (e: unknown) {
        let duplicateAfterFailure = false;
        if (phoneDigits) {
          try {
            const refreshedClients = await refetchMatchingClients();
            duplicateAfterFailure =
              refreshedClients.data?.items.some(
                (item) =>
                  item.id !== client.id && phoneDuplicateKey(item.phone) === phoneDigits,
              ) ?? false;
          } catch {
            duplicateAfterFailure = false;
          }
        }
        if (duplicateAfterFailure || isClientDuplicateError(e)) {
          alertValidation(
            "Esse telefone já está cadastrado em outro cliente. Abra o cadastro existente para editar.",
          );
          return;
        }
        const message =
          e instanceof Error
            ? e.message
            : "Não foi possível atualizar o cliente. Tente novamente.";
        alertError(message);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <StandardModal
      title="Editar cliente"
      subtitle="Só o nome é obrigatório. Mantenha os dados sempre por perto."
      size="form"
      dismissDisabled={updateClient.isPending}
      visible={visible}
      onClose={onClose}
      footer={
        <FormActions>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            disabled={updateClient.isPending}
          />
          <Button
            title="Salvar alterações"
            onPress={() => {
              void handleSubmit();
            }}
            loading={updateClient.isPending}
          />
        </FormActions>
      }
    >
      <FormBody>
        <ClientFormFields
          name={name}
          phone={phone}
          address={address}
          birthday={birthday}
          notes={notes}
          onNameChange={setName}
          onPhoneChange={setPhone}
          onAddressChange={setAddress}
          onBirthdayChange={setBirthday}
          onNotesChange={setNotes}
          nameValidation={formValidation.field("name")}
          phoneValidation={formValidation.field("phone")}
        />
        <FormSection
          title="Próximo contato"
          subtitle="Combine uma data para falar com o cliente."
          initiallyOpen={hasNextContact}
        >
          <FormGrid>
            <CalendarDateField
              optional
              label="Data do contato"
              value={nextContactAt}
              onChange={setNextContactAt}
              accessibilityLabel="Data do próximo contato"
            />
            <FormField label="Motivo" optional>
              <TextField
                accessibilityLabel="Motivo do próximo contato"
                placeholder="Ex.: confirmar encomenda"
                value={nextContactReason}
                onChangeText={setNextContactReason}
                maxLength={200}
              />
            </FormField>
            <FormField label="Nota para o contato" optional span="full">
              <TextField
                accessibilityLabel="Nota para o contato"
                placeholder="Ex.: perguntar quantidade final"
                value={nextContactNotes}
                onChangeText={setNextContactNotes}
                maxLength={500}
                multiline
              />
            </FormField>
          </FormGrid>
        </FormSection>
      </FormBody>
    </StandardModal>
  );
}

function isClientDuplicateError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;

  const message = error.message.toLowerCase();
  return (
    error.code === "VALIDATION_ERROR" &&
    message.includes("telefone") &&
    message.includes("cadastrado")
  );
}
