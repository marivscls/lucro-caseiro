# ai.context.mobile.md — Orders (Agenda / Encomendas)

---

## Purpose

Agenda do negócio: encomendas/compromissos com **data de entrega** e **status**, em visões
Atrasadas / Hoje / Amanhã / Esta semana / Próximas, com lembrete e opção de registrar a
receita ao entregar.

## Non-goals

- Não é calendário mensal/grade horária.
- v1 sem itens de produto e sem seleção de cliente no formulário (só projeta `clientName`).
- Não dá baixa de estoque/insumos.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (Order, CreateOrder, UpdateOrder, DeliverOrder, OrderStatus), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`, `shared/hooks/notification-types`.
- **Dependentes:** `app/agenda` (tela), `app/tabs/index` (card + quick-access), `app/tabs/more` (entrada), `app/_layout` (monta `useDeliveryNotifier`).

## Code pointers

| Arquivo                                                     | Descricao                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/mobile/src/features/orders/api.ts`                    | Funcoes HTTP (fetch/create/update/deliver/delete)                                  |
| `apps/mobile/src/features/orders/hooks.ts`                  | React Query hooks                                                                  |
| `apps/mobile/src/features/orders/types.ts`                  | Re-export dos tipos de contracts                                                   |
| `apps/mobile/src/features/orders/domain.ts`                 | Agrupar por data, rótulos/tons de status, formatação                               |
| `apps/mobile/src/features/orders/domain.test.ts`            | Testes de agrupamento/contagem/formatação                                          |
| `apps/mobile/src/features/orders/components/order-card.tsx` | Card de encomenda (status pill, data, valor)                                       |
| `apps/mobile/src/features/orders/components/order-form.tsx` | Formulario criar/editar                                                            |
| `apps/mobile/src/features/orders/use-delivery-notifier.ts`  | Notificacao local de entregas proximas (1x/dia) + sync dos lembretes por encomenda |
| `apps/mobile/src/features/orders/reminders.ts`              | Agenda/cancela lembrete local por encomenda (vespera 9h)                           |
| `apps/mobile/src/app/agenda.tsx`                            | Tela `/agenda` (lista agrupada + detalhe/edicao)                                   |

## Components

### `OrderCard`

- **Props:** `{ order: Order; onPress?: () => void }`
- Mostra título, cliente (se houver), data/hora, valor e pill de status (cor por tom).

### `OrderForm`

- **Props:** `{ order?: Order | null; onSuccess?: () => void }`
- Cria ou edita. Campos: o que é (título), data (chips Hoje/Amanhã + DD/MM/AAAA), horário, valor, observações.

### `OrderDetail` (definido na tela `agenda.tsx`)

- Detalhe com troca rápida de status (a fazer/produzindo/pronto), "Marcar como entregue"
  (pergunta se registra receita), Editar e Excluir.

### `OrdersSummaryHeader` (definido na tela `agenda.tsx`)

- Card no topo da lista: "Total dos pedidos: R$ X" + linha "A receber: R$ Y · Recebido: R$ Z".
- Usa `useOrdersSummary()`; oculto quando não há pedidos (`totalOrders === 0`).

## Hooks

| Hook                      | Tipo          | Descricao                                                                             |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `useOrders(opts?)`        | `useQuery`    | Lista de encomendas. Query key: `["orders", opts]`.                                   |
| `useOrdersSummary(opts?)` | `useQuery`    | Resumo agregado (total/a receber/recebido). Query key: `["orders", "summary", opts]`. |
| `useCreateOrder()`        | `useMutation` | Cria. Invalida `["orders"]`.                                                          |
| `useUpdateOrder()`        | `useMutation` | Atualiza (inclui status). Invalida `["orders"]`.                                      |
| `useDeliverOrder()`       | `useMutation` | Entrega (opcional receita). Invalida `["orders"]` e `["finance"]`.                    |
| `useDeleteOrder()`        | `useMutation` | Remove. Invalida `["orders"]`.                                                        |

## API Integration

| Endpoint                     | Verbo  | Funcao               | Parametros                     |
| ---------------------------- | ------ | -------------------- | ------------------------------ |
| `/api/v1/orders`             | GET    | `fetchOrders`        | `?status=&from=&to=`           |
| `/api/v1/orders/summary`     | GET    | `fetchOrdersSummary` | `?status=&startDate=&endDate=` |
| `/api/v1/orders`             | POST   | `createOrder`        | body: `CreateOrder`            |
| `/api/v1/orders/:id`         | PATCH  | `updateOrder`        | body: `UpdateOrder`            |
| `/api/v1/orders/:id/deliver` | POST   | `deliverOrder`       | body: `DeliverOrder`           |
| `/api/v1/orders/:id`         | DELETE | `deleteOrder`        | -                              |

