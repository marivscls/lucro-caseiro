/**
 * Detalhe do cliente no desktop (web >= 1024px): cabeçalho da página com as
 * ações, faixa de indicadores, histórico em tabela e dados na lateral. Mesmos
 * dados e ações do celular; só o arranjo muda.
 */
import type { Client, Sale } from "@lucro-caseiro/contracts";
import { Button, radii, spacing, Typography, useTheme } from "@lucro-caseiro/ui";
import React from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";

import { AppIcon, type AppIconName } from "../../../shared/components/app-icon";
import { ScreenHeader } from "../../../shared/components/screen-header";
import { DesktopEmptyCard, DesktopTag } from "../../../shared/layout/desktop-kit";
import {
  DesktopCard,
  DesktopSection,
  DesktopSplit,
  DesktopStatRow,
  DesktopTable,
  DesktopToolbarButton,
  desktopActionButton,
  desktopPageContent,
} from "../../../shared/layout/desktop-page";
import { formatCurrency } from "../../../shared/utils/format";
import { maskPhoneBR } from "../../../shared/utils/phone";
import { displayProductName } from "../../products/display";

const STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  paid: { label: "Pago", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

function saleTitle(sale: Sale): string {
  const first = sale.items?.[0];
  const name = first ? displayProductName(first.productName) : "Venda";
  const extra = (sale.items?.length ?? 0) > 1 ? ` +${(sale.items?.length ?? 1) - 1}` : "";
  return name + extra;
}

function DesktopInfoRow({
  icon,
  label,
  value,
}: Readonly<{ icon: AppIconName; label: string; value: string }>) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.full,
          backgroundColor: theme.colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppIcon name={icon} size={18} color={theme.colors.textSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="desktopMeta">{label}</Typography>
        <Typography variant="desktopBody">{value}</Typography>
      </View>
    </View>
  );
}

