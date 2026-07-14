import type { Quote, QuoteStatusType } from "@lucro-caseiro/contracts";
import { hasActiveFeature } from "@lucro-caseiro/contracts";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Typography,
  useTheme,
  radii,
  spacing,
} from "@lucro-caseiro/ui";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import quotesEmpty from "../assets/quotes-empty.png";
import { trackAnalyticsAction } from "../features/analytics/tracker";
import { useClient } from "../features/clients/hooks";
import { QuoteForm } from "../features/quotes/components/quote-form";
import { showAlert } from "../shared/components/alert-store";
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

function ModalHeader({
  title,
  onClose,
  onBack,
  rightLabel,
  onRight,
}: Readonly<{
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  rightLabel?: string;
  onRight?: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
      }}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityLabel="Voltar"
          hitSlop={10}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onClose}
          accessibilityLabel="Fechar"
          hitSlop={10}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </Pressable>
      )}
      <Typography
        variant="h1"
        color={theme.colors.text}
        numberOfLines={1}
        style={{ flex: 1, fontSize: 22 }}
      >
        {title}
      </Typography>
      {rightLabel && onRight ? (
        <Pressable
          onPress={onRight}
          accessibilityRole="button"
          hitSlop={10}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Typography variant="bodyBold" color={theme.colors.primary}>
            {rightLabel}
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuoteCard({ quote, onPress }: Readonly<{ quote: Quote; onPress: () => void }>) {
  const { theme } = useTheme();
  const meta = quoteStatusMeta(quote.status);
  return (
    <Card onPress={onPress} padding="lg">
      <View style={{ gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Typography variant="h3" numberOfLines={2} style={{ lineHeight: 25 }}>
            {quote.title}
          </Typography>
          <Typography variant="caption" numberOfLines={1}>
            {quote.clientName ?? "Sem cliente"} ·{" "}
            {quote.items.length === 1 ? "1 item" : `${quote.items.length} itens`}
          </Typography>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Typography variant="bodyBold" color={theme.colors.success}>
            {formatCurrency(quote.total)}
          </Typography>
          <Badge label={meta.label} variant={meta.variant} />
        </View>
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
  const { theme } = useTheme();
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: radii["2xl"],
            padding: spacing.xl,
            gap: spacing.md,
          }}
        >
          <Typography variant="h3">Aprovar e criar encomenda</Typography>
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
          <Button
            title="Criar encomenda"
            onPress={() => void handleConvert()}
            loading={convert.isPending}
          />
          <Button title="Cancelar" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
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
  const meta = quoteStatusMeta(quote.status);
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
    <ScrollView
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1 }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h2" style={{ flex: 1 }} numberOfLines={2}>
          {quote.title}
        </Typography>
        <Badge label={meta.label} variant={meta.variant} />
      </View>
      {quote.clientName && (
        <Typography variant="body" color={theme.colors.textSecondary}>
          Cliente: {quote.clientName}
        </Typography>
      )}

      <Card>
        <View style={{ gap: spacing.sm }}>
          {quote.items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <Typography variant="body" style={{ flex: 1 }}>
                {Number.isInteger(item.quantity)
                  ? item.quantity
                  : String(item.quantity).replace(".", ",")}
                x {item.description}
              </Typography>
              <Typography variant="bodyBold">
                {formatCurrency(item.quantity * item.unitPrice)}
              </Typography>
            </View>
          ))}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor:
                theme.mode === "dark"
                  ? "rgba(245, 225, 219, 0.12)"
                  : "rgba(74, 50, 40, 0.1)",
              paddingTop: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <Typography variant="bodyBold">Total</Typography>
            <Typography variant="h3" color={theme.colors.success}>
              {formatCurrency(quote.total)}
            </Typography>
          </View>
        </View>
      </Card>

      {quote.validUntil && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.colors.textSecondary}
          />
          <Typography variant="caption">
            Válido até {quote.validUntil.split("-").reverse().join("/")}
          </Typography>
        </View>
      )}
      {quote.notes && (
        <Card variant="surface">
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Typography variant="caption" color={theme.colors.textSecondary}>
                Observações
              </Typography>
              <Typography variant="body" color={theme.colors.text}>
                {quote.notes}
              </Typography>
            </View>
          </View>
        </Card>
      )}

      {/* Ação primária + ações relevantes por status; o resto vai no menu "Mais ações".
          marginTop auto fixa o bloco no rodapé quando o conteúdo é curto. */}
      <View style={{ gap: spacing.md, marginTop: "auto" }}>
        <Button
          title="Enviar no WhatsApp"
          variant="success"
          size="lg"
          icon={<Ionicons name="logo-whatsapp" size={20} color="#fff" />}
          onPress={() => {
            void handleWhatsApp();
          }}
        />
        {quote.status === "pending" && (
          <Button
            title="Aprovado! Criar encomenda"
            size="lg"
            icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
            onPress={() => setConvertVisible(true)}
          />
        )}
        {quote.orderId && (
          <Button
            title="Ver encomenda na agenda"
            variant="outline"
            size="lg"
            onPress={() => {
              onClose();
              router.push("/tabs/agenda");
            }}
          />
        )}
        <Button
          title="Mais ações"
          variant="ghost"
          size="lg"
          icon={
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.primary} />
          }
          onPress={openMoreActions}
        />
      </View>

      <ConvertModal
        quote={quote}
        visible={convertVisible}
        onClose={() => setConvertVisible(false)}
        onDone={() => setConvertVisible(false)}
      />
    </ScrollView>
  );
}

