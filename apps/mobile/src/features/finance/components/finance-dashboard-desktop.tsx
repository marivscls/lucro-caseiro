/**
 * Financeiro no desktop (web >= 1024px): painel vinho com resultado, entradas e
 * saídas; lançamentos em tabela na coluna principal; comparação, pendências,
 * recebimentos e exportação na lateral. Estado e regras ficam em
 * `finance-dashboard.tsx`; aqui só a apresentação.
 */
import type { FinanceEntry, FinanceEntryType } from "@lucro-caseiro/contracts";
import {
  Button,
  CenteredTextInput,
  Typography,
  fontSizes,
  fonts,
  radii,
  spacing,
  useTheme,
} from "@lucro-caseiro/ui";
import React, { useState, type ReactNode, type RefObject } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  View,
  type TextStyle,
} from "react-native";

import financeSummaryIllustration from "../../../assets/finance-summary-illustration.png";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import {
  DesktopGrid,
  DesktopSplit,
  DesktopTable,
  desktopActionButton,
  desktopPageContent,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import type { FinancePeriod } from "../calc";
import {
  categoryLabel,
  entryCountLabel,
  entryDisplayDescription,
  formatEntryDate,
} from "../entry-display";
import {
  AsideCard,
  AttentionRow,
  DesktopEmptyCard,
  DesktopExportButton,
  DesktopFlowBar,
  DesktopMonthStepper,
  DesktopSegmented,
  DesktopTag,
  HeroFlowButton,
} from "./finance-desktop-parts";

const PAGE_SIZE = 30;
const NOWRAP =
  Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as unknown as TextStyle) : undefined;

export type FinanceFilter = "all" | FinanceEntryType;

export type FinanceAttention = Readonly<{
  key: string;
  icon:
    | "alert-circle-outline"
    | "time-outline"
    | "document-text-outline"
    | "analytics-outline";
  title: string;
  detail?: string;
  tone?: "neutral" | "alert";
  actionLabel?: string;
  onPress: () => void;
}>;

export type FinanceDesktopProps = Readonly<{
  header: ReactNode;
  scrollRef: RefObject<ScrollView | null>;
  onEntriesLayout: (y: number) => void;
  period: FinancePeriod;
  periodOptions: ReadonlyArray<{ value: FinancePeriod; label: string }>;
  onPeriodChange: (period: FinancePeriod) => void;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenMonthPicker: () => void;
  hasNoMovements: boolean;
  profitLabel: string;
  profit: number;
  deltaLabel: string | null;
  deltaUp: boolean;
  income: number;
  expenses: number;
  incomeCount: number;
  expenseCount: number;
  onShowEntries: (type: FinanceEntryType) => void;
  balanceLabel: string;
  negativeBalance: number;
  attention: readonly FinanceAttention[];
  receivables: Readonly<{ received: number; toReceive: number; progress: number }> | null;
  onOpenReceivables: () => void;
  exportBadge: string | null;
  exporting: "pdf" | "xlsx" | null;
  onExport: (format: "pdf" | "xlsx") => void;
  allCount: number;
  entries: readonly FinanceEntry[];
  filter: FinanceFilter;
  onFilterChange: (filter: FinanceFilter) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEntryPress: (entry: FinanceEntry) => void;
  onCreate: (type: "income" | "expense") => void;
  materialNoun: string;
  packagingNoun: string;
}>;

/** Na tabela a coluna Categoria já diz "Venda": tira o prefixo repetido. */
function tableDescription(entry: FinanceEntry): string {
  const text = entryDisplayDescription(entry, entry.type === "income");
  if (entry.category !== "sale") return text;
  return text.replace(/^Venda:\s*/i, "") || text;
}

function heroMoney(value: number): string {
  const formatted = formatCurrency(value);
  return formatted.startsWith("-") ? `- ${formatted.slice(1)}` : formatted;
}

