import { formatCurrency } from "../shared/utils/format";
import {
  Button,
  EmptyState,
  Typography,
  fonts,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import packagingEmpty from "../assets/packaging-empty.png";
import { PackagingCard } from "../features/packaging/components/packaging-card";
import { PackagingDetail } from "../features/packaging/components/packaging-detail";
import { PackagingForm } from "../features/packaging/components/packaging-form";
import { PACKAGING_TYPES, totalStockCost, typeColor } from "../features/packaging/domain";
import { useDeletePackaging, usePackagingList } from "../features/packaging/hooks";
import { LimitBanner } from "../features/subscription/components/limit-banner";
import { showAlert } from "../shared/components/alert-store";
import { usePaywall } from "../shared/hooks/use-paywall";
import { alertError } from "../shared/utils/alerts";

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  hint: string;
}>) {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";
  const cardBg = isDark ? "rgba(44, 36, 32, 0.55)" : theme.colors.surfaceElevated;
  const border = theme.colors.border;
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: cardBg,
        padding: spacing.lg,
        gap: spacing.sm,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radii.full,
          backgroundColor: `${theme.colors.primary}26`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Typography
        variant="caption"
        color={theme.colors.textSecondary}
        numberOfLines={2}
        style={{ textAlign: "center", minHeight: 34 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h3"
        color={theme.colors.text}
        style={{ fontSize: 22, textAlign: "center" }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {hint}
      </Typography>
    </View>
  );
}

export default function PackagingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data, isLoading, error } = usePackagingList();
  const deletePackaging = useDeletePackaging();
  const showPaywall = usePaywall((s) => s.show);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const items = data?.items ?? [];
  const selected = items.find((p) => p.id === selectedId) ?? null;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter && p.type !== typeFilter) return false;
      return !query || p.name.toLowerCase().includes(query);
    });
  }, [items, search, typeFilter]);

  const border = theme.colors.border;

  function deleteById(id: string) {
    deletePackaging
      .mutateAsync(id)
      .then(() => {
        if (selectedId === id) {
          setSelectedId(null);
          setEditing(false);
        }
      })
      .catch(() => alertError("Não foi possível excluir a embalagem."));
  }

  function openCard(id: string) {
    setSelectedId(id);
    setEditing(false);
  }

  function startEdit(id: string) {
    setSelectedId(id);
    setEditing(true);
  }

  function renderList() {
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
          description="Não foi possível carregar suas embalagens. Tente novamente."
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={
            <Image
              source={packagingEmpty}
              resizeMode="contain"
              style={{ width: 146, height: 146 }}
            />
          }
          title="Nenhuma embalagem ainda"
          description="Cadastre sua primeira embalagem pra calcular o custo certinho dos seus produtos"
          action={
            <Button title="Cadastrar embalagem" onPress={() => setShowCreate(true)} />
          }
        />
      );
    }
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        {/* Resumo */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <SummaryCard
            icon="cube-outline"
            label="Total de embalagens"
            value={String(data?.total ?? items.length)}
            hint="cadastradas"
          />
          <SummaryCard
            icon="cash-outline"
            label="Custo total em estoque"
            value={formatCurrency(totalStockCost(items))}
            hint="valor investido"
          />
        </View>

        {visible.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center" }}>
            <Typography
              variant="body"
              color={theme.colors.textSecondary}
              style={{ textAlign: "center" }}
            >
              Nenhuma embalagem encontrada. Ajuste a busca ou o filtro.
            </Typography>
          </View>
        ) : (
          visible.map((pkg) => (
            <PackagingCard
              key={pkg.id}
              packaging={pkg}
              onPress={() => openCard(pkg.id)}
              onEdit={() => startEdit(pkg.id)}
              onDelete={() => deleteById(pkg.id)}
            />
          ))
        )}

        {/* CTA tracejado */}
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Adicionar nova embalagem"
          style={({ pressed }) => ({
            marginTop: spacing.sm,
            borderRadius: radii.xl,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: theme.colors.primaryLight,
            backgroundColor: theme.colors.primaryBg,
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={theme.colors.primary}>
              Adicionar nova embalagem
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Cadastre uma embalagem que será utilizada nos seus produtos
            </Typography>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ width: 32, height: 40, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          Embalagens
        </Typography>
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Nova embalagem"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={26} color={theme.colors.textOnPrimary} />
        </Pressable>
      </View>

      {/* Busca + Filtros */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: border,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setSearchOpen(true);
            }}
            placeholder="Buscar embalagem..."
            placeholderTextColor={theme.colors.textSecondary}
            style={{
              flex: 1,
              color: theme.colors.text,
              fontSize: 16,
              paddingVertical: 0,
            }}
          />
          {searchOpen && search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={8}
              accessibilityLabel="Limpar busca"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setFiltersOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          style={({ pressed }) => ({
            minHeight: 48,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: typeFilter ? theme.colors.primary : border,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons
            name="funnel-outline"
            size={18}
            color={typeFilter ? theme.colors.primary : theme.colors.text}
          />
          <Typography
            variant="bodyBold"
            color={typeFilter ? theme.colors.primary : theme.colors.text}
          >
            Filtros
          </Typography>
        </Pressable>
      </View>

      {filtersOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {[{ value: null, label: "Todas" }, ...PACKAGING_TYPES].map((t) => {
              const active = typeFilter === t.value;
              const chipColor = t.value
                ? typeColor(theme, t.value)
                : theme.colors.primary;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => setTypeFilter(t.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: active ? chipColor : border,
                    backgroundColor: active ? `${chipColor}26` : "transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    color={active ? chipColor : theme.colors.textSecondary}
                    style={{ fontFamily: fonts.bold }}
                  >
                    {t.label}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <LimitBanner
          resource="packaging"
          onUpgrade={() => showPaywall("packaging")}
          containerStyle={{ marginHorizontal: spacing.lg, marginTop: spacing.sm }}
        />
        {renderList()}
      </View>

      {/* Modal: criar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setShowCreate(false)}
              accessibilityLabel="Fechar"
              hitSlop={10}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
            <Typography
              variant="h1"
              color={theme.colors.text}
              style={{ flex: 1, fontSize: 24 }}
            >
              Nova embalagem
            </Typography>
          </View>
          <PackagingForm
            existingPackaging={items}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal: detalhe / editar */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedId(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {selected && !editing ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.sm,
                }}
              >
                <Pressable onPress={() => setSelectedId(null)} hitSlop={10}>
                  <Typography variant="bodyBold" color={theme.colors.primary}>
                    Fechar
                  </Typography>
                </Pressable>
                <Pressable onPress={() => setEditing(true)} hitSlop={10}>
                  <Typography variant="bodyBold" color={theme.colors.primary}>
                    Editar
                  </Typography>
                </Pressable>
              </View>
              <PackagingDetail
                packaging={selected}
                onDelete={() => deleteById(selected.id)}
                isDeleting={deletePackaging.isPending}
              />
            </>
          ) : null}

          {selected && editing ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.sm,
                  gap: spacing.md,
                }}
              >
                <Pressable
                  onPress={() => setEditing(false)}
                  accessibilityLabel="Voltar"
                  hitSlop={10}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
                </Pressable>
                <Typography
                  variant="h1"
                  color={theme.colors.text}
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 22 }}
                >
                  Editar embalagem
                </Typography>
                <Pressable
                  onPress={() => {
                    showAlert({
                      title: "Excluir embalagem",
                      message: "Tem certeza que deseja excluir esta embalagem?",
                      buttons: [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Excluir",
                          style: "destructive",
                          onPress: () => deleteById(selected.id),
                        },
                      ],
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Excluir"
                  hitSlop={10}
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.alert} />
                  <Typography variant="bodyBold" color={theme.colors.alert}>
                    Excluir
                  </Typography>
                </Pressable>
              </View>
              <PackagingForm
                packaging={selected}
                existingPackaging={items}
                onSuccess={() => setEditing(false)}
                onCancel={() => setEditing(false)}
              />
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
