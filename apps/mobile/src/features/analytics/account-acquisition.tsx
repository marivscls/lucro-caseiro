import type { AccountAcquisitionReport } from "@lucro-caseiro/contracts";
import { Card, Typography, spacing, useTheme } from "@lucro-caseiro/ui";
import { View } from "react-native";

const labels = {
  first_value: "Primeira ação útil",
  product: "Primeiro produto",
  pricing: "Primeira precificação",
  sale: "Primeira venda",
};
const percent = (value: number | null) =>
  value == null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export function AccountAcquisition({
  data,
}: Readonly<{ data: AccountAcquisitionReport }>) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <Card variant="elevated" style={{ gap: spacing.md }}>
        <Typography variant="h3">Primeira experiência por conta</Typography>
        <Typography variant="body" color={theme.colors.textSecondary}>
          {data.accounts} contas confirmadas nos últimos 90 dias. Administradores
          configurados foram excluídos. Cada conta é contada uma vez, mesmo usando mais de
          um aparelho.
        </Typography>
        {data.milestones.map((item) => (
          <View key={item.action} style={{ gap: spacing.xs }}>
            <Typography variant="bodyBold">
              {labels[item.action]} · {percent(item.percent)}
            </Typography>
            <Typography variant="body">
              {item.users} de {item.eligible} contas concluíram em até 7 dias.
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              {item.medianMinutes == null
                ? "Ainda sem ações para calcular o tempo."
                : `Tempo mediano: ${item.medianMinutes.toLocaleString("pt-BR")} min após o cadastro.`}
            </Typography>
          </View>
        ))}
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Contas com menos de 7 dias aguardam sua janela. Produto, cálculo ou venda podem
          ser a primeira ação; encomendas, serviços, orçamentos, catálogo e financeiro
          também contam como utilidade. Cadastros salvos e eventos registrados compõem a
          medição. Exclusões de dados e falhas antigas de coleta podem reduzir o
          histórico.
        </Typography>
      </Card>
      <Card variant="elevated" style={{ gap: spacing.md }}>
        <Typography variant="h3">Retorno das contas novas</Typography>
        {([1, 7] as const).map((day) => {
          const metric = data.retention[day === 1 ? "day1" : "day7"];
          return (
            <View key={day} style={{ gap: spacing.xs }}>
              <Typography variant="bodyBold">
                D{day}: {percent(metric.percent)}
              </Typography>
              <Typography variant="body">
                {metric.retained} retornaram de {metric.eligible} contas elegíveis.
              </Typography>
            </View>
          );
        })}
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Retorno no dia exato após o cadastro, em UTC. O dia atual ainda incompleto não
          entra no denominador.
        </Typography>
        {data.cohorts.map((cohort) => (
          <View key={cohort.week} style={{ gap: spacing.xs }}>
            <Typography variant="bodyBold">
              Semana de {cohort.week.split("-").reverse().join("/")} · {cohort.accounts}{" "}
              contas
            </Typography>
            <Typography variant="caption" color={theme.colors.textSecondary}>
              D1: {cohort.retainedD1}/{cohort.eligibleD1} · D7: {cohort.retainedD7}/
              {cohort.eligibleD7} elegíveis
            </Typography>
          </View>
        ))}
      </Card>
      <Card variant="elevated" style={{ gap: spacing.md }}>
        <Typography variant="h3">Origem das instalações</Typography>
        <Typography variant="caption" color={theme.colors.textSecondary}>
          Primeiras aberturas nos últimos 90 dias. A origem depende do identificador
          entregue pela Google Play na nova versão; instalações sem identificação
          permanecem sem origem conhecida.
        </Typography>
        {data.sources.map((source) => (
          <View
            key={JSON.stringify([source.source, source.medium, source.campaign])}
            style={{ gap: spacing.xs }}
          >
            <Typography variant="bodyBold">
              {source.source ?? "Origem não identificada"}: {source.installations}
            </Typography>
            {source.campaign || source.medium ? (
              <Typography variant="caption" color={theme.colors.textSecondary}>
                {[source.medium, source.campaign].filter(Boolean).join(" · ")}
              </Typography>
            ) : null}
          </View>
        ))}
      </Card>
    </View>
  );
}
