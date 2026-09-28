import React from "react";
import { Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { CalendarDateField } from "../../../shared/components/calendar-date-field";
import {
  FormField,
  TextField,
  type FormFieldProps,
} from "../../../shared/components/form-field";
import { FormGrid } from "../../../shared/components/form-layout";
import { maskPhoneBR } from "../../../shared/utils/phone";

const NOTES_MAX = 200;

type Validation = FormFieldProps["validation"];

interface ClientFormFieldsProps {
  name: string;
  phone: string;
  address: string;
  birthday: string;
  notes: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onBirthdayChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  nameValidation: Validation;
  phoneValidation?: Validation;
}

/** Os mesmos campos, na mesma ordem, no cadastro e na edição do cliente. */
export function ClientFormFields(props: Readonly<ClientFormFieldsProps>) {
  const { theme } = useTheme();

  return (
    <FormGrid>
      <FormField label="Nome do cliente" validation={props.nameValidation} span="full">
        <TextField
          icon="person-outline"
          accessibilityLabel="Nome do cliente"
          placeholder="Ex.: Maria Silva"
          value={props.name}
          onChangeText={props.onNameChange}
          autoCapitalize="words"
          autoComplete="name"
        />
      </FormField>
      <FormField label="Telefone" optional validation={props.phoneValidation}>
        <TextField
          icon="call-outline"
          accessibilityLabel="Telefone"
          placeholder="(11) 99999-9999"
          value={props.phone}
          onChangeText={(value) => props.onPhoneChange(maskPhoneBR(value))}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </FormField>
      <CalendarDateField
        optional
        label="Aniversário"
        value={props.birthday}
        onChange={props.onBirthdayChange}
        accessibilityLabel="Data de nascimento"
      />
      <FormField label="Endereço" optional span="full">
        <TextField
          icon="location-outline"
          accessibilityLabel="Endereço"
          placeholder="Rua, número e complemento"
          value={props.address}
          onChangeText={props.onAddressChange}
          autoComplete="street-address"
        />
      </FormField>
      <FormField label="Observações" optional span="full">
        <TextField
          accessibilityLabel="Observações"
          placeholder="Preferências, pedidos especiais…"
          value={props.notes}
          onChangeText={(value) => props.onNotesChange(value.slice(0, NOTES_MAX))}
          multiline
          maxLength={NOTES_MAX}
        />
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{
            alignSelf: "flex-end",
            marginTop: spacing.xs,
            fontVariant: ["tabular-nums"],
          }}
        >
          {props.notes.length}/{NOTES_MAX}
        </Typography>
      </FormField>
    </FormGrid>
  );
}
