import type { Supplier } from "@lucro-caseiro/contracts";
import { Button, EmptyState, useTheme, spacing } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";

import { useSuppliers } from "../hooks";
import { SupplierCard } from "./supplier-card";

interface SupplierListProps {
  search?: string;
  onSupplierPress?: (id: string) => void;
  onAddPress?: () => void;
}

export function SupplierList({
  search,
  onSupplierPress,
  onAddPress,
}: Readonly<SupplierListProps>) {
  const { theme } = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useSuppliers({ search });

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
        description="Não foi possível carregar seus fornecedores. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={<Ionicons name="business-outline" size={48} color={theme.colors.primary} />}
        title="Nenhum fornecedor ainda"
        description="Cadastre de quem você compra seus insumos e embalagens para organizar seus gastos."
        action={
          onAddPress ? (
            <Button title="Cadastrar fornecedor" onPress={onAddPress} />
          ) : undefined
        }
      />
    );
  }

  return (
    <FlatList
      data={data.items}
      keyExtractor={(item: Supplier) => item.id}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing["3xl"],
        gap: spacing.md,
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
      renderItem={({ item }) => (
        <SupplierCard supplier={item} onPress={() => onSupplierPress?.(item.id)} />
      )}
    />
  );
}
