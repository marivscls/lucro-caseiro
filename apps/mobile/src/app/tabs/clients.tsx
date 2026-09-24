import { useFormValidation } from "../../shared/hooks/use-form-validation";
import { ScreenHeader } from "../../shared/components/screen-header";
import { ScreenGuidance } from "../../shared/guidance/screen-guidance";
import {
  CenteredTextInput,
  Button,
  Chip,
  EmptyState,
  FilterChipRow,
  fontSizes,
  fonts,
  PressableScale,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../../shared/components/app-icon";
import type { AppIconName } from "../../shared/components/app-icon";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClientDetail } from "../../features/clients/components/client-detail";
import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { EditClientForm } from "../../features/clients/components/edit-client-form";
import {
  useAllClients,
  useClient,
  useClients,
  useCreateClient,
} from "../../features/clients/hooks";
import {
  buildClientListInsights,
  clientSecondaryLabel,
  countClientListFilters,
  filterAndSortClientInsights,
  type ClientListFilter,
  type ClientListInsight,
  type ClientListSort,
} from "../../features/clients/client-list";
import { useAllSales } from "../../features/sales/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { ApiError } from "../../shared/utils/api-client";
import { brToIso } from "../../shared/utils/date";
import { phoneDuplicateKey } from "../../shared/utils/duplicates";
import { isValidBrazilPhone } from "../../shared/utils/phone";
import { alertValidation } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";
import { SkeletonList } from "../../shared/components/skeleton";
import { AnimatedListItem } from "../../shared/components/animated-list-item";
import { FAB } from "../../shared/components/fab";
import { ScreenCreateBar } from "../../shared/components/screen-create-bar";
import { ClientFormFields } from "../../features/clients/components/client-form-fields";
import {
  DesktopEmptyCard,
  DesktopHeaderBlock,
  DesktopListHeader,
  DesktopMeasuredHeader,
  DesktopPager,
  DesktopSearchField,
  DesktopSegmented,
  DesktopSelectButton,
  DesktopStatusPill,
  DesktopToolbar,
  DesktopCellText,
  type DesktopTone,
} from "../../features/sales/components/desktop-list-kit";
import {
  DesktopStatRow,
  DesktopTable,
  desktopPageContent,
  type DesktopTableColumn,
} from "../../shared/layout/desktop-page";
import {
  desktopLayout,
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../../shared/layout/desktop-density";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import { StandardModal } from "../../shared/components/standard-modal";
import { useBrandScreenPalette } from "../../shared/brand-palette";
import { formatCurrency } from "../../shared/utils/format";
import clientsCommunity from "../../assets/clients-community.png";

type Screen =
  | { name: "list" }
  | { name: "detail"; clientId: string }
  | { name: "create" };

/** Quantos clientes aparecem por vez na lista do celular. */
const CLIENTS_BATCH = 30;

const FILTER_OPTIONS: ReadonlyArray<{ key: ClientListFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "recent", label: "Recentes" },
  { key: "frequent", label: "Frequentes" },
  { key: "credit", label: "Com fiado" },
];

const SORT_OPTIONS: ReadonlyArray<{ key: ClientListSort; label: string }> = [
  { key: "recent", label: "Mais recentes" },
  { key: "alphabetical", label: "Ordem A–Z" },
  { key: "highest", label: "Maior valor comprado" },
  { key: "frequent", label: "Clientes frequentes" },
];

interface SearchBoxProps {
  value: string;
  onChangeText: (value: string) => void;
  onFilterPress?: () => void;
  placeholder: string;
  filterIcon?: AppIconName;
}

