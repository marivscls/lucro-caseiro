import type { Client } from "@lucro-caseiro/contracts";
import { Button, Input, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClients } from "../hooks";
import { desktopModalSurface } from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { ResponsiveOverlayModal } from "../../../shared/components/responsive-modal-surface";

type ClientOption = Pick<Client, "id" | "name">;

interface ClientPickerModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelect: (client: ClientOption | null) => void;
}

export function ClientPickerModal({
  visible,
  onClose,
  onSelect,
}: Readonly<ClientPickerModalProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useClients({ search: search.trim() || undefined });
  const clients = data?.items ?? [];

  function select(client: ClientOption | null) {
    onSelect(client);
    onClose();
  }

  return (
    <ResponsiveOverlayModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: isDesktop ? "center" : "flex-end",
          padding: isDesktop ? spacing.xl : 0,
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            {
              maxHeight: "78%",
              borderTopLeftRadius: radii["2xl"],
              borderTopRightRadius: radii["2xl"],
              backgroundColor: theme.colors.surfaceElevated,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom,
              gap: spacing.md,
            },
            desktopModalSurface(isDesktop, 640),
          ]}
        >
          <Typography variant="h3" color={theme.colors.text}>
            Selecionar cliente
          </Typography>
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChangeText={setSearch}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => select(null)}
            style={{
              minHeight: 52,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="bodyBold" color={theme.colors.text}>
              Sem cliente (avulso)
            </Typography>
          </Pressable>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => select(item)}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: spacing.sm,
                    justifyContent: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <Typography variant="body" color={theme.colors.text}>
                    {item.name}
                  </Typography>
                </Pressable>
              )}
              ListEmptyComponent={
                <Typography
                  variant="caption"
                  color={theme.colors.textSecondary}
                  style={{ textAlign: "center", padding: spacing.md }}
                >
                  Nenhum cliente encontrado
                </Typography>
              }
            />
          )}
          <Button title="Fechar" onPress={onClose} />
        </View>
      </View>
    </ResponsiveOverlayModal>
  );
}