export default function QuotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<QuoteStatusType | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { data, isLoading } = useQuotes(
    filter === "all" ? undefined : { status: filter },
  );

  const quotes = data?.items ?? [];
  const selected = quotes.find((q) => q.id === selectedId) ?? null;

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
          gap: spacing.md,
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
        <Typography variant="h1" color={theme.colors.text} style={{ flex: 1 }}>
          Orçamentos
        </Typography>
      </View>

      {/* Filtros (chips) */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                }}
              >
                <Typography
                  variant="bodyBold"
                  color={active ? theme.colors.textOnPrimary : theme.colors.text}
                >
                  {f.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        {isLoading && (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["3xl"] }}
          />
        )}

        {!isLoading && quotes.length === 0 && (
          <EmptyState
            icon={
              <Image
                source={quotesEmpty}
                resizeMode="contain"
                style={{ width: 142, height: 142 }}
              />
            }
            title="Nenhum orçamento ainda"
            description="Monte o orçamento, envie no WhatsApp e, quando aprovar, vire encomenda com um toque."
          />
        )}

        {!isLoading && quotes.length > 0 && (
          <ScrollView
            contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            {quotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onPress={() => setSelectedId(quote.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Ação principal: novo orçamento */}
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm + insets.bottom,
        }}
      >
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: radii.lg,
            backgroundColor: theme.colors.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="add" size={24} color={theme.colors.textOnPrimary} />
          <Typography variant="h3" color={theme.colors.textOnPrimary}>
            Novo orçamento
          </Typography>
        </Pressable>
      </View>

      {/* Criar */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <ModalHeader title="Novo orçamento" onClose={() => setShowCreate(false)} />
          <QuoteForm onSuccess={() => setShowCreate(false)} />
        </SafeAreaView>
      </Modal>

      {/* Detalhe / editar */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedId(null);
          setEditing(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          {selected && !editing && (
            <>
              <ModalHeader
                title="Detalhes"
                onClose={() => setSelectedId(null)}
                rightLabel={selected.status === "pending" ? "Editar" : undefined}
                onRight={
                  selected.status === "pending" ? () => setEditing(true) : undefined
                }
              />
              <QuoteDetail
                quote={selected}
                onClose={() => setSelectedId(null)}
                onEdit={() => setEditing(true)}
              />
            </>
          )}
          {selected && editing && (
            <>
              <ModalHeader title="Editar orçamento" onBack={() => setEditing(false)} />
              <QuoteForm quote={selected} onSuccess={() => setEditing(false)} />
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
