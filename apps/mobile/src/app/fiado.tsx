import type { Sale } from "@lucro-caseiro/contracts";
import {
  Chip,
  FilterChipRow,
  fonts,
  iconSizes,
  radii,
  spacing,
  Typography,
  useTheme,
  type Theme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import fiadoNotebook from "../assets/fiado-notebook-calendar.png";
import { useClients } from "../features/clients/hooks";
import {
  buildChargeMessage,
  fiadoTiming,
  groupFiados,
  totalOwed,
  type FiadoGroup,
  type FiadoTiming,
} from "../features/sales/fiado";
import { useSales, useUpdateSaleStatus } from "../features/sales/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import type { AppIconName } from "../shared/components/app-icon";
import { AppIcon } from "../shared/components/app-icon";
import { showAlert } from "../shared/components/alert-store";
import { ResponsiveOverlayModal } from "../shared/components/responsive-modal-surface";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { showToast } from "../shared/components/toast";
import {
  desktopModalSurface,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { alertError } from "../shared/utils/alerts";
import { formatCurrency } from "../shared/utils/format";
import { isValidBrazilPhone } from "../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../shared/utils/whatsapp";

type StatusFilter = "all" | "overdue" | "upcoming";
type ContactFilter = "all" | "withPhone" | "withoutPhone";
type SortOrder = "oldest" | "newest";

const LOCALE = "pt-BR";
const FAB_SIZE = 56;
const FAB_BOTTOM_GAP = spacing.xl;

function useFiadoScreen() {
  const { theme } = useTheme();
  const colors = brandScreenPalette(theme);
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  return { theme, colors, styles };
}

const COPY = {
  all: "Todos",
  overdue: "Vencidos",
  upcoming: "Próximos",
  oldest: "Mais antigos",
  newest: "Mais recentes",
  open: "Em aberto",
  charge: "Cobrar",
  markReceived: "Marcar como recebido",
} as const;

const CONTACT_FILTERS: ReadonlyArray<{ key: ContactFilter; label: string }> = [
  { key: "all", label: "Todos os contatos" },
  { key: "withPhone", label: "Com WhatsApp" },
  { key: "withoutPhone", label: "Sem WhatsApp" },
];

function saleDateParts(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: new Intl.DateTimeFormat(LOCALE, { month: "short" })
      .format(date)
      .replace(".", "")
      .toLocaleUpperCase(LOCALE),
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toLocaleUpperCase(LOCALE);
  return `${parts[0][0]}${parts[1][0]}`.toLocaleUpperCase(LOCALE);
}

function launchCountLabel(count: number): string {
  return count === 1 ? "1 lançamento" : `${count} lançamentos`;
}

function timingLabel(timing: FiadoTiming): string {
  if (timing.kind === "open") return COPY.open;
  if (timing.kind === "upcoming") {
    return timing.days === 1 ? "Vence amanhã" : `Vence em ${timing.days} dias`;
  }
  if (timing.days === 0) return "Venceu hoje";
  return timing.days === 1 ? "Vencido há 1 dia" : `Vencido há ${timing.days} dias`;
}

function groupDate(group: FiadoGroup, order: SortOrder): number {
  const timestamps = group.sales.map((sale) => new Date(sale.soldAt).getTime());
  return order === "oldest" ? Math.min(...timestamps) : Math.max(...timestamps);
}

function groupMatchesStatus(group: FiadoGroup, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  return group.sales.some((sale) => fiadoTiming(sale.soldAt).kind === filter);
}

function ActionSheetRow({
  icon,
  label,
  color,
  onPress,
}: Readonly<{
  icon: AppIconName;
  label: string;
  color?: string;
  onPress: () => void;
}>) {
  const { colors, styles } = useFiadoScreen();
  const actionColor = color ?? colors.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}
    >
      <AppIcon name={icon} size={iconSizes.md} color={actionColor} />
      <Typography variant="bodyBold" color={actionColor}>
        {label}
      </Typography>
    </Pressable>
  );
}

