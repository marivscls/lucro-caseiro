import type { Client } from "@lucro-caseiro/contracts";
import { Button, EmptyState, Typography, useTheme, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

import { useClients } from "../hooks";
import { ClientCard } from "./client-card";

interface ClientListProps {
  search?: string;
  onClientPress?: (id: string) => void;
  onAddPress?: () => void;
}

function groupClientsByInitial(items: Client[]) {
  const groups: { letter: string; data: Client[] }[] = [];
  const map = new Map<string, Client[]>();

  for (const item of items) {
    const letter = item.name.charAt(0).toUpperCase();
    if (!map.has(letter)) {
      map.set(letter, []);
    }
    map.get(letter)!.push(item);
  }

  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [letter, data] of sorted) {
    groups.push({ letter, data });
  }

  return groups;
}

export function ClientList({
  search,
  onClientPress,
  onAddPress,
}: Readonly<ClientListProps>) {
  const { theme } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useClients({
    search,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Nao foi possivel carregar seus clientes. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="Nenhum cliente ainda"
        description="Cadastre seu primeiro cliente para comecar a gerenciar suas vendas"
        action={
          onAddPress ? (
            <Button title="Cadastrar cliente" onPress={onAddPress} />
          ) : undefined
        }
      />
    );
  }

  const groups = groupClientsByInitial(data.items);

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item.letter}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing["3xl"],
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      renderItem={({ item: group }) => (
        <View style={{ marginTop: spacing.xl }}>
          {/* Letter header */}
          <Typography variant="h2" style={{ marginBottom: spacing.md }}>
            {group.letter}
          </Typography>

          <View style={{ gap: spacing.md }}>
            {group.data.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={() => onClientPress?.(client.id)}
              />
            ))}
          </View>
        </View>
      )}
    />
  );
}
