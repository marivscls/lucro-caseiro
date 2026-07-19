import type { Supplier } from "@lucro-caseiro/contracts";
import {
  Button,
  EmptyState,
  Typography,
  fontSizes,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../../shared/components/app-icon";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import suppliersEmpty from "../../../assets/suppliers-empty.png";
import { SkeletonList } from "../../../shared/components/skeleton";
import { useSuppliers } from "../hooks";

const PAGE_SIZE = 10;

interface SupplierTableProps {
  search?: string;
  onSupplierPress?: (id: string) => void;
  onEditPress?: (supplier: Supplier) => void;
  onDeletePress?: (supplier: Supplier) => void;
  onAddPress?: () => void;
}

export function SupplierTable({
  search,
  onSupplierPress,
  onEditPress,
  onDeletePress,
  onAddPress,
}: Readonly<SupplierTableProps>) {
  const { theme } = useTheme();
  const { data, isLoading, error } = useSuppliers({ search });
  const [page, setPage] = useState(1);

  // Paginação client-side: a API devolve os itens filtrados em data.items.
  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // Volta pra primeira página quando a busca muda ou o total encolhe.
  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page],
  );

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

  if (!items.length) {
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

  const border = theme.colors.border;
  const headerCellStyle = {
    fontSize: fontSizes.sm,
    color: theme.colors.textSecondary,
  } as const;

  function paginationOpacity(disabled: boolean, pressed: boolean): number {
    if (disabled) return 0.4;
    if (pressed) return 0.7;
    return 1;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing["3xl"],
      }}
    >
      <View
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: radii.md,
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <Typography variant="caption" style={[{ flex: 3 }, headerCellStyle]}>
            Nome
          </Typography>
          <Typography variant="caption" style={[{ flex: 2 }, headerCellStyle]}>
            Telefone
          </Typography>
          <Typography variant="caption" style={[{ flex: 3 }, headerCellStyle]}>
            E-mail
          </Typography>
          <Typography
            variant="caption"
            style={[{ width: 96, textAlign: "right" }, headerCellStyle]}
          >
            Ações
          </Typography>
        </View>

        {/* Linhas */}
        {pageItems.map((supplier, index) => (
          <Pressable
            key={supplier.id}
            onPress={() => onSupplierPress?.(supplier.id)}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${supplier.name}`}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm + 2,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: border,
              backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
            })}
          >
            <Typography variant="bodyBold" numberOfLines={1} style={{ flex: 3 }}>
              {supplier.name}
            </Typography>
            <Typography variant="body" numberOfLines={1} style={{ flex: 2 }}>
              {supplier.phone ?? "—"}
            </Typography>
            <Typography variant="body" numberOfLines={1} style={{ flex: 3 }}>
              {supplier.email ?? "—"}
            </Typography>
            <View
              style={{
                width: 96,
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: spacing.xs,
              }}
            >
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEditPress?.(supplier);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${supplier.name}`}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <AppIcon
                  name="pencil-outline"
                  size={iconSizes.sm}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onDeletePress?.(supplier);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Excluir ${supplier.name}`}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <AppIcon
                  name="trash-outline"
                  size={iconSizes.sm}
                  color={theme.colors.alert}
                />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Paginação */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: spacing.md,
          paddingTop: spacing.md,
        }}
      >
        <Typography variant="caption">{`Página ${page} de ${totalPages}`}</Typography>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            accessibilityRole="button"
            accessibilityLabel="Página anterior"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: border,
              opacity: paginationOpacity(page <= 1, pressed),
            })}
          >
            <AppIcon name="chevron-back" size={iconSizes.sm} color={theme.colors.text} />
            <Typography variant="body">Anterior</Typography>
          </Pressable>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            accessibilityRole="button"
            accessibilityLabel="Próxima página"
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: border,
              opacity: paginationOpacity(page >= totalPages, pressed),
            })}
          >
            <Typography variant="body">Próximo</Typography>
            <AppIcon
              name="chevron-forward"
              size={iconSizes.sm}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
