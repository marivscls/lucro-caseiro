import type { Client } from "@lucro-caseiro/contracts";
import {
  Button,
  EmptyState,
  fontSizes,
  fonts,
  PressableScale,
  Typography,
  useTheme,
  spacing,
  radii,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClientDetail } from "../../features/clients/components/client-detail";
import { avatarPastel } from "../../features/clients/components/avatar-colors";
import { EditClientForm } from "../../features/clients/components/edit-client-form";
import { useClient, useClients, useCreateClient } from "../../features/clients/hooks";
import { LimitBanner } from "../../features/subscription/components/limit-banner";
import { useLimitCheck } from "../../shared/hooks/use-limit-check";
import { usePaywall } from "../../shared/hooks/use-paywall";
import { ApiError } from "../../shared/utils/api-client";
import { brToIso, maskDateBR } from "../../shared/utils/date";
import { phoneDuplicateKey } from "../../shared/utils/duplicates";
import { isValidBrazilPhone, maskPhoneBR } from "../../shared/utils/phone";
import { alertValidation } from "../../shared/utils/alerts";
import { showAlert } from "../../shared/components/alert-store";
import { AnimatedListItem } from "../../shared/components/animated-list-item";
import { CalendarModal } from "../../shared/components/calendar-modal";
import { DesktopPagination } from "../../shared/components/desktop-pagination";
import { FAB } from "../../shared/components/fab";
import { useDesktopLayout } from "../../shared/layout/use-desktop-layout";
import {
  ResponsiveModalSurface,
  ResponsiveOverlayModal,
} from "../../shared/components/responsive-modal-surface";
import { desktopAction, desktopContained } from "../../shared/layout/desktop-density";
import clientsEmpty from "../../assets/clients-empty.png";

type Screen =
  | { name: "list" }
  | { name: "detail"; clientId: string }
  | { name: "create" };

type ClientGroup = {
  letter: string;
  data: Client[];
};

// Paleta derivada do tema ativo (antes constantes fixas de dark).
function clientsPalette(theme: { mode: string; colors: Record<string, string> }) {
  const isDark = theme.mode === "dark";
  return {
    cardBg: isDark ? "rgba(44, 36, 32, 0.82)" : theme.colors.surfaceElevated,
    cardBorder: theme.colors.border,
    muted: theme.colors.textSecondary,
    divider: theme.colors.border,
    subtleFill: isDark ? "rgba(245, 225, 219, 0.06)" : "rgba(74, 50, 40, 0.05)",
  };
}

function surfaceStyle(
  pal: ReturnType<typeof clientsPalette>,
  extra?: ViewStyle,
): ViewStyle {
  return {
    backgroundColor: pal.cardBg,
    borderWidth: 1,
    borderColor: pal.cardBorder,
    ...extra,
  };
}

function groupClientsByInitial(items: Client[]): ClientGroup[] {
  const map = new Map<string, Client[]>();
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    const letter = (item.name.trim().charAt(0) || "#").toUpperCase();
    const current = map.get(letter) ?? [];
    current.push(item);
    map.set(letter, current);
  }

  const entries = [...map.entries()];
  entries.sort(([a], [b]) => a.localeCompare(b, "pt-BR"));

  return entries.map(([letter, data]) => {
    const sortedData = [...data];
    sortedData.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return { letter, data: sortedData };
  });
}

interface SearchBoxProps {
  value: string;
  onChangeText: (value: string) => void;
  onFilterPress?: () => void;
  placeholder: string;
  filterIcon?: keyof typeof Ionicons.glyphMap;
}

function SearchBox({
  value,
  onChangeText,
  onFilterPress,
  placeholder,
  filterIcon = "options-outline",
}: Readonly<SearchBoxProps>) {
  const { theme } = useTheme();
  const pal = clientsPalette(theme);

  return (
    <View
      style={[
        surfaceStyle(pal, {
          minHeight: 48,
          borderRadius: radii.xl,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        }),
      ]}
    >
      <Ionicons name="search-outline" size={20} color={pal.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={{
          flex: 1,
          color: theme.colors.text,
          fontSize: fontSizes.md,
          fontFamily: fonts.semiBold,
          paddingVertical: 0,
        }}
      />
      <Pressable
        onPress={onFilterPress}
        hitSlop={10}
        style={{
          borderLeftWidth: 1,
          borderLeftColor: pal.divider,
          paddingLeft: spacing.md,
        }}
      >
        <Ionicons name={filterIcon} size={21} color={pal.muted} />
      </Pressable>
    </View>
  );
}

interface AvatarProps {
  label: string;
  size?: number;
}

function Avatar({ label, size = 44 }: Readonly<AvatarProps>) {
  const { theme } = useTheme();
  const pastel = avatarPastel(label, theme.mode);
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
        style={{ fontSize: size * 0.48, fontFamily: fonts.displayBold }}
      >
        {(label.trim().charAt(0) || "?").toUpperCase()}
      </Typography>
    </View>
  );
}

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

