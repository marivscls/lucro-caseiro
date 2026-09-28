import {
  MEI_ACTIVITY_LABELS,
  MEI_WARNING_RATIO,
  type MeiActivity,
  type MeiSummary,
} from "@lucro-caseiro/contracts";
import {
  Button,
  Card,
  IconButton,
  Typography,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useEffect, useState } from "react";
import { Linking, Switch, View } from "react-native";

import {
  dasReminderSupported,
  isDasReminderOn,
  setDasReminder,
} from "../features/mei/das-reminder";
import {
  MONTH_NAMES,
  ceilingMessage,
  dasReminderText,
  meiReportText,
  monthLabel,
  projectionWarning,
  shiftMonth,
} from "../features/mei/domain";
import { useMeiSummary, useUpdateMeiSettings } from "../features/mei/hooks";
import { exportMeiReportPdf } from "../features/mei/report-pdf";
import { useProfile } from "../features/subscription/hooks";
import { brandScreenPalette } from "../shared/brand-palette";
import { AppIcon } from "../shared/components/app-icon";
import { ChoiceField, FormField, TextField } from "../shared/components/form-field";
import { FormActions } from "../shared/components/form-layout";
import { SkeletonList } from "../shared/components/skeleton";
import { showToast } from "../shared/components/toast";
import { ToolPage } from "../shared/layout/tool-page";
import { alertError, errorMessage } from "../shared/utils/alerts";
import { maskCurrencyInput, parseCurrencyInput } from "../shared/utils/currency-input";
import { formatCurrency } from "../shared/utils/format";
import { openWhatsAppShare } from "../shared/utils/whatsapp";

const PGMEI_URL =
  "https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao";

const ACTIVITIES: MeiActivity[] = ["commerce", "industry", "services"];

function todayMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function ActivityPicker({
  value,
  onSave,
  saving,
}: Readonly<{
  value: MeiActivity | null;
  onSave: (a: MeiActivity) => void;
  saving: boolean;
}>) {
  const [choice, setChoice] = useState<MeiActivity>(value ?? "industry");
  return (
    <View style={{ gap: spacing.lg }}>
      <FormField
        label="O que você faz como MEI?"
        hint="Vale a atividade principal do seu CNPJ."
      >
        <ChoiceField
          value={choice}
          accessibilityLabel="Atividade do MEI"
          options={ACTIVITIES.map((activity) => ({
            value: activity,
            label: MEI_ACTIVITY_LABELS[activity],
          }))}
          onChange={setChoice}
        />
      </FormField>
      <FormActions>
        <Button
          title="Salvar atividade"
          loading={saving}
          onPress={() => onSave(choice)}
        />
      </FormActions>
    </View>
  );
}

