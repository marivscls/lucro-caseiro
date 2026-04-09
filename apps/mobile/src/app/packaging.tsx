import { Badge, Card, EmptyState, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePackagingList } from "../features/packaging/hooks";

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function PackagingScreen() {
  const { theme } = useTheme();
  const { data, isLoading, error } = usePackagingList();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {isLoading && (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.success} />
        </View>
      )}
      {!isLoading && error && (
        <EmptyState
          title="Algo deu errado"
          description="Nao foi possivel carregar suas embalagens. Tente novamente."
        />
      )}
      {!isLoading && !error && !data?.items.length && (
        <EmptyState
          title="Nenhuma embalagem ainda"
          description="Cadastre suas embalagens para facilitar a precificacao"
        />
      )}
      {!isLoading && !error && !!data?.items.length && (
        <FlatList
          data={data.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, padding: 20 }}
          ListHeaderComponent={
            <View style={{ gap: 8 }}>
              <Typography variant="h2">Embalagens</Typography>
              <Typography variant="caption">
                {data.total} embalage{data.total !== 1 ? "ns" : "m"}
              </Typography>
            </View>
          }
          renderItem={({ item }) => (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ gap: 4, flex: 1 }}>
                  <Typography variant="h3">{item.name}</Typography>
                  <Typography variant="caption">
                    {formatCurrency(item.unitCost)}
                  </Typography>
                </View>
                {item.type && <Badge label={item.type} variant="info" />}
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}
