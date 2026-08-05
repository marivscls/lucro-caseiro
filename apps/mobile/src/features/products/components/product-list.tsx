import { Button, EmptyState, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import type { Product } from "@lucro-caseiro/contracts";
import React, { useEffect, useState } from "react";
import { FlatList, Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { useLowStockProducts, useProducts } from "../hooks";
import { ProductCard } from "./product-card";
import { AppIcon } from "../../../shared/components/app-icon";

interface ProductListProps {
  readonly category?: string;
  readonly search?: string;
  readonly isComposite?: boolean;
  readonly stockOnly?: boolean;
  readonly items?: Product[];
  readonly onProductPress?: (id: string) => void;
  readonly onAddPress?: () => void;
  readonly addButtonTitle?: string;
}

export function ProductList({
  category,
  search,
  isComposite,
  stockOnly = false,
  items,
  onProductPress,
  onAddPress,
  addButtonTitle = "Cadastrar produto",
}: ProductListProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDesktop = useDesktopLayout();
  const showAds = useShowAds();
  const [page, setPage] = useState(1);
  const productsQuery = useProducts({
    page: isDesktop ? page : undefined,
    category,
    search,
    isComposite,
  });
  const lowStockQuery = useLowStockProducts();
  const lowStockItems = lowStockQuery.data?.filter((product) => {
    const query = search?.trim().toLocaleLowerCase("pt-BR");
    return !query || product.name.toLocaleLowerCase("pt-BR").includes(query);
  });
  let data = productsQuery.data;
  let isLoading = productsQuery.isLoading;
  let error = productsQuery.error;
  if (stockOnly) {
    data = {
      items: lowStockItems ?? [],
      total: lowStockItems?.length ?? 0,
      page: 1,
      limit: lowStockItems?.length ?? 0,
      totalPages: 1,
    };
    isLoading = lowStockQuery.isLoading;
    error = lowStockQuery.error;
  }
  if (items !== undefined) {
    data = {
      items,
      total: items.length,
      page: 1,
      limit: items.length,
      totalPages: 1,
    };
    isLoading = false;
    error = null;
  }

  useEffect(() => {
    setPage(1);
  }, [category, search, isComposite]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: isDesktop ? 0 : spacing.lg,
          paddingVertical: spacing.lg,
        }}
      >
        <SkeletonList rows={6} variant="product" />
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
    let emptyTitle = "Nenhum produto ainda";
    let emptyDescription = "Cadastre seu primeiro produto para começar a vender";
    if (stockOnly) {
      emptyTitle = search ? "Nenhum item encontrado" : "Estoque em dia";
      emptyDescription = search
        ? "Ajuste a busca para encontrar outro item."
        : "Nenhum produto precisa de reposição agora.";
    }

    return (
      <EmptyState
        icon={
          stockOnly ? undefined : (
            <Image
              source={productsEmpty}
              resizeMode="contain"
              style={{ width: 220, height: 220 }}
            />
          )
        }
        title={emptyTitle}
        description={emptyDescription}
        action={
          !stockOnly && onAddPress ? (
            <Button title={addButtonTitle} onPress={onAddPress} />
          ) : undefined
        }
      />
    );
  }

  const listData = showAds ? interleaveAds(data.items) : data.items;
  let itemCountLabel = `${data.total} produto${data.total !== 1 ? "s" : ""}`;
  if (stockOnly) {
    itemCountLabel = `${data.total} ${
      data.total === 1 ? "item para repor" : "itens para repor"
    }`;
  }

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
      contentContainerStyle={{
        gap: 12,
        paddingHorizontal: isDesktop ? 0 : 20,
        paddingTop: 20,
        paddingBottom: 32,
      }}
      ListHeaderComponent={<Typography variant="caption">{itemCountLabel}</Typography>}
      ListFooterComponent={
        <View style={{ gap: spacing.md, paddingTop: spacing.sm }}>
          {isDesktop && !stockOnly && !items ? (
            <DesktopPagination
              page={data.page}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          ) : null}
          {!stockOnly && onAddPress ? (
            <View
              style={{
                paddingBottom: spacing.lg + insets.bottom,
                alignItems: isDesktop ? "flex-end" : "stretch",
              }}
            >
              <Button
                title={addButtonTitle}
                onPress={onAddPress}
                icon={<AppIcon name="add" size={20} color={theme.colors.textOnPrimary} />}
                style={
                  isDesktop ? { alignSelf: "flex-end" } : { width: "100%", minHeight: 52 }
                }
              />
            </View>
          ) : null}
        </View>
      }
    />
  );
}
