import type { Service } from "@lucro-caseiro/contracts";
import {
  Badge,
  type BadgeVariant,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Typography,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Image, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import servicesEmpty from "../assets/services-empty-transparent.png";
import { OrderForm } from "../features/orders/components/order-form";
import { ServiceDashboardModal } from "../features/services/components/service-dashboard-modal";
import { ServiceForm } from "../features/services/components/service-form";
import {
  buildServiceOverview,
  calculateStoredServicePricing,
  filterServices,
  serviceHasCostData,
  servicePriceHealth,
  type ServiceFilter,
} from "../features/services/domain";
import { useServices } from "../features/services/hooks";
import { showAlert } from "../shared/components/alert-store";
import { AppIcon } from "../shared/components/app-icon";
import type { AppIconName } from "../shared/components/app-icon";
import { ScreenHeader } from "../shared/components/screen-header";
import { SkeletonList } from "../shared/components/skeleton";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { formatCurrency } from "../shared/utils/format";

function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

function ServiceMetricCard({
  icon,
  label,
  value,
  hint,
  compact,
}: Readonly<{
  icon: AppIconName;
  label: string;
  value: string;
  hint: string;
  compact: boolean;
}>) {
  const { theme } = useTheme();
  return (
    <Card
      variant="elevated"
      padding="lg"
      style={{
        flex: 1,
        flexBasis: compact ? "46%" : 0,
        minWidth: compact ? 140 : 180,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.surface,
          }}
        >
          <AppIcon name={icon} size={20} color={theme.colors.textSecondary} />
        </View>
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          style={{ flex: 1 }}
        >
          {label}
        </Typography>
      </View>
      <Typography variant="h3">{value}</Typography>
      <Typography variant="caption" color={theme.colors.textSecondary}>
        {hint}
      </Typography>
    </Card>
  );
}

function priceHealthBadge(service: Service): {
  label: string;
  variant: BadgeVariant;
} {
  const health = servicePriceHealth(service);
  if (health === "missing-price") {
    return { label: "Preço a definir", variant: "warning" };
  }
  if (health === "below-cost") {
    return { label: "Abaixo do custo", variant: "danger" };
  }
  if (health === "costed") {
    return { label: "Custos conferidos", variant: "success" };
  }
  return { label: "Preço definido", variant: "info" };
}

function ServiceCard({
  service,
  onPress,
}: Readonly<{ service: Service; onPress: () => void }>) {
  const { theme } = useTheme();
  const health = priceHealthBadge(service);
  const pricing = calculateStoredServicePricing(service);
  const hasCostData = serviceHasCostData(service);
  return (
    <Card
      variant="elevated"
      onPress={onPress}
      style={{ flex: 1, minWidth: 0, gap: spacing.md }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.primaryBg,
          }}
        >
          <AppIcon
            name="briefcase-outline"
            size={23}
            color={theme.colors.primaryStrong}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
          <Typography variant="bodyBold" numberOfLines={1}>
            {service.name}
          </Typography>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            <Badge
              label={service.active ? "Disponível" : "Pausado"}
              variant={service.active ? "success" : "neutral"}
            />
            <Badge label={health.label} variant={health.variant} />
          </View>
        </View>
      </View>

      {service.description ? (
        <Typography
          variant="caption"
          color={theme.colors.textSecondary}
          numberOfLines={2}
        >
          {service.description}
        </Typography>
      ) : null}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <AppIcon name="time-outline" size={18} color={theme.colors.textSecondary} />
          <Typography variant="caption">
            {durationLabel(service.durationMinutes)}
          </Typography>
        </View>
        <Typography
          variant="bodyBold"
          color={
            service.defaultPrice == null
              ? theme.colors.textSecondary
              : theme.colors.primaryStrong
          }
        >
          {service.defaultPrice == null
            ? "Valor combinado"
            : formatCurrency(service.defaultPrice)}
        </Typography>
      </View>

      {hasCostData ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: spacing.md,
            flexDirection: "row",
            gap: spacing.lg,
          }}
        >
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Custo estimado
            </Typography>
            <Typography variant="bodyBold">
              {formatCurrency(pricing.totalCost)}
            </Typography>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              Preço sugerido
            </Typography>
            <Typography variant="bodyBold" color={theme.colors.primaryStrong}>
              {formatCurrency(pricing.suggestedPrice)}
            </Typography>
          </View>
        </View>
      ) : (
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Adicione seus custos para conferir se o preço cobre o atendimento.
        </Typography>
      )}
    </Card>
  );
}