function SearchBox({
  value,
  onChangeText,
  onFilterPress,
  placeholder,
  filterIcon = "options-outline",
}: Readonly<SearchBoxProps>) {
  const pal = useBrandScreenPalette();

  return (
    <View
      style={{
        minHeight: 58,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: spacing.lg,
        backgroundColor: pal.white,
        borderWidth: 1,
        borderColor: pal.border,
      }}
    >
      <AppIcon name="search-outline" size={24} color={pal.muted} />
      <CenteredTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={pal.muted}
        style={{
          flex: 1,
          minWidth: 0,
          color: pal.ink,
          fontSize: fontSizes.md,
          fontFamily: fonts.regular,
          paddingHorizontal: spacing.md,
          paddingVertical: 0,
        }}
      />
      <Pressable
        onPress={onFilterPress}
        accessibilityLabel="Abrir filtros"
        accessibilityRole="button"
        hitSlop={10}
        style={({ pressed }) => ({
          width: 58,
          height: 40,
          borderLeftWidth: 1,
          borderLeftColor: pal.border,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <AppIcon name={filterIcon} size={23} color={pal.muted} />
      </Pressable>
    </View>
  );
}

interface AvatarProps {
  label: string;
  size?: number;
}

function Avatar({ label, size = 44 }: Readonly<AvatarProps>) {
  const pastel = avatarPastel(label, "light");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pastel.bg,
        borderWidth: 1,
        borderColor: pastel.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="h2"
        color={pastel.fg}
        style={{ fontSize: size * 0.48, fontFamily: fonts.bold }}
      >
        {(label.trim().charAt(0) || "?").toUpperCase()}
      </Typography>
    </View>
  );
}

interface ClientCardProps {
  insight: ClientListInsight;
  onPress: () => void;
}

function ClientCard({ insight, onPress }: Readonly<ClientCardProps>) {
  const pal = useBrandScreenPalette();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const { client } = insight;
  let badge: "credit" | "frequent" | null = null;
  if (insight.pendingTotal > 0) badge = "credit";
  else if (insight.frequent) badge = "frequent";

  return (
    <PressableScale
      onPress={onPress}
      style={{
        backgroundColor: pal.white,
        borderWidth: 1,
        borderColor: pal.border,
        borderRadius: 22,
        minHeight: 108,
        paddingHorizontal: isNarrow ? 10 : spacing.md,
        paddingVertical: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      }}
    >
      <Avatar label={client.name} size={isNarrow ? 44 : 48} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Typography
            variant="h3"
            color={pal.ink}
            numberOfLines={1}
            style={{ flex: 1, minWidth: 0, fontSize: isNarrow ? 15 : fontSizes.md }}
          >
            {client.name}
          </Typography>
          {badge !== "credit" ? (
            <Typography
              variant="bodyBold"
              color={pal.ink}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={{
                maxWidth: isNarrow ? 78 : 94,
                flexShrink: 0,
                fontSize: isNarrow ? 13 : fontSizes.sm,
              }}
            >
              {formatCurrency(client.totalSpent)}
            </Typography>
          ) : null}
          <AppIcon name="chevron-forward" size={isNarrow ? 18 : 20} color={pal.muted} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <AppIcon name="call" size={14} color={pal.muted} />
          <Typography
            variant="body"
            color={pal.muted}
            numberOfLines={1}
            style={{ fontSize: fontSizes.xs }}
          >
            {client.phone || "Sem telefone"}
          </Typography>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Typography
            variant="caption"
            color={insight.lastSaleAt ? pal.rose : pal.muted}
            numberOfLines={1}
            style={{ flex: 1, minWidth: 0, fontSize: fontSizes.xs }}
          >
            {clientSecondaryLabel(insight)}
          </Typography>
          {badge ? (
            <View
              style={{
                maxWidth: isNarrow ? 108 : 116,
                flexShrink: 0,
                paddingHorizontal: spacing.sm,
                paddingVertical: 5,
                borderRadius: radii.full,
                backgroundColor: badge === "frequent" ? pal.lime : pal.softRose,
                borderWidth: badge === "credit" ? 1 : 0,
                borderColor: pal.border,
              }}
            >
              <Typography
                variant="caption"
                color={badge === "frequent" ? pal.onLime : pal.rose}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={{ fontSize: isNarrow ? 10 : 11 }}
              >
                {badge === "frequent"
                  ? "Cliente frequente"
                  : `Fiado ${formatCurrency(insight.pendingTotal)}`}
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

function ClienteleSummary({
  total,
  boughtThisMonth,
  withCredit,
  isLoading,
}: Readonly<{
  total: number;
  boughtThisMonth: number;
  withCredit: number;
  isLoading?: boolean;
}>) {
  const pal = useBrandScreenPalette();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const cardPadding = isNarrow ? spacing.xl : spacing["2xl"];
  let illustrationSize = 104;
  if (isNarrow) illustrationSize = Math.max(68, width * 0.23);
  else if (width < 430) illustrationSize = 88;
  const metrics = [
    { value: isLoading ? "—" : total, label: "clientes", flex: 1 },
    {
      value: isLoading ? "—" : boughtThisMonth,
      label: "compraram\nno mês",
      flex: 1.25,
    },
    { value: isLoading ? "—" : withCredit, label: "com fiado", flex: 1 },
  ];

  return (
    <View
      style={{
        padding: cardPadding,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: pal.border,
        backgroundColor: pal.white,
      }}
    >
      <Typography
        variant="h3"
        color={pal.wine}
        numberOfLines={1}
        style={{ marginBottom: 18 }}
      >
        Sua clientela
      </Typography>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 13,
            minWidth: 0,
            minHeight: illustrationSize,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {metrics.map((metric, index) => (
            <React.Fragment key={metric.label}>
              {index > 0 ? (
                <View
                  style={{
                    width: 1,
                    height: isNarrow ? 42 : 46,
                    marginHorizontal: isNarrow ? spacing.xs : 6,
                    backgroundColor: pal.border,
                    alignSelf: "center",
                  }}
                />
              ) : null}
              <View
                style={{
                  flex: metric.flex,
                  minWidth: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h3"
                  color={pal.wine}
                  numberOfLines={1}
                  style={{ textAlign: "center" }}
                >
                  {metric.value}
                </Typography>
                <Typography
                  variant="caption"
                  color={pal.muted}
                  style={{
                    minHeight: 30,
                    fontSize: isNarrow ? 9.5 : 11,
                    lineHeight: 15,
                    textAlign: "center",
                  }}
                >
                  {metric.label}
                </Typography>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View
          style={{
            flex: 7,
            minWidth: 0,
            alignSelf: "stretch",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={clientsCommunity}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            style={{
              width: illustrationSize,
              height: illustrationSize,
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </View>
      </View>
    </View>
  );
}

function OptionsModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Readonly<{
  visible: boolean;
  title: string;
  options: ReadonlyArray<{ key: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}>) {
  const pal = useBrandScreenPalette();

  return (
    <StandardModal visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => {
          const active = option.key === selected;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                onSelect(option.key);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                minHeight: 52,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.xl,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: active ? pal.softRose : pal.white,
                borderWidth: 1,
                borderColor: active ? pal.rose : pal.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Typography variant="bodyBold" color={active ? pal.wine : pal.muted}>
                {option.label}
              </Typography>
              {active ? <AppIcon name="checkmark" size={20} color={pal.rose} /> : null}
            </Pressable>
          );
        })}
      </View>
    </StandardModal>
  );
}

function clientSituation(
  insight: ClientListInsight,
): { label: string; tone: DesktopTone } | null {
  if (insight.pendingTotal > 0) {
    return { label: `Fiado ${formatCurrency(insight.pendingTotal)}`, tone: "attention" };
  }
  if (insight.frequent) return { label: "Cliente frequente", tone: "brand" };
  return null;
}

function birthdayLabel(birthday: string | null): string {
  if (!birthday) return "—";
  return new Date(`${birthday}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

/** Tabela de clientes do desktop: colunas extras só a partir de 1280px. */
function DesktopClientsTable({
  insights,
  onClientPress,
}: Readonly<{
  insights: ClientListInsight[];
  onClientPress: (id: string) => void;
}>) {
  const pal = useBrandScreenPalette();
  const { width } = useWindowDimensions();
  const wide = width >= 1280;
  const columns: DesktopTableColumn<ClientListInsight>[] = [
    {
      key: "client",
      title: "Cliente",
      flex: 2,
      render: (insight) => (
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Avatar label={insight.client.name} size={40} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <DesktopCellText strong>{insight.client.name}</DesktopCellText>
            <Typography variant="desktopMeta" numberOfLines={1}>
              {clientSecondaryLabel(insight)}
            </Typography>
          </View>
        </View>
      ),
    },
    {
      key: "phone",
      title: "Telefone",
      flex: 1.2,
      render: ({ client }) => (
        <DesktopCellText color={client.phone ? undefined : pal.muted}>
          {client.phone || "Sem telefone"}
        </DesktopCellText>
      ),
    },
    ...(wide
      ? [
          {
            key: "birthday",
            title: "Aniversário",
            flex: 0.9,
            render: ({ client }: ClientListInsight) => (
              <DesktopCellText>{birthdayLabel(client.birthday)}</DesktopCellText>
            ),
          },
        ]
      : []),
    {
      key: "situation",
      title: "Situação",
      width: wide ? 168 : 152,
      render: (insight) => {
        const situation = clientSituation(insight);
        return situation ? <DesktopStatusPill {...situation} /> : null;
      },
    },
    {
      key: "spent",
      title: "Total comprado",
      width: wide ? 136 : 124,
      align: "right",
      render: ({ client }) => (
        <DesktopCellText strong align="right">
          {formatCurrency(client.totalSpent)}
        </DesktopCellText>
      ),
    },
    {
      key: "open",
      title: "",
      width: 24,
      align: "right",
      render: () => <AppIcon name="chevron-forward" size={20} color={pal.muted} />,
    },
  ];
  return (
    <DesktopTable
      columns={columns}
      rows={insights}
      keyExtractor={(insight) => insight.client.id}
      onRowPress={(insight) => onClientPress(insight.client.id)}
      rowAccessibilityLabel={(insight) => `Abrir cliente ${insight.client.name}`}
    />
  );
}

function EmptyClients({ onCreatePress }: Readonly<{ onCreatePress: () => void }>) {
  return (
    <EmptyState
      title="Nenhum cliente ainda"
      description="Cadastre seu primeiro cliente pra acompanhar pedidos e aniversários"
      action={<Button title="Novo cliente" onPress={onCreatePress} />}
    />
  );
}

interface ClientsListScreenProps {
  search: string;
  setSearch: (value: string) => void;
  onBack: () => void;
  onCreatePress: () => void;
  onClientPress: (id: string) => void;
}

function ClientsListScreen({
  search,
  setSearch,
  onBack,
  onCreatePress,
  onClientPress,
}: Readonly<ClientsListScreenProps>) {
  const pal = useBrandScreenPalette();
  const isDesktop = useDesktopLayout();
  const { width } = useWindowDimensions();
  const showPaywall = usePaywall((s) => s.show);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ClientListFilter>("all");
  const [sort, setSort] = useState<ClientListSort>("recent");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  // Computador: paginação numerada. Celular: busca todos os clientes para
  // filtros e contagens valerem para a lista inteira, e mostra aos poucos.
  const searchTerm = search.trim() || undefined;
  const pagedBaseClients = useClients({ page }, { enabled: isDesktop });
  const pagedListClients = useClients(
    { page, search: searchTerm },
    { enabled: isDesktop },
  );
  const allBaseClients = useAllClients(undefined, { enabled: !isDesktop });
  const allListClients = useAllClients({ search: searchTerm }, { enabled: !isDesktop });
  const baseClientsQuery = isDesktop ? pagedBaseClients : allBaseClients;
  const listClientsQuery = isDesktop ? pagedListClients : allListClients;
  const [visibleCount, setVisibleCount] = useState(CLIENTS_BATCH);
  useEffect(() => {
    setVisibleCount(CLIENTS_BATCH);
  }, [filter, sort, searchTerm]);
  const salesQuery = useAllSales();
  const summaryInsights = useMemo(
    () =>
      buildClientListInsights(
        baseClientsQuery.data?.items ?? [],
        salesQuery.data?.items ?? [],
      ),
    [baseClientsQuery.data?.items, salesQuery.data?.items],
  );
  const listInsights = useMemo(
    () =>
      buildClientListInsights(
        listClientsQuery.data?.items ?? [],
        salesQuery.data?.items ?? [],
      ),
    [listClientsQuery.data?.items, salesQuery.data?.items],
  );
  const visibleInsights = useMemo(
    () => filterAndSortClientInsights(listInsights, filter, sort),
    [filter, listInsights, sort],
  );
  const totalClients = baseClientsQuery.data?.total ?? summaryInsights.length;
  const clientsLoading = baseClientsQuery.isLoading || listClientsQuery.isLoading;
  const peopleLabel =
    totalClients === 1 ? "pessoa no seu negócio" : "pessoas no seu negócio";
  const clientsSubtitle = clientsLoading
    ? "Carregando sua clientela"
    : `${totalClients} ${peopleLabel}`;
  const boughtThisMonth = summaryInsights.filter(
    (insight) => insight.monthOrders > 0,
  ).length;
  const withCredit = summaryInsights.filter((insight) => insight.pendingTotal > 0).length;
  const filterCounts = useMemo(
    () => countClientListFilters(summaryInsights),
    [summaryInsights],
  );
  const tabBarClearance = spacing.lg;
  const listBottomPadding = isDesktop ? spacing["3xl"] : tabBarClearance;
  const selectedSortLabel =
    SORT_OPTIONS.find((option) => option.key === sort)?.label ?? "Mais recentes";
  let clientsContent: React.ReactNode;

  if (listClientsQuery.isLoading) {
    clientsContent = (
      <View style={{ minHeight: 180 }}>
        <SkeletonList rows={6} variant="client" />
      </View>
    );
  } else if (listClientsQuery.error) {
    clientsContent = (
      <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h3" color={pal.ink}>
          Algo deu errado
        </Typography>
        <Typography variant="body" color={pal.muted}>
          Não foi possível carregar seus clientes.
        </Typography>
      </View>
    );
  } else if (totalClients === 0 && !search.trim()) {
    clientsContent = <EmptyClients onCreatePress={onCreatePress} />;
  } else if (visibleInsights.length === 0) {
    clientsContent = (
      <View
        style={{
          minHeight: 150,
          padding: spacing.xl,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          backgroundColor: pal.white,
          borderWidth: 1,
          borderColor: pal.border,
        }}
      >
        <Typography variant="h3" color={pal.ink}>
          Nenhum cliente encontrado
        </Typography>
        <Typography variant="body" color={pal.muted} style={{ textAlign: "center" }}>
          Ajuste a busca ou escolha outro filtro.
        </Typography>
      </View>
    );
  } else {
    const hiddenCount = visibleInsights.length - visibleCount;
    clientsContent = (
      <View style={{ gap: spacing.sm }}>
        {visibleInsights.slice(0, visibleCount).map((insight, index) => (
          <AnimatedListItem key={insight.client.id} index={index}>
            <ClientCard
              insight={insight}
              onPress={() => onClientPress(insight.client.id)}
            />
          </AnimatedListItem>
        ))}
        {hiddenCount > 0 ? (
          <Button
            title={`Ver mais ${Math.min(hiddenCount, CLIENTS_BATCH)} clientes`}
            variant="secondary"
            onPress={() => setVisibleCount((count) => count + CLIENTS_BATCH)}
          />
        ) : null}
      </View>
    );
  }

  const sortModal = (
    <OptionsModal
      visible={sortModalOpen}
      title="Ordenar clientes"
      options={SORT_OPTIONS}
      selected={sort}
      onSelect={setSort}
      onClose={() => setSortModalOpen(false)}
    />
  );

  if (isDesktop) {
    let desktopContent: React.ReactNode;
    if (listClientsQuery.isLoading) {
      desktopContent = <SkeletonList rows={6} variant="client" />;
    } else if (listClientsQuery.error) {
      desktopContent = (
        <DesktopEmptyCard
          title="Algo deu errado"
          description="Não foi possível carregar seus clientes."
          actionLabel="Tentar novamente"
          secondary
          onAction={() => void listClientsQuery.refetch()}
        />
      );
    } else if (totalClients === 0 && !search.trim()) {
      desktopContent = (
        <DesktopEmptyCard
          art={clientsCommunity}
          title="Nenhum cliente ainda"
          description="Cadastre seu primeiro cliente pra acompanhar pedidos e aniversários"
          actionLabel="Novo cliente"
          actionIcon="person-add-outline"
          onAction={onCreatePress}
        />
      );
    } else if (visibleInsights.length === 0) {
      desktopContent = (
        <DesktopEmptyCard
          title="Nenhum cliente encontrado"
          description="Ajuste a busca ou escolha outro filtro."
          actionLabel="Limpar filtros"
          secondary
          onAction={() => {
            setSearch("");
            setFilter("all");
          }}
        />
      );
    } else {
      desktopContent = (
        <View style={{ gap: spacing.md }}>
          <DesktopClientsTable insights={visibleInsights} onClientPress={onClientPress} />
          <DesktopPager
            page={listClientsQuery.data?.page ?? page}
            total={listClientsQuery.data?.total ?? 0}
            totalPages={listClientsQuery.data?.totalPages ?? 1}
            noun={["cliente", "clientes"]}
            onPageChange={setPage}
          />
        </View>
      );
    }
    const loadingValue = (value: number) => (clientsLoading ? "—" : String(value));
    return (
      <>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[desktopPageContent(true), { gap: 0 }]}
        >
          <DesktopHeaderBlock>
            <ScreenGuidance
              renderHeader={(helpButton) => (
                <DesktopMeasuredHeader>
                  <ScreenHeader
                    help={helpButton}
                    title="Clientes"
                    subtitle={clientsSubtitle}
                    hideBack
                    right={
                      <FAB
                        icon="add"
                        header
                        accessibilityLabel="Novo cliente"
                        onPress={onCreatePress}
                      />
                    }
                  />
                </DesktopMeasuredHeader>
              )}
              area="clients"
              onStart={onCreatePress}
              hasRecords={totalClients > 0}
              loading={clientsLoading || baseClientsQuery.isError}
              suspended={filterModalOpen || sortModalOpen}
            />
          </DesktopHeaderBlock>
          <View style={{ gap: desktopLayout.blockGap }}>
            <DesktopStatRow
              items={[
                { label: "Clientes", value: loadingValue(totalClients) },
                { label: "Compraram no mês", value: loadingValue(boughtThisMonth) },
                { label: "Com fiado", value: loadingValue(withCredit) },
              ]}
            />
            <LimitBanner resource="clients" onUpgrade={() => showPaywall("clients")} />
            <View style={{ gap: desktopLayout.sectionGap }}>
              <DesktopListHeader
                title="Seus clientes"
                right={
                  <DesktopSelectButton
                    label="Ordenar:"
                    value={selectedSortLabel}
                    onPress={() => setSortModalOpen(true)}
                  />
                }
              />
              <DesktopToolbar>
                <DesktopSearchField
                  value={search}
                  onChangeText={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder="Buscar cliente"
                />
                <DesktopSegmented
                  options={FILTER_OPTIONS.map((option) => ({
                    ...option,
                    count: clientsLoading ? undefined : filterCounts[option.key],
                  }))}
                  value={filter}
                  onChange={setFilter}
                  accessibilityLabel="Filtrar clientes"
                />
              </DesktopToolbar>
              {desktopContent}
            </View>
          </View>
        </ScrollView>
        {sortModal}
      </>
    );
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={listClientsQuery.isRefetching || salesQuery.isRefetching}
              onRefresh={() => {
                void Promise.all([
                  baseClientsQuery.refetch(),
                  listClientsQuery.refetch(),
                  salesQuery.refetch(),
                ]);
              }}
              colors={[pal.rose]}
              tintColor={pal.rose}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: isDesktop ? 0 : spacing.md,
            paddingBottom: listBottomPadding,
            gap: spacing.xl,
            ...pageGutter(isDesktop, width < 390 ? spacing.md : spacing.xl),
            ...desktopStretch(isDesktop, desktopWidths.data),
          }}
        >
          <View style={{ gap: isDesktop ? 0 : spacing.xl }}>
            <ScreenGuidance
              renderHeader={(helpButton) =>
                isDesktop ? (
                  <ScreenHeader
                    help={helpButton}
                    title="Clientes"
                    subtitle={clientsSubtitle}
                    hideBack
                    right={
                      <FAB
                        icon="add"
                        header
                        accessibilityLabel="Novo cliente"
                        onPress={onCreatePress}
                      />
                    }
                  />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: isDesktop ? spacing.md : spacing.sm,
                    }}
                  >
                    {!isDesktop ? (
                      <Pressable
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                        hitSlop={10}
                        style={{
                          width: 44,
                          height: 44,
                          alignItems: "flex-start",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <AppIcon name="chevron-back" size={28} color={pal.wine} />
                      </Pressable>
                    ) : null}
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography
                        variant="screenTitle"
                        color={pal.wine}
                        numberOfLines={1}
                      >
                        Clientes
                      </Typography>
                      <Typography variant="body" color={pal.muted}>
                        {clientsSubtitle}
                      </Typography>
                    </View>

                    {helpButton}
                    <FAB
                      icon="add"
                      accessibilityLabel="Novo cliente"
                      onPress={onCreatePress}
                      style={{
                        backgroundColor: pal.rose,
                      }}
                    />
                  </View>
                )
              }
              area="clients"
              onStart={onCreatePress}
              hasRecords={totalClients > 0}
              loading={clientsLoading || baseClientsQuery.isError}
              suspended={filterModalOpen || sortModalOpen}
            />
          </View>

          <View
            style={{
              alignSelf: "flex-start",
              maxWidth: isDesktop ? desktopWidths.data : undefined,
              width: "100%",
            }}
          >
            <ClienteleSummary
              total={totalClients}
              boughtThisMonth={boughtThisMonth}
              withCredit={withCredit}
              isLoading={clientsLoading}
            />
          </View>

          <View
            style={{
              alignSelf: "flex-start",
              maxWidth: isDesktop ? 480 : undefined,
              width: "100%",
            }}
          >
            <SearchBox
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar cliente"
              onFilterPress={() => setFilterModalOpen(true)}
            />
          </View>

          <FilterChipRow style={isDesktop ? { maxWidth: desktopWidths.data } : undefined}>
            {FILTER_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                count={clientsLoading ? undefined : filterCounts[option.key]}
                selected={filter === option.key}
                onPress={() => setFilter(option.key)}
              />
            ))}
          </FilterChipRow>

          <LimitBanner resource="clients" onUpgrade={() => showPaywall("clients")} />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Typography variant="h3" color={pal.ink} numberOfLines={1}>
              Seus clientes
            </Typography>
            <Pressable
              onPress={() => setSortModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Ordenar clientes: ${selectedSortLabel}`}
              style={({ pressed }) => ({
                minHeight: 44,
                maxWidth: "52%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: spacing.xs,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Typography
                variant="body"
                color={pal.wine}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={{ fontSize: fontSizes.sm }}
              >
                {selectedSortLabel}
              </Typography>
              <AppIcon name="chevron-down" size={19} color={pal.wine} />
            </Pressable>
          </View>

          {clientsContent}
        </ScrollView>

        {totalClients > 0 ? (
          <ScreenCreateBar title="+ Novo cliente" onPress={onCreatePress} />
        ) : null}
      </View>

      <OptionsModal
        visible={filterModalOpen}
        title="Filtrar clientes"
        options={FILTER_OPTIONS}
        selected={filter}
        onSelect={setFilter}
        onClose={() => setFilterModalOpen(false)}
      />
      {sortModal}
    </>
  );
}

interface NewClientModalProps {
  visible: boolean;
  onClose: () => void;
}

function NewClientModal({ visible, onClose }: Readonly<NewClientModalProps>) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const submittingRef = useRef(false);
  const createClient = useCreateClient();
  const { checkAndBlock: checkClientLimit } = useLimitCheck("clients");
  const showPaywall = usePaywall((s) => s.show);
  const { data: matchingClients, refetch: refetchMatchingClients } = useClients({
    search: phone.trim() || "__sem_telefone__",
  });

  const reset = useCallback(() => {
    setName("");
    setPhone("");
    setAddress("");
    setBirthday("");
    setNotes("");
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const formValidation = useFormValidation(
    {
      name: !name.trim() && "Informe o nome do cliente.",
    },
    visible,
  );

  async function handleCreate() {
    if (!formValidation.validate()) return;
    if (submittingRef.current || createClient.isPending) return;
    submittingRef.current = true;

    try {
      if (checkClientLimit()) return;

      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      if (!trimmedName) {
        alertValidation("Coloque o nome do cliente.");
        return;
      }

      if (trimmedPhone && !isValidBrazilPhone(trimmedPhone)) {
        alertValidation("Telefone inválido. Use DDD + número, ex: (11) 99999-9999.");
        return;
      }

      const phoneDigits = phoneDuplicateKey(trimmedPhone);
      let duplicateCandidates = matchingClients?.items ?? [];
      if (phoneDigits) {
        const refreshedClients = await refetchMatchingClients();
        duplicateCandidates = refreshedClients.data?.items ?? duplicateCandidates;
      }
      const duplicate = duplicateCandidates.find(
        (client) => !!phoneDigits && phoneDuplicateKey(client.phone) === phoneDigits,
      );
      if (duplicate) {
        showAlert({
          title: "Cliente já cadastrado",
          message:
            "Esse telefone já está cadastrado em outro cliente. Abra o cadastro existente para editar.",
        });
        return;
      }

      try {
        await createClient.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone || undefined,
          address: address.trim() || undefined,
          birthday: brToIso(birthday),
          notes: notes.trim() || undefined,
        });
        showAlert({
          title: "Cliente cadastrado!",
          message: `${trimmedName} foi adicionado à sua lista.`,
        });
        close();
      } catch (error: unknown) {
        if (error instanceof ApiError && error.code === "LIMIT_EXCEEDED") {
          showPaywall("clients");
          return;
        }
        let duplicateAfterFailure = false;
        if (phoneDigits) {
          try {
            const refreshedClients = await refetchMatchingClients();
            duplicateAfterFailure =
              refreshedClients.data?.items.some(
                (client) => phoneDuplicateKey(client.phone) === phoneDigits,
              ) ?? false;
          } catch {
            duplicateAfterFailure = false;
          }
        }
        if (duplicateAfterFailure || isClientDuplicateError(error)) {
          showAlert({
            title: "Cliente já cadastrado",
            message:
              "Esse telefone já está cadastrado em outro cliente. Abra o cadastro existente para editar.",
          });
          return;
        }
        showAlert({
          title: "Erro",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível cadastrar o cliente. Tente novamente.",
        });
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <StandardModal
      title="Novo cliente"
      subtitle="Só o nome é obrigatório. Complete o restante quando quiser."
      visible={visible}
      onClose={close}
      dismissDisabled={createClient.isPending}
      footer={
        <Button
          title="Cadastrar cliente"
          size="lg"
          onPress={() => {
            void handleCreate();
          }}
          disabled={createClient.isPending}
          loading={createClient.isPending}
          icon={
            <AppIcon
              name="person-add-outline"
              size={20}
              color={theme.colors.textOnPrimary}
            />
          }
          style={{ flex: 1 }}
        />
      }
    >
      <ClientFormFields
        name={name}
        phone={phone}
        address={address}
        birthday={birthday}
        notes={notes}
        onNameChange={setName}
        onPhoneChange={setPhone}
        onAddressChange={setAddress}
        onBirthdayChange={setBirthday}
        onNotesChange={setNotes}
        nameValidation={formValidation.field("name")}
      />
    </StandardModal>
  );
}

function isClientDuplicateError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;

  const message = error.message.toLowerCase();
  return (
    error.code === "VALIDATION_ERROR" &&
    message.includes("telefone") &&
    message.includes("cadastrado")
  );
}

export default function ClientsScreen() {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const isDesktop = useDesktopLayout();
  const router = useRouter();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) setScreen({ name: "detail", clientId });
  }, [clientId]);

  const { data: editingClient } = useClient(editingClientId ?? "");

  const goToList = useCallback(() => setScreen({ name: "list" }), []);
  const goToCreate = useCallback(() => setScreen({ name: "create" }), []);
  const goToDetail = useCallback(
    (id: string) => setScreen({ name: "detail", clientId: id }),
    [],
  );
  const handleBack = useCallback(() => {
    router.replace("/tabs/more");
  }, [router]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor:
          screen.name === "list" ? pal.background : theme.colors.background,
      }}
    >
      {screen.name === "list" && (
        <ClientsListScreen
          search={search}
          setSearch={setSearch}
          onBack={handleBack}
          onCreatePress={goToCreate}
          onClientPress={goToDetail}
        />
      )}

      {screen.name === "detail" && (
        <>
          <View
            style={{
              paddingTop: spacing.xl,
              paddingBottom: spacing.sm,
              ...pageGutter(isDesktop),
            }}
          >
            <Pressable
              onPress={goToList}
              accessibilityRole="button"
              accessibilityLabel="Voltar para clientes"
              hitSlop={10}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                alignSelf: "flex-start",
                minHeight: 44,
              }}
            >
              <AppIcon name="chevron-back" size={24} color={theme.colors.primaryStrong} />
              <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
                Voltar
              </Typography>
            </Pressable>
          </View>
          <ClientDetail
            clientId={screen.clientId}
            onEditPress={() => setEditingClientId(screen.clientId)}
          />
        </>
      )}

      <NewClientModal visible={screen.name === "create"} onClose={goToList} />

      {editingClientId && editingClient && (
        <EditClientForm
          client={editingClient}
          visible
          onClose={() => setEditingClientId(null)}
          onSuccess={() => setEditingClientId(null)}
        />
      )}
    </SafeAreaView>
  );
}
