# ai.context.mobile.md — Insights (Gráficos / Análises)

---

## Purpose

Painel visual de desempenho do negócio: faturamento mês a mês, produtos mais vendidos e
melhores clientes — numa janela de 3, 6 ou 12 meses. Tudo com gráficos simples (barras em
`View`, sem biblioteca nativa), para não exigir rebuild do dev/EAS.

## Non-goals

- Não edita nada (somente leitura).
- Não recalcula nada no cliente: projeta exatamente o que o endpoint `insights` retorna.
- Não substitui o card de Financeiro do mês (entradas/saídas/lucro) na Home.
- Não exporta arquivo (export PDF/Excel fica no Financeiro).

## Boundaries & Ownership

- **Depende de**: `@lucro-caseiro/contracts` (Insights, TopProduct, TopClient, MonthlyRevenue),
  `shared/utils/api-client`, `shared/hooks/use-auth`, `@lucro-caseiro/ui`.
- **Counterpart de API**: feature `insights` (`GET /api/v1/insights?months=`).
- **Dependentes**: tela `app/insights.tsx`; atalho na Home (`app/tabs/index.tsx`).

## Code pointers

- `apps/mobile/src/app/insights.tsx` — tela (seletor de janela, cards de resumo, gráficos)
- `apps/mobile/src/features/insights/api.ts` — `fetchInsights(token, months?)`
- `apps/mobile/src/features/insights/hooks.ts` — `useInsights(months?)`
- `apps/mobile/src/features/insights/domain.ts` — formatMoney, monthLabel, maxRevenue
- `apps/mobile/src/features/insights/components/monthly-bars.tsx` — barras verticais
- `apps/mobile/src/features/insights/components/rank-bars.tsx` — ranking com barra horizontal
- `apps/mobile/src/features/insights/types.ts` — re-export dos contratos

## Components

- **MonthlyBars** (`{ series: MonthlyRevenue[] }`): barras verticais do faturamento, altura
  proporcional ao máximo da série; mês sem venda vira barra cinza vazia. Eixo X sempre com
  abreviações de mês (janela de 12 mostra mês sim, mês não, terminando no mais recente).
- **RankBars** (`{ rows: RankRow[]; color }`): lista ranqueada com barra de preenchimento
  horizontal proporcional ao maior valor. `RankRow = { key, label, caption, value }`.
- **StatCard / WindowSelector** (locais na tela): cards de resumo e pills 3/6/12 meses.

## Hooks

- **useInsights(months?)**: React Query (`["insights", months]`), `enabled: !!token`.
  Reaproveita o cache por janela; troca de janela refaz a query mantendo os dados
  anteriores na tela (`keepPreviousData` do React Query — sem spinner de tela cheia).

## API Integration

- `GET /api/v1/insights?months=N` via `apiClient` com Bearer token.
- Resposta: `Insights { months, totalRevenue, totalSales, topProducts[], topClients[], monthlyRevenue[] }`.
- Sem mutations (feature de leitura).

## Contracts

- **Insights**, **TopProduct**, **TopClient**, **MonthlyRevenue** (de `@lucro-caseiro/contracts`).
- `monthlyRevenue` já vem contínuo (meses zerados preenchidos no backend) e em ordem crescente.

## Error Handling

- Loading: `ActivityIndicator` centralizado.
- Sem dados (`totalSales === 0`): `EmptyState` convidando a registrar vendas.
- Erros de rede: tratados pelo `apiClient`/React Query (retry padrão); a tela só projeta o
  estado atual (sem dados → EmptyState).

## Performance

- Gráficos em puro `View` (sem `react-native-svg` nem libs nativas) → zero impacto no bundle
  nativo e nenhuma necessidade de rebuild.
- Uma única request por janela; cache do React Query evita refetch ao alternar de volta.

## Test matrix

- Domínio puro (`domain.ts`): `monthLabel("2026-05") === "mai"`; `maxRevenue([]) >= 1`;
  `formatMoneyShort(1500)` → "R$ 1.500" (abrevia "mil" só a partir de 10.000);
  `monthOverMonthDelta` (variação % do último mês vs anterior; null sem base de comparação).
  (cobertura leve; lógica pesada de agregação é da API)

## Examples

```tsx
const { data } = useInsights(6);
// data.topProducts[0] => { name: "Bolo de pote", quantity: 40, revenue: 600 }
<MonthlyBars series={data.monthlyRevenue} />;
```

## Change log / Decisions

- Criação inicial: tela de Insights com faturamento mensal, mais vendidos e melhores clientes.
- Decisão: gráficos em `View` (barras) em vez de lib de chart nativa, para manter o dev build
  atual sem rebuild e o bundle leve.
- Janela default de 6 meses (pills 3/6/12); top 5 vem pronto do backend.
- 2026-06-16: **gating Premium** — free vê só os 3 cards do mês atual (`useInsights(isPremium ? months : 1)`); seletor de janela some e gráfico + rankings viram `ReportsPremiumTeaser` (toque → `showPaywall("reports")`). Premium-check via `useProfile().plan`. Backend também força `months=1` no free (não confiar no front).
- 2026-07-11: **refinamentos de leitura** — (a) eixo X do gráfico de 12 meses mostra abreviações alternadas em vez de pontinhos; (b) `formatMoneyShort` só abrevia "mil" a partir de R$ 10.000 (eixo Y consistente: "R$ 1.000", não "R$ 1,0 mil"); (c) no Premium, o card "FATURAMENTO" (redundante com o total do gráfico) vira "VS. MÊS ANTERIOR" com a variação % mês a mês (`monthOverMonthDelta`; fallback pro card de faturamento quando não há base de comparação — e o free mantém o card original).
