import type { Quote, QuoteStatusType } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  FilterChipRow,
  Input,
  Typography,
  useTheme,
  fontSizes,
  iconSizes,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { AppIcon } from "../shared/components/app-icon";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import quotesDocument3d from "../assets/orcamentos-documento-3d.png";
import { trackAnalyticsAction } from "../features/analytics/tracker";
import { useClient } from "../features/clients/hooks";
import { QuoteDetailContent } from "../features/quotes/components/quote-detail-content";
import { QuoteForm } from "../features/quotes/components/quote-form";
import { showAlert } from "../shared/components/alert-store";
import { ContentTransition } from "../shared/components/motion-feedback";
import { ScreenHeader } from "../shared/components/screen-header";
import { useBrandScreenPalette } from "../shared/brand-palette";
import { FAB } from "../shared/components/fab";
import { ScreenCreateBar } from "../shared/components/screen-create-bar";
import { SkeletonList } from "../shared/components/skeleton";
import {
  useConvertQuote,
  useDeleteQuote,
  useQuotes,
  useUpdateQuoteStatus,
} from "../features/quotes/hooks";
import { buildQuoteMessage } from "../features/quotes/message";
import { exportQuotePdf } from "../features/quotes/quote-pdf";
import { useProfile } from "../features/subscription/hooks";
import { DateField } from "../shared/components/date-field";
import { showToast } from "../shared/components/toast";
import { usePaywall } from "../shared/hooks/use-paywall";
import { useAuth } from "../shared/hooks/use-auth";
import { brToIso } from "../shared/utils/date";
import {
  desktopStretch,
  desktopWidths,
  pageGutter,
} from "../shared/layout/desktop-density";
import { useDesktopLayout } from "../shared/layout/use-desktop-layout";
import { StandardModal } from "../shared/components/standard-modal";
import { formatCurrency } from "../shared/utils/format";
import { isValidBrazilPhone } from "../shared/utils/phone";
import { openWhatsApp, openWhatsAppShare } from "../shared/utils/whatsapp";
import { alertValidation, alertError } from "../shared/utils/alerts";
import { maskCurrencyInput, parseCurrencyInput } from "../shared/utils/currency-input";

const STATUS_META: Record<
  QuoteStatusType,
  { label: string; variant: "warning" | "success" | "danger" }
> = {
  pending: { label: "Aguardando", variant: "warning" },
  accepted: { label: "Aprovado", variant: "success" },
  rejected: { label: "Recusado", variant: "danger" },
};

type QuoteStatusMeta = (typeof STATUS_META)[QuoteStatusType];

function quoteStatusMeta(status: string): QuoteStatusMeta {
  if (status === "expired") return { label: "Expirado", variant: "warning" };
  return (
    STATUS_META[status as QuoteStatusType] ?? {
      label: "Status indisponível",
      variant: "warning",
    }
  );
}

const FILTERS: { key: QuoteStatusType | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Aguardando" },
  { key: "accepted", label: "Aprovados" },
  { key: "rejected", label: "Recusados" },
];

function normalizeQuoteSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function formatSentDate(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "Enviado recentemente";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sentDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const daysAgo = Math.floor((today.getTime() - sentDay.getTime()) / 86_400_000);

  if (daysAgo === 0) return "Enviado hoje";
  if (daysAgo === 1) return "Enviado ontem";

  const compactDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  })
    .format(created)
    .replace(" de ", " ")
    .replace(".", "");
  return `Enviado ${compactDate}`;
}

function QuoteStatusChip({ status }: Readonly<{ status: string }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const meta = quoteStatusMeta(status);
  let backgroundColor = theme.colors.yellowBg;
  let dotColor: string = pal.lime;
  let textColor = theme.colors.yellow;

  if (status === "accepted") {
    backgroundColor = theme.colors.successBg;
    dotColor = theme.colors.success;
    textColor = theme.colors.success;
  } else if (status === "rejected") {
    backgroundColor = theme.colors.alertBg;
    dotColor = theme.colors.alert;
    textColor = theme.colors.alert;
  }

  return (
    <ContentTransition
      transitionKey={status}
      duration={220}
      style={{
        minHeight: 30,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor,
      }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: radii.full,
          backgroundColor: dotColor,
        }}
      />
      <Typography variant="caption" color={textColor} numberOfLines={1}>
        {meta.label}
      </Typography>
    </ContentTransition>
  );
}

