import type { Sale } from "@lucro-caseiro/contracts";
import { Typography, radii, spacing, useTheme, type Theme } from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useClients } from "../features/clients/hooks";
import { useSales, useUpdateSaleStatus } from "../features/sales/hooks";
import { buildChargeMessage, groupFiados, totalOwed } from "../features/sales/fiado";
import type { FiadoGroup } from "../features/sales/fiado";
import { Illustration } from "../shared/components/illustrations";
import { showToast } from "../shared/components/toast";
import { alertError } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";
import { isValidBrazilPhone } from "../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../shared/utils/whatsapp";
import fiadoHero from "../assets/fiado-hero.png";

type FiadoFilter = "all" | "withPhone" | "withoutPhone" | "overdue";

const FILTER_OPTIONS: Array<{ key: FiadoFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "withPhone", label: "Com WhatsApp" },
  { key: "withoutPhone", label: "Sem WhatsApp" },
  { key: "overdue", label: "+7 dias" },
];

/** Paleta do Fiado derivada do tema (antes eram cores fixas de dark). */
function fiadoPalette(theme: Theme) {
  const isDark = theme.mode === "dark";
  const c = theme.colors;
  return {
    screenBg: c.background,
    cardBg: isDark ? "rgba(47, 42, 35, 0.72)" : c.surfaceElevated,
    cardBorder: isDark ? "rgba(245, 225, 219, 0.11)" : "rgba(74, 50, 40, 0.1)",
    innerBorder: isDark ? "rgba(245, 225, 219, 0.1)" : "rgba(74, 50, 40, 0.1)",
    divider: isDark ? "rgba(245, 225, 219, 0.09)" : "rgba(74, 50, 40, 0.08)",
    text: c.text,
    textSecondary: c.textSecondary,
    subtleFill: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(74, 50, 40, 0.05)",
    dateChipBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(74, 50, 40, 0.05)",
    handle: isDark ? "rgba(245, 225, 219, 0.25)" : "rgba(74, 50, 40, 0.2)",
    received: isDark ? "#58D18C" : "#2E7D52",
    receivedBg: isDark ? "rgba(88, 209, 140, 0.16)" : "rgba(46, 125, 82, 0.12)",
    amountChipBg: isDark ? "rgba(111, 81, 13, 0.42)" : "rgba(126, 102, 15, 0.12)",
    amountChipFg: isDark ? "#FFD964" : c.yellow,
    sheetBg: isDark ? "#26201B" : c.surfaceElevated,
    totalCardBg: isDark ? "rgba(63, 42, 45, 0.66)" : c.surfaceElevated,
  };
}

function isOldSale(iso: string): boolean {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() <= sevenDaysAgo;
}

function saleDateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return { day, month };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function OpenSaleRow({
  sale,
  isLast,
  onMarkPaid,
}: Readonly<{ sale: Sale; isLast: boolean; onMarkPaid: (saleId: string) => void }>) {
  const { theme } = useTheme();
  const pal = fiadoPalette(theme);
  const { day, month } = saleDateParts(sale.soldAt);

  return (
    <View
      style={{
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: pal.divider,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.md,
          backgroundColor: pal.dateChipBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <Typography
          variant="bodyBold"
          color={pal.text}
          style={{ fontSize: 18, lineHeight: 20 }}
        >
          {day}
        </Typography>
        <Typography variant="caption" color={pal.textSecondary} style={{ fontSize: 11 }}>
          {month}
        </Typography>
      </View>

      <Typography
        variant="h3"
        color={pal.text}
        style={{ flex: 1, fontSize: 18, fontWeight: "700" }}
      >
        {formatCurrency(sale.total)}
      </Typography>

      <Pressable
        onPress={() => onMarkPaid(sale.id)}
        accessibilityRole="button"
        accessibilityLabel="Marcar como recebido"
        style={({ pressed }) => ({
          minHeight: 40,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.full,
          borderWidth: 1.5,
          borderColor: pal.received,
          backgroundColor: pal.receivedBg,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="checkmark-circle" size={20} color={pal.received} />
        <Typography variant="bodyBold" color={pal.received} style={{ fontSize: 16 }}>
          Recebi
        </Typography>
      </Pressable>
    </View>
  );
}

function ActionSheetRow({
  icon,
  label,
  color,
  onPress,
}: Readonly<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
}>) {
  const { theme } = useTheme();
  const pal = fiadoPalette(theme);
  const resolvedColor = color ?? pal.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        backgroundColor: pressed ? pal.subtleFill : "transparent",
      })}
    >
      <Ionicons name={icon} size={24} color={resolvedColor} />
      <Typography variant="bodyBold" color={resolvedColor} style={{ fontSize: 16 }}>
        {label}
      </Typography>
    </Pressable>
  );
}