## Contracts

- `Order` — `{ id, userId, clientId, clientName, title, deliveryDate, deliveryTime, status, amount, notes, saleId, createdAt }`.
- `CreateOrder` / `UpdateOrder` — payloads de criação/edição.
- `DeliverOrder` — `{ registerIncome, paymentMethod? }`.
- `OrderStatus` — `"pending"|"in_production"|"ready"|"done"|"cancelled"`.
- `OrdersSummary` — `{ totalOrders, totalAmount, pending: { count, amount }, delivered: { count, amount } }`.

## Error Handling

- **Erro ao salvar:** `Alert.alert("Erro", "Não foi possível salvar a encomenda. Tente novamente.")`.
- **Validação local:** título obrigatório, data DD/MM/AAAA válida, horário HH:MM.

## Performance

- `useOrders` traz tudo e o agrupamento é client-side (`groupOrders`).
- `useDeliveryNotifier` notifica no máximo 1x/dia (dedupe via AsyncStorage `deliveryNotifiedDate`) e sincroniza os lembretes agendados por encomenda.
- Lembrete agendado por encomenda (`reminders.ts`): notificação local na véspera às 9h via `expo-notifications` (trigger DATE). Agenda no criar/editar, cancela no entregar/excluir e em status finalizado. Mapa `orderId -> notificationId` em AsyncStorage (`orderReminderIds`). Não agenda para datas passadas. Chega mesmo com o app fechado.

## Test matrix

- [ ] `groupOrders` separa atrasadas/hoje/amanhã/semana/próximas/finalizadas
- [ ] `upcomingCount` conta ativas hoje/amanhã/atrasadas
- [ ] `formatDateBR` formata DD/MM/AAAA
- [ ] `OrderForm` valida título e data
- [ ] Fluxo de status e "entregar" (com/sem receita)

## Examples

- Home → quick-access "Agenda" ou card "Agenda" → tela `/agenda`.
- FAB "Nova encomenda" → form → salvar. Tap no card → detalhe → status / entregar / editar.

## Change log / Decisions

- Criação inicial: agenda de encomendas/entregas unificada.
- v1 sem itens de produto nem seleção de cliente no form (só título+data+valor).
- "Entregar" pode registrar a receita no financeiro (back cria lançamento income/sale).
- Notificação local de entregas próximas (tipo `DELIVERY` → roteia `/agenda`).
- 2026-05-30: lembrete agendado por encomenda (véspera 9h) via `reminders.ts`, complementar ao resumo diário. Chega com o app fechado; ligado ao ciclo de vida nos hooks + sync em `useDeliveryNotifier`.
- 2026-05-30: resumo de valores (P2 #13) — `useOrdersSummary` + `fetchOrdersSummary` (`GET /summary`) e header `OrdersSummaryHeader` no topo da agenda ("Total dos pedidos" + a receber/recebido). Query key `["orders","summary",opts]` é invalidada automaticamente pelas mutações existentes (criar/entregar/excluir) por prefixo, já que todas invalidam `["orders"]`.
- 2026-06-10: formulário ganhou "Sinal recebido" (validação local sinal ≤ valor) e
  FormSection "Personalização" (tema/homenageado/cores). Card mostra "Falta R$X";
  detalhe na agenda mostra faixa de sinal e bloco de personalização.
- 2026-06-10: campo de data de entrega ganhou seletor nativo de data (icone de calendario abre @react-native-community/datetimepicker); digitacao mascarada continua valendo. Conversao de orcamento em quotes.tsx usa o DateField compartilhado.
- 2026-06-17: campo "Horario (opcional)" agora aplica mascara progressiva `maskTimeBR` ("1430" -> "14:30") e valida 24h via `isValidTimeBR` (00:00–23:59) — antes aceitava qualquer `\d{2}:\d{2}`. Removido o chevron sem acao do campo.
- 2026-06-17: fix `useUpdateOrder.onMutate` — o `getQueriesData({ queryKey: ["orders"] })` casa por prefixo tambem com `["orders","summary"]` (objeto, nao array); ao editar uma encomenda isso quebrava com `orders.map is not a function`. Agora pula caches que nao sao array (`Array.isArray`).
