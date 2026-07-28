import type { Service } from "@lucro-caseiro/contracts";
import {
  Badge,
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
import { FlatList, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ServiceForm } from "../features/services/components/service-form";
import { useServices } from "../features/services/hooks";
import { AppIcon } from "../shared/components/app-icon";
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

function ServiceCard({
  service,
  onPress,
}: Readonly<{ service: Service; onPress: () => void }>) {
  const { theme } = useTheme();
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
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Typography variant="bodyBold" numberOfLines={1}>
            {service.name}
          </Typography>
          <Badge
            label={service.active ? "Ativo" : "Inativo"}
            variant={service.active ? "success" : "neutral"}
          />
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
            ? "Sem preço"
            : formatCurrency(service.defaultPrice)}
        </Typography>
      </View>
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
  const [showInactive, setShowInactive] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const visibleServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return services.filter(
      (service) =>
        (showInactive || service.active) &&
        (!query ||
          service.name.toLocaleLowerCase("pt-BR").includes(query) ||
          service.description?.toLocaleLowerCase("pt-BR").includes(query)),
    );
  }, [search, services, showInactive]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/tabs/more");
  }

  function renderServices() {
    if (servicesQuery.isLoading) {
      return (
        <View style={{ ...pageGutter(isDesktop), paddingTop: spacing.lg }}>
          <SkeletonList rows={6} variant="product" />
        </View>
      );
    }

    if (servicesQuery.error) {
      return (
        <Card
          style={{
            ...pageGutter(isDesktop),
            marginTop: spacing.lg,
            gap: spacing.md,
          }}
        >
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
      const hasOnlyInactiveServices = services.length > 0 && !showInactive;
      let emptyTitle = "Nenhum serviço ainda";
      let emptyDescription =
        "Cadastre seu primeiro serviço para organizar preços e atendimentos.";
      if (hasOnlyInactiveServices) {
        emptyTitle = "Nenhum serviço ativo";
        emptyDescription = "Veja todos os serviços para reativar um cadastro.";
      }
      if (search) {
        emptyTitle = "Nenhum serviço encontrado";
        emptyDescription = "Tente buscar por outro nome.";
      }
      const emptyActionTitle = hasOnlyInactiveServices
        ? "Ver todos"
        : "Cadastrar serviço";

      return (
        <View style={{ flex: 1, ...pageGutter(isDesktop) }}>
          <EmptyState
            icon={
              <AppIcon name="briefcase-outline" size={76} color={theme.colors.primary} />
            }
            title={emptyTitle}
            description={emptyDescription}
            action={
              !search ? (
                <Button
                  title={emptyActionTitle}
                  onPress={() => {
                    if (services.length > 0 && !showInactive) {
                      setShowInactive(true);
                      return;
                    }
                    setShowCreate(true);
                  }}
                />
              ) : undefined
            }
          />
        </View>
      );
    }

    return (
      <FlatList
        key={isDesktop ? "desktop-services" : "mobile-services"}
        data={visibleServices}
        numColumns={isDesktop ? 3 : 1}
        keyExtractor={(service) => service.id}
        renderItem={({ item }) => (
          <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
            <ServiceCard service={item} onPress={() => setEditingService(item)} />
          </View>
        )}
        columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
        contentContainerStyle={{
          ...pageGutter(isDesktop),
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
          subtitle={`${services.length} ${
            services.length === 1 ? "serviço cadastrado" : "serviços cadastrados"
          }`}
          onBack={goBack}
          hideBack={isDesktop}
        />

        <View
          style={{
            ...pageGutter(isDesktop),
            gap: spacing.md,
            paddingBottom: spacing.sm,
          }}
        >
          <Input
            placeholder="Buscar serviço"
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
              label="Ativos"
              selected={!showInactive}
              onPress={() => setShowInactive(false)}
            />
            <Chip
              label="Todos"
              selected={showInactive}
              onPress={() => setShowInactive(true)}
            />
          </View>
        </View>

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
              title="Novo serviço"
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
    </SafeAreaView>
  );
}
