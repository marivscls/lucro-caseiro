/**
 * Fiado no desktop (web >= 1024px): painel vinho com os indicadores, barra de
 * ferramentas e cobranças em grade de cartões. Estado e ações ficam em
 * `app/fiado.tsx`; aqui só a apresentação.
 */
import type { Sale } from "@lucro-caseiro/contracts";
import { radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import { Pressable, View, type ImageSourcePropType } from "react-native";

import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon } from "../../../shared/components/app-icon";
import { SkeletonList } from "../../../shared/components/skeleton";
import { DesktopGrid, desktopCardStyle } from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import {
  fiadoInitials,
  fiadoTiming,
  fiadoTimingLabel,
  launchCountLabel,
  type FiadoGroup,
} from "../fiado";
import {
  DesktopEmptyCard,
  DesktopSearchField,
  DesktopSegmented,
  DesktopToolbar,
} from "../../../shared/layout/desktop-kit";
import {
  DesktopListHeader,
  DesktopRowButton,
  DesktopStatusPill,
  DesktopWineHero,
  type DesktopTone,
} from "./desktop-list-kit";

export type FiadoStatusFilter = "all" | "overdue" | "upcoming";
export type FiadoContactFilter = "all" | "withPhone" | "withoutPhone";
export type FiadoSortOrder = "oldest" | "newest";

function timingTone(sale: Sale): DesktopTone {
  const kind = fiadoTiming(sale.soldAt).kind;
  if (kind === "overdue") return "negative";
  if (kind === "upcoming") return "attention";
  return "neutral";
}

function saleDay(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(iso))
    .replace(" de ", " ")
    .replace(".", "");
}

