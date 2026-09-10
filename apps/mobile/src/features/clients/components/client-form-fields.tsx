import React, { useState } from "react";
import { Pressable, View } from "react-native";
import {
  Input,
  Typography,
  ValidationField,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import { CalendarModal } from "../../../shared/components/calendar-modal";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { maskDateBR } from "../../../shared/utils/date";
import { maskPhoneBR } from "../../../shared/utils/phone";

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
  nameValidation: Omit<React.ComponentProps<typeof ValidationField>, "children">;
}

/** The same field hierarchy and spacing in registration and editing. */
export function ClientFormFields(props: Readonly<ClientFormFieldsProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const [calendarVisible, setCalendarVisible] = useState(false);

  return (
    <View style={{ gap: spacing.lg }}>
      <ValidationField {...props.nameValidation}>
        <Input
          label="Nome do cliente *"
          accessibilityLabel="Nome do cliente"
          placeholder="Ex.: Maria Silva"
          value={props.name}
          onChangeText={props.onNameChange}
          autoCapitalize="words"
          autoComplete="name"
        />
      </ValidationField>
      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: spacing.lg }}>
        <Input
          label="Telefone"
          placeholder="(11) 99999-9999"
          value={props.phone}
          onChangeText={(value) => props.onPhoneChange(maskPhoneBR(value))}
          keyboardType="phone-pad"
          autoComplete="tel"
          containerStyle={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}
        />
        <View style={{ flex: isDesktop ? 1 : undefined, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
            <Input
              label="Aniversário"
              accessibilityLabel="Data de nascimento"
              placeholder="DD/MM/AAAA"
              value={props.birthday}
              onChangeText={(value) => props.onBirthdayChange(maskDateBR(value))}
              keyboardType="number-pad"
              maxLength={10}
              containerStyle={{ flex: 1 }}
            />
            <Pressable
              onPress={() => setCalendarVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir calendário de aniversário"
              style={({ pressed }) => ({
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.lg,
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <AppIcon
                name="calendar-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>
      <Input
        label="Endereço"
        placeholder="Rua, número e complemento"
        value={props.address}
        onChangeText={props.onAddressChange}
        autoComplete="street-address"
      />
      <View style={{ gap: spacing.xs }}>
        <Input
          label="Observações"
          placeholder="Preferências, pedidos especiais…"
          value={props.notes}
          onChangeText={(value) => props.onNotesChange(value.slice(0, 200))}
          multiline
          maxLength={200}
          style={{ height: 88, paddingVertical: spacing.md, textAlignVertical: "top" }}
        />
        <Typography
          variant="caption"
          style={{ alignSelf: "flex-end", fontVariant: ["tabular-nums"] }}
        >
          {props.notes.length}/200
        </Typography>
      </View>
      <CalendarModal
        visible={calendarVisible}
        value={props.birthday}
        onClose={() => setCalendarVisible(false)}
        onSelect={props.onBirthdayChange}
      />
    </View>
  );
}
