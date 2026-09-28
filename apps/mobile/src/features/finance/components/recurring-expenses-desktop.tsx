/**
 * Gastos fixos no desktop (web >= 1024px). Estado e regras continuam em
 * `app/recurring-expenses.tsx`; aqui só a apresentação.
 */
import { Button, Typography, fonts, radii, spacing, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { Image, Platform, View, type TextStyle } from "react-native";

import fixedExpensesCalendar from "../../../assets/fixed-expenses-calendar.png";
import { useBrandScreenPalette } from "../../../shared/brand-palette";
import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import {
  DesktopTable,
  desktopActionButton,
  desktopCardStyle,
  type DesktopTableColumn,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { DesktopEmptyCard, DesktopTag } from "../../../shared/layout/desktop-kit";

const NOWRAP =
  Platform.OS === "web" ? ({ whiteSpace: "nowrap" } as unknown as TextStyle) : undefined;

export type RecurringDesktopRow = Readonly<{
  id: string;
  name: string;
  category: string;
  icon: AppIconName;
  iconSurface: string;
  day: number;
  amount: number;
  active: boolean;
  isNext: boolean;
}>;

/** Painel vinho: total do mês, quantidade, próximo vencimento e dias. */
export function RecurringCommitmentsDesktop({
  total,
  count,
  nextDay,
  timelineDays,
}: Readonly<{
  total: number;
  count: number;
  nextDay: number | null;
  timelineDays: readonly number[];
}>) {
  const pal = useBrandScreenPalette();
  const countLabel = `${count} ${count === 1 ? "gasto cadastrado" : "gastos cadastrados"}`;
  return (
    <View
      style={{
        backgroundColor: pal.wineFill,
        borderRadius: radii["2xl"],
        paddingHorizontal: 28,
        paddingVertical: spacing["2xl"],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing["2xl"],
        overflow: "hidden",
      }}
    >
      <View style={{ flex: 1, minWidth: 220, gap: spacing.sm }}>
        <Typography
          variant="desktopBodyStrong"
          color={pal.onWineMuted}
          accessibilityRole="header"
        >
          Compromissos do mês
        </Typography>
        <Typography
          color={pal.onWine}
          numberOfLines={1}
          style={{
            fontFamily: fonts.extraBold,
            fontSize: 44,
            lineHeight: 50,
            letterSpacing: -1,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatCurrency(total)}
        </Typography>
        <Typography variant="desktopBody" color={pal.onWineMuted}>
          {nextDay === null ? countLabel : `${countLabel} · próximo no dia ${nextDay}`}
        </Typography>
      </View>

      <View style={{ flex: 1, maxWidth: 320, minWidth: 0, gap: spacing.sm }}>
        <Typography variant="desktopMeta" color={pal.onWineMuted}>
          Próximos vencimentos
        </Typography>
        {timelineDays.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {timelineDays.map((day) => {
              const highlighted = day === nextDay;
              return (
                <View
                  key={day}
                  accessibilityLabel={`Dia ${day}${highlighted ? ", próximo" : ""}`}
                  style={{
                    minWidth: 48,
                    height: 48,
                    paddingHorizontal: spacing.sm,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: highlighted ? pal.lime : "transparent",
                    borderWidth: 1,
                    borderColor: highlighted ? pal.lime : pal.wineDivider,
                  }}
                >
                  <Typography
                    variant="desktopBodyStrong"
                    color={highlighted ? pal.onLime : pal.onWine}
                  >
                    {day}
                  </Typography>
                </View>
              );
            })}
          </View>
        ) : (
          <Typography variant="desktopBody" color={pal.onWineMuted}>
            Seus próximos vencimentos aparecerão aqui.
          </Typography>
        )}
      </View>

      <Image
        accessible={false}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={fixedExpensesCalendar}
        style={{ width: 112, height: 112 }}
      />
    </View>
  );
}

/** Cartão do recurso Profissional: texto e botão à esquerda, benefícios à direita. */
export function RecurringGateDesktop({
  benefits,
  onUnlock,
}: Readonly<{ benefits: readonly string[]; onUnlock: () => void }>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        desktopCardStyle(theme, { padding: 28 }),
        { flexDirection: "row", flexWrap: "wrap", gap: spacing["3xl"] },
      ]}
    >
      <View style={{ flex: 1, flexBasis: 300, minWidth: 0, gap: spacing.md }}>
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: theme.colors.premiumBg,
          }}
        >
          <AppIcon name="diamond-outline" size={16} color={theme.colors.premium} />
          <Typography
            variant="desktopMeta"
            color={theme.colors.premium}
            style={{ fontFamily: fonts.bold }}
          >
            Recurso Profissional
          </Typography>
        </View>
        <Typography variant="desktopSection" accessibilityRole="header">
          Gastos fixos no automático
        </Typography>
        <Typography variant="desktopBody" style={{ maxWidth: 440 }}>
          Cadastre uma vez e deixe o app lançar seus custos mensais sozinho, sempre na
          data certa.
        </Typography>
        <Button
          icon={
            <AppIcon
              name="lock-open-outline"
              size={20}
              color={theme.colors.textOnPrimary}
            />
          }
          onPress={onUnlock}
          title="Desbloquear no Profissional"
          style={{
            ...desktopActionButton,
            alignSelf: "flex-start",
            marginTop: spacing.sm,
          }}
        />
      </View>
      <View style={{ flex: 1, flexBasis: 300, minWidth: 0, gap: spacing.lg }}>
        {benefits.map((benefit) => (
          <View
            key={benefit}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.premiumBg,
              }}
            >
              <AppIcon name="checkmark" size={18} color={theme.colors.premium} />
            </View>
            <Typography
              variant="desktopBody"
              color={theme.colors.text}
              style={{ flex: 1, paddingTop: 4 }}
            >
              {benefit}
            </Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Tabela de gastos fixos, próximos vencimentos primeiro. */
export function RecurringTableDesktop({
  rows,
  onRowPress,
}: Readonly<{ rows: readonly RecurringDesktopRow[]; onRowPress: (id: string) => void }>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  const columns: DesktopTableColumn<RecurringDesktopRow>[] = [
    {
      key: "name",
      title: "Gasto",
      flex: 2,
      render: (row) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: row.iconSurface,
            }}
          >
            <AppIcon name={row.icon} size={20} color={pal.wine} />
          </View>
          <Typography variant="desktopBodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {row.name}
          </Typography>
        </View>
      ),
    },
    {
      key: "category",
      title: "Categoria",
      flex: 1,
      render: (row) => <DesktopTag label={row.category} />,
    },
    {
      key: "day",
      title: "Vencimento",
      width: 170,
      render: (row) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Typography variant="desktopBody" color={theme.colors.text} style={NOWRAP}>
            Todo dia {row.day}
          </Typography>
          {row.isNext ? <DesktopTag label="Próximo" variant="success" /> : null}
          {row.active ? null : <DesktopTag label="Inativo" />}
        </View>
      ),
    },
    {
      key: "amount",
      title: "Valor",
      width: 130,
      align: "right",
      render: (row) => (
        <Typography
          variant="desktopBodyStrong"
          style={[NOWRAP, { fontVariant: ["tabular-nums"] }]}
        >
          {formatCurrency(row.amount)}
        </Typography>
      ),
    },
  ];
  return (
    <DesktopTable
      columns={columns}
      rows={rows}
      keyExtractor={(row) => row.id}
      onRowPress={(row) => onRowPress(row.id)}
      rowAccessibilityLabel={(row) =>
        `${row.name}, ${row.category}, dia ${row.day}, ${formatCurrency(row.amount)}`
      }
    />
  );
}

