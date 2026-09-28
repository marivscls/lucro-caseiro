/**
 * Peças da Agenda no desktop (web >= 1024px). Estado e regras continuam em
 * `app/tabs/agenda.tsx`; aqui só a apresentação: faixa de dias em cartões,
 * encomendas em tabela por grupo e linha do tempo em grade.
 */
import type { Order } from "@lucro-caseiro/contracts";
import { Button, Typography, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React, { type ReactNode } from "react";
import { Image, Pressable, View } from "react-native";

import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  DesktopCard,
  DesktopGrid,
  DesktopTable,
  DesktopToolbarButton,
  desktopActionButton,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import {
  STATUS_LABEL,
  STATUS_TONE,
  agendaDayCountLabel,
  formatDateBR,
  type AgendaStripDay,
  type AgendaTimelineSlot,
} from "../domain";
import { orderIcon, orderToneColors } from "./order-card";

type Noun = { singular: string; plural: string };

function DayButton({
  selected,
  accessibilityLabel,
  onPress,
  children,
}: Readonly<{
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
}>) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      aria-selected={selected}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => {
        let borderColor: string = theme.colors.border;
        if (hovered) borderColor = theme.colors.textSecondary;
        if (selected) borderColor = theme.colors.primaryStrong;
        return {
          flex: 1,
          minWidth: 0,
          minHeight: 96,
          borderRadius: radii.lg,
          borderWidth: selected ? 2 : 1,
          borderColor,
          backgroundColor: selected
            ? theme.colors.primaryBg
            : theme.colors.surfaceElevated,
          paddingVertical: spacing.md - (selected ? 1 : 0),
          paddingHorizontal: spacing.sm,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          opacity: pressed ? 0.85 : 1,
        };
      }}
    >
      {children}
    </Pressable>
  );
}

/**
 * Faixa de dias do desktop: "Todos" + próximos 7 dias em cartões de 96px,
 * com o número do dia em 22px e a contagem por extenso.
 */
export function AgendaDesktopDayStrip({
  days,
  totalOrders,
  selectedDate,
  noun,
  onSelect,
  onOpenFilter,
}: Readonly<{
  days: readonly AgendaStripDay[];
  totalOrders: number;
  selectedDate: string | null;
  noun: Noun;
  onSelect: (date: string | null) => void;
  onOpenFilter: () => void;
}>) {
  const { theme } = useTheme();
  const allSelected = selectedDate === null;
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <Typography
          variant="desktopSection"
          accessibilityRole="header"
          style={{ flex: 1 }}
        >
          Próximos dias
        </Typography>
        <DesktopToolbarButton
          icon="calendar-outline"
          label="Todas as datas"
          onPress={onOpenFilter}
        />
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <DayButton
          selected={allSelected}
          accessibilityLabel={`Todos os dias, ${totalOrders} ${totalOrders === 1 ? noun.singular : noun.plural}`}
          onPress={() => onSelect(null)}
        >
          <Typography
            variant="desktopMeta"
            color={allSelected ? theme.colors.primaryStrong : undefined}
          >
            Todos
          </Typography>
          <Typography variant="desktopMetric">{totalOrders}</Typography>
          <Typography variant="desktopMeta" numberOfLines={1}>
            no total
          </Typography>
        </DayButton>
        {days.map((item) => {
          const selected = selectedDate === item.date;
          const busy = item.count > 0;
          return (
            <DayButton
              key={item.date}
              selected={selected}
              accessibilityLabel={`${item.label}, ${formatDateBR(item.date)}, ${agendaDayCountLabel(item.count, noun)}`}
              onPress={() => onSelect(item.date)}
            >
              <Typography
                variant="desktopMeta"
                numberOfLines={1}
                color={selected ? theme.colors.primaryStrong : undefined}
              >
                {item.label}
              </Typography>
              <Typography
                variant="desktopMetric"
                color={busy ? theme.colors.text : theme.colors.textSecondary}
              >
                {item.day}
              </Typography>
              {busy ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppIcon
                    name="cube-outline"
                    size={16}
                    color={theme.colors.primaryStrong}
                  />
                  <Typography
                    variant="desktopBodyStrong"
                    color={theme.colors.primaryStrong}
                  >
                    {item.count}
                  </Typography>
                </View>
              ) : (
                <Typography variant="desktopMeta" numberOfLines={1}>
                  Livre
                </Typography>
              )}
            </DayButton>
          );
        })}
      </View>
    </View>
  );
}

function StatusBadge({ order }: Readonly<{ order: Order }>) {
  const { theme } = useTheme();
  const colors = orderToneColors(theme, STATUS_TONE[order.status]);
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.full,
      }}
    >
      <Typography variant="desktopMeta" color={colors.fg} numberOfLines={1}>
        {STATUS_LABEL[order.status]}
      </Typography>
    </View>
  );
}

function OrderThumb({ order }: Readonly<{ order: Order }>) {
  const { theme } = useTheme();
  const colors = orderToneColors(theme, STATUS_TONE[order.status]);
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radii.md,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {order.photoUrl ? (
        <Image source={{ uri: order.photoUrl }} style={{ width: 44, height: 44 }} />
      ) : (
        <AppIcon name={orderIcon(order)} size={22} color={colors.fg} />
      )}
    </View>
  );
}