function FiadoGroupCard({
  group,
  phone,
  onCharge,
  onMarkPaid,
  onMarkAllPaid,
}: Readonly<{
  group: FiadoGroup;
  phone?: string;
  onCharge: (group: FiadoGroup) => void;
  onMarkPaid: (saleId: string) => void;
  onMarkAllPaid: (group: FiadoGroup) => void;
}>) {
  const { theme } = useTheme();
  const pal = fiadoPalette(theme);
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const hasPhone = Boolean(phone && isValidBrazilPhone(phone));
  const launchCount =
    group.sales.length === 1 ? "1 lançamento" : `${group.sales.length} lançamentos`;
  const markAllLabel =
    group.sales.length === 1 ? "Marcar como recebido" : "Marcar tudo como recebido";

  function closeMenuThen(action: () => void) {
    setMenuOpen(false);
    action();
  }

  function handleCall() {
    setMenuOpen(false);
    void Linking.openURL(`tel:${(phone ?? "").replace(/\D/g, "")}`);
  }

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: 1,
        borderColor: pal.cardBorder,
        backgroundColor: pal.cardBg,
        padding: spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: theme.mode === "dark" ? 0.28 : 0.08,
        shadowRadius: 24,
        elevation: 4,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="bodyBold" color="#FFFFFF" serif style={{ fontSize: 18 }}>
            {initials(group.clientName)}
          </Typography>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Typography
            variant="h3"
            color={pal.text}
            numberOfLines={1}
            style={{ fontSize: 19, fontWeight: "800" }}
          >
            {group.clientName}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="calendar-outline" size={14} color={pal.textSecondary} />
            <Typography variant="caption" color={pal.textSecondary}>
              {launchCount}
            </Typography>
          </View>
        </View>

        <View
          style={{
            minWidth: 88,
            minHeight: 36,
            borderRadius: 14,
            backgroundColor: pal.amountChipBg,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: spacing.md,
          }}
        >
          <Typography
            variant="bodyBold"
            color={pal.amountChipFg}
            style={{ fontSize: 15 }}
          >
            {formatCurrency(group.total)}
          </Typography>
        </View>

        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Mais ações de ${group.clientName}`}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? pal.subtleFill : "transparent",
          })}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={pal.textSecondary} />
        </Pressable>
      </View>

      <View
        style={{
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: pal.innerBorder,
          overflow: "hidden",
          paddingHorizontal: spacing.sm,
        }}
      >
        {group.sales.map((sale, index) => (
          <OpenSaleRow
            key={sale.id}
            sale={sale}
            isLast={index === group.sales.length - 1}
            onMarkPaid={onMarkPaid}
          />
        ))}
      </View>

      <Pressable
        onPress={() => onCharge(group)}
        accessibilityRole="button"
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: radii.md,
          backgroundColor: "#3F8A53",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.md,
          opacity: pressed ? 0.86 : 1,
        })}
      >
        <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
        <Typography variant="bodyBold" color="#FFFFFF" style={{ fontSize: 17 }}>
          Cobrar no WhatsApp
        </Typography>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{
              backgroundColor: pal.sheetBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.lg + insets.bottom,
              gap: spacing.xs,
            }}
          >
            <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
              <View
                style={{
                  width: 44,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: pal.handle,
                }}
              />
            </View>
            <Typography
              variant="h3"
              color={pal.text}
              numberOfLines={1}
              style={{
                fontSize: 18,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.xs,
              }}
            >
              {group.clientName}
            </Typography>

            <ActionSheetRow
              icon="checkmark-done-circle"
              label={markAllLabel}
              color={pal.received}
              onPress={() => closeMenuThen(() => onMarkAllPaid(group))}
            />
            <ActionSheetRow
              icon="logo-whatsapp"
              label="Cobrar no WhatsApp"
              onPress={() => closeMenuThen(() => onCharge(group))}
            />
            {hasPhone ? (
              <ActionSheetRow
                icon="call"
                label="Ligar para o cliente"
                onPress={handleCall}
              />
            ) : null}
            <ActionSheetRow
              icon="close"
              label="Fechar"
              color={pal.textSecondary}
              onPress={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TotalCard({ total }: Readonly<{ total: number }>) {
  const { theme } = useTheme();
  const pal = fiadoPalette(theme);

  return (
    <View
      style={{
        minHeight: 118,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}52`,
        backgroundColor: pal.totalCardBg,
        overflow: "hidden",
        padding: spacing.lg,
        justifyContent: "center",
      }}
    >
      <Image
        source={fiadoHero}
        resizeMode="cover"
        blurRadius={1}
        style={{
          position: "absolute",
          right: -28,
          top: -28,
          width: 190,
          height: 172,
          opacity: theme.mode === "dark" ? 0.26 : 0.16,
        }}
      />
      <Typography variant="h3" color={pal.text} serif style={{ fontSize: 20 }}>
        Total a receber
      </Typography>
      <Typography
        variant="moneyHero"
        color={theme.colors.primary}
        serif
        style={{ fontSize: 38, lineHeight: 48 }}
      >
        {formatCurrency(total)}
      </Typography>
    </View>
  );
}