function DesktopFiadoCard({
  group,
  hasPhone,
  sortOrder,
  onCharge,
  onCall,
  onMarkPaid,
  onMarkAllPaid,
}: Readonly<{
  group: FiadoGroup;
  hasPhone: boolean;
  sortOrder: FiadoSortOrder;
  onCharge: (group: FiadoGroup) => void;
  onCall: (group: FiadoGroup) => void;
  onMarkPaid: (saleId: string) => void;
  onMarkAllPaid: (group: FiadoGroup) => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const sales = [...group.sales].sort((a, b) => {
    const delta = new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime();
    return sortOrder === "oldest" ? delta : -delta;
  });
  const single = sales.length === 1;

  return (
    <View style={[desktopCardStyle(theme), { gap: spacing.lg, height: "100%" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radii.full,
            backgroundColor: pal.softRose,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="desktopBodyStrong" color={pal.wine}>
            {fiadoInitials(group.clientName)}
          </Typography>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography variant="desktopCardTitle" numberOfLines={1}>
            {group.clientName}
          </Typography>
          <Typography variant="desktopMeta">
            {launchCountLabel(group.sales.length)}
          </Typography>
        </View>
        <Typography
          variant="desktopSection"
          style={{ fontVariant: ["tabular-nums"] }}
          numberOfLines={1}
        >
          {formatCurrency(group.total)}
        </Typography>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        {sales.map((sale) => (
          <View
            key={sale.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              minHeight: 64,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}
              >
                <Typography
                  variant="desktopBodyStrong"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCurrency(Math.max(0, sale.total - sale.paidAmount))}
                </Typography>
                <Typography variant="desktopMeta">{saleDay(sale.soldAt)}</Typography>
              </View>
              <DesktopStatusPill
                label={fiadoTimingLabel(fiadoTiming(sale.soldAt))}
                tone={timingTone(sale)}
              />
            </View>
            {single ? null : (
              <DesktopRowButton
                icon="checkmark-circle-outline"
                label="Recebi"
                accessibilityLabel={`Marcar como recebido: ${formatCurrency(
                  Math.max(0, sale.total - sale.paidAmount),
                )}`}
                onPress={() => onMarkPaid(sale.id)}
              />
            )}
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: "auto",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <DesktopRowButton
          icon="checkmark-done-outline"
          label={single ? "Recebi" : "Recebi tudo"}
          accessibilityLabel={
            single ? "Marcar como recebido" : "Marcar tudo como recebido"
          }
          filled
          grow
          onPress={() => onMarkAllPaid(group)}
        />
        <DesktopRowButton
          icon="logo-whatsapp"
          label="Cobrar"
          accessibilityLabel={`Cobrar ${group.clientName} no WhatsApp`}
          color={theme.colors.success}
          grow
          onPress={() => onCharge(group)}
        />
        {hasPhone ? (
          <Pressable
            onPress={() => onCall(group)}
            accessibilityRole="button"
            accessibilityLabel={`Ligar para ${group.clientName}`}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
              width: 44,
              height: 44,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: hovered ? pal.wine : theme.colors.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <AppIcon name="call-outline" size={18} color={pal.wine} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type DesktopFiadoPageProps = Readonly<{
  header: ReactNode;
  art: ImageSourcePropType;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  grandTotal: number;
  clientsCount: number;
  launchesCount: number;
  overdueCount: number;
  upcomingCount: number;
  groups: FiadoGroup[];
  visibleGroups: FiadoGroup[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: FiadoStatusFilter;
  onStatusFilterChange: (value: FiadoStatusFilter) => void;
  contactFilter: FiadoContactFilter;
  onContactFilterChange: (value: FiadoContactFilter) => void;
  sortOrder: FiadoSortOrder;
  onToggleSort: () => void;
  hasPhone: (group: FiadoGroup) => boolean;
  onCharge: (group: FiadoGroup) => void;
  onCall: (group: FiadoGroup) => void;
  onMarkPaid: (saleId: string) => void;
  onMarkAllPaid: (group: FiadoGroup) => void;
  onResetFilters: () => void;
  onNewSale: () => void;
}>;

function FiadoCharges(props: DesktopFiadoPageProps) {
  if (props.groups.length === 0) {
    return (
      <DesktopEmptyCard
        layout="tall"
        title="Ninguém te deve"
        description="Vendas no fiado em aberto aparecem aqui para você cobrar."
        action={{ label: "Nova venda", onPress: props.onNewSale, icon: "add" }}
      />
    );
  }
  if (props.visibleGroups.length === 0) {
    return (
      <DesktopEmptyCard
        layout="tall"
        title="Nada encontrado"
        description="Ajuste a busca ou limpe os filtros para ver seus fiados em aberto."
        action={{
          label: "Limpar filtros",
          onPress: props.onResetFilters,
          variant: "outline",
        }}
      />
    );
  }
  return (
    <DesktopGrid minColumnWidth={340} maxColumns={3}>
      {props.visibleGroups.map((group) => (
        <DesktopFiadoCard
          key={group.clientId ?? "avulso"}
          group={group}
          hasPhone={props.hasPhone(group)}
          sortOrder={props.sortOrder}
          onCharge={props.onCharge}
          onCall={props.onCall}
          onMarkPaid={props.onMarkPaid}
          onMarkAllPaid={props.onMarkAllPaid}
        />
      ))}
    </DesktopGrid>
  );
}

export function DesktopFiadoPage(props: DesktopFiadoPageProps) {
  const pal = useBrandScreenPalette();
  const { launchesCount, clientsCount } = props;
  let body: ReactNode;
  if (props.isLoading) body = <SkeletonList rows={6} variant="fiado" />;
  else if (props.error) {
    body = (
      <DesktopEmptyCard
        layout="tall"
        title="Algo deu errado"
        description="Não foi possível carregar os fiados. Tente novamente."
        action={{ label: "Tentar novamente", onPress: props.onRetry, variant: "outline" }}
      />
    );
  } else {
    body = (
      <>
        <DesktopWineHero
          label="A receber"
          value={formatCurrency(props.grandTotal)}
          meta={`${clientsCount} ${clientsCount === 1 ? "cliente" : "clientes"} · ${launchCountLabel(launchesCount)}`}
          stats={[
            {
              label: "Vencidos",
              value: String(props.overdueCount),
              hint: props.overdueCount === 1 ? "cliente" : "clientes",
            },
            {
              label: "Vencem em breve",
              value: String(props.upcomingCount),
              hint: props.upcomingCount === 1 ? "cliente" : "clientes",
            },
          ]}
          art={props.art}
        />
        <View style={{ gap: spacing["2xl"] }}>
          <DesktopListHeader
            title="Cobranças"
            right={
              <Pressable
                onPress={props.onToggleSort}
                accessibilityRole="button"
                accessibilityLabel={`Ordenação: ${props.sortOrder === "oldest" ? "Mais antigos" : "Mais recentes"}`}
                style={({ pressed }) => ({
                  minHeight: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography variant="desktopBodyStrong" color={pal.wine}>
                  {props.sortOrder === "oldest" ? "Mais antigos" : "Mais recentes"}
                </Typography>
                <AppIcon
                  name={props.sortOrder === "oldest" ? "arrow-down" : "arrow-up"}
                  size={18}
                  color={pal.wine}
                />
              </Pressable>
            }
          />
          <DesktopToolbar>
            <DesktopSearchField
              value={props.search}
              onChangeText={props.onSearchChange}
              placeholder="Buscar cliente ou valor"
              style={{ flexBasis: 240, minWidth: 240 }}
            />
            <DesktopSegmented
              options={[
                { key: "all", label: "Todos", count: props.groups.length },
                { key: "overdue", label: "Vencidos", count: props.overdueCount },
                { key: "upcoming", label: "Próximos", count: props.upcomingCount },
              ]}
              value={props.statusFilter}
              onChange={props.onStatusFilterChange}
              accessibilityLabel="Situação das cobranças"
            />
            <DesktopSegmented
              options={[
                { key: "all", label: "Todos os contatos" },
                { key: "withPhone", label: "Com WhatsApp" },
                { key: "withoutPhone", label: "Sem WhatsApp" },
              ]}
              value={props.contactFilter}
              onChange={props.onContactFilterChange}
              accessibilityLabel="Contato do cliente"
            />
          </DesktopToolbar>
          <FiadoCharges {...props} />
        </View>
      </>
    );
  }
  return (
    <>
      {props.header}
      <View style={{ gap: spacing["3xl"] }}>{body}</View>
    </>
  );
}