function orderColumns(
  theme: ReturnType<typeof useTheme>["theme"],
): DesktopTableColumn<Order>[] {
  return [
    {
      key: "order",
      title: "Encomenda",
      flex: 2,
      render: (order) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            width: "100%",
          }}
        >
          <OrderThumb order={order} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="desktopBodyStrong" numberOfLines={1}>
              {order.title}
            </Typography>
            <Typography variant="desktopMeta" numberOfLines={1}>
              {order.clientName ?? "Sem cliente"}
            </Typography>
          </View>
        </View>
      ),
    },
    {
      key: "delivery",
      title: "Entrega",
      flex: 1,
      render: (order) => (
        <View>
          <Typography variant="desktopBody" color={theme.colors.text} numberOfLines={1}>
            {formatDateBR(order.deliveryDate)}
          </Typography>
          <Typography variant="desktopMeta" numberOfLines={1}>
            {order.deliveryTime ?? "Sem horário"}
          </Typography>
        </View>
      ),
    },
    {
      key: "amount",
      title: "Valor",
      width: 132,
      align: "right",
      render: (order) => {
        const missing =
          order.deposit != null && order.amount != null && order.deposit < order.amount
            ? order.amount - order.deposit
            : null;
        return (
          <View style={{ alignItems: "flex-end" }}>
            <Typography
              variant="desktopBodyStrong"
              color={
                order.amount == null ? theme.colors.textSecondary : theme.colors.success
              }
              numberOfLines={1}
            >
              {order.amount == null ? "A combinar" : formatCurrency(order.amount)}
            </Typography>
            {missing == null ? null : (
              <Typography variant="desktopMeta" numberOfLines={1}>
                Falta {formatCurrency(missing)}
              </Typography>
            )}
          </View>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      width: 128,
      align: "right",
      render: (order) => <StatusBadge order={order} />,
    },
  ];
}

/** Um grupo da agenda ("Amanhã", "Esta semana"…) como tabela. */
export function AgendaDesktopGroup({
  title,
  icon,
  color,
  orders,
  noun,
  onSelect,
}: Readonly<{
  title: string;
  icon: AppIconName;
  color: string;
  orders: readonly Order[];
  noun: Noun;
  onSelect: (id: string) => void;
}>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <AppIcon name={icon} size={22} color={color} />
        <Typography variant="desktopSection" color={color} accessibilityRole="header">
          {title}
        </Typography>
        <Typography variant="desktopMeta" style={{ marginLeft: spacing.xs }}>
          {agendaDayCountLabel(orders.length, noun)}
        </Typography>
      </View>
      <DesktopTable
        columns={orderColumns(theme)}
        rows={orders}
        keyExtractor={(order) => order.id}
        onRowPress={(order) => onSelect(order.id)}
        rowAccessibilityLabel={(order) =>
          `Abrir ${order.title}, entrega ${formatDateBR(order.deliveryDate)}${
            order.deliveryTime ? ` às ${order.deliveryTime}` : ""
          }, ${STATUS_LABEL[order.status]}`
        }
      />
    </View>
  );
}

/** Linha do tempo do dia em grade de horários (8h às 18h). */
export function AgendaDesktopTimeline({
  slots,
}: Readonly<{ slots: readonly AgendaTimelineSlot[] }>) {
  const { theme } = useTheme();
  return (
    <DesktopCard>
      <View style={{ gap: spacing.xs }}>
        <Typography variant="desktopCardTitle" accessibilityRole="header">
          Linha do tempo do dia
        </Typography>
        <Typography variant="desktopBody">
          Horários livres e ocupados entre 8h e 18h.
        </Typography>
      </View>
      <DesktopGrid minColumnWidth={150} maxColumns={5} gap={spacing.sm}>
        {slots.map((slot) => (
          <View
            key={slot.label}
            accessibilityLabel={
              slot.busyWith
                ? `${slot.label}, ocupado com ${slot.busyWith}`
                : `${slot.label}, livre`
            }
            style={{
              minHeight: 56,
              borderRadius: radii.md,
              backgroundColor: slot.busyWith
                ? theme.colors.premiumBg
                : theme.colors.surface,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              justifyContent: "center",
            }}
          >
            <Typography variant="desktopBodyStrong">{slot.label}</Typography>
            <Typography
              variant="desktopMeta"
              numberOfLines={1}
              color={slot.busyWith ? theme.colors.premium : undefined}
            >
              {slot.busyWith ?? "Livre"}
            </Typography>
          </View>
        ))}
      </DesktopGrid>
    </DesktopCard>
  );
}

/** Estado vazio do desktop: cartão tracejado na coluna, não texto solto. */
export function AgendaDesktopEmpty({
  title,
  description,
  actionLabel,
  onAction,
}: Readonly<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}>) {
  const { theme } = useTheme();
  return (
    <DesktopCard style={{ borderStyle: "dashed", alignItems: "flex-start" }}>
      <AppIcon name="calendar-outline" size={28} color={theme.colors.textSecondary} />
      <View style={{ gap: spacing.xs }}>
        <Typography variant="desktopCardTitle">{title}</Typography>
        <Typography variant="desktopBody">{description}</Typography>
      </View>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={desktopActionButton} />
      ) : null}
    </DesktopCard>
  );
}

/** Dica do dia no desktop (16px, botão de fechar de 44px). */
export function AgendaDesktopTip({ onDismiss }: Readonly<{ onDismiss: () => void }>) {
  const { theme } = useTheme();
  return (
    <DesktopCard
      padding={spacing.lg}
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}
    >
      <AppIcon name="calendar" size={24} color={theme.colors.textSecondary} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="desktopBodyStrong">Dica do dia</Typography>
        <Typography variant="desktopBody">
          Mantenha sua agenda em dia para não perder nenhum pedido!
        </Typography>
      </View>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Fechar dica"
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <AppIcon name="close" size={22} color={theme.colors.textSecondary} />
      </Pressable>
    </DesktopCard>
  );
}
