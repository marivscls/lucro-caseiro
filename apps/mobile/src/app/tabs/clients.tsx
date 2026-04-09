import { Input, Typography, useTheme, spacing, radii } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClientDetail } from "../../features/clients/components/client-detail";
import { ClientList } from "../../features/clients/components/client-list";
import { CreateClientForm } from "../../features/clients/components/create-client-form";
import { EditClientForm } from "../../features/clients/components/edit-client-form";
import { useClient, useClients } from "../../features/clients/hooks";

type Screen =
  | { name: "list" }
  | { name: "detail"; clientId: string }
  | { name: "create" };

export default function ClientsScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const { data: clientsData } = useClients({});
  const { data: editingClient } = useClient(editingClientId ?? "");

  const goToList = useCallback(() => setScreen({ name: "list" }), []);
  const goToCreate = useCallback(() => setScreen({ name: "create" }), []);
  const goToDetail = useCallback(
    (id: string) => setScreen({ name: "detail", clientId: id }),
    [],
  );

  const totalClients = clientsData?.total ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {screen.name === "list" && (
        <>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              gap: spacing.xs,
            }}
          >
            <Typography variant="h1">Clientes</Typography>
            <Typography variant="label">{totalClients} CLIENTES CADASTRADOS</Typography>
          </View>

          {/* Search */}
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.lg,
              paddingBottom: spacing.sm,
            }}
          >
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChangeText={setSearch}
              icon={
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              }
            />
          </View>

          <ClientList
            search={search}
            onClientPress={goToDetail}
            onAddPress={goToCreate}
          />

          {/* FAB */}
          <Pressable
            style={{
              position: "absolute",
              bottom: 24,
              right: spacing.xl,
              width: 56,
              height: 56,
              borderRadius: radii.full,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6,
            }}
            onPress={goToCreate}
          >
            <Ionicons name="add" size={28} color={theme.colors.textOnPrimary} />
          </Pressable>
        </>
      )}

      {screen.name === "detail" && (
        <>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.sm,
            }}
          >
            <Pressable onPress={goToList}>
              <Typography variant="body" color={theme.colors.primary}>
                {"< Voltar"}
              </Typography>
            </Pressable>
          </View>
          <ClientDetail
            clientId={screen.clientId}
            onEditPress={() => setEditingClientId(screen.clientId)}
          />
        </>
      )}

      {/* Modal - Criar cliente */}
      <Modal
        visible={screen.name === "create"}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={goToList}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              padding: spacing.xl,
              paddingBottom: spacing.sm,
              alignItems: "flex-end",
            }}
          >
            <Pressable onPress={goToList}>
              <Typography variant="body" color={theme.colors.primary}>
                Cancelar
              </Typography>
            </Pressable>
          </View>
          <CreateClientForm onSuccess={goToList} />
        </SafeAreaView>
      </Modal>

      {/* Modal - Editar cliente */}
      {editingClientId && editingClient && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditingClientId(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View
              style={{
                padding: spacing.xl,
                paddingBottom: spacing.sm,
                alignItems: "flex-end",
              }}
            >
              <Pressable onPress={() => setEditingClientId(null)}>
                <Typography variant="body" color={theme.colors.primary}>
                  Cancelar
                </Typography>
              </Pressable>
            </View>
            <EditClientForm
              client={editingClient}
              onSuccess={() => setEditingClientId(null)}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