function ClientCard({ client, onPress }: Readonly<ClientCardProps>) {
  const { theme } = useTheme();
  const pal = clientsPalette(theme);

  return (
    <PressableScale
      onPress={onPress}
      style={surfaceStyle(pal, {
        borderRadius: radii["2xl"],
        minHeight: 62,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      })}
    >
      <Avatar label={client.name} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Typography
          variant="h3"
          color={theme.colors.text}
          numberOfLines={1}
          style={{ fontSize: fontSizes.md }}
        >
          {client.name}
        </Typography>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="call" size={14} color={pal.muted} />
          <Typography
            variant="body"
            color={pal.muted}
            numberOfLines={1}
            style={{ fontSize: fontSizes.xs }}
          >
            {client.phone || "Sem telefone"}
          </Typography>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={22} color={pal.muted} />
    </PressableScale>
  );
}

function DesktopClientsTable({
  items,
  page,
  total,
  totalPages,
  onClientPress,
  onPageChange,
}: Readonly<{
  items: Client[];
  page: number;
  total: number;
  totalPages: number;
  onClientPress: (id: string) => void;
  onPageChange: (page: number) => void;
}>) {
  const { theme } = useTheme();
  const pal = clientsPalette(theme);
  const headerStyle = {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.4,
  } as const;

  return (
    <View
      style={surfaceStyle(pal, {
        borderRadius: radii.xl,
        overflow: "hidden",
      })}
    >
      <View
        style={{
          minHeight: 46,
          paddingHorizontal: spacing.lg,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
        }}
      >
        <Typography variant="caption" style={[headerStyle, { flex: 1.6 }]}>
          Cliente
        </Typography>
        <Typography variant="caption" style={[headerStyle, { flex: 1.1 }]}>
          Telefone
        </Typography>
        <Typography variant="caption" style={[headerStyle, { flex: 0.9 }]}>
          Aniversário
        </Typography>
        <Typography variant="caption" style={[headerStyle, { flex: 1.8 }]}>
          Observações
        </Typography>
        <View style={{ width: 20 }} />
      </View>

      {items.map((client) => (
        <Pressable
          key={client.id}
          accessibilityRole="button"
          onPress={() => onClientPress(client.id)}
          style={({ pressed }) => ({
            minHeight: 62,
            paddingHorizontal: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.primaryBg : pal.cardBg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
          })}
        >
          <View
            style={{
              flex: 1.6,
              minWidth: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <Avatar label={client.name} size={36} />
            <Typography variant="bodyBold" numberOfLines={1} style={{ flex: 1 }}>
              {client.name}
            </Typography>
          </View>
          <Typography variant="body" numberOfLines={1} style={{ flex: 1.1 }}>
            {client.phone || "—"}
          </Typography>
          <Typography variant="body" style={{ flex: 0.9 }}>
            {client.birthday
              ? new Date(`${client.birthday}T12:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })
              : "—"}
          </Typography>
          <Typography variant="body" numberOfLines={1} style={{ flex: 1.8 }}>
            {client.notes || "—"}
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={pal.muted} />
        </Pressable>
      ))}

      <DesktopPagination
        page={page}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </View>
  );
}

function EmptyClients({ onCreatePress }: Readonly<{ onCreatePress: () => void }>) {
  return (
    <EmptyState
      icon={
        <Image
          source={clientsEmpty}
          resizeMode="contain"
          style={{ width: 146, height: 146 }}
        />
      }
      title="Nenhum cliente ainda"
      description="Cadastre seu primeiro cliente pra acompanhar pedidos e aniversários"
      action={<Button title="Novo cliente" onPress={onCreatePress} />}
      style={{ flex: undefined }}
    />
  );
}

interface ClientsListScreenProps {
  search: string;
  setSearch: (value: string) => void;
  onCreatePress: () => void;
  onClientPress: (id: string) => void;
}

function ClientsListScreen({
  search,
  setSearch,
  onCreatePress,
  onClientPress,
}: Readonly<ClientsListScreenProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = clientsPalette(theme);
  const showPaywall = usePaywall((s) => s.show);
  const [showTip, setShowTip] = useState(true);
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isRefetching } = useClients({
    page: isDesktop ? page : undefined,
    search: search.trim() || undefined,
  });

  const groups = useMemo(() => groupClientsByInitial(data?.items ?? []), [data?.items]);
  const totalClients = groups.reduce((sum, group) => sum + group.data.length, 0);
  let listBottomPadding = showTip ? 218 : 150;
  if (isDesktop) listBottomPadding = spacing["3xl"];
  let clientsContent: React.ReactNode;

  if (isLoading) {
    clientsContent = (
      <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  } else if (error) {
    clientsContent = (
      <View style={{ minHeight: 180, alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h3" color={theme.colors.text}>
          Algo deu errado
        </Typography>
        <Typography variant="body" color={pal.muted}>
          Não foi possível carregar seus clientes.
        </Typography>
      </View>
    );
  } else if (groups.length === 0) {
    clientsContent = <EmptyClients onCreatePress={onCreatePress} />;
  } else if (isDesktop) {
    clientsContent = (
      <DesktopClientsTable
        items={data?.items ?? []}
        page={data?.page ?? page}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 1}
        onClientPress={onClientPress}
        onPageChange={setPage}
      />
    );
  } else {
    clientsContent = (
      <View style={{ gap: spacing.lg }}>
        {groups.map((group) => (
          <View key={group.letter} style={{ gap: spacing.sm }}>
            <Typography
              variant="h2"
              color={pal.muted}
              style={{ fontSize: fontSizes.md, fontFamily: fonts.displayBold }}
            >
              {group.letter}
            </Typography>
            <View style={{ gap: spacing.sm }}>
              {group.data.map((client, i) => (
                <AnimatedListItem key={client.id} index={i}>
                  <ClientCard client={client} onPress={() => onClientPress(client.id)} />
                </AnimatedListItem>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: listBottomPadding,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          {!isDesktop && (
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Typography
                variant="display"
                color={theme.colors.text}
                style={{ fontSize: fontSizes["3xl"] }}
              >
                Clientes
              </Typography>
              <Typography
                variant="label"
                color={pal.muted}
                style={{ fontSize: fontSizes.xs, letterSpacing: 2.4 }}
              >
                {totalClients} CLIENTES CADASTRADOS
              </Typography>
            </View>
          )}

          <Pressable
            onPress={onCreatePress}
            style={({ pressed }) => [
              surfaceStyle(pal, {
                borderRadius: radii.xl,
                minHeight: 48,
                paddingHorizontal: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
                opacity: pressed ? 0.86 : 1,
              }),
            ]}
          >
            <Ionicons name="person-add-outline" size={22} color={pal.muted} />
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={{ fontSize: fontSizes.sm }}
            >
              Novo cliente
            </Typography>
          </Pressable>
        </View>

        <SearchBox
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por nome ou telefone..."
          onFilterPress={() => {
            showAlert({
              title: "Filtro de clientes",
              message: "Use a busca para filtrar por nome ou telefone.",
            });
          }}
        />

        <LimitBanner resource="clients" onUpgrade={() => showPaywall("clients")} />

        {clientsContent}
      </ScrollView>

      {!isDesktop && (
        <FAB
          icon="add"
          accessibilityLabel="Novo cliente"
          onPress={onCreatePress}
          style={{
            position: "absolute",
            right: spacing.xl,
            bottom: showTip ? 118 : 98,
          }}
        />
      )}

      {!isDesktop && showTip && (
        <View
          style={[
            surfaceStyle(pal, {
              position: "absolute",
              left: spacing.xl,
              right: spacing.xl,
              bottom: 34,
              borderRadius: radii.xl,
              minHeight: 68,
              padding: spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
            }),
          ]}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: pal.subtleFill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people-outline" size={20} color={pal.muted} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Typography
              variant="bodyBold"
              color={theme.colors.text}
              style={{ fontSize: fontSizes.xs }}
            >
              Dica rápida
            </Typography>
            <Typography
              variant="body"
              color={theme.colors.text}
              style={{ fontSize: fontSizes.xs, lineHeight: 16 }}
            >
              Mantenha seus clientes atualizados para uma comunicação mais eficiente.
            </Typography>
          </View>
          <Pressable onPress={() => setShowTip(false)} hitSlop={10}>
            <Ionicons name="close" size={24} color={pal.muted} />
          </Pressable>
        </View>
      )}
    </>
  );
}

interface NewClientFieldProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  onTrailingPress?: () => void;
  tall?: boolean;
  count?: string;
}

function NewClientField({
  icon,
  label,
  trailingIcon,
  onTrailingPress,
  tall,
  count,
  style,
  ...inputProps
}: Readonly<NewClientFieldProps>) {
  const { theme } = useTheme();
  const pal = clientsPalette(theme);

  return (
    <View
      style={[
        surfaceStyle(pal, {
          minHeight: tall ? 108 : 72,
          borderRadius: radii.xl,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          flexDirection: "row",
          gap: spacing.md,
        }),
      ]}
    >
      <View
        style={{
          width: 42,
          height: 48,
          borderRadius: 21,
          backgroundColor: pal.subtleFill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={24} color={pal.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="bodyBold"
          color={theme.colors.text}
          style={{ fontSize: fontSizes.md, marginBottom: 0 }}
        >
          {label}
        </Typography>
        <TextInput
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            {
              color: theme.colors.text,
              fontSize: fontSizes.md,
              lineHeight: 22,
              padding: 0,
              minHeight: tall ? 50 : 24,
              textAlignVertical: tall ? "top" : "center",
            },
            style,
          ]}
          {...inputProps}
        />
      </View>
      {trailingIcon ? (
        <Pressable
          onPress={onTrailingPress}
          disabled={!onTrailingPress}
          hitSlop={10}
          style={{ alignSelf: "center", opacity: onTrailingPress ? 1 : 0.9 }}
        >
          <Ionicons name={trailingIcon} size={23} color={pal.muted} />
        </Pressable>
      ) : null}
      {count ? (
        <Typography
          variant="caption"
          color={pal.muted}
          style={{ position: "absolute", right: spacing.lg, bottom: spacing.sm }}
        >
          {count}
        </Typography>
      ) : null}
    </View>
  );
}

interface NewClientModalProps {
  visible: boolean;
  onClose: () => void;
}

function NewClientModal({ visible, onClose }: Readonly<NewClientModalProps>) {
  const { theme } = useTheme();
  const isDesktop = useDesktopLayout();
  const pal = clientsPalette(theme);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
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

  async function handleCreate() {
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
    <ResponsiveOverlayModal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <ResponsiveModalSurface maxWidth={840}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.lg,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
              <Pressable
                onPress={close}
                style={{
                  width: 42,
                  height: 48,
                  borderRadius: 21,
                  backgroundColor: pal.subtleFill,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="arrow-back" size={23} color={pal.muted} />
              </Pressable>
              <Typography variant="h1" color={theme.colors.text}>
                Novo cliente
              </Typography>
            </View>
            <Pressable onPress={close} hitSlop={10}>
              <Typography
                variant="bodyBold"
                color={theme.colors.primaryStrong}
                style={{ fontSize: fontSizes.md }}
              >
                Cancelar
              </Typography>
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                {
                  flexGrow: 1,
                  paddingHorizontal: spacing.xl,
                  paddingTop: spacing.md,
                  paddingBottom: spacing["5xl"],
                  gap: spacing.md,
                },
                desktopContained(isDesktop, 720),
              ]}
            >
              <View
                style={[
                  surfaceStyle(pal, {
                    borderRadius: radii.lg,
                    minHeight: 74,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.primaryLight,
                    marginTop: spacing.sm,
                  }),
                ]}
              >
                <View
                  style={{
                    width: 42,
                    height: 48,
                    borderRadius: 21,
                    backgroundColor: pal.subtleFill,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person-add-outline" size={24} color={pal.muted} />
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Typography
                    variant="bodyBold"
                    color={theme.colors.text}
                    style={{ fontSize: fontSizes.md }}
                  >
                    Preencha os dados do cliente.
                  </Typography>
                  <Typography
                    variant="body"
                    color={pal.muted}
                    style={{ fontSize: fontSizes.sm }}
                  >
                    Campos opcionais ajudam a personalizar o cadastro.
                  </Typography>
                </View>
              </View>

              <NewClientField
                icon="person-outline"
                label="Nome do cliente *"
                placeholder="Ex: Maria Silva, João Pereira..."
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <NewClientField
                icon="call-outline"
                label="Telefone (opcional)"
                placeholder="Ex: (11) 99999-9999"
                value={phone}
                onChangeText={(value) => setPhone(maskPhoneBR(value))}
                keyboardType="phone-pad"
              />
              <NewClientField
                icon="location-outline"
                label="Endereço (opcional)"
                placeholder="Ex: Rua das Flores, 123"
                value={address}
                onChangeText={setAddress}
              />
              <NewClientField
                icon="calendar-outline"
                label="Data de nascimento (opcional)"
                placeholder="DD/MM/AAAA"
                value={birthday}
                onChangeText={(value) => setBirthday(maskDateBR(value))}
                keyboardType="number-pad"
                trailingIcon="calendar-outline"
                onTrailingPress={() => setCalendarVisible(true)}
              />
              <NewClientField
                icon="document-text-outline"
                label="Observações (opcional)"
                placeholder="Anotações sobre o cliente..."
                value={notes}
                onChangeText={(value) => setNotes(value.slice(0, 200))}
                multiline
                tall
                maxLength={200}
                count={`${notes.length}/200`}
              />
              <Typography
                variant="body"
                color={pal.muted}
                style={{ fontSize: fontSizes.sm }}
              >
                <Typography variant="bodyBold" color={theme.colors.text}>
                  *
                </Typography>{" "}
                Campos obrigatórios
              </Typography>

              <Pressable
                onPress={() => {
                  void handleCreate();
                }}
                disabled={createClient.isPending}
                style={({ pressed }) => [
                  {
                    minHeight: 58,
                    borderRadius: radii.xl,
                    backgroundColor: theme.colors.primaryInteractive,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: spacing.md,
                    opacity: pressed || createClient.isPending ? 0.82 : 1,
                  },
                  desktopAction(isDesktop, 240),
                ]}
              >
                {createClient.isPending ? (
                  <ActivityIndicator color={theme.colors.textOnPrimary} />
                ) : (
                  <Ionicons
                    name="person-add-outline"
                    size={23}
                    color={theme.colors.textOnPrimary}
                  />
                )}
                <Typography
                  variant="bodyBold"
                  color={theme.colors.textOnPrimary}
                  style={{ fontSize: fontSizes.lg }}
                >
                  Cadastrar cliente
                </Typography>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
          <CalendarModal
            visible={calendarVisible}
            value={birthday}
            onClose={() => setCalendarVisible(false)}
            onSelect={setBirthday}
          />
        </SafeAreaView>
      </ResponsiveModalSurface>
    </ResponsiveOverlayModal>
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
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const { data: editingClient } = useClient(editingClientId ?? "");

  const goToList = useCallback(() => setScreen({ name: "list" }), []);
  const goToCreate = useCallback(() => setScreen({ name: "create" }), []);
  const goToDetail = useCallback(
    (id: string) => setScreen({ name: "detail", clientId: id }),
    [],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {screen.name === "list" && (
        <ClientsListScreen
          search={search}
          setSearch={setSearch}
          onCreatePress={goToCreate}
          onClientPress={goToDetail}
        />
      )}

      {screen.name === "detail" && (
        <>
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.xl,
              paddingBottom: spacing.sm,
            }}
          >
            <Pressable
              onPress={goToList}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primaryStrong} />
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
        <ResponsiveOverlayModal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditingClientId(null)}
        >
          <ResponsiveModalSurface maxWidth={840}>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <View
                style={{
                  padding: spacing.xl,
                  paddingBottom: spacing.sm,
                  alignItems: "flex-end",
                }}
              >
                <Pressable onPress={() => setEditingClientId(null)}>
                  <Typography variant="body" color={theme.colors.primary}>
                    Cancelar
                  </Typography>
                </Pressable>
              </View>
              <EditClientForm
                client={editingClient}
                onSuccess={() => setEditingClientId(null)}
              />
            </SafeAreaView>
          </ResponsiveModalSurface>
        </ResponsiveOverlayModal>
      )}
    </SafeAreaView>
  );
}
