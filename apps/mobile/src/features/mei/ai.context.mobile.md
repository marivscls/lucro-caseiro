# ai.context.mobile.md — MEI (Cantinho do MEI)

---

## Purpose

Para quem é MEI: mostrar quanto do teto anual já foi usado (alerta a partir de 80%), a
projeção do ano, o Relatório Mensal das Receitas Brutas (PDF e texto) e lembrar do DAS a cada mês no
dia 15 (vence dia 20).

## Non-goals

- Não emite DAS nem nota fiscal; só leva ao PGMEI da Receita.
- Não calcula imposto nem trata teto proporcional de quem abriu o MEI no ano (só avisa).
- Não soma receitas: a API usa as entradas do Financeiro.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (`MeiSummary`, `MEI_*`), `@lucro-caseiro/ui`,
  `expo-notifications`, `shared/utils/export-html`.
- **Dependentes:** `app/mei.tsx`; `shared/hooks/notification-types.ts` (`MEI_DAS` abre `/mei`).

## Code pointers

| Arquivo           | Descricao                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `api.ts`          | GET resumo por ano/mês, PUT atividade                                     |
| `hooks.ts`        | `useMeiSummary`, `useUpdateMeiSettings`                                   |
| `domain.ts`       | Linhas do relatório, texto, mensagens do teto, mês anterior/seguinte, DAS |
| `report-pdf.ts`   | HTML/PDF do relatório                                                     |
| `das-reminder.ts` | Agenda/cancela o aviso mensal (dia 15, 9h) no celular                     |
| `app/mei.tsx`     | Tela                                                                      |

## Components

- Tela com: escolha da atividade (sem atividade, só isso aparece), cartão do teto com barra e
  marca de 80%, relatório do mês (navegação entre meses, valor com nota opcional, WhatsApp e
  PDF), DAS (texto do próximo vencimento, chave do lembrete, link do PGMEI), barras mês a mês.

## Hooks

| Hook                     | Tipo          | Descricao                       |
| ------------------------ | ------------- | ------------------------------- |
| `useMeiSummary(y, m)`    | `useQuery`    | Key `["mei", "summary", y, m]`. |
| `useUpdateMeiSettings()` | `useMutation` | Invalida `["mei"]`.             |

## API Integration

| Endpoint                           | Verbo | Funcao              | Parametros          |
| ---------------------------------- | ----- | ------------------- | ------------------- |
| `/api/v1/mei/summary?year=&month=` | GET   | `fetchMeiSummary`   | ano e mês           |
| `/api/v1/mei/settings`             | PUT   | `updateMeiSettings` | body `{ activity }` |

## Contracts

- `MeiSummary { year, month, activity, monthRevenue, yearRevenue, annualLimit, usedRatio,
remaining, projectedYearRevenue, status, months[] }`; `MeiActivity`.

## Error Handling

- Falha ao salvar atividade: `alertError` com a mensagem da API.
- Sem permissão de notificação: a chave volta para desligada e avisa.
- PDF: alerta genérico se falhar.

## Performance

- Uma query por mês visto; o relatório é montado no aparelho.

## Test matrix

- [x] `domain.test.ts`: linhas por atividade, nota fiscal limitada ao total, texto, mensagens
      do teto (ok/near/over), projeção, navegação de meses, próximo DAS.
- [x] `shared/mock/growth-routes.test.ts`: resumo no formato do contrato.

## Examples

- Mais > Ver tudo > Cantinho do MEI > escolher "Prestação de serviços" > Salvar.
- Relatório de agosto > R$ 300 com nota > Baixar relatório em PDF.

## Change log / Decisions

- 2026-09-28: criação. Todas as entradas do mês vão para a atividade escolhida; a divisão com
  e sem nota é digitada e não é salva (vale para aquele relatório). Lembrete só no celular.
