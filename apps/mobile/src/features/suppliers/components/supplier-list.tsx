import type { Supplier } from "@lucro-caseiro/contracts";
import { Button, EmptyState, useTheme, spacing } from "@lucro-caseiro/ui";
import React from "react";
import { FlatList, Image, RefreshControl, View } from "react-native";

import suppliersEmpty from "../../../assets/suppliers-empty.png";
import { SkeletonList } from "../../../shared/components/skeleton";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useSuppliers } from "../hooks";
import { SupplierCard } from "./supplier-card";
import { useBusinessCopy } from "../../subscription/business-copy";

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
  const isDesktop = useDesktopLayout();
  const experienceCopy = useBusinessCopy();
  const { data, isLoading, error, refetch, isRefetching } = useSuppliers({ search });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          paddingVertical: spacing.xl,
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
      >
        <SkeletonList rows={6} variant="supplier" />
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
            style={{ width: 220, height: 220 }}
          />
        }
        title="Nenhum fornecedor ainda"
        description={`Cadastre de quem você compra ${experienceCopy.materialNounPlural} e outros itens para organizar seus gastos.`}
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
        ...pageGutter(isDesktop),
        ...desktopStretch(isDesktop, desktopWidths.data),
        paddingTop: spacing.md,
        paddingBottom: spacing["3xl"],
        gap: spacing.md,
      }}
      ListFooterComponent={
        onAddPress ? (
          <View style={{ paddingTop: spacing.sm }}>
            <Button
              title="Adicionar fornecedor"
              onPress={onAddPress}
              style={{ width: "100%" }}
            />
          </View>
        ) : null
      }
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
