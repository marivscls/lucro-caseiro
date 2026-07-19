import { Button, EmptyState, Typography, spacing } from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { FlatList, Image, View } from "react-native";

import productsEmpty from "../../../assets/products-empty.png";
import { SkeletonList } from "../../../shared/components/skeleton";
import {
  AD_ITEM_MARKER,
  AdBanner,
  interleaveAds,
} from "../../../shared/components/ad-banner";
import { useShowAds } from "../../../shared/hooks/use-show-ads";
import { DesktopPagination } from "../../../shared/components/desktop-pagination";
import { useDesktopLayout } from "../../../shared/layout/use-desktop-layout";
import { useProducts } from "../hooks";
import { ProductCard } from "./product-card";

interface ProductListProps {
  readonly category?: string;
  readonly search?: string;
  readonly isComposite?: boolean;
  readonly onProductPress?: (id: string) => void;
  readonly onAddPress?: () => void;
}

export function ProductList({
  category,
  search,
  isComposite,
  onProductPress,
  onAddPress,
}: ProductListProps) {
  const isDesktop = useDesktopLayout();
  const showAds = useShowAds();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useProducts({
    page: isDesktop ? page : undefined,
    category,
    search,
    isComposite,
  });

  useEffect(() => {
    setPage(1);
  }, [category, search, isComposite]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: spacing.lg }}>
        <SkeletonList rows={6} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Algo deu errado"
        description="Não foi possível carregar seus produtos. Tente novamente."
      />
    );
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        icon={
          <Image
            source={productsEmpty}
            resizeMode="contain"
            style={{ width: 146, height: 146 }}
          />
        }
        title="Nenhum produto ainda"
        description="Cadastre seu primeiro produto para começar a vender"
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
      key={isDesktop ? "desktop-products" : "mobile-products"}
      data={listData}
      numColumns={isDesktop ? 3 : 1}
      keyExtractor={(item, index) => (item === AD_ITEM_MARKER ? `ad-${index}` : item.id)}
      renderItem={({ item }) => {
        if (item === AD_ITEM_MARKER) {
          return (
            <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
              <AdBanner size="banner" />
            </View>
          );
        }
        return (
          <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
            <ProductCard product={item} onPress={() => onProductPress?.(item.id)} />
          </View>
        );
      }}
      columnWrapperStyle={isDesktop ? { gap: 12 } : undefined}
      contentContainerStyle={{ gap: 12, padding: 20, paddingBottom: 32 }}
      ListHeaderComponent={
        <Typography variant="caption">
          {data.total} produto{data.total !== 1 ? "s" : ""}
        </Typography>
      }
      ListFooterComponent={
        isDesktop ? (
          <DesktopPagination
            page={data.page}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        ) : null
      }
    />
  );
}
