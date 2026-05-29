# ai.context.mobile.md — Goals (Meta de Pró-labore)

---

## Purpose

Deixar o usuário definir quanto quer ganhar por mês (pró-labore) e mostrar, na Home, o
progresso do mês: quanto já faturou, quanto falta e ~quantas vendas faltam para a meta.

## Non-goals

- Não calcula receita/despesa (feature `finance`); apenas projeta o que o back retorna.
- Não tem histórico de metas nem projeção multi-mês (futuro).
- Não há gate de paywall (feature é grátis na v1).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (ProlaboreGoal, ProlaboreProgress, ProlaboreStatus, UpsertProlaboreGoal), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `app/tabs/index` (Home renderiza `ProlaboreCard`), `app/settings` (entrada para editar a meta).

## Code pointers

| Arquivo                                                             | Descricao                                           |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| `apps/mobile/src/features/goals/api.ts`                             | Funcoes HTTP (fetchProlaboreStatus, upsert, delete) |
| `apps/mobile/src/features/goals/hooks.ts`                           | React Query hooks                                   |
| `apps/mobile/src/features/goals/types.ts`                           | Re-export dos tipos de contracts                    |
| `apps/mobile/src/features/goals/domain.ts`                          | Helpers puros (formatCurrency, prolaboreMessage)    |
| `apps/mobile/src/features/goals/domain.test.ts`                     | Testes do dominio de formatacao/mensagem            |
| `apps/mobile/src/features/goals/components/prolabore-card.tsx`      | Card da Home (progresso ou CTA) + modal de edicao   |
| `apps/mobile/src/features/goals/components/prolabore-goal-form.tsx` | Formulario de definir/editar/remover meta           |

## Components

### `ProlaboreCard`

- **Props:** nenhuma. Usa `useProlaboreStatus`.
- Sem meta: card CTA "Definir meta de pro-labore".
- Com meta: faturamento atual vs necessário, barra de progresso (flex), mensagem de incentivo. Tap abre o modal de edição.
- Retorna `null` enquanto carrega (mantém a Home limpa).

### `ProlaboreGoalForm`

- **Props:** `{ config: ProlaboreGoal | null; onSuccess?: () => void }`
- Campos: "Quanto você quer ganhar por mês?" (obrigatório, > 0), custos fixos (opcional), preço médio por venda (opcional).
- Botão Salvar (upsert) e, quando há meta, Remover (com confirmação).

## Hooks

| Hook                       | Tipo          | Descricao                                                       |
| -------------------------- | ------------- | --------------------------------------------------------------- |
| `useProlaboreStatus()`     | `useQuery`    | Config + progresso do mês. Query key: `["goals", "prolabore"]`. |
| `useUpsertProlaboreGoal()` | `useMutation` | Cria/atualiza a meta. Invalida `["goals"]`.                     |
| `useDeleteProlaboreGoal()` | `useMutation` | Remove a meta. Invalida `["goals"]`.                            |

## API Integration

| Endpoint                  | Verbo  | Funcao                 | Parametros                  |
| ------------------------- | ------ | ---------------------- | --------------------------- |
| `/api/v1/goals/prolabore` | GET    | `fetchProlaboreStatus` | -                           |
| `/api/v1/goals/prolabore` | PUT    | `upsertProlaboreGoal`  | body: `UpsertProlaboreGoal` |
| `/api/v1/goals/prolabore` | DELETE | `deleteProlaboreGoal`  | -                           |

## Contracts

- `ProlaboreStatus` — `{ config: ProlaboreGoal | null, progress: ProlaboreProgress }`.
- `ProlaboreGoal` — `{ id, userId, monthlyProlaboreGoal, estimatedMonthlyCosts, avgTicketOverride, updatedAt }`.
- `ProlaboreProgress` — `{ requiredRevenue, currentRevenue, remainingRevenue, progressPct, salesNeeded, salesRemaining, avgTicket, reached, period }`.
- `UpsertProlaboreGoal` — `{ monthlyProlaboreGoal, estimatedMonthlyCosts?, avgTicketOverride? }`.

## Error Handling

- **Erro ao salvar:** `Alert.alert("Erro", "Nao foi possivel salvar sua meta. Tente novamente.")`.
- **Erro ao remover:** Alert genérico.
- **Validação local:** meta > 0 (mensagem amigável); custos/ticket vazios viram `undefined`.

## Performance

- Uma única query (`useProlaboreStatus`) alimenta card e formulário.
- O backend compõe finance/sales/products em paralelo; o mobile só projeta.

## Test matrix

- [ ] `formatCurrency` formata com vírgula
- [ ] `prolaboreMessage`: meta batida, vendas restantes (plural/singular), fallback por valor
- [ ] `ProlaboreCard` renderiza CTA sem meta e progresso com meta
- [ ] `ProlaboreGoalForm` valida meta > 0

## Examples

- Home → card "Meta do mês" → tap abre formulário → salvar.
- Configurações → card "Meta de pro-labore" → Definir/Editar.

## Change log / Decisions

- Criação inicial: card na Home + formulário (Home e Configurações).
- Barra de progresso usa `flex` (evita `width` em %, mais simples de tipar).
- Feature grátis na v1 (sem paywall), conforme decisão de produto.