function CeilingCard({ summary }: Readonly<{ summary: MeiSummary }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const used = Math.min(1, summary.usedRatio);
  const BAR_COLORS: Record<MeiSummary["status"], string> = {
    ok: palette.lime,
    near: "#F2B84B",
    over: "#E5484D",
  };
  const barColor = BAR_COLORS[summary.status];
  const warning = projectionWarning(summary);
  return (
    <Card
      variant="transparent"
      padding="xl"
      style={{ backgroundColor: palette.wineFill, gap: spacing.md, borderRadius: 22 }}
    >
      <Typography variant="body" color="#F2D9DE">
        Faturamento de {summary.year} até agora
      </Typography>
      <Typography variant="moneyLg" color="#FFFFFF">
        {formatCurrency(summary.yearRevenue)}
      </Typography>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Quanto do teto do MEI você já usou"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(used * 100) }}
        style={{
          height: 14,
          borderRadius: 999,
          backgroundColor: "#6E4553",
          overflow: "hidden",
        }}
      >
        <View
          style={{ width: `${used * 100}%`, height: "100%", backgroundColor: barColor }}
        />
        <View
          style={{
            position: "absolute",
            left: `${MEI_WARNING_RATIO * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#FFFFFF",
          }}
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Typography variant="caption" color="#F2D9DE">
          {Math.round(summary.usedRatio * 100)}% do teto
        </Typography>
        <Typography variant="caption" color="#F2D9DE">
          Teto: {formatCurrency(summary.annualLimit)}
        </Typography>
      </View>
      <Typography variant="bodyBold" color="#FFFFFF">
        {ceilingMessage(summary)}
      </Typography>
      {warning ? (
        <Typography variant="body" color="#F2D9DE">
          {warning}
        </Typography>
      ) : null}
    </Card>
  );
}

function MonthBars({ summary }: Readonly<{ summary: MeiSummary }>) {
  const { theme } = useTheme();
  const palette = brandScreenPalette(theme);
  const max = Math.max(1, ...summary.months.map((item) => item.revenue));
  return (
    <Card variant="surface" padding="xl" style={{ gap: spacing.sm }}>
      <Typography variant="h3">Mês a mês</Typography>
      {summary.months.map((item) => (
        <View
          key={item.month}
          style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
        >
          <Typography variant="caption" style={{ width: 36 }}>
            {MONTH_NAMES[item.month - 1]?.slice(0, 3)}
          </Typography>
          <View style={{ flex: 1, height: 10, borderRadius: 999, overflow: "hidden" }}>
            <View
              style={{
                width: `${(item.revenue / max) * 100}%`,
                height: "100%",
                backgroundColor: palette.rose,
                borderRadius: 999,
              }}
            />
          </View>
          <Typography variant="caption" style={{ width: 104, textAlign: "right" }}>
            {formatCurrency(item.revenue)}
          </Typography>
        </View>
      ))}
    </Card>
  );
}

export default function MeiScreen() {
  const { theme } = useTheme();
  const today = todayMonth();
  const [period, setPeriod] = useState(today);
  const [invoiced, setInvoiced] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { data: summary, isLoading } = useMeiSummary(period.year, period.month);
  const { data: profile } = useProfile();
  const update = useUpdateMeiSettings();
  const businessName = profile?.businessName?.trim() || profile?.name || "Meu negócio";

  useEffect(() => {
    void isDasReminderOn().then(setReminderOn);
  }, []);

  async function saveActivity(activity: MeiActivity) {
    try {
      await update.mutateAsync({ activity });
      showToast("Atividade salva.");
    } catch (error) {
      alertError(errorMessage(error));
    }
  }

  async function toggleReminder(on: boolean) {
    const result = await setDasReminder(on);
    setReminderOn(result);
    if (on && !result) {
      alertError("Libere as notificações do app para receber o lembrete do DAS.");
    }
  }

  if (isLoading || !summary) {
    return (
      <ToolPage title="Cantinho do MEI">
        <SkeletonList rows={3} />
      </ToolPage>
    );
  }

  const activity = summary.activity;
  if (!activity) {
    return (
      <ToolPage
        title="Cantinho do MEI"
        subtitle="Teto do ano, relatório mensal e lembrete do DAS"
      >
        <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
          <Typography variant="h3">Você é MEI?</Typography>
          <Typography variant="body" color={theme.colors.textSecondary}>
            O app usa as entradas do Financeiro para mostrar quanto do teto de{" "}
            {formatCurrency(summary.annualLimit)} você já usou e montar o relatório mensal
            que o MEI precisa guardar.
          </Typography>
          <ActivityPicker
            value={null}
            onSave={(a) => void saveActivity(a)}
            saving={update.isPending}
          />
        </Card>
      </ToolPage>
    );
  }

  const withInvoice = invoiced ? parseCurrencyInput(invoiced) : 0;
  const reportArgs = [summary, activity, withInvoice] as const;
  const previous = shiftMonth(period, -1, today);
  const next = shiftMonth(period, 1, today);

  async function handlePdf() {
    setExporting(true);
    try {
      await exportMeiReportPdf(...reportArgs, { name: businessName });
    } catch {
      alertError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ToolPage
      title="Cantinho do MEI"
      subtitle="Teto do ano, relatório mensal e lembrete do DAS"
    >
      <CeilingCard summary={summary} />

      <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <IconButton
            icon={<AppIcon name="chevron-back" size={20} color={theme.colors.text} />}
            size={48}
            accessibilityLabel="Mês anterior"
            disabled={!previous}
            style={{ opacity: previous ? 1 : 0.4 }}
            onPress={() => previous && setPeriod(previous)}
          />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Typography variant="h3">
              Relatório de {monthLabel(period.year, period.month)}
            </Typography>
          </View>
          <IconButton
            icon={<AppIcon name="chevron-forward" size={20} color={theme.colors.text} />}
            size={48}
            accessibilityLabel="Próximo mês"
            disabled={!next}
            style={{ opacity: next ? 1 : 0.4 }}
            onPress={() => next && setPeriod(next)}
          />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Typography variant="body" color={theme.colors.textSecondary}>
            Entradas do mês ({MEI_ACTIVITY_LABELS[activity].toLocaleLowerCase("pt-BR")})
          </Typography>
          <Typography variant="money">{formatCurrency(summary.monthRevenue)}</Typography>
        </View>
        <FormField
          label="Quanto disso teve nota fiscal?"
          optional
          hint="Deixe vazio se você não emitiu nota neste mês."
        >
          <TextField
            prefix="R$"
            accessibilityLabel="Valor com nota fiscal, em reais"
            placeholder="0,00"
            value={invoiced}
            onChangeText={(value) => setInvoiced(maskCurrencyInput(value))}
            keyboardType="numeric"
          />
        </FormField>
        <FormActions>
          <Button
            title="Mandar no WhatsApp"
            variant="outline"
            onPress={() =>
              void openWhatsAppShare(
                meiReportText(summary, activity, withInvoice, businessName),
              )
            }
          />
          <Button
            title="Baixar relatório em PDF"
            loading={exporting}
            onPress={() => void handlePdf()}
          />
        </FormActions>
      </Card>

      <Card variant="surface" padding="xl" style={{ gap: spacing.md }}>
        <Typography variant="h3">DAS do mês</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          {dasReminderText(new Date())}
        </Typography>
        {dasReminderSupported ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Typography variant="body" style={{ flex: 1 }}>
              Me lembrar todo dia 15
            </Typography>
            <Switch
              accessibilityLabel="Lembrete do DAS todo dia 15"
              trackColor={{
                false: theme.colors.surface,
                true: theme.colors.primaryInteractive,
              }}
              thumbColor={theme.colors.textOnPrimary}
              value={reminderOn}
              onValueChange={(value) => void toggleReminder(value)}
            />
          </View>
        ) : (
          <Typography variant="caption" color={theme.colors.textSecondary}>
            O lembrete do dia 15 chega no app do celular.
          </Typography>
        )}
        <FormActions>
          <Button
            title="Pagar o DAS no site da Receita"
            variant="outline"
            onPress={() => void Linking.openURL(PGMEI_URL)}
          />
        </FormActions>
      </Card>

      {summary.months.length > 1 ? <MonthBars summary={summary} /> : null}

      <Card variant="surface" padding="xl" style={{ gap: spacing.lg }}>
        <Typography variant="h3">Sua atividade</Typography>
        <ActivityPicker
          value={activity}
          onSave={(a) => void saveActivity(a)}
          saving={update.isPending}
        />
        <Typography variant="caption" color={theme.colors.textSecondary}>
          O valor vem das entradas do Financeiro. Quem abriu o MEI neste ano tem teto
          proporcional: {formatCurrency(summary.annualLimit / 12)} por mês de atividade.
        </Typography>
      </Card>
    </ToolPage>
  );
}
