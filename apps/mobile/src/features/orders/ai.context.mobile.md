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

| Arquivo                                                     | Descricao                                            |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `apps/mobile/src/features/orders/api.ts`                    | Funcoes HTTP (fetch/create/update/deliver/delete)    |
| `apps/mobile/src/features/orders/hooks.ts`                  | React Query hooks                                    |
| `apps/mobile/src/features/orders/types.ts`                  | Re-export dos tipos de contracts                     |
| `apps/mobile/src/features/orders/domain.ts`                 | Agrupar por data, rótulos/tons de status, formatação |
| `apps/mobile/src/features/orders/domain.test.ts`            | Testes de agrupamento/contagem/formatação            |
| `apps/mobile/src/features/orders/components/order-card.tsx` | Card de encomenda (status pill, data, valor)         |
| `apps/mobile/src/features/orders/components/order-form.tsx` | Formulario criar/editar                              |
| `apps/mobile/src/features/orders/use-delivery-notifier.ts`  | Notificacao local de entregas proximas (1x/dia)      |
| `apps/mobile/src/app/agenda.tsx`                            | Tela `/agenda` (lista agrupada + detalhe/edicao)     |

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

## Hooks

| Hook                | Tipo          | Descricao                                                          |
| ------------------- | ------------- | ------------------------------------------------------------------ |
| `useOrders(opts?)`  | `useQuery`    | Lista de encomendas. Query key: `["orders", opts]`.                |
| `useCreateOrder()`  | `useMutation` | Cria. Invalida `["orders"]`.                                       |
| `useUpdateOrder()`  | `useMutation` | Atualiza (inclui status). Invalida `["orders"]`.                   |
| `useDeliverOrder()` | `useMutation` | Entrega (opcional receita). Invalida `["orders"]` e `["finance"]`. |
| `useDeleteOrder()`  | `useMutation` | Remove. Invalida `["orders"]`.                                     |

## API Integration

| Endpoint                     | Verbo  | Funcao         | Parametros           |
| ---------------------------- | ------ | -------------- | -------------------- |
| `/api/v1/orders`             | GET    | `fetchOrders`  | `?status=&from=&to=` |
| `/api/v1/orders`             | POST   | `createOrder`  | body: `CreateOrder`  |
| `/api/v1/orders/:id`         | PATCH  | `updateOrder`  | body: `UpdateOrder`  |
| `/api/v1/orders/:id/deliver` | POST   | `deliverOrder` | body: `DeliverOrder` |
| `/api/v1/orders/:id`         | DELETE | `deleteOrder`  | -                    |

## Contracts

- `Order` — `{ id, userId, clientId, clientName, title, deliveryDate, deliveryTime, status, amount, notes, saleId, createdAt }`.
- `CreateOrder` / `UpdateOrder` — payloads de criação/edição.
- `DeliverOrder` — `{ registerIncome, paymentMethod? }`.
- `OrderStatus` — `"pending"|"in_production"|"ready"|"done"|"cancelled"`.

## Error Handling

- **Erro ao salvar:** `Alert.alert("Erro", "Não foi possível salvar a encomenda. Tente novamente.")`.
- **Validação local:** título obrigatório, data DD/MM/AAAA válida, horário HH:MM.

## Performance

- `useOrders` traz tudo e o agrupamento é client-side (`groupOrders`).
- `useDeliveryNotifier` notifica no máximo 1x/dia (dedupe via AsyncStorage `deliveryNotifiedDate`).

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
