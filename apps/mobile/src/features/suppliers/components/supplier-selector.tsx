import { Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useFieldPalette } from "../../../shared/components/form-field";
import { useSuppliers } from "../hooks";
import { CreateSupplierForm } from "./create-supplier-form";
import {
  ResponsiveModal,
  ResponsiveOverlayModal,
} from "../../../shared/components/responsive-modal-surface";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";

interface SupplierSelectorProps {
  /** id do fornecedor selecionado, ou null. */
  readonly value: string | null;
  readonly onChange: (supplierId: string | null) => void;
}

/**
 * Campo reutilizável para escolher um fornecedor cadastrado (ou nenhum).
 * Abre um bottom-sheet com busca + opção de cadastrar um novo na hora.
 */
export function SupplierSelector({ value, onChange }: SupplierSelectorProps) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = useFieldPalette();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useSuppliers();
  const suppliers = data?.items ?? [];
  const selected = suppliers.find((s) => s.id === value) ?? null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [suppliers, search]);

  function pick(id: string | null) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Escolher fornecedor"
        style={{
          minHeight: 60,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pal.border,
          backgroundColor: pal.fieldBg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          gap: spacing.md,
        }}
      >
        <AppIcon name="business-outline" size={22} color={theme.colors.primary} />
        <Typography
          variant="body"
          color={selected ? theme.colors.text : pal.placeholder}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {selected ? selected.name : "Selecionar fornecedor (opcional)"}
        </Typography>
        {selected ? (
          <Pressable
            onPress={() => pick(null)}
            hitSlop={8}
            accessibilityLabel="Remover fornecedor"
          >
            <AppIcon name="close-circle" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        ) : (
          <AppIcon name="chevron-down" size={20} color={theme.colors.textSecondary} />
        )}
      </Pressable>

      {/* Bottom sheet de seleção */}
      <ResponsiveOverlayModal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: isDesktop ? "center" : "flex-end",
            padding: isDesktop ? spacing.xl : 0,
          }}
        >
          <Pressable
            style={[
              {
                backgroundColor: pal.sheetBg,
                borderTopLeftRadius: radii["2xl"],
                borderTopRightRadius: radii["2xl"],
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
                paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom,
                gap: spacing.sm,
                maxHeight: "75%",
              },
              desktopModalSurface(isDesktop, 640),
            ]}
          >
            <Typography variant="h3" color={theme.colors.text}>
              Fornecedor
            </Typography>

            {/* Busca */}
            <View
              style={{
                minHeight: 48,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: pal.border,
                backgroundColor: pal.fieldBg,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.md,
                gap: spacing.sm,
              }}
            >
              <AppIcon
                name="search-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar..."
                placeholderTextColor={pal.placeholder}
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  fontSize: 16,
                  paddingVertical: 0,
                }}
              />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
            >
              {/* Nenhum */}
              <Pressable
                onPress={() => pick(null)}
                accessibilityRole="button"
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: value === null ? theme.colors.primary : pal.border,
                  backgroundColor: pal.fieldBg,
                }}
              >
                <Typography variant="body" color={theme.colors.textSecondary}>
                  Nenhum fornecedor
                </Typography>
              </Pressable>

              {visible.map((s) => {
                const active = s.id === value;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => pick(s.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      minHeight: 48,
                      justifyContent: "center",
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : pal.border,
                      backgroundColor: active ? `${theme.colors.primary}1f` : pal.fieldBg,
                    }}
                  >
                    <Typography variant="bodyBold" color={theme.colors.text}>
                      {s.name}
                    </Typography>
                    {s.phone ? (
                      <Typography variant="caption" color={theme.colors.textSecondary}>
                        {s.phone}
                      </Typography>
                    ) : null}
                  </Pressable>
                );
              })}

              {visible.length === 0 && search.trim() ? (
                <Typography
                  variant="caption"
                  color={theme.colors.textSecondary}
                  style={{ textAlign: "center", paddingVertical: spacing.md }}
                >
                  Nenhum fornecedor encontrado.
                </Typography>
              ) : null}
            </ScrollView>

            {/* Cadastrar novo */}
            <Pressable
              onPress={() => setCreating(true)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radii.lg,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: theme.colors.primaryLight,
                backgroundColor: theme.colors.primaryBg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppIcon name="add-circle-outline" size={22} color={theme.colors.primary} />
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Cadastrar novo fornecedor
              </Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>

      {/* Modal de criar fornecedor (auto-seleciona o criado) */}
      <ResponsiveModal
        desktopMaxWidth={840}
        visible={creating}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreating(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setCreating(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <AppIcon name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography variant="h1" color={theme.colors.text} style={{ flex: 1 }}>
              Novo fornecedor
            </Typography>
          </View>
          <CreateSupplierForm
            onSuccess={(created) => {
              setCreating(false);
              if (created) pick(created.id);
            }}
          />
        </SafeAreaView>
      </ResponsiveModal>
    </>
  );
}
