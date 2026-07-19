import type { Supplier } from "@lucro-caseiro/contracts";
import { Button, EmptyState, useTheme, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { FlatList, Image, RefreshControl, View } from "react-native";

import suppliersEmpty from "../../../assets/suppliers-empty.png";
import { SkeletonList } from "../../../shared/components/skeleton";
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
      <View style={{ flex: 1, padding: spacing.xl }}>
        <SkeletonList rows={6} />
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
        icon={
          <Image
            source={suppliersEmpty}
            resizeMode="contain"
            style={{ width: 146, height: 146 }}
          />
        }
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
