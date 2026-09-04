import type { Service } from "@lucro-caseiro/contracts";
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  Chip,
  EmptyState,
  FilterChipRow,
  Input,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Image, Pressable, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import servicesHeroToolkit from "../assets/services-hero-toolkit.png";
import { OrderForm } from "../features/orders/components/order-form";
import { ServiceDashboardModal } from "../features/services/components/service-dashboard-modal";
import { ServiceForm } from "../features/services/components/service-form";
import {
  buildServiceOverview,
  calculateStoredServicePricing,
  filterServices,
  serviceCategoryLabel,
  serviceHasCostData,
  serviceMarginPercent,
  servicePriceHealth,
  type ServiceFilter,
} from "../features/services/domain";
import { useServices } from "../features/services/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { showAlert } from "../shared/components/alert-store";
import { AppIcon, type AppIconName } from "../shared/components/app-icon";
import { FAB } from "../shared/components/fab";
import { ScreenCreateBar } from "../shared/components/screen-create-bar";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import { desktopWidths } from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { formatCurrency } from "../shared/utils/format";

const FILTERS: ReadonlyArray<{ value: ServiceFilter; label: string }> = [
  { value: "active", label: "Disponíveis" },
  { value: "review", label: "Revisar preço" },
  { value: "inactive", label: "Pausados" },
  { value: "all", label: "Todos" },
];

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h${String(remaining).padStart(2, "0")}min` : `${hours}h`;
}

function serviceCountLabel(count: number): string {
  return `${count} ${count === 1 ? "serviço pronto" : "serviços prontos"} para vender`;
}

function reviewLabel(count: number): string {
  if (count === 0) return "Nenhum serviço precisa de revisão";
  if (count === 1) return "1 serviço precisa de revisão";
  return `${count} serviços precisam de revisão`;
}

function priceHealthBadge(service: Service): {
  label: string;
  variant: BadgeVariant;
} {
  const health = servicePriceHealth(service);
  if (health === "missing-price") return { label: "Preço a definir", variant: "warning" };
  if (health === "below-cost") return { label: "Abaixo do custo", variant: "danger" };
  if (health === "costed") return { label: "Custos conferidos", variant: "success" };
  return { label: "Preço definido", variant: "info" };
}

function HeroCard({ count, compact }: Readonly<{ count: number; compact: boolean }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      style={{
        minHeight: compact ? 190 : 220,
        position: "relative",
        borderRadius: radii["2xl"],
        backgroundColor: palette.wineFill,
        overflow: "hidden",
        paddingHorizontal: compact ? spacing.lg : spacing["2xl"],
        paddingVertical: compact ? spacing.xl : spacing["2xl"],
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: compact ? "51%" : "52%",
          maxWidth: 430,
          zIndex: 1,
          gap: spacing.sm,
        }}
      >
        <Typography variant="label" color={palette.lime}>
          SEU CATÁLOGO
        </Typography>
        <Typography
          variant={compact ? "h2" : "h1"}
          color={palette.onWine}
          style={{ letterSpacing: -0.4 }}
        >
          {serviceCountLabel(count)}
        </Typography>
        <Typography
          variant={compact ? "caption" : "body"}
          color={palette.onWine}
          style={{ maxWidth: compact ? 170 : 270 }}
        >
          Preços, tempo e custos em um só lugar.
        </Typography>
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: spacing.xs,
          bottom: compact ? 4 : 0,
          width: compact ? "43%" : "50%",
          height: compact ? "72%" : "88%",
        }}
      >
        <Image
          source={servicesHeroToolkit}
          resizeMode="contain"
          accessible={false}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </View>
    </View>
  );
}

function MetricItem({
  icon,
  label,
  value,
  bordered,
  compact,
}: Readonly<{
  icon: AppIconName;
  label: string;
  value: string;
  bordered?: boolean;
  compact: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: compact ? 96 : 92,
        paddingHorizontal: compact ? spacing.sm : spacing.lg,
        borderLeftWidth: bordered ? 1 : 0,
        borderLeftColor: palette.border,
        flexDirection: compact ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? spacing.xs : spacing.sm,
      }}
    >
      <View
        style={{
          width: compact ? 32 : 40,
          height: compact ? 32 : 40,
          flexShrink: 0,
          borderRadius: radii.full,
          backgroundColor: palette.softRose,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={compact ? 17 : 21} color={palette.wine} />
      </View>
      <View
        style={{ minWidth: 0, gap: 1, alignItems: compact ? "center" : "flex-start" }}
      >
        <Typography
          variant="bodyBold"
          color={palette.wine}
          numberOfLines={1}
          style={{ textAlign: compact ? "center" : "left" }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color={palette.warmGray}
          numberOfLines={2}
          style={{ textAlign: compact ? "center" : "left" }}
        >
          {label}
        </Typography>
      </View>
    </View>
  );
}

function ServiceMetrics({
  available,
  averagePrice,
  averageDuration,
  compact,
}: Readonly<{
  available: number;
  averagePrice: string;
  averageDuration: string;
  compact: boolean;
}>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radii.xl,
        backgroundColor: palette.white,
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <MetricItem
        icon="briefcase-outline"
        value={String(available)}
        label="Disponíveis"
        compact={compact}
      />
      <MetricItem
        icon="pricetag-outline"
        value={averagePrice}
        label="Preço médio"
        bordered
        compact={compact}
      />
      <MetricItem
        icon="time-outline"
        value={averageDuration}
        label="Duração média"
        bordered
        compact={compact}
      />
    </View>
  );
}

function ServiceCard({
  service,
  compact,
  onPress,
}: Readonly<{ service: Service; compact: boolean; onPress: () => void }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const health = priceHealthBadge(service);
  const pricing = calculateStoredServicePricing(service);
  const hasCostData = serviceHasCostData(service);
  const margin = serviceMarginPercent(service);

  return (
    <Card
      variant="elevated"
      padding="lg"
      style={{
        paddingBottom: 0,
        backgroundColor: palette.white,
        borderColor: palette.border,
        gap: spacing.sm,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir opções de ${service.name}`}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
      >
        <View style={{ paddingRight: 44, gap: 2 }}>
          <Typography variant="label" color={palette.rose} numberOfLines={1}>
            {serviceCategoryLabel(service).toLocaleUpperCase("pt-BR")}
          </Typography>
          <Typography variant="h3" color={palette.ink} numberOfLines={2}>
            {service.name}
          </Typography>
        </View>
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="ellipsis-horizontal" size={22} color={palette.warmGray} />
        </View>
      </Pressable>

      {service.description ? (
        <Typography
          variant="body"
          color={palette.warmGray}
          numberOfLines={2}
          style={{ maxWidth: 680 }}
        >
          {service.description}
        </Typography>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Badge
          label={service.active ? "Disponível" : "Pausado"}
          variant={service.active ? "success" : "neutral"}
        />
        <Badge label={health.label} variant={health.variant} />
      </View>

      <View
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <AppIcon name="time-outline" size={18} color={palette.warmGray} />
          <Typography variant="caption" color={palette.warmGray}>
            {durationLabel(service.durationMinutes)}
          </Typography>
        </View>
        <Typography
          variant="money"
          color={service.defaultPrice == null ? palette.warmGray : palette.wine}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {service.defaultPrice == null
            ? "Valor combinado"
            : formatCurrency(service.defaultPrice)}
        </Typography>
      </View>

      {hasCostData ? (
        <View
          style={{
            marginHorizontal: -spacing.lg,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            flexDirection: "row",
          }}
        >
          <View
            style={{
              width: compact ? "42%" : "45%",
              minWidth: 0,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              gap: 2,
            }}
          >
            <Typography variant="caption" color={palette.warmGray}>
              Custo
            </Typography>
            <Typography variant="bodyBold" color={palette.ink} numberOfLines={1}>
              {formatCurrency(pricing.totalCost)}
            </Typography>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 0,
              borderLeftWidth: 1,
              borderLeftColor: palette.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              gap: 2,
            }}
          >
            <Typography variant="caption" color={palette.warmGray}>
              Sugerido
            </Typography>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
              >
                <Typography variant="bodyBold" color={palette.ink} numberOfLines={1}>
                  {formatCurrency(pricing.suggestedPrice)}
                </Typography>
                <AppIcon name="trending-up" size={18} color={palette.limeText} />
              </View>
              {margin == null ? null : (
                <View
                  style={{
                    borderRadius: radii.full,
                    backgroundColor: `${palette.lime}55`,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  }}
                >
                  <Typography variant="captionBold" color={palette.onLime}>
                    Margem {margin}%
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View
          style={{
            marginHorizontal: -spacing.lg,
            borderTopWidth: 1,
            borderTopColor: palette.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <Typography variant="caption" color={palette.warmGray}>
            Adicione os custos para ver o preço sugerido e a margem.
          </Typography>
        </View>
      )}
    </Card>
  );
}

export default function ServicesScreen() {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const router = useRouter();
  const isDesktop = useDesktopLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const compact = viewportWidth < 390;
  const metricsCompact = viewportWidth < 480;
  const servicesQuery = useServices();
  const services = servicesQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ServiceFilter>("active");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentService, setAppointmentService] = useState<Service | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const overview = useMemo(() => buildServiceOverview(services), [services]);
  const filterCounts = useMemo(
    () => ({
      all: services.length,
      active: filterServices(services, "active", "").length,
      review: filterServices(services, "review", "").length,
      inactive: filterServices(services, "inactive", "").length,
    }),
    [services],
  );
  const visibleServices = useMemo(
    () => filterServices(services, filter, search),
    [filter, search, services],
  );
  const averagePriceLabel =
    overview.averagePrice == null ? "—" : formatCurrency(overview.averagePrice);
  const averageDurationLabel =
    overview.averageDurationMinutes == null
      ? "—"
      : durationLabel(overview.averageDurationMinutes);
  const listBottomClearance = spacing.lg;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/tabs/more");
  }

  function renderListHeader() {
    return (
      <View style={{ gap: spacing.lg, paddingBottom: spacing.sm }}>
        <HeroCard count={overview.activeCount} compact={compact} />
        <ServiceMetrics
          available={overview.activeCount}
          averagePrice={averagePriceLabel}
          averageDuration={averageDurationLabel}
          compact={metricsCompact}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${reviewLabel(overview.attentionCount)}. Filtrar serviços para revisão.`}
          onPress={() => setFilter("review")}
          style={({ pressed }) => ({
            minHeight: 52,
            paddingHorizontal: spacing.lg,
            borderRadius: radii.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <AppIcon
            name={
              overview.attentionCount === 0
                ? "checkmark-circle-outline"
                : "alert-circle-outline"
            }
            size={23}
            color={overview.attentionCount === 0 ? palette.limeText : palette.rose}
          />
          <Typography variant="body" color={palette.warmGray} style={{ flex: 1 }}>
            {reviewLabel(overview.attentionCount)}
          </Typography>
          <AppIcon name="chevron-forward" size={20} color={palette.warmGray} />
        </Pressable>

        <Input
          placeholder="Buscar serviço"
          accessibilityLabel="Buscar serviço por nome, categoria ou descrição"
          value={search}
          onChangeText={setSearch}
          icon={<AppIcon name="search-outline" size={21} color={palette.warmGray} />}
          containerStyle={{ width: "100%" }}
        />

        <FilterChipRow>
          {FILTERS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              count={filterCounts[item.value]}
              selected={filter === item.value}
              onPress={() => setFilter(item.value)}
              style={compact ? { paddingHorizontal: spacing.md } : undefined}
            />
          ))}
        </FilterChipRow>

        <View
          style={{
            paddingTop: spacing.sm,
            flexDirection: compact ? "column" : "row",
            alignItems: compact ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: compact ? spacing.xs : spacing.md,
          }}
        >
          <Typography variant="h3" color={palette.ink}>
            Seus serviços
          </Typography>
          <Typography variant="body" color={palette.warmGray}>
            {overview.activeCount} {overview.activeCount === 1 ? "ativo" : "ativos"} de{" "}
            {overview.totalCount}{" "}
            {overview.totalCount === 1 ? "cadastrado" : "cadastrados"}
          </Typography>
        </View>
      </View>
    );
  }

  function renderListEmpty() {
    if (servicesQuery.isLoading) {
      return (
        <View style={{ paddingTop: spacing.lg }}>
          <SkeletonList rows={5} variant="product" />
        </View>
      );
    }

    if (servicesQuery.error) {
      return (
        <Card variant="elevated" style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Typography variant="h3">Não foi possível carregar os serviços</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Verifique sua conexão e tente novamente.
          </Typography>
          <Button
            title="Tentar novamente"
            variant="secondary"
            onPress={() => void servicesQuery.refetch()}
          />
        </Card>
      );
    }

    if (visibleServices.length === 0) {
      let emptyTitle = "Nenhum serviço disponível";
      let emptyDescription =
        "Os serviços pausados continuam guardados e podem ser retomados quando quiser.";
      let emptyActionTitle: string | undefined;
      let onEmptyAction: (() => void) | undefined;

      if (services.length === 0) {
        emptyTitle = "Comece pelo seu primeiro serviço";
        emptyDescription =
          "Cadastre qualquer trabalho que você oferece, defina o tempo e escolha se quer informar um preço.";
        emptyActionTitle = "Cadastrar serviço";
        onEmptyAction = () => setShowCreate(true);
      } else if (filter === "active") {
        emptyActionTitle = "Ver pausados";
        onEmptyAction = () => setFilter("inactive");
      } else if (filter === "inactive") {
        emptyTitle = "Nenhum serviço pausado";
        emptyDescription = "Seus serviços disponíveis continuam aparecendo normalmente.";
      } else if (filter === "review") {
        emptyTitle = "Preços em dia";
        emptyDescription = "Nenhum serviço disponível precisa de revisão de preço.";
      }
      if (search) {
        emptyTitle = "Nenhum resultado encontrado";
        emptyDescription = "Tente buscar por outro nome, categoria ou descrição.";
        emptyActionTitle = undefined;
        onEmptyAction = undefined;
      }

      return (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            emptyActionTitle && onEmptyAction ? (
              <Button title={emptyActionTitle} onPress={onEmptyAction} />
            ) : undefined
          }
        />
      );
    }

    return null;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background }}
      edges={["top"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: desktopWidths.wide,
          alignSelf: "center",
        }}
      >
        <ScreenHeader
          title="Serviços"
          subtitle="Organize o que você faz e quanto vale."
          subtitleNumberOfLines={2}
          onBack={goBack}
          right={
            <FAB
              icon="add"
              header
              accessibilityLabel="Cadastrar serviço"
              onPress={() => setShowCreate(true)}
            />
          }
          titleStyle={{ color: palette.wine }}
          subtitleStyle={{ color: palette.warmGray }}
        />

        <FlatList
          data={servicesQuery.isLoading || servicesQuery.error ? [] : visibleServices}
          keyExtractor={(service) => service.id}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderListEmpty}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              compact={compact}
              onPress={() => setSelectedService(item)}
            />
          )}
          contentContainerStyle={{
            flexGrow: 1,
            gap: spacing.md,
            paddingHorizontal: isDesktop ? 0 : spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: listBottomClearance,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {!servicesQuery.isLoading && !servicesQuery.error && services.length > 0 ? (
        <ScreenCreateBar
          title="+ Cadastrar serviço"
          onPress={() => setShowCreate(true)}
        />
      ) : null}

      {showCreate ? (
        <ServiceForm key="new-service" visible onClose={() => setShowCreate(false)} />
      ) : null}
      {editingService ? (
        <ServiceForm
          key={editingService.id}
          visible
          service={editingService}
          onClose={() => setEditingService(null)}
        />
      ) : null}
      {selectedService ? (
        <ServiceDashboardModal
          key={`dashboard-${selectedService.id}`}
          visible
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={() => {
            setSelectedService(null);
            setEditingService(selectedService);
          }}
          onNewAppointment={() => {
            setSelectedService(null);
            setAppointmentService(selectedService);
          }}
        />
      ) : null}
      {appointmentService ? (
        <OrderForm
          key={`appointment-${appointmentService.id}`}
          visible
          mode="appointment"
          initialServiceId={appointmentService.id}
          onClose={() => setAppointmentService(null)}
          onSuccess={() => {
            setAppointmentService(null);
            showAlert({
              title: "Atendimento agendado",
              message: "Ele já está disponível na Agenda.",
            });
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
