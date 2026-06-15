import type { Quote, QuoteStatusType } from "@lucro-caseiro/contracts";
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
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { QuoteForm } from "../features/quotes/components/quote-form";
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
import { Illustration } from "../shared/components/illustrations";
import { showToast } from "../shared/components/toast";
import { usePaywall } from "../shared/hooks/use-paywall";
import { brToIso } from "../shared/utils/date";
import { formatCurrency } from "../shared/utils/format";
import { openWhatsAppShare } from "../shared/utils/whatsapp";
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

const FILTERS: { key: QuoteStatusType | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Aguardando" },
  { key: "accepted", label: "Aprovados" },
  { key: "rejected", label: "Recusados" },
];

function QuoteCard({ quote, onPress }: Readonly<{ quote: Quote; onPress: () => void }>) {
  const { theme } = useTheme();
  const meta = STATUS_META[quote.status];
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
  const showPaywall = usePaywall((s) => s.show);
  const setStatus = useUpdateQuoteStatus();
  const removeQuote = useDeleteQuote();
  const [convertVisible, setConvertVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const meta = STATUS_META[quote.status];
  const businessName = profile?.businessName ?? profile?.name ?? "Meu negócio";

  function handleWhatsApp() {
    void openWhatsAppShare(buildQuoteMessage(quote, businessName));
  }

  async function handlePdf() {
    if (profile?.plan !== "premium") {
      showPaywall("export");
      return;
    }
    setExporting(true);
    try {
      await exportQuotePdf(quote, { name: businessName, phone: profile?.phone });
    } catch {
      alertError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleReject() {
    Alert.alert("Recusado?", "Marcar este orçamento como recusado?", [
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
    ]);
  }

  function handleDelete() {
    Alert.alert("Excluir orçamento", "Essa ação não pode ser desfeita.", [
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
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
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
        <Typography variant="caption">
          Válido até {quote.validUntil.split("-").reverse().join("/")}
        </Typography>
      )}
      {quote.notes && <Typography variant="body">{quote.notes}</Typography>}

      <View style={{ gap: spacing.md }}>
        <Button
          title="Enviar no WhatsApp"
          variant="success"
          size="lg"
          icon={<Ionicons name="logo-whatsapp" size={20} color="#fff" />}
          onPress={handleWhatsApp}
        />
        <Button
          title="Orçamento em PDF"
          variant="secondary"
          size="lg"
          icon={
            <Ionicons
              name="document-text-outline"
              size={20}
              color={theme.colors.primary}
            />
          }
          onPress={() => void handlePdf()}
          loading={exporting}
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
              router.push("/agenda");
            }}
          />
        )}
        {quote.status === "pending" && (
          <Button title="Editar" variant="secondary" size="lg" onPress={onEdit} />
        )}
        {quote.status === "pending" && (
          <Button
            title="Marcar como recusado"
            variant="outline"
            size="lg"
            onPress={handleReject}
          />
        )}
        <Button title="Excluir" variant="ghost" size="lg" onPress={handleDelete} />
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
      edges={["bottom"]}
    >
      <View style={{ flex: 1, padding: spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
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
                  width: "48%",
                  paddingHorizontal: spacing.md,
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
        </View>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={{ marginTop: spacing["3xl"] }}
          />
        )}

        {!isLoading && quotes.length === 0 && (
          <EmptyState
            icon={<Illustration name="clipboard" />}
            title="Nenhum orçamento ainda"
            description="Monte o orçamento, envie no WhatsApp e, quando aprovar, vire encomenda com um toque."
            action={<Button title="Novo orçamento" onPress={() => setShowCreate(true)} />}
          />
        )}

        {!isLoading && quotes.length > 0 && (
          <ScrollView
            contentContainerStyle={{ gap: spacing.md, paddingBottom: 120 }}
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

      {/* FAB */}
      <View
        style={{
          position: "absolute",
          bottom: spacing.xl + insets.bottom,
          right: spacing.xl,
        }}
      >
        <Pressable
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo orçamento"
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            elevation: 6,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
          }}
        >
          <Ionicons name="add" size={30} color={theme.colors.textOnPrimary} />
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
          <View style={{ alignItems: "flex-end", padding: spacing.lg }}>
            <Pressable onPress={() => setShowCreate(false)} hitSlop={12}>
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
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
          <View style={{ alignItems: "flex-end", padding: spacing.lg }}>
            <Pressable
              onPress={() => {
                setSelectedId(null);
                setEditing(false);
              }}
              hitSlop={12}
            >
              <Typography variant="bodyBold" color={theme.colors.primary}>
                Fechar
              </Typography>
            </Pressable>
          </View>
          {selected && !editing && (
            <QuoteDetail
              quote={selected}
              onClose={() => setSelectedId(null)}
              onEdit={() => setEditing(true)}
            />
          )}
          {selected && editing && (
            <QuoteForm quote={selected} onSuccess={() => setEditing(false)} />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
