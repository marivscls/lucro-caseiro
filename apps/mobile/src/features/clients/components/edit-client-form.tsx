import { Typography, useTheme } from "@lucro-caseiro/ui";
import { ClientFormFields } from "./client-form-fields";
import { AppIcon } from "../../../shared/components/app-icon";
import { useFormValidation } from "../../../shared/hooks/use-form-validation";
import type { Client } from "@lucro-caseiro/contracts";
import { Button, Input, spacing } from "@lucro-caseiro/ui";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { brToIso, isoToBR, maskDateBR } from "../../../shared/utils/date";
import { phoneDuplicateKey } from "../../../shared/utils/duplicates";
import { isValidBrazilPhone, maskPhoneBR } from "../../../shared/utils/phone";
import { useClients, useUpdateClient } from "../hooks";
import { showToast } from "../../../shared/components/toast";
import { alertValidation, alertError } from "../../../shared/utils/alerts";
import { ApiError } from "../../../shared/utils/api-client";
import { StandardModal } from "../../../shared/components/standard-modal";
import {
  desktopAction,
  desktopCompactField,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

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
  const isDesktop = useDesktopLayout();
  const { theme } = useTheme();
  const [contactExpanded, setContactExpanded] = useState(
    !!(client.nextContactAt || client.nextContactReason || client.nextContactNotes),
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
    },
    visible,
  );

  async function handleSubmit() {
    if (!formValidation.validate()) return;
    if (submittingRef.current || updateClient.isPending) return;
    submittingRef.current = true;

    try {
      if (!name.trim()) {
        alertValidation("Coloque o nome do cliente.");
        return;
      }

      const trimmedPhone = phone.trim();
      if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
        alertValidation("Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
        return;
      }

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
      dismissDisabled={updateClient.isPending}
      visible={visible}
      onClose={onClose}
      footer={
        <View
          style={{
            flexDirection: "row",
            justifyContent: isDesktop ? "flex-end" : undefined,
            width: "100%",
          }}
        >
          <Button
            title="Salvar alterações"
            size="lg"
            onPress={() => {
              void handleSubmit();
            }}
            loading={updateClient.isPending}
            disabled={updateClient.isPending}
            icon={
              <AppIcon name="checkmark" size={20} color={theme.colors.textOnPrimary} />
            }
            style={isDesktop ? desktopAction(isDesktop, 220) : { flex: 1 }}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.xl }}>
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
        />
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: spacing.md,
            gap: spacing.md,
          }}
        >
          <Pressable
            onPress={() => setContactExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel="Próximo contato"
            accessibilityState={{ expanded: contactExpanded }}
            style={({ pressed }) => ({
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <AppIcon
              name="calendar-outline"
              size={20}
              color={theme.colors.primaryStrong}
            />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Typography variant="bodyBold">Próximo contato</Typography>
              <Typography variant="caption">
                Combine uma data para falar com o cliente.
              </Typography>
            </View>
            <AppIcon
              name={contactExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
          {contactExpanded && (
            <View style={{ gap: spacing.lg }}>
              <View
                style={{ flexDirection: isDesktop ? "row" : "column", gap: spacing.md }}
              >
                <View style={desktopCompactField(isDesktop)}>
                  <Input
                    label="Próximo contato (opcional)"
                    placeholder="DD/MM/AAAA"
                    value={nextContactAt}
                    onChangeText={(value) => setNextContactAt(maskDateBR(value))}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={isDesktop ? { flex: 1 } : undefined}>
                  <Input
                    label="Motivo do próximo contato"
                    placeholder="Ex.: confirmar encomenda"
                    value={nextContactReason}
                    onChangeText={setNextContactReason}
                    maxLength={200}
                  />
                </View>
              </View>

              <Input
                label="Nota para o contato"
                placeholder="Ex.: perguntar quantidade final"
                value={nextContactNotes}
                onChangeText={setNextContactNotes}
                maxLength={500}
                multiline
                numberOfLines={2}
                style={{ height: 78, textAlignVertical: "center" }}
              />
            </View>
          )}
        </View>
      </View>
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