/** Lateral: detalhes do gasto escolhido, ou uma dica quando nenhum está aberto. */
export function RecurringAsideDesktop({
  selected,
  onEdit,
  onDelete,
  onClose,
}: Readonly<{
  selected: (RecurringDesktopRow & { categoryLabel: string }) | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}>) {
  const { theme } = useTheme();
  const pal = useBrandScreenPalette();
  if (!selected) {
    return (
      <View
        style={[desktopCardStyle(theme, { padding: spacing.xl }), { gap: spacing.sm }]}
      >
        <Typography variant="desktopCardTitle">Detalhes do gasto</Typography>
        <Typography variant="desktopBody">
          Escolha um gasto na lista para ver os detalhes, editar ou remover.
        </Typography>
      </View>
    );
  }
  const details: { icon: AppIconName; label: string; value: string }[] = [
    { icon: "cash-outline", label: "Valor", value: formatCurrency(selected.amount) },
    { icon: "grid-outline", label: "Categoria", value: selected.categoryLabel },
    { icon: "calendar-outline", label: "Dia do mês", value: `Todo dia ${selected.day}` },
    {
      icon: "checkmark-circle-outline",
      label: "Status",
      value: selected.active ? "Ativo" : "Inativo",
    },
  ];
  return (
    <View style={[desktopCardStyle(theme, { padding: spacing.xl }), { gap: spacing.lg }]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Typography variant="desktopMeta">Detalhes do gasto</Typography>
          <Typography variant="desktopCardTitle" accessibilityRole="header">
            {selected.name}
          </Typography>
        </View>
        <Button
          title="Fechar"
          variant="ghost"
          accessibilityLabel="Fechar detalhes"
          onPress={onClose}
          icon={<AppIcon name="close" size={18} color={theme.colors.text} />}
          style={{ minHeight: 44 }}
        />
      </View>
      <View style={{ gap: spacing.md }}>
        {details.map((detail) => (
          <View
            key={detail.label}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
          >
            <AppIcon name={detail.icon} size={20} color={pal.warmGray} />
            <Typography variant="desktopBody" style={{ flex: 1 }}>
              {detail.label}
            </Typography>
            <Typography variant="desktopBodyStrong" style={NOWRAP}>
              {detail.value}
            </Typography>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button
          title="Remover"
          variant="alertOutline"
          onPress={onDelete}
          icon={<AppIcon name="trash-outline" size={18} color={theme.colors.alert} />}
          style={{ flex: 1, minHeight: 48 }}
        />
        <Button
          title="Editar"
          onPress={onEdit}
          icon={
            <AppIcon name="create-outline" size={18} color={theme.colors.textOnPrimary} />
          }
          style={{ flex: 1, minHeight: 48 }}
        />
      </View>
    </View>
  );
}

/** Estado vazio do plano Profissional, em cartão tracejado. */
export function RecurringEmptyDesktop({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <DesktopEmptyCard
      layout="center"
      title="Nenhum gasto fixo ainda"
      description="Cadastre seus custos mensais e deixe o app lançar pra você."
    >
      <Button title="Novo gasto fixo" onPress={onAdd} style={desktopActionButton} />
    </DesktopEmptyCard>
  );
}
