import React, { useState } from "react";
import { useFieldValidationError } from "@lucro-caseiro/ui";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Input, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import { FieldLabel, TextFieldCard } from "../../../shared/components/form-field";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";
import { maskCurrencyInput } from "../../../shared/utils/currency-input";
import { AppIcon } from "../../../shared/components/app-icon";
import { useBrandScreenPalette } from "../../../shared/brand-palette";

export function PricingField({
  label,
  value,
  onChange,
  money = true,
  hint,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  money?: boolean;
  hint?: string;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <FieldLabel label={label} />
      <TextFieldCard
        icon={money ? "cash-outline" : "calculator-outline"}
        prefix={money ? "R$" : undefined}
        accessibilityLabel={label}
        value={value}
        keyboardType="decimal-pad"
        placeholder="0"
        onChangeText={(text) =>
          onChange(money ? maskCurrencyInput(text) : text.replace(/[^0-9,.]/g, ""))
        }
      />
      {hint ? (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

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
  const { theme } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const validationError = useFieldValidationError();
  React.useEffect(() => {
    if (validationError) setOpen(true);
  }, [validationError]);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radii.lg,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          padding: spacing.lg,
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Typography variant="bodyBold">{title}</Typography>
          <Typography variant="caption" color={theme.colors.textSecondary}>
            {summary}
          </Typography>
        </View>
        <AppIcon
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.textSecondary}
        />
      </Pressable>
      {open ? (
        <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.lg }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

export function PricingChoice({
  label,
  selected,
  onPress,
}: Readonly<{ label: string; selected: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = useBrandScreenPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: selected ? palette.wine : theme.colors.border,
        backgroundColor: theme.colors.surface,
        padding: spacing.md,
        minHeight: 44,
        borderRadius: radii.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      {selected ? (
        <AppIcon name="checkmark-circle" size={18} color={palette.wine} />
      ) : null}
      <Typography variant="captionBold" style={{ flexShrink: 1 }}>
        {label}
      </Typography>
    </Pressable>
  );
}

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
      {selectedLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${selectedLabel}`}
          accessibilityState={{ expanded: open }}
          onPress={() => {
            setSearch("");
            setOpen(true);
          }}
          style={{
            minHeight: 48,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: radii.md,
            backgroundColor: theme.colors.surfaceElevated,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Typography variant="body" style={{ flex: 1, minWidth: 0 }}>
            {selectedLabel}
          </Typography>
          <AppIcon name="chevron-down" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      ) : (
        <Button
          title={action}
          variant="outline"
          onPress={() => {
            setSearch("");
            setOpen(true);
          }}
        />
      )}
      <ResponsiveOverlayModal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            padding: spacing.lg,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.colors.overlay,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "85%",
              padding: spacing.lg,
              gap: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Typography variant="h3">{title}</Typography>
            <Input
              accessibilityLabel={`Buscar em ${title}`}
              placeholder="Buscar pelo nome"
              value={search}
              onChangeText={setSearch}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {visible.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: spacing.md,
                    borderBottomWidth: 1,
                    borderColor: theme.colors.border,
                    minHeight: 48,
                  }}
                >
                  <Typography variant="bodyBold">{item.label}</Typography>
                  <Typography variant="caption" color={theme.colors.textSecondary}>
                    {item.detail}
                  </Typography>
                </Pressable>
              ))}
              {!visible.length ? (
                <Typography variant="body">{emptyMessage}</Typography>
              ) : null}
            </ScrollView>
            <Button title="Fechar" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </ResponsiveOverlayModal>
    </>
  );
}