export function FinanceDashboardDesktop(props: FinanceDesktopProps) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [splitY, setSplitY] = useState(0);
  // Em 1024px a área útil tem ~700px: a lateral vira uma grade abaixo do painel.
  const [pageWidth, setPageWidth] = useState(0);
  const wide = pageWidth === 0 || pageWidth >= 960;
  const flowMax = Math.max(props.income, props.expenses, 1);
  const positive = props.profit >= 0;
  const statusColor = positive ? theme.colors.success : theme.colors.alert;

  const columns: DesktopTableColumn<FinanceEntry>[] = [
    {
      key: "date",
      title: "Data",
      width: 72,
      render: (entry) => (
        <Typography variant="desktopBody" style={NOWRAP}>
          {formatEntryDate(entry.date)}
        </Typography>
      ),
    },
    {
      key: "description",
      title: "Descrição",
      flex: 3,
      render: (entry) => (
        <Typography variant="desktopBodyStrong" numberOfLines={1}>
          {tableDescription(entry)}
        </Typography>
      ),
    },
    {
      key: "category",
      title: "Categoria",
      width: 136,
      render: (entry) => (
        <DesktopTag
          label={[
            categoryLabel(entry.category, props.materialNoun, props.packagingNoun),
            entry.type === "expense" && entry.isFixed ? "fixo" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      ),
    },
    {
      key: "amount",
      title: "Valor",
      width: 148,
      align: "right",
      render: (entry) => {
        const income = entry.type === "income";
        return (
          <Typography
            variant="desktopBodyStrong"
            color={income ? theme.colors.success : theme.colors.alert}
            style={[NOWRAP, { fontVariant: ["tabular-nums"] }]}
          >
            {income ? "+ " : "− "}
            {formatCurrency(entry.amount)}
          </Typography>
        );
      },
    },
  ];

  const shown = props.entries.slice(0, visible);
  const remaining = props.entries.length - shown.length;
  const searchActive = props.searchTerm.trim().length > 0;

  const asideCards = (
    <>
      <AsideCard key="flow" title="Entradas x saídas">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            marginTop: -spacing.sm,
          }}
        >
          <AppIcon
            name={positive ? "trending-up-outline" : "trending-down-outline"}
            size={18}
            color={props.hasNoMovements ? theme.colors.textSecondary : statusColor}
          />
          <Typography
            variant="desktopMeta"
            color={props.hasNoMovements ? theme.colors.textSecondary : statusColor}
            style={{ fontFamily: fonts.bold }}
          >
            {props.balanceLabel}
          </Typography>
        </View>
        <DesktopFlowBar
          label="Entradas"
          value={formatCurrency(props.income)}
          percent={(props.income / flowMax) * 100}
          color={theme.colors.success}
        />
        <DesktopFlowBar
          label="Saídas"
          value={formatCurrency(props.expenses)}
          percent={(props.expenses / flowMax) * 100}
          color={theme.colors.alert}
        />
        {props.negativeBalance > 0 ? (
          <AttentionRow
            icon="alert-circle-outline"
            tone="alert"
            title="As saídas superam as entradas"
            detail={`Revise ${formatCurrency(props.negativeBalance)} no período.`}
            onPress={() => props.onShowEntries("expense")}
          />
        ) : null}
      </AsideCard>

      {props.attention.length > 0 ? (
        <AsideCard title="Precisa de atenção">
          <View style={{ gap: spacing.xs }}>
            {props.attention.map(({ key, ...item }) => (
              <AttentionRow key={key} {...item} />
            ))}
          </View>
        </AsideCard>
      ) : null}

      {props.receivables ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver recebimentos de encomendas"
          onPress={props.onOpenReceivables}
        >
          {({ hovered }: { pressed: boolean; hovered?: boolean }) => (
            <AsideCard
              title="Recebimentos de encomendas"
              right={<AppIcon name="chevron-forward" size={18} color={pal.wine} />}
              style={hovered ? { borderColor: theme.colors.textSecondary } : undefined}
            >
              <View style={{ flexDirection: "row", gap: spacing.lg }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typography variant="desktopMeta">Recebido</Typography>
                  <Typography variant="desktopCardTitle" color={pal.wine} style={NOWRAP}>
                    {formatCurrency(props.receivables!.received)}
                  </Typography>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Typography variant="desktopMeta">A receber</Typography>
                  <Typography variant="desktopCardTitle" color={pal.wine} style={NOWRAP}>
                    {formatCurrency(props.receivables!.toReceive)}
                  </Typography>
                </View>
              </View>
              <View style={{ gap: spacing.xs }}>
                <View
                  style={{
                    height: 10,
                    borderRadius: radii.full,
                    backgroundColor: pal.surface,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${props.receivables!.progress}%`,
                      backgroundColor: pal.lime,
                      borderRadius: radii.full,
                    }}
                  />
                </View>
                <Typography variant="desktopMeta">
                  {props.receivables!.progress}% recebido
                </Typography>
              </View>
            </AsideCard>
          )}
        </Pressable>
      ) : null}
    </>
  );

  const exportCard = (row: boolean) => (
    <AsideCard
      key="export"
      title="Exportar relatório"
      right={
        props.exportBadge ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <AppIcon name="diamond" size={14} color={theme.colors.premium} />
            <Typography
              variant="desktopMeta"
              color={theme.colors.premium}
              style={{ fontFamily: fonts.bold }}
            >
              {props.exportBadge}
            </Typography>
          </View>
        ) : null
      }
    >
      <Typography variant="desktopMeta">
        Resumo de {props.monthLabel.toLowerCase()} para guardar ou enviar.
      </Typography>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.sm,
          ...(row ? { width: 320, alignSelf: "flex-end" as const } : null),
        }}
      >
        <DesktopExportButton
          icon="document-text-outline"
          label="PDF"
          loading={props.exporting === "pdf"}
          disabled={props.exporting !== null}
          onPress={() => props.onExport("pdf")}
        />
        <DesktopExportButton
          icon="document-attach-outline"
          label="Excel"
          loading={props.exporting === "xlsx"}
          disabled={props.exporting !== null}
          onPress={() => props.onExport("xlsx")}
        />
      </View>
    </AsideCard>
  );
  const aside = (
    <>
      {asideCards}
      {exportCard(false)}
    </>
  );
  const narrowCards = React.Children.toArray(asideCards.props.children).filter(Boolean);
  const exportInGrid = narrowCards.length % 2 === 1;

  return (
    <ScrollView
      ref={props.scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={desktopPageContent(true)}
    >
      {/* Cabeçalho + faixa de introdução num bloco só (sem o gap da página). */}
      <View>{props.header}</View>

      <View
        style={{ gap: spacing.lg }}
        onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <DesktopSegmented
            accessibilityLabel="Período"
            options={props.periodOptions}
            value={props.period}
            onChange={props.onPeriodChange}
          />
          {props.period === "month" ? (
            <DesktopMonthStepper
              label={props.monthLabel}
              onPrev={props.onPrevMonth}
              onNext={props.onNextMonth}
              onOpenPicker={props.onOpenMonthPicker}
            />
          ) : (
            <Button
              title="Escolher mês"
              variant="outline"
              accessibilityLabel="Escolher período personalizado"
              onPress={props.onOpenMonthPicker}
              icon={<AppIcon name="calendar-outline" size={20} color={pal.wine} />}
              style={desktopActionButton}
            />
          )}
        </View>
      </View>

      <View onLayout={(event) => setSplitY(event.nativeEvent.layout.y)}>
        <DesktopSplit aside={wide ? aside : null}>
          <View
            style={{
              backgroundColor: pal.wineFill,
              borderRadius: radii["2xl"],
              padding: 28,
              gap: spacing.xl,
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", gap: spacing.xl }}>
              <View style={{ flex: 1, minWidth: 0, gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <Typography
                    variant="desktopBodyStrong"
                    color={pal.onWineMuted}
                    accessibilityRole="header"
                  >
                    {props.profitLabel}
                  </Typography>
                  {props.deltaLabel ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: radii.full,
                        backgroundColor: pal.lime,
                      }}
                    >
                      <AppIcon
                        name={
                          props.deltaUp ? "trending-up-outline" : "trending-down-outline"
                        }
                        size={16}
                        color={pal.onLime}
                      />
                      <Typography
                        variant="desktopMeta"
                        color={pal.onLime}
                        style={[NOWRAP, { fontFamily: fonts.bold }]}
                      >
                        {props.deltaLabel}
                      </Typography>
                    </View>
                  ) : null}
                </View>
                <Typography
                  color={props.hasNoMovements ? pal.onWine : pal.lime}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                  style={{
                    fontFamily: fonts.extraBold,
                    fontSize: 48,
                    lineHeight: 54,
                    letterSpacing: -1.2,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {heroMoney(props.profit)}
                </Typography>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: spacing.sm,
                  }}
                >
                  <AppIcon
                    name="information-circle-outline"
                    size={18}
                    color={pal.onWineMuted}
                    style={{ marginTop: 1 }}
                  />
                  <Typography
                    variant="desktopMeta"
                    color={pal.onWineMuted}
                    style={{ flex: 1, maxWidth: 460 }}
                  >
                    {props.hasNoMovements
                      ? "Ainda não há movimentos neste período. Registre uma entrada ou despesa para começar."
                      : "Calculado com as entradas e saídas registradas. Custos que você não informou ainda não estão incluídos."}
                  </Typography>
                </View>
              </View>
              {wide ? (
                <Image
                  source={financeSummaryIllustration}
                  style={{ width: 176, height: 136, marginRight: -spacing.sm }}
                  resizeMode="contain"
                  accessible={false}
                />
              ) : null}
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <HeroFlowButton
                label="Entradas"
                icon="arrow-down"
                value={formatCurrency(props.income)}
                caption={entryCountLabel(props.incomeCount)}
                accessibilityLabel="Ver entradas do período"
                onPress={() => props.onShowEntries("income")}
              />
              <HeroFlowButton
                label="Saídas"
                icon="arrow-up"
                value={formatCurrency(props.expenses)}
                caption={entryCountLabel(props.expenseCount)}
                accessibilityLabel="Ver saídas do período"
                onPress={() => props.onShowEntries("expense")}
              />
            </View>
          </View>

          {wide ? null : (
            <>
              <DesktopGrid minColumnWidth={300} maxColumns={2}>
                {narrowCards}
                {exportInGrid ? exportCard(false) : null}
              </DesktopGrid>
              {exportInGrid ? null : exportCard(true)}
            </>
          )}

          <View
            onLayout={(event) =>
              props.onEntriesLayout(splitY + event.nativeEvent.layout.y)
            }
            style={{ gap: spacing.lg, marginTop: spacing.sm }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}
            >
              <Typography variant="desktopSection" accessibilityRole="header">
                Lançamentos
              </Typography>
              {props.entries.length > 0 ? (
                <Typography variant="desktopMeta">
                  {entryCountLabel(props.entries.length)}
                </Typography>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  flexGrow: 1,
                  flexBasis: 240,
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: pal.white,
                }}
              >
                <AppIcon name="search-outline" size={20} color={pal.warmGray} />
                <CenteredTextInput
                  value={props.searchTerm}
                  onChangeText={(text) => {
                    setVisible(PAGE_SIZE);
                    props.onSearchChange(text);
                  }}
                  placeholder="Buscar lançamento"
                  placeholderTextColor={pal.warmGray}
                  accessibilityLabel="Buscar lançamento"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 0,
                    color: pal.ink,
                    fontFamily: fonts.regular,
                    fontSize: fontSizes.md,
                  }}
                />
                {searchActive ? (
                  <Pressable
                    onPress={() => props.onSearchChange("")}
                    accessibilityRole="button"
                    accessibilityLabel="Limpar busca"
                    hitSlop={10}
                  >
                    <AppIcon name="close-circle" size={20} color={pal.warmGray} />
                  </Pressable>
                ) : null}
              </View>
              <DesktopSegmented
                accessibilityLabel="Tipo de lançamento"
                value={props.filter}
                onChange={(next) => {
                  setVisible(PAGE_SIZE);
                  props.onFilterChange(next);
                }}
                options={[
                  { value: "all", label: "Tudo", count: props.allCount },
                  { value: "income", label: "Entradas", count: props.incomeCount },
                  { value: "expense", label: "Saídas", count: props.expenseCount },
                ]}
              />
            </View>

            {props.entries.length > 0 ? (
              <>
                <DesktopTable
                  columns={columns}
                  rows={shown}
                  keyExtractor={(entry) => entry.id}
                  onRowPress={props.onEntryPress}
                  rowAccessibilityLabel={(entry) =>
                    `${entry.type === "income" ? "Entrada" : "Saída"} de ${formatCurrency(entry.amount)}: ${entryDisplayDescription(entry, entry.type === "income")}, ${formatEntryDate(entry.date)}`
                  }
                />
                {remaining > 0 ? (
                  <Button
                    title={`Mostrar mais ${Math.min(PAGE_SIZE, remaining)} de ${remaining}`}
                    variant="outline"
                    onPress={() => setVisible((current) => current + PAGE_SIZE)}
                    style={{ ...desktopActionButton, alignSelf: "center" }}
                  />
                ) : null}
              </>
            ) : (
              <DesktopEmptyCard
                title={
                  searchActive || props.filter !== "all"
                    ? "Nenhum lançamento encontrado"
                    : "Nenhum lançamento por aqui"
                }
                description={
                  searchActive || props.filter !== "all"
                    ? "Troque o filtro ou a busca para ver outros lançamentos do período."
                    : "Registre entradas e saídas para acompanhar o lucro do mês."
                }
              >
                <Button
                  title="Registrar despesa"
                  variant="outline"
                  onPress={() => props.onCreate("expense")}
                  style={desktopActionButton}
                />
                <Button
                  title="Registrar entrada"
                  onPress={() => props.onCreate("income")}
                  style={desktopActionButton}
                />
              </DesktopEmptyCard>
            )}
          </View>
        </DesktopSplit>
      </View>
    </ScrollView>
  );
}