function QuoteSummaryHero({
  quotes,
  width,
}: Readonly<{ quotes: Quote[]; width: number }>) {
  const pal = useBrandScreenPalette();
  const pendingQuotes = quotes.filter((quote) => quote.status === "pending");
  const pendingTotal = pendingQuotes.reduce((total, quote) => total + quote.total, 0);
  const compact = width < 360;
  const imageSize = Math.min(160, Math.max(96, (width - spacing["3xl"]) * 0.36));
  const cardHeight = compact ? 164 : 176;
  const textWidth = Math.max(
    132,
    width - spacing["3xl"] - imageSize - (compact ? spacing.xs : spacing.md),
  );
  const proposalLabel =
    pendingQuotes.length === 1
      ? "1 proposta aguardando"
      : `${pendingQuotes.length} propostas aguardando`;

  return (
    <View
      style={{
        width: "100%",
        height: cardHeight,
        borderRadius: radii["2xl"],
        backgroundColor: pal.wineFill,
        overflow: "hidden",
        paddingHorizontal: spacing.xl,
        justifyContent: "center",
      }}
    >
      <View style={{ width: textWidth, gap: spacing.sm, zIndex: 1 }}>
        <Typography variant="body" color={pal.onWine} numberOfLines={1}>
          Em negociação
        </Typography>
        <Typography
          variant={compact ? "moneyLg" : "homeFinancialValue"}
          color={pal.onWine}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.76}
          style={{ width: "100%", fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(pendingTotal)}
        </Typography>
        <Typography variant="body" color={pal.onWine} numberOfLines={compact ? 2 : 1}>
          {proposalLabel}
        </Typography>
      </View>

      <Image
        source={quotesDocument3d}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{
          position: "absolute",
          right: spacing.md,
          top: (cardHeight - imageSize) / 2,
          width: imageSize,
          height: imageSize,
        }}
      />
    </View>
  );
}