export function ClientDetailDesktop({
  client,
  sales,
  salesTotal,
  salesLoading,
  salesError,
  birthdayThisMonth,
  onBack,
  onEditPress,
  onWhatsApp,
  onBirthday,
  formatDate,
}: Readonly<{
  client: Client;
  sales: readonly Sale[];
  salesTotal: number;
  salesLoading: boolean;
  salesError: boolean;
  birthdayThisMonth: boolean;
  onBack?: () => void;
  onEditPress?: () => void;
  onWhatsApp?: () => void;
  onBirthday?: () => void;
  formatDate: (date: string) => string;
}>) {
  const { theme } = useTheme();
  // Em 1024px a tabela não cabe ao lado dos dados: os dados sobem para cima.
  const stacked = useWindowDimensions().width < 1200;
  const since = client.createdAt ? new Date(client.createdAt).getFullYear() : "hoje";
  const pending = sales
    .filter((sale) => sale.status === "pending")
    .reduce((sum, sale) => sum + sale.total, 0);
  const hasInfo = !!(client.phone || client.address || client.birthday || client.notes);

  let history: React.ReactNode;
  if (salesLoading) {
    history = <Typography variant="desktopBody">Carregando compras…</Typography>;
  } else if (salesError) {
    history = (
      <DesktopEmptyCard
        layout="center"
        title="Não foi possível carregar as compras"
        description="Tente novamente mais tarde."
      />
    );
  } else if (sales.length === 0) {
    history = (
      <DesktopEmptyCard
        layout="center"
        title="Nenhuma compra ainda"
        description="As vendas feitas para este cliente aparecem aqui."
      />
    );
  } else {
    history = (
      <DesktopTable
        columns={[
          {
            key: "item",
            title: "Venda",
            flex: 2,
            render: (sale) => (
              <Typography variant="desktopBodyStrong" numberOfLines={1}>
                {saleTitle(sale)}
              </Typography>
            ),
          },
          {
            key: "date",
            title: "Data",
            width: 116,
            render: (sale) => (
              <Typography variant="desktopBody">
                {new Date(sale.soldAt).toLocaleDateString("pt-BR")}
              </Typography>
            ),
          },
          {
            key: "status",
            title: "Situação",
            width: 104,
            render: (sale) => {
              const status = STATUS[sale.status] ?? {
                label: sale.status,
                variant: "danger" as const,
              };
              return <DesktopTag label={status.label} variant={status.variant} strong />;
            },
          },
          {
            key: "total",
            title: "Total",
            width: 112,
            align: "right",
            render: (sale) => (
              <Typography
                variant="desktopBodyStrong"
                color={theme.colors.success}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCurrency(sale.total)}
              </Typography>
            ),
          },
        ]}
        rows={sales}
        keyExtractor={(sale) => sale.id}
      />
    );
  }

  const actions = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
      {onBack ? (
        <DesktopToolbarButton icon="chevron-back" label="Clientes" onPress={onBack} />
      ) : null}
      <Button
        title="Editar cliente"
        variant="outline"
        onPress={onEditPress ?? (() => {})}
        style={desktopActionButton}
        icon={
          <AppIcon name="pencil-outline" size={18} color={theme.colors.primaryStrong} />
        }
      />
      {onWhatsApp ? (
        <Button
          title="WhatsApp"
          variant="success"
          onPress={onWhatsApp}
          style={desktopActionButton}
          icon={
            <AppIcon name="logo-whatsapp" size={18} color={theme.colors.textOnPrimary} />
          }
        />
      ) : null}
    </View>
  );

  const details = (
    <>
      <DesktopCard>
        <Typography variant="desktopCardTitle" accessibilityRole="header">
          Dados do cliente
        </Typography>
        {client.phone ? (
          <DesktopInfoRow
            icon="call-outline"
            label="Telefone"
            value={maskPhoneBR(client.phone)}
          />
        ) : null}
        {client.address ? (
          <DesktopInfoRow
            icon="location-outline"
            label="Endereço"
            value={client.address}
          />
        ) : null}
        {client.birthday ? (
          <DesktopInfoRow
            icon="gift-outline"
            label="Aniversário"
            value={formatDate(client.birthday)}
          />
        ) : null}
        {client.notes ? (
          <DesktopInfoRow
            icon="document-text-outline"
            label="Observações"
            value={client.notes}
          />
        ) : null}
        {hasInfo ? null : (
          <Typography variant="desktopBody">
            Nenhuma informação adicional cadastrada.
          </Typography>
        )}
        {client.tags.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {client.tags.map((tag) => (
              <DesktopTag key={tag} label={tag} variant="lavender" strong />
            ))}
          </View>
        ) : null}
      </DesktopCard>
      {birthdayThisMonth && onBirthday ? (
        <DesktopCard>
          <Typography variant="desktopCardTitle">Aniversário este mês</Typography>
          <Typography variant="desktopBody">
            Mande uma mensagem de parabéns pelo WhatsApp.
          </Typography>
          <Button
            title="Enviar parabéns"
            variant="secondary"
            onPress={onBirthday}
            style={{ minHeight: 48 }}
          />
        </DesktopCard>
      ) : null}
    </>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[desktopPageContent(true), { gap: 0 }]}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title={client.name}
        subtitle={`Cliente desde ${since}`}
        hideBack
        right={stacked ? undefined : actions}
      />
      <View style={{ gap: spacing["3xl"] }}>
        {/* Em 1024px as ações ficam numa linha própria para o nome não quebrar. */}
        {stacked ? actions : null}
        <DesktopStatRow
          items={[
            {
              label: "Total em compras",
              value: formatCurrency(client.totalSpent),
              color: theme.colors.success,
            },
            { label: "Compras", value: salesLoading ? "—" : String(salesTotal) },
            {
              label: "A receber",
              value: formatCurrency(pending),
              color: pending > 0 ? theme.colors.yellow : undefined,
            },
          ]}
        />
        {stacked ? (
          <>
            <View style={{ gap: spacing.lg }}>{details}</View>
            <DesktopSection title="Histórico de compras">{history}</DesktopSection>
          </>
        ) : (
          <DesktopSplit aside={details}>
            <DesktopSection title="Histórico de compras">{history}</DesktopSection>
          </DesktopSplit>
        )}
      </View>
    </ScrollView>
  );
}
