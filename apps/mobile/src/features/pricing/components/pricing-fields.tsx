import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import {
  FormField,
  SelectField,
  TextField,
  useFieldPalette,
  type FormFieldProps,
} from "../../../shared/components/form-field";
import { FormActions } from "../../../shared/components/form-layout";
import { FormSection } from "../../../shared/components/form-section";
import { StandardModal } from "../../../shared/components/standard-modal";
import { maskCurrencyInput } from "../../../shared/utils/currency-input";
import { AppIcon } from "../../../shared/components/app-icon";

/** Campo numérico da precificação: dinheiro com "R$" ou número com unidade no fim. */
export function PricingField({
  label,
  value,
  onChange,
  money = true,
  suffix,
  optional,
  hint,
  validation,
  span,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  money?: boolean;
  /** Unidade depois do valor (ex.: "%", "min"). */
  suffix?: string;
  optional?: boolean;
  hint?: string;
  validation?: FormFieldProps["validation"];
  span?: FormFieldProps["span"];
}>) {
  return (
    <FormField
      label={label}
      optional={optional}
      hint={hint}
      validation={validation}
      span={span}
    >
      <TextField
        prefix={money ? "R$" : undefined}
        suffix={suffix}
        accessibilityLabel={label}
        value={value}
        keyboardType="decimal-pad"
        numericMode={money ? undefined : "decimal"}
        placeholder="0"
        onChangeText={(text) =>
          onChange(money ? maskCurrencyInput(text) : text.replace(/[^0-9,.]/g, ""))
        }
      />
    </FormField>
  );
}

/** Detalhe opcional da precificação: seção recolhível do padrão de formulários. */
export function PricingSection({
  title,
  summary,
  children,
  initiallyOpen = false,
}: Readonly<{
  title: string;
  summary: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}>) {
  return (
    <FormSection title={title} subtitle={summary} initiallyOpen={initiallyOpen}>
      {children}
    </FormSection>
  );
}

/**
 * Opção de uma lista (despesas cadastradas, canais salvos). Mesmo visual das
 * categorias do cadastro de produto: pílula de 44 px, selecionada em rosa.
 */
export function PricingChoice({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const pal = useFieldPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: "flex-start",
        maxWidth: "100%",
        minHeight: 44,
        paddingHorizontal: spacing.lg - (selected ? 1 : 0),
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.primaryStrong : pal.border,
        backgroundColor: selected ? theme.colors.primaryBg : pal.fieldBgFocus,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? (
        <AppIcon name="checkmark-circle" size={18} color={theme.colors.primaryStrong} />
      ) : null}
      <Typography
        variant="body"
        color={selected ? theme.colors.primaryStrong : theme.colors.text}
        style={{ flexShrink: 1 }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

/** Campo que abre uma lista pesquisável de cadastros (produto, embalagem, filtro). */
export function PricingPicker({
  title,
  action,
  items,
  onSelect,
  selectedLabel,
  emptyMessage = "Nenhum cadastro disponível para esta busca. Você pode informar o valor manualmente.",
}: Readonly<{
  title: string;
  action: string;
  items: Array<{ id: string; label: string; detail: string }>;
  onSelect: (id: string) => void;
  selectedLabel?: string;
  emptyMessage?: string;
}>) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const visible = items.filter((item) =>
    item.label.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <SelectField
        value={selectedLabel}
        placeholder={action}
        accessibilityLabel={action}
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
      />
      <StandardModal
        visible={open}
        title={title}
        onClose={() => setOpen(false)}
        footer={
          <FormActions>
            <Button title="Fechar" variant="outline" onPress={() => setOpen(false)} />
          </FormActions>
        }
      >
        <TextField
          icon="search-outline"
          accessibilityLabel={`Buscar em ${title}`}
          placeholder="Buscar pelo nome"
          value={search}
          onChangeText={setSearch}
        />
        <View>
          {visible.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              style={({ pressed }) => ({
                minHeight: 56,
                justifyContent: "center",
                gap: 2,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Typography variant="bodyBold">{item.label}</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {item.detail}
              </Typography>
            </Pressable>
          ))}
          {!visible.length ? (
            <Typography variant="body" color={theme.colors.textSecondary}>
              {emptyMessage}
            </Typography>
          ) : null}
        </View>
      </StandardModal>
    </>
  );
}
