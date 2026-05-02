import { Button, EmptyState, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { useProducts } from "../hooks";
import { ProductCard } from "./product-card";

interface ProductListProps {
  readonly category?: string;
  readonly search?: string;
  readonly onProductPress?: (id: string) => void;
  readonly onAddPress?: () => void;
}

export function ProductList({
  category,
  search,
  onProductPress,
  onAddPress,
}: ProductListProps) {
  const { theme } = useTheme();
  const showAds = useShowAds();
  const { data, isLoading, error } = useProducts({ category, search });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.success} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Nao foi possivel carregar seus produtos. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="Nenhum produto ainda"
        description="Cadastre seu primeiro produto para comecar a vender"
        action={
          onAddPress ? (
            <Button title="Cadastrar produto" onPress={onAddPress} />
          ) : undefined
        }
      />
    );
  }

  const listData = showAds ? interleaveAds(data.items) : data.items;

  return (
    <FlatList
      data={listData}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return <AdBanner size="banner" />;
        }
        return <ProductCard product={item} onPress={() => onProductPress?.(item.id)} />;
      }}
      contentContainerStyle={{ gap: 12, padding: 20 }}
      ListHeaderComponent={
        <Typography variant="caption">
          {data.total} produto{data.total !== 1 ? "s" : ""}
        </Typography>
      }
    />
  );
}