function QuoteCard({
  quote,
  number,
  narrow,
  onPress,
}: Readonly<{ quote: Quote; number: number; narrow: boolean; onPress: () => void }>) {
  const pal = useBrandScreenPalette();
  const quoteLabel = `ORÇAMENTO #${String(number).padStart(2, "0")}`;
  const itemLabel = quote.items.length === 1 ? "1 item" : `${quote.items.length} itens`;

  if (narrow) {
    return (
      <Card
        onPress={onPress}
        variant="elevated"
        padding="lg"
        style={{ minHeight: 154, backgroundColor: pal.white }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                color={pal.muted}
                numberOfLines={1}
                style={{ textTransform: "uppercase" }}
              >
                {quoteLabel}
              </Typography>
              <Typography variant="h3" color={pal.ink} numberOfLines={2}>
                {quote.title}
              </Typography>
            </View>
            <View
              style={{
                width: 120,
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: spacing.xs,
              }}
            >
              <Typography
                variant="money"
                color={pal.wine}
                numberOfLines={1}
                style={{ flex: 1, textAlign: "right" }}
              >
                {formatCurrency(quote.total)}
              </Typography>
              <AppIcon name="chevron-forward" size={iconSizes.xs} color={pal.ink} />
            </View>
          </View>

          <Typography
            variant="body"
            color={pal.ink}
            numberOfLines={1}
            style={{ fontSize: fontSizes.sm }}
          >
            {quote.clientName ?? "Sem cliente"} · {itemLabel}
          </Typography>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <AppIcon name="calendar-outline" size={iconSizes.xs} color={pal.muted} />
              <Typography variant="caption" color={pal.muted} numberOfLines={1}>
                {formatSentDate(quote.createdAt)}
              </Typography>
            </View>
            <QuoteStatusChip status={quote.status} />
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card
      onPress={onPress}
      variant="elevated"
      padding="lg"
      style={{ minHeight: 136, backgroundColor: pal.white }}
    >
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography
            variant="caption"
            color={pal.muted}
            numberOfLines={1}
            style={{ textTransform: "uppercase" }}
          >
            {quoteLabel}
          </Typography>
          <Typography
            variant="h3"
            color={pal.ink}
            numberOfLines={2}
            style={{ marginBottom: 2 }}
          >
            {quote.title}
          </Typography>
          <Typography
            variant="body"
            color={pal.ink}
            numberOfLines={1}
            style={{ fontSize: fontSizes.sm }}
          >
            {quote.clientName ?? "Sem cliente"} · {itemLabel}
          </Typography>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <AppIcon name="calendar-outline" size={iconSizes.xs} color={pal.muted} />
            <Typography variant="caption" color={pal.muted} numberOfLines={1}>
              {formatSentDate(quote.createdAt)}
            </Typography>
          </View>
        </View>

        <View
          style={{
            width: 122,
            flexShrink: 0,
            alignItems: "flex-end",
            justifyContent: "center",
            gap: spacing.md,
          }}
        >
          <Typography
            variant="money"
            color={pal.wine}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{ width: "100%", textAlign: "right" }}
          >
            {formatCurrency(quote.total)}
          </Typography>
          <QuoteStatusChip status={quote.status} />
        </View>

        <AppIcon name="chevron-forward" size={iconSizes.sm} color={pal.ink} />
      </View>
    </Card>
  );
}

function ConvertModal({
  quote,
  visible,
  onClose,
  onDone,
}: Readonly<{
  quote: Quote;
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
}>) {
  const convert = useConvertQuote();
  const [dateText, setDateText] = useState("");
  const [deposit, setDeposit] = useState("");

  async function handleConvert() {
    const iso = brToIso(dateText);
    if (!iso) {
      alertValidation("Informe a data de entrega no formato DD/MM/AAAA.");
      return;
    }
    const parsedDeposit = deposit.trim() ? parseCurrencyInput(deposit) : undefined;
    if (parsedDeposit !== undefined && Number.isNaN(parsedDeposit)) {
      alertValidation("Sinal inválido.");
      return;
    }
    try {
      await convert.mutateAsync({
        id: quote.id,
        data: { deliveryDate: iso, deposit: parsedDeposit ?? null },
      });
      showToast("Encomenda criada na agenda!");
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível converter.";
      alertError(message);
    }
  }

  return (
    <StandardModal
      title="Aprovar e criar encomenda"
      visible={visible}
      onClose={onClose}
      footer={
        <>
          <Button
            title="Cancelar"
            variant="ghost"
            onPress={onClose}
            style={{ flex: 1 }}
          />
          <Button
            title="Criar encomenda"
            onPress={() => void handleConvert()}
            loading={convert.isPending}
            style={{ flex: 1 }}
          />
        </>
      }
    >
      <View style={{ flexShrink: 1, gap: spacing.md }}>
        <Typography variant="caption">
          O orçamento "{quote.title}" ({formatCurrency(quote.total)}) vira uma encomenda
          na sua agenda.
        </Typography>
        <DateField label="Data de entrega" value={dateText} onChange={setDateText} />
        <Input
          label="Sinal recebido (opcional)"
          placeholder="Ex.: 60,00"
          value={deposit}
          onChangeText={(value) => setDeposit(maskCurrencyInput(value))}
          keyboardType="numeric"
        />
      </View>
    </StandardModal>
  );
}

function QuoteDetail({
  quote,
  onClose,
  onEdit,
}: Readonly<{ quote: Quote; onClose: () => void; onEdit: () => void }>) {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: client, refetch: refetchClient } = useClient(quote.clientId ?? "");
  const showPaywall = usePaywall((s) => s.show);
  const setStatus = useUpdateQuoteStatus();
  const removeQuote = useDeleteQuote();
  const [convertVisible, setConvertVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const businessName = profile?.businessName ?? profile?.name ?? "Meu negócio";

  async function handleWhatsApp() {
    const message = buildQuoteMessage(quote, businessName);
    const currentClient =
      client ?? (quote.clientId ? (await refetchClient()).data : undefined);
    if (currentClient?.phone && isValidBrazilPhone(currentClient.phone)) {
      await openWhatsApp(currentClient.phone, message);
    } else {
      await openWhatsAppShare(message);
    }
  }

  async function handlePdf() {
    if (!profile || !hasActiveFeature(profile.plan, profile.planExpiresAt, "quotesPdf")) {
      showPaywall("export");
      return;
    }
    setExporting(true);
    try {
      await exportQuotePdf(quote, { name: businessName, phone: profile?.phone });
      void trackAnalyticsAction("quote_pdf_exported", useAuth.getState().token);
    } catch {
      alertError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleReject() {
    showAlert({
      title: "Recusado?",
      message: "Marcar este orçamento como recusado?",
      buttons: [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, recusado",
          style: "destructive",
          onPress: () => {
            setStatus
              .mutateAsync({ id: quote.id, status: "rejected" })
              .then(() => showToast("Orçamento marcado como recusado."))
              .catch(() => alertError("Não foi possível atualizar."));
          },
        },
      ],
    });
  }

  function handleDelete() {
    showAlert({
      title: "Excluir orçamento",
      message: "Essa ação não pode ser desfeita.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            removeQuote
              .mutateAsync(quote.id)
              .then(() => {
                showToast("Orçamento excluído.");
                onClose();
              })
              .catch(() => alertError("Não foi possível excluir."));
          },
        },
      ],
    });
  }

  // Ações secundárias agrupadas num menu, pra não virar parede de botões.
  function openMoreActions() {
    const options: {
      text: string;
      style?: "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: exporting ? "Gerando PDF..." : "Orçamento em PDF",
        onPress: () => void handlePdf(),
      },
    ];
    if (quote.status === "pending") {
      options.push({ text: "Editar orçamento", onPress: onEdit });
      options.push({ text: "Marcar como recusado", onPress: handleReject });
    }
    options.push({
      text: "Excluir orçamento",
      style: "destructive",
      onPress: handleDelete,
    });
    options.push({ text: "Cancelar", style: "cancel" });
    showAlert({ title: "Mais ações", message: quote.title, buttons: options });
  }

  return (
    <>
      <StandardModal
        title="Orçamento"
        visible={!convertVisible}
        onClose={onClose}
        right={
          quote.status === "pending" ? (
            <Button
              title="Editar"
              variant="text"
              onPress={onEdit}
              icon={
                <AppIcon
                  name="create-outline"
                  size={16}
                  color={theme.colors.primaryStrong}
                />
              }
            />
          ) : undefined
        }
        footer={
          <View style={{ flex: 1, gap: spacing.sm }}>
            {quote.status === "pending" && (
              <Button
                title="Aprovar e criar encomenda"
                size="lg"
                icon={
                  <AppIcon
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.textOnPrimary}
                  />
                }
                onPress={() => setConvertVisible(true)}
              />
            )}
            {quote.orderId && (
              <Button
                title="Ver encomenda na agenda"
                size="lg"
                onPress={() => {
                  onClose();
                  router.push("/tabs/agenda");
                }}
              />
            )}
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button
                title="Enviar no WhatsApp"
                variant="successOutline"
                size="lg"
                style={{ flex: 1 }}
                icon={
                  <AppIcon name="logo-whatsapp" size={20} color={theme.colors.success} />
                }
                onPress={() => {
                  void handleWhatsApp();
                }}
              />
              <Button
                title="Mais"
                accessibilityLabel="Mais ações do orçamento"
                variant="ghost"
                size="lg"
                compact
                loading={exporting}
                icon={
                  <AppIcon
                    name="ellipsis-horizontal"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                }
                onPress={openMoreActions}
              />
            </View>
          </View>
        }
      >
        <QuoteDetailContent
          quote={quote}
          status={<QuoteStatusChip status={quote.status} />}
        />
      </StandardModal>
      <ConvertModal
        quote={quote}
        visible={convertVisible}
        onClose={() => setConvertVisible(false)}
        onDone={() => setConvertVisible(false)}
      />
    </>
  );
}