export default function ServicesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useDesktopLayout();
  const insets = useSafeAreaInsets();
  const servicesQuery = useServices();
  const services = servicesQuery.data ?? [];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ServiceFilter>("active");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [appointmentService, setAppointmentService] = useState<Service | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const overview = useMemo(() => buildServiceOverview(services), [services]);
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

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/tabs/more");
  }

  function renderListHeader() {
    return (
      <View style={{ gap: spacing.md }}>
        {!servicesQuery.isLoading && !servicesQuery.error && services.length > 0 ? (
          <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <Typography variant="bodyBold">Visão geral</Typography>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Um retrato rápido dos serviços disponíveis para novos atendimentos.
              </Typography>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <ServiceMetricCard
                icon="briefcase-outline"
                label="Disponíveis"
                value={String(overview.activeCount)}
                hint={`de ${overview.totalCount} cadastrados`}
                compact={!isDesktop}
              />
              <ServiceMetricCard
                icon="cash-outline"
                label="Preço médio"
                value={averagePriceLabel}
                hint={`${overview.pricedCount} com preço definido`}
                compact={!isDesktop}
              />
              <ServiceMetricCard
                icon="time-outline"
                label="Duração média"
                value={averageDurationLabel}
                hint="por atendimento"
                compact={!isDesktop}
              />
              <ServiceMetricCard
                icon="alert-circle-outline"
                label="Revisar preço"
                value={String(overview.attentionCount)}
                hint="sem preço ou abaixo do custo"
                compact={!isDesktop}
              />
            </View>
          </View>
        ) : null}

        <View style={{ gap: spacing.md, paddingBottom: spacing.sm }}>
          <Input
            placeholder="Buscar por nome ou descrição"
            value={search}
            onChangeText={setSearch}
            icon={
              <AppIcon
                name="search-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            }
            containerStyle={{
              width: "100%",
              maxWidth: isDesktop ? 480 : undefined,
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            <Chip
              label="Disponíveis"
              selected={filter === "active"}
              onPress={() => setFilter("active")}
            />
            <Chip
              label="Revisar preço"
              selected={filter === "review"}
              onPress={() => setFilter("review")}
            />
            <Chip
              label="Pausados"
              selected={filter === "inactive"}
              onPress={() => setFilter("inactive")}
            />
            <Chip
              label="Todos"
              selected={filter === "all"}
              onPress={() => setFilter("all")}
            />
          </View>
        </View>
      </View>
    );
  }

  function renderListEmpty() {
    if (servicesQuery.isLoading) {
      return (
        <View style={{ paddingTop: spacing.lg }}>
          <SkeletonList rows={6} variant="product" />
        </View>
      );
    }

    if (servicesQuery.error) {
      return (
        <Card style={{ marginTop: spacing.lg, gap: spacing.md }}>
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
        emptyDescription =
          "Nenhum serviço disponível está sem preço ou abaixo do custo informado.";
      }
      if (search) {
        emptyTitle = "Nenhum resultado encontrado";
        emptyDescription = "Tente buscar por outro nome ou descrição.";
        emptyActionTitle = undefined;
        onEmptyAction = undefined;
      }

      return (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon={
              <Image
                source={servicesEmpty}
                resizeMode="contain"
                style={{
                  width: isDesktop ? 240 : 220,
                  height: isDesktop ? 240 : 220,
                }}
              />
            }
            title={emptyTitle}
            description={emptyDescription}
            action={
              emptyActionTitle && onEmptyAction ? (
                <Button title={emptyActionTitle} onPress={onEmptyAction} />
              ) : undefined
            }
          />
        </View>
      );
    }

    return null;
  }

  function renderServices() {
    return (
      <FlatList
        key={isDesktop ? "desktop-services" : "mobile-services"}
        data={servicesQuery.isLoading || servicesQuery.error ? [] : visibleServices}
        numColumns={isDesktop ? 3 : 1}
        keyExtractor={(service) => service.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        renderItem={({ item }) => (
          <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
            <ServiceCard service={item} onPress={() => setSelectedService(item)} />
          </View>
        )}
        columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
        contentContainerStyle={{
          ...pageGutter(isDesktop),
          flexGrow: 1,
          gap: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing["3xl"],
        }}
      />
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          flex: 1,
          ...desktopStretch(isDesktop, desktopWidths.data),
        }}
      >
        <ScreenHeader
          title="Serviços"
          subtitle={`${overview.activeCount} disponíveis de ${overview.totalCount} cadastrados`}
          onBack={goBack}
          hideBack={isDesktop}
        />

        {renderServices()}

        {services.length > 0 ? (
          <View
            style={{
              paddingHorizontal: isDesktop ? 0 : spacing.xl,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm + insets.bottom,
              alignItems: isDesktop ? "flex-end" : "center",
            }}
          >
            <Button
              title="Cadastrar serviço"
              onPress={() => setShowCreate(true)}
              icon={<AppIcon name="add" size={20} color={theme.colors.textOnPrimary} />}
            />
          </View>
        ) : null}
      </View>

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