export default function FiadoScreen() {
  const { theme } = useTheme();
  const pal = fiadoPalette(theme);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FiadoFilter>("all");
  const { data, isLoading, error, refetch } = useSales({ status: "pending" });
  const { data: clientsData } = useClients();
  const updateStatus = useUpdateSaleStatus();

  const sales = data?.items ?? [];
  const groups = React.useMemo(() => groupFiados(sales), [sales]);
  const grandTotal = totalOwed(sales.filter((s) => s.status === "pending"));

  const phoneById = new Map<string, string>();
  for (const client of clientsData?.items ?? []) {
    if (client.phone) phoneById.set(client.id, client.phone);
  }

  const visibleGroups = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groups.filter((group) => {
      const phone = group.clientId ? phoneById.get(group.clientId) : undefined;
      const hasPhone = Boolean(phone && isValidBrazilPhone(phone));
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "withPhone" && hasPhone) ||
        (activeFilter === "withoutPhone" && !hasPhone) ||
        (activeFilter === "overdue" &&
          group.sales.some((sale) => isOldSale(sale.soldAt)));

      if (!matchesFilter) return false;
      if (!query) return true;

      return (
        group.clientName.toLowerCase().includes(query) ||
        formatCurrency(group.total).toLowerCase().includes(query) ||
        group.sales.some((sale) =>
          [
            sale.clientName,
            sale.paymentMethod,
            sale.total.toString(),
            formatCurrency(sale.total),
            saleDateParts(sale.soldAt).day,
            saleDateParts(sale.soldAt).month,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      );
    });
  }, [activeFilter, groups, phoneById, searchQuery]);

  function handleCharge(group: FiadoGroup) {
    const message = buildChargeMessage(group);
    const phone = group.clientId ? phoneById.get(group.clientId) : undefined;
    if (phone && isValidBrazilPhone(phone)) void openWhatsApp(phone, message);
    else void openWhatsAppShare(message);
  }

  function handleMarkPaid(saleId: string) {
    Alert.alert("Recebido?", "Marcar esta venda como paga?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim, recebi",
        onPress: () => {
          void (async () => {
            try {
              await updateStatus.mutateAsync({ id: saleId, status: "paid" });
              showToast("Recebido! Venda marcada como paga.");
              void refetch();
            } catch {
              alertError("Não foi possível atualizar. Tente novamente.");
            }
          })();
        },
      },
    ]);
  }

  function runMarkAllPaid(group: FiadoGroup) {
    void (async () => {
      try {
        await Promise.all(
          group.sales.map((sale) =>
            updateStatus.mutateAsync({ id: sale.id, status: "paid" }),
          ),
        );
        showToast("Tudo recebido! Vendas marcadas como pagas.");
        void refetch();
      } catch {
        alertError("Não foi possível atualizar. Tente novamente.");
      }
    })();
  }

  function handleMarkAllPaid(group: FiadoGroup) {
    const count = group.sales.length;
    if (count === 1) {
      handleMarkPaid(group.sales[0].id);
      return;
    }
    Alert.alert(
      "Marcar tudo como recebido?",
      `Marcar as ${count} vendas de ${group.clientName} como pagas?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, recebi tudo", onPress: () => runMarkAllPaid(group) },
      ],
    );
  }

  function renderContent() {
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
          <Typography variant="h2" color={pal.text} style={{ textAlign: "center" }}>
            Algo deu errado
          </Typography>
          <Typography
            variant="body"
            color={pal.textSecondary}
            style={{ textAlign: "center" }}
          >
            Não foi possível carregar os fiados. Tente novamente.
          </Typography>
        </View>
      );
    }

    if (groups.length === 0) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Illustration name="coins" />
          </View>
          <Typography variant="h2" color={pal.text} style={{ textAlign: "center" }}>
            Ninguém te deve
          </Typography>
          <Typography
            variant="body"
            color={pal.textSecondary}
            style={{ textAlign: "center" }}
          >
            Vendas no fiado em aberto aparecem aqui para você cobrar.
          </Typography>
        </View>
      );
    }

    if (visibleGroups.length === 0) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: 104 + insets.bottom,
            justifyContent: "center",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Illustration name="coins" />
          <Typography variant="h2" color={pal.text} style={{ textAlign: "center" }}>
            Nada encontrado
          </Typography>
          <Typography
            variant="body"
            color={pal.textSecondary}
            style={{ textAlign: "center" }}
          >
            Ajuste a busca ou limpe os filtros para ver seus fiados em aberto.
          </Typography>
          <View style={{ width: "100%" }}>
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              accessibilityRole="button"
              style={({ pressed }) => ({
                minHeight: 48,
                borderRadius: radii.md,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.86 : 1,
              })}
            >
              <Typography variant="bodyBold" color="#FFFFFF">
                Limpar filtros
              </Typography>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: 104 + insets.bottom,
          gap: spacing.md,
        }}
      >
        <TotalCard total={grandTotal} />

        {visibleGroups.map((group) => (
          <FiadoGroupCard
            key={group.clientId ?? "avulso"}
            group={group}
            phone={group.clientId ? phoneById.get(group.clientId) : undefined}
            onCharge={handleCharge}
            onMarkPaid={handleMarkPaid}
            onMarkAllPaid={handleMarkAllPaid}
          />
        ))}

        <View
          style={{
            borderRadius: radii.xl,
            padding: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            backgroundColor: "rgba(196, 112, 126, 0.16)",
            borderWidth: 1,
            borderColor: "rgba(196, 112, 126, 0.35)",
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.full,
              backgroundColor: "rgba(196, 112, 126, 0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={theme.colors.primaryLight}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="bodyBold" color={pal.text}>
              Dica rápida
            </Typography>
            <Typography variant="caption" color={pal.textSecondary}>
              Mantenha seus recebimentos em dia e fortaleça a confiança dos seus clientes.
            </Typography>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pal.screenBg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image
        source={fiadoHero}
        resizeMode="cover"
        blurRadius={18}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: theme.mode === "dark" ? 0.08 : 0.04,
        }}
      />

      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{
            width: 36,
            height: 40,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={29} color={pal.text} />
        </Pressable>
        <Typography
          variant="h1"
          color={pal.text}
          style={{ flex: 1, fontSize: 28, fontWeight: "800" }}
        >
          Fiado
        </Typography>
        <Pressable
          onPress={() => {
            setSearchOpen((current) => !current);
            setFilterOpen(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: pal.subtleFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="search-outline" size={25} color={pal.text} />
        </Pressable>
        <Pressable
          onPress={() => {
            setFilterOpen((current) => !current);
            setSearchOpen(false);
          }}
          accessibilityRole="button"
          accessibilityLabel="Filtros"
          hitSlop={10}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              activeFilter !== "all" ? "rgba(196, 112, 126, 0.2)" : "transparent",
          }}
        >
          <Ionicons
            name="options-outline"
            size={27}
            color={activeFilter !== "all" ? theme.colors.primaryLight : pal.textSecondary}
          />
        </Pressable>
      </View>

      {searchOpen ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <View
            style={{
              minHeight: 48,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: pal.innerBorder,
              backgroundColor: pal.subtleFill,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Ionicons name="search-outline" size={20} color={pal.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar cliente ou valor"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
              style={{
                flex: 1,
                minHeight: 46,
                color: pal.text,
                fontSize: 16,
                paddingVertical: 0,
              }}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={pal.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {filterOpen ? (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
          }}
        >
          {FILTER_OPTIONS.map((option) => {
            const selected = activeFilter === option.key;
            const isDark = theme.mode === "dark";
            const idleBg = isDark ? "rgba(255,255,255,0.06)" : theme.colors.surface;
            const idleBorder = isDark
              ? "rgba(245, 225, 219, 0.1)"
              : "rgba(74, 50, 40, 0.1)";
            return (
              <Pressable
                key={option.key}
                onPress={() => setActiveFilter(option.key)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  minHeight: 38,
                  borderRadius: 19,
                  paddingHorizontal: spacing.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? theme.colors.primary : idleBg,
                  borderWidth: 1,
                  borderColor: selected ? theme.colors.primary : idleBorder,
                  opacity: pressed ? 0.82 : 1,
                })}
              >
                <Typography
                  variant="caption"
                  color={selected ? "#FFFFFF" : pal.text}
                  style={{ fontWeight: "700" }}
                >
                  {option.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>{renderContent()}</View>

      {groups.length > 0 && !isLoading && !error ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            right: spacing.lg,
            bottom: spacing.md + insets.bottom,
          }}
        >
          <View
            style={{
              display: "none",
              flex: 1,
              minHeight: 68,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: "rgba(104, 174, 103, 0.2)",
              backgroundColor: "rgba(33, 52, 34, 0.78)",
              padding: spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(82, 151, 75, 0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bulb-outline" size={23} color="#DDF4CE" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="bodyBold" color="#58D18C">
                Dica
              </Typography>
              <Typography
                variant="caption"
                color="#F4E9E3"
                numberOfLines={2}
                style={{ lineHeight: 17, fontSize: 12 }}
              >
                Mantenha seus recebimentos em dia e fortaleça a confiança dos seus
                clientes.
              </Typography>
            </View>
          </View>

          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push("/tabs/new-sale")}
              accessibilityRole="button"
              accessibilityLabel="Novo lançamento"
              style={({ pressed }) => ({
                width: 66,
                height: 66,
                borderRadius: 33,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.86 : 1,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 18,
                elevation: 8,
              })}
            >
              <Ionicons name="add" size={36} color="#FFFFFF" />
            </Pressable>
            <Typography variant="caption" color={pal.text} style={{ fontSize: 12 }}>
              Novo lançamento
            </Typography>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