export default function QuotesScreen() {
  const pal = useBrandScreenPalette();
  const router = useRouter();
  const isDesktop = useDesktopLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const [filter, setFilter] = useState<QuoteStatusType | "all">("all");
  const [search, setSearch] = useState("");
  const [contentWidth, setContentWidth] = useState(() =>
    Math.max(280, Math.min(viewportWidth - spacing.xl * 2, desktopWidths.wide)),
  );
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { data, isLoading, error, refetch } = useQuotes();

  const quotes = data?.items ?? [];
  const filterCounts = useMemo<Record<QuoteStatusType | "all", number>>(
    () => ({
      all: quotes.length,
      pending: quotes.filter((quote) => quote.status === "pending").length,
      accepted: quotes.filter((quote) => quote.status === "accepted").length,
      rejected: quotes.filter((quote) => quote.status === "rejected").length,
    }),
    [quotes],
  );
  const filteredQuotes = useMemo(() => {
    const normalizedSearch = normalizeQuoteSearch(search);
    return quotes.filter((quote) => {
      if (filter !== "all" && quote.status !== filter) return false;
      if (!normalizedSearch) return true;
      const searchable = normalizeQuoteSearch(`${quote.title} ${quote.clientName ?? ""}`);
      return searchable.includes(normalizedSearch);
    });
  }, [filter, quotes, search]);
  const quoteNumberById = useMemo(
    () => new Map(quotes.map((quote, index) => [quote.id, index + 1])),
    [quotes],
  );

  const selected = quotes.find((q) => q.id === selectedId) ?? null;
  const backToMore = !router.canGoBack();
  const narrowCards = contentWidth < 350;
  const sectionCountLabel =
    filteredQuotes.length === 1 ? "1 proposta" : `${filteredQuotes.length} propostas`;

  function handleBack() {
    if (backToMore) {
      router.replace("/tabs/more");
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pal.background }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        guidance={{
          area: "quotes",
          onStart: () => setShowCreate(true),
          hasRecords: (data?.items.length ?? 0) > 0,
          loading: isLoading || !!error,
          suspended: showCreate,
        }}
        title="Orçamentos"
        subtitle="Propostas organizadas, pedidos mais perto."
        subtitleNumberOfLines={2}
        onBack={handleBack}
        backLabel={backToMore ? "Ir para Mais opções" : "Voltar"}
        hideBack={isDesktop}
        style={{ paddingBottom: spacing.lg }}
        titleStyle={{ color: pal.wine }}
        subtitleStyle={{ lineHeight: 18 }}
        right={
          <FAB
            icon="add"
            header
            accessibilityLabel="Novo orçamento"
            onPress={() => setShowCreate(true)}
          />
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...pageGutter(isDesktop),
          ...desktopStretch(isDesktop, desktopWidths.data),
          paddingBottom: spacing.lg,
        }}
      >
        <View
          onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}
          style={{ width: "100%", gap: spacing.xl }}
        >
          {isLoading ? <SkeletonList rows={5} variant="quote" /> : null}

          {!isLoading && error ? (
            <EmptyState
              title="Não foi possível carregar os orçamentos"
              description="Verifique sua conexão e tente novamente."
              action={<Button title="Tentar novamente" onPress={() => void refetch()} />}
            />
          ) : null}

          {!isLoading && !error ? (
            <>
              <QuoteSummaryHero quotes={quotes} width={contentWidth} />

              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar orçamento ou cliente"
                accessibilityLabel="Buscar orçamento ou cliente"
                returnKeyType="search"
                icon={
                  <AppIcon name="search-outline" size={iconSizes.md} color={pal.muted} />
                }
                containerStyle={{ width: "100%", maxWidth: isDesktop ? 480 : undefined }}
                style={{ height: 50 }}
              />

              <FilterChipRow>
                {FILTERS.map((filterOption) => (
                  <Chip
                    key={filterOption.key}
                    label={filterOption.label}
                    count={filterCounts[filterOption.key]}
                    selected={filter === filterOption.key}
                    onPress={() => setFilter(filterOption.key)}
                  />
                ))}
              </FilterChipRow>

              <View style={{ gap: 2 }}>
                <Typography variant="h3" color={pal.ink}>
                  Orçamentos recentes
                </Typography>
                <Typography variant="body" color={pal.muted}>
                  {sectionCountLabel}
                </Typography>
              </View>

              {quotes.length === 0 ? (
                <EmptyState
                  title="Nenhum orçamento ainda"
                  description="Monte o orçamento, envie no WhatsApp e, quando aprovar, vire encomenda com um toque."
                  action={
                    <Button title="Novo orçamento" onPress={() => setShowCreate(true)} />
                  }
                />
              ) : null}

              {quotes.length > 0 && filteredQuotes.length === 0 ? (
                <EmptyState
                  title="Nenhum orçamento encontrado"
                  description="Tente outro termo ou escolha um filtro diferente."
                />
              ) : null}

              {filteredQuotes.length > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.md,
                  }}
                >
                  {filteredQuotes.map((quote) => (
                    <View
                      key={quote.id}
                      style={isDesktop ? { width: "49%" } : { width: "100%" }}
                    >
                      <QuoteCard
                        quote={quote}
                        number={quoteNumberById.get(quote.id) ?? 1}
                        narrow={narrowCards}
                        onPress={() => setSelectedId(quote.id)}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {!isLoading && !error && quotes.length > 0 ? (
        <ScreenCreateBar title="+ Novo orçamento" onPress={() => setShowCreate(true)} />
      ) : null}

      {/* Criar */}
      <QuoteForm
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />

      {/* Detalhe */}
      {selected && !editing ? (
        <QuoteDetail
          quote={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditing(true)}
        />
      ) : null}

      {/* Editar */}
      {selected && editing ? (
        <QuoteForm
          quote={selected}
          visible
          onClose={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