function StatusBadge({ timing }: Readonly<{ timing: FiadoTiming }>) {
  const { colors, styles } = useFiadoScreen();
  const isOverdue = timing.kind === "overdue";
  const isUpcoming = timing.kind === "upcoming";
  let backgroundColor: string = colors.neutral;
  if (isOverdue) backgroundColor = colors.softRose;
  if (isUpcoming) backgroundColor = `${colors.lime}57`;
  const color = isOverdue ? colors.rose : colors.muted;
  const dotColor = isUpcoming ? colors.lime : color;

  return (
    <View
      accessibilityLabel={`Situação: ${timingLabel(timing)}`}
      style={[styles.statusBadge, { backgroundColor }]}
    >
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      <Typography
        variant="caption"
        color={isUpcoming ? colors.ink : color}
        numberOfLines={1}
        style={styles.statusText}
      >
        {timingLabel(timing)}
      </Typography>
    </View>
  );
}

function CardAction({
  icon,
  label,
  filled = false,
  flex = 1,
  onPress,
}: Readonly<{
  icon: AppIconName;
  label: string;
  filled?: boolean;
  flex?: number;
  onPress: () => void;
}>) {
  const { colors, styles } = useFiadoScreen();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.cardAction,
        { flex },
        filled ? styles.cardActionFilled : styles.cardActionOutlined,
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        name={icon}
        size={iconSizes.sm}
        color={filled ? colors.onWine : colors.wine}
      />
      <Typography
        variant="caption"
        color={filled ? colors.onWine : colors.wine}
        style={styles.cardActionText}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function OpenSaleRow({
  sale,
  isLast,
  isNarrow,
  onCharge,
  onMarkPaid,
}: Readonly<{
  sale: Sale;
  isLast: boolean;
  isNarrow: boolean;
  onCharge: () => void;
  onMarkPaid: (saleId: string) => void;
}>) {
  const { colors, styles } = useFiadoScreen();
  const { day, month } = saleDateParts(sale.soldAt);
  const timing = fiadoTiming(sale.soldAt);
  const amount = Math.max(0, sale.total - sale.paidAmount);

  return (
    <View style={[styles.saleBlock, !isLast && styles.saleDivider]}>
      <View style={styles.saleSummary}>
        <View style={styles.dateBadge}>
          <Typography variant="h3" color={colors.wine} style={styles.dateDay}>
            {day}
          </Typography>
          <Typography variant="label" color={colors.ink} style={styles.dateMonth}>
            {month}
          </Typography>
        </View>
        <Typography
          variant="h3"
          color={colors.ink}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={styles.saleAmount}
        >
          {formatCurrency(amount)}
        </Typography>
        <StatusBadge timing={timing} />
      </View>

      <View style={[styles.actionRow, isNarrow && styles.actionRowNarrow]}>
        <CardAction
          icon="checkmark-circle-outline"
          label={COPY.markReceived}
          flex={1.55}
          onPress={() => onMarkPaid(sale.id)}
        />
        <CardAction
          icon="logo-whatsapp"
          label={COPY.charge}
          filled={timing.kind === "overdue"}
          onPress={onCharge}
        />
      </View>
    </View>
  );
}

function FiadoGroupCard({
  group,
  phone,
  isNarrow,
  sortOrder,
  onCharge,
  onMarkPaid,
  onMarkAllPaid,
}: Readonly<{
  group: FiadoGroup;
  phone?: string;
  isNarrow: boolean;
  sortOrder: SortOrder;
  onCharge: (group: FiadoGroup) => void;
  onMarkPaid: (saleId: string) => void;
  onMarkAllPaid: (group: FiadoGroup) => void;
}>) {
  const { colors, styles } = useFiadoScreen();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const hasPhone = Boolean(phone && isValidBrazilPhone(phone));
  const markAllLabel =
    group.sales.length === 1 ? COPY.markReceived : "Marcar tudo como recebido";
  const orderedSales = [...group.sales].sort((a, b) => {
    const delta = new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime();
    return sortOrder === "oldest" ? delta : -delta;
  });

  function closeMenuThen(action: () => void) {
    setMenuOpen(false);
    action();
  }

  function handleCall() {
    setMenuOpen(false);
    void Linking.openURL(`tel:${(phone ?? "").replace(/\D/g, "")}`);
  }

  return (
    <View style={styles.chargeCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Typography variant="bodyBold" color={colors.wine} style={styles.avatarText}>
            {initials(group.clientName)}
          </Typography>
        </View>

        <View style={styles.clientInfo}>
          <Typography variant="h3" color={colors.ink} style={styles.clientName}>
            {group.clientName}
          </Typography>
          <Typography variant="caption" color={colors.muted}>
            {launchCountLabel(group.sales.length)}
          </Typography>
        </View>

        {!isNarrow ? (
          <Typography variant="h3" color={colors.ink} style={styles.groupTotal}>
            {formatCurrency(group.total)}
          </Typography>
        ) : null}

        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Mais ações de ${group.clientName}`}
          hitSlop={8}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
        >
          <AppIcon name="ellipsis-vertical" size={iconSizes.list} color={colors.ink} />
        </Pressable>
      </View>

      {isNarrow ? (
        <Typography variant="h3" color={colors.ink} style={styles.groupTotalNarrow}>
          {formatCurrency(group.total)}
        </Typography>
      ) : null}

      <View style={styles.cardDivider} />

      {orderedSales.map((sale, index) => (
        <OpenSaleRow
          key={sale.id}
          sale={sale}
          isLast={index === orderedSales.length - 1}
          isNarrow={isNarrow}
          onCharge={() => onCharge(group)}
          onMarkPaid={onMarkPaid}
        />
      ))}

      <ResponsiveOverlayModal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={[styles.modalBackdrop, isDesktop && styles.modalBackdropDesktop]}
        >
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: isDesktop ? spacing.lg : spacing.lg + insets.bottom },
              desktopModalSurface(isDesktop, 560),
            ]}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>
            <Typography variant="h3" color={colors.ink} style={styles.sheetTitle}>
              {group.clientName}
            </Typography>
            <ActionSheetRow
              icon="checkmark-done-circle"
              label={markAllLabel}
              color={colors.wine}
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
              color={colors.muted}
              onPress={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </ResponsiveOverlayModal>
    </View>
  );
}

function SummaryCard({
  total,
  clients,
  launches,
  isCompact,
  isNarrow,
}: Readonly<{
  total: number;
  clients: number;
  launches: number;
  isCompact: boolean;
  isNarrow: boolean;
}>) {
  const { colors, styles } = useFiadoScreen();

  return (
    <View
      style={[
        styles.summaryCard,
        isCompact && styles.summaryCardCompact,
        isNarrow && styles.summaryCardNarrow,
      ]}
    >
      <View
        style={[
          styles.summaryCopy,
          isCompact && styles.summaryCopyCompact,
          isNarrow && styles.summaryCopyNarrow,
        ]}
      >
        <Typography variant="h3" color={colors.onWine} style={styles.summaryLabel}>
          A receber
        </Typography>
        <Typography variant="moneyHero" color={colors.onWine}>
          {formatCurrency(total)}
        </Typography>
        <Typography variant="body" color={colors.onWine} style={styles.summaryMeta}>
          {clients} {clients === 1 ? "cliente" : "clientes"} · {launches}{" "}
          {launches === 1 ? "lançamento" : "lançamentos"}
        </Typography>
      </View>
      <Image
        source={fiadoNotebook}
        resizeMode="contain"
        accessible={false}
        style={[
          styles.summaryArt,
          isCompact && styles.summaryArtCompact,
          isNarrow && styles.summaryArtNarrow,
        ]}
      />
    </View>
  );
}

function EmptyMessage({
  title,
  description,
  action,
}: Readonly<{ title: string; description: string; action?: React.ReactNode }>) {
  const { colors, styles } = useFiadoScreen();

  return (
    <View style={styles.emptyState}>
      <Typography variant="h3" color={colors.wine} style={styles.centerText}>
        {title}
      </Typography>
      <Typography variant="body" color={colors.muted} style={styles.centerText}>
        {description}
      </Typography>
      {action}
    </View>
  );
}

export default function FiadoScreen() {
  const { colors, styles } = useFiadoScreen();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 370;
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [contactFilter, setContactFilter] = React.useState<ContactFilter>("all");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("oldest");
  const { data, isLoading, error, refetch } = useSales({ status: "pending" });
  const { data: clientsData } = useClients();
  const updateStatus = useUpdateSaleStatus();

  const sales = data?.items ?? [];
  const pendingSales = React.useMemo(
    () => sales.filter((sale) => sale.status === "pending"),
    [sales],
  );
  const groups = React.useMemo(() => groupFiados(pendingSales), [pendingSales]);
  const grandTotal = totalOwed(pendingSales);
  const phoneById = React.useMemo(() => {
    const phones = new Map<string, string>();
    for (const client of clientsData?.items ?? []) {
      if (client.phone) phones.set(client.id, client.phone);
    }
    return phones;
  }, [clientsData?.items]);

  const overdueCount = groups.filter((group) =>
    groupMatchesStatus(group, "overdue"),
  ).length;
  const upcomingCount = groups.filter((group) =>
    groupMatchesStatus(group, "upcoming"),
  ).length;
  const query = searchQuery.trim().toLocaleLowerCase(LOCALE);
  const visibleGroups = groups
    .filter((group) => groupMatchesStatus(group, statusFilter))
    .filter((group) => {
      const phone = group.clientId ? phoneById.get(group.clientId) : undefined;
      const hasPhone = Boolean(phone && isValidBrazilPhone(phone));
      return (
        contactFilter === "all" ||
        (contactFilter === "withPhone" && hasPhone) ||
        (contactFilter === "withoutPhone" && !hasPhone)
      );
    })
    .filter((group) => {
      if (!query) return true;
      return (
        group.clientName.toLocaleLowerCase(LOCALE).includes(query) ||
        formatCurrency(group.total).toLocaleLowerCase(LOCALE).includes(query) ||
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
            .toLocaleLowerCase(LOCALE)
            .includes(query),
        )
      );
    })
    .sort((a, b) => {
      const delta = groupDate(a, sortOrder) - groupDate(b, sortOrder);
      return sortOrder === "oldest" ? delta : -delta;
    });

  function handleCharge(group: FiadoGroup) {
    const message = buildChargeMessage(group);
    const phone = group.clientId ? phoneById.get(group.clientId) : undefined;
    if (phone && isValidBrazilPhone(phone)) void openWhatsApp(phone, message);
    else void openWhatsAppShare(message);
  }

  function handleMarkPaid(saleId: string) {
    showAlert({
      title: "Recebido?",
      message: "Marcar esta venda como paga?",
      buttons: [
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
      ],
    });
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
    if (group.sales.length === 1) {
      handleMarkPaid(group.sales[0].id);
      return;
    }
    showAlert({
      title: "Marcar tudo como recebido?",
      message: `Marcar as ${group.sales.length} vendas de ${group.clientName} como pagas?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        { text: "Recebi tudo", onPress: () => runMarkAllPaid(group) },
      ],
    });
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setContactFilter("all");
  }

  function renderCharges() {
    if (groups.length === 0) {
      return (
        <EmptyMessage
          title="Ninguém te deve"
          description="Vendas no fiado em aberto aparecem aqui para você cobrar."
        />
      );
    }

    if (visibleGroups.length === 0) {
      return (
        <EmptyMessage
          title="Nada encontrado"
          description="Ajuste a busca ou limpe os filtros para ver seus fiados em aberto."
          action={
            <Pressable
              onPress={resetFilters}
              accessibilityRole="button"
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            >
              <Typography variant="bodyBold" color={colors.wine}>
                Limpar filtros
              </Typography>
            </Pressable>
          }
        />
      );
    }

    return (
      <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
        {visibleGroups.map((group) => (
          <View
            key={group.clientId ?? "avulso"}
            style={isDesktop ? styles.cardColumnDesktop : styles.cardColumn}
          >
            <FiadoGroupCard
              group={group}
              phone={group.clientId ? phoneById.get(group.clientId) : undefined}
              isNarrow={isNarrow}
              sortOrder={sortOrder}
              onCharge={handleCharge}
              onMarkPaid={handleMarkPaid}
              onMarkAllPaid={handleMarkAllPaid}
            />
          </View>
        ))}
      </View>
    );
  }

  function renderLoadedContent() {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.content,
          pageGutter(isDesktop, spacing.lg),
          desktopStretch(isDesktop, desktopWidths.data),
          { paddingBottom: insets.bottom + FAB_BOTTOM_GAP + FAB_SIZE + spacing.lg },
        ]}
      >
        <SummaryCard
          total={grandTotal}
          clients={groups.length}
          launches={pendingSales.length}
          isCompact={width < 460}
          isNarrow={isNarrow}
        />

        <FilterChipRow>
          <Chip
            label={COPY.all}
            count={groups.length}
            selected={statusFilter === "all"}
            onPress={() => setStatusFilter("all")}
          />
          <Chip
            label={COPY.overdue}
            count={overdueCount}
            selected={statusFilter === "overdue"}
            onPress={() => setStatusFilter("overdue")}
          />
          <Chip
            label={COPY.upcoming}
            count={upcomingCount}
            selected={statusFilter === "upcoming"}
            onPress={() => setStatusFilter("upcoming")}
          />
          <Pressable
            onPress={() =>
              setSortOrder((current) => (current === "oldest" ? "newest" : "oldest"))
            }
            accessibilityRole="button"
            accessibilityLabel={`Ordenação: ${sortOrder === "oldest" ? COPY.oldest : COPY.newest}`}
            style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
          >
            <Typography
              variant="body"
              color={colors.wine}
              numberOfLines={1}
              style={styles.sortText}
            >
              {sortOrder === "oldest" ? COPY.oldest : COPY.newest}
            </Typography>
            <AppIcon
              name={sortOrder === "oldest" ? "arrow-down" : "arrow-up"}
              size={iconSizes.sm}
              color={colors.wine}
            />
          </Pressable>
        </FilterChipRow>

        <View style={styles.listHeading}>
          <Typography variant="h3" color={colors.wine}>
            Cobranças
          </Typography>
          <Typography variant="body" color={colors.muted} style={styles.openLabel}>
            Total em aberto
          </Typography>
        </View>

        {renderCharges()}
      </ScrollView>
    );
  }

  function renderBody() {
    if (isLoading) {
      return (
        <View
          style={[
            styles.stateContainer,
            pageGutter(isDesktop, spacing.lg),
            desktopStretch(isDesktop, desktopWidths.data),
          ]}
        >
          <SkeletonList rows={6} variant="fiado" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorState}>
          <Typography variant="h3" color={colors.wine} style={styles.centerText}>
            Algo deu errado
          </Typography>
          <Typography variant="body" color={colors.muted} style={styles.centerText}>
            Não foi possível carregar os fiados. Tente novamente.
          </Typography>
          <Pressable
            onPress={() => void refetch()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
          >
            <Typography variant="bodyBold" color={colors.wine}>
              Tentar novamente
            </Typography>
          </Pressable>
        </View>
      );
    }

    return renderLoadedContent();
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Fiado"
        titleStyle={{ color: colors.ink }}
        style={styles.navbar}
        right={
          <View style={styles.navActions}>
            <Pressable
              onPress={() => {
                setSearchOpen((current) => !current);
                setFilterOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Buscar"
              style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
            >
              <AppIcon name="search-outline" size={iconSizes.md} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => {
                setFilterOpen((current) => !current);
                setSearchOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Filtros"
              accessibilityState={{ expanded: filterOpen }}
              style={({ pressed }) => [
                styles.navButton,
                contactFilter !== "all" && styles.navButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="options-outline" size={iconSizes.md} color={colors.ink} />
            </Pressable>
          </View>
        }
      />

      {searchOpen ? (
        <View
          style={[
            styles.toolbar,
            pageGutter(isDesktop, spacing.lg),
            desktopStretch(isDesktop, 480),
          ]}
        >
          <View style={styles.searchField}>
            <AppIcon name="search-outline" size={iconSizes.sm} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar cliente ou valor"
              placeholderTextColor={colors.muted}
              autoFocus
              style={styles.searchInput}
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                style={styles.clearSearch}
              >
                <AppIcon name="close-circle" size={iconSizes.sm} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {filterOpen ? (
        <View
          style={[
            styles.contactFilters,
            pageGutter(isDesktop, spacing.lg),
            desktopStretch(isDesktop, desktopWidths.data),
          ]}
        >
          {CONTACT_FILTERS.map((option) => {
            const selected = contactFilter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setContactFilter(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.contactChip,
                  selected && styles.contactChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Typography
                  variant="caption"
                  color={selected ? colors.onWine : colors.wine}
                  style={styles.contactText}
                >
                  {option.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.body}>{renderBody()}</View>

      {!isLoading && !error ? (
        <View style={[styles.fabDock, { bottom: insets.bottom + FAB_BOTTOM_GAP }]}>
          <Pressable
            onPress={() => router.push("/tabs/new-sale")}
            accessibilityRole="button"
            accessibilityLabel="Novo lançamento"
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          >
            <AppIcon name="add" size={iconSizes.lg} color={colors.onWine} />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  const colors = brandScreenPalette(theme);

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    navbar: { paddingBottom: spacing.md, backgroundColor: colors.background },
    navActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    navButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
    },
    navButtonActive: { backgroundColor: colors.softRose },
    body: { flex: 1, minHeight: 0 },
    contentScroll: { flex: 1, minHeight: 0 },
    content: { paddingTop: spacing.sm, gap: spacing.xl },
    summaryCard: {
      minHeight: 188,
      borderRadius: radii.sm,
      backgroundColor: colors.wineFill,
      overflow: "hidden",
      padding: spacing["2xl"],
      justifyContent: "center",
    },
    summaryCardCompact: { minHeight: 188, padding: spacing.xl },
    summaryCardNarrow: { minHeight: 176, padding: spacing.xl },
    summaryCopy: { width: "61%", gap: spacing.sm, zIndex: 1 },
    summaryCopyCompact: { width: "68%", gap: spacing.xs },
    summaryCopyNarrow: { width: "75%" },
    summaryLabel: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 28 },
    summaryMeta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
    summaryArt: {
      position: "absolute",
      right: spacing.xl,
      width: "38%",
      height: "82%",
    },
    summaryArtCompact: { right: spacing.md, width: "31%", height: "72%" },
    summaryArtNarrow: { right: spacing.sm, width: "25%", height: "64%" },
    sortButton: {
      minHeight: 44,
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    sortText: { fontFamily: fonts.semiBold },
    listHeading: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    openLabel: { flexShrink: 1, textAlign: "right" },
    cardsGrid: { gap: spacing.lg },
    cardsGridDesktop: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-start",
    },
    cardColumn: { width: "100%" },
    cardColumnDesktop: { width: "48%", flexGrow: 1, minWidth: 340 },
    chargeCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.softRose,
      backgroundColor: colors.white,
      padding: spacing.lg,
      shadowColor: colors.wineFill,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    avatar: {
      width: 48,
      height: 48,
      flexShrink: 0,
      borderRadius: radii.full,
      backgroundColor: colors.softRose,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 18, lineHeight: 24 },
    clientInfo: { flex: 1, minWidth: 0, gap: 2 },
    clientName: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 23 },
    groupTotal: {
      flexShrink: 1,
      textAlign: "right",
      fontFamily: fonts.bold,
      fontSize: 17,
    },
    groupTotalNarrow: {
      alignSelf: "flex-end",
      marginTop: spacing.sm,
      fontFamily: fonts.bold,
      fontSize: 20,
    },
    menuButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.full,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.neutral,
      marginTop: spacing.lg,
    },
    saleBlock: { paddingTop: spacing.md, gap: spacing.md },
    saleDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral,
      paddingBottom: spacing.lg,
    },
    saleSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dateBadge: {
      width: 54,
      minHeight: 54,
      borderRadius: radii.sm,
      backgroundColor: colors.softRose,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xs,
    },
    dateDay: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 23 },
    dateMonth: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
    saleAmount: {
      flex: 1,
      minWidth: 0,
      fontFamily: fonts.semiBold,
      fontSize: 20,
    },
    statusBadge: {
      minHeight: 38,
      maxWidth: "100%",
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 0,
      gap: spacing.xs,
    },
    statusDot: { width: 8, height: 8, borderRadius: radii.full, flexShrink: 0 },
    statusText: { flexShrink: 0, fontFamily: fonts.medium },
    actionRow: { flexDirection: "row", gap: spacing.sm },
    actionRowNarrow: { flexDirection: "column" },
    cardAction: {
      minHeight: 48,
      borderRadius: radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    cardActionOutlined: { backgroundColor: colors.white, borderColor: colors.rose },
    cardActionFilled: { backgroundColor: colors.rose, borderColor: colors.rose },
    cardActionText: { fontFamily: fonts.semiBold, fontSize: 13, textAlign: "center" },
    modalBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: `${colors.wineFill}75`,
    },
    modalBackdropDesktop: { justifyContent: "center", padding: spacing.xl },
    sheet: {
      borderTopLeftRadius: radii["2xl"],
      borderTopRightRadius: radii["2xl"],
      backgroundColor: colors.white,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    sheetHandleWrap: { alignItems: "center", paddingVertical: spacing.sm },
    sheetHandle: {
      width: 44,
      height: 5,
      borderRadius: radii.full,
      backgroundColor: colors.softRose,
    },
    sheetTitle: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
    sheetAction: {
      minHeight: 56,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    toolbar: { paddingBottom: spacing.sm },
    searchField: {
      minHeight: 48,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.softRose,
      backgroundColor: colors.white,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      minHeight: 46,
      paddingVertical: 0,
      color: colors.ink,
      fontFamily: fonts.regular,
      fontSize: 16,
    },
    clearSearch: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    contactFilters: {
      paddingBottom: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    contactChip: {
      minHeight: 44,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.rose,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    contactChipSelected: {
      backgroundColor: colors.wineFill,
      borderColor: colors.wineFill,
    },
    contactText: { fontFamily: fonts.semiBold },
    emptyState: {
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingVertical: spacing.xl,
    },
    centerText: { textAlign: "center" },
    clearButton: {
      minHeight: 48,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.rose,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    stateContainer: { flex: 1, paddingVertical: spacing.xl },
    errorState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    fabDock: {
      position: "absolute",
      right: 0,
      zIndex: 10,
      alignItems: "flex-end",
      paddingHorizontal: spacing.lg,
      backgroundColor: "transparent",
    },
    fab: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: radii.full,
      backgroundColor: colors.wineFill,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.wineFill,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
      elevation: 5,
    },
    pressed: { opacity: 0.72 },
  });
}
