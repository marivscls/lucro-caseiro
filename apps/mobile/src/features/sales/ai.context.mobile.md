# ai.context.mobile.md — Sales (Mobile Feature)

---

## Purpose

Registrar e gerenciar vendas: criar vendas via wizard de 4 passos (selecionar produtos, cliente, pagamento, revisar), listar vendas com filtro por status, visualizar detalhes e atualizar status (marcar como pago, cancelar). Exibe resumo do dia na Home.

## Non-goals

- Nao gerencia produtos (feature `products`).
- Nao gerencia clientes (feature `clients`).
- Nao calcula precificacao (feature `pricing`).
- Nao gera relatorios financeiros (feature `finance`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Sale`, `CreateSale`, `UpdateSaleStatus`, `SaleStatus`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/utils/api-client`.
- **Depende de (cross-feature):** `features/products/hooks` (`useProducts` para selecao de produtos no wizard), `features/clients/hooks` (`useClients` para selecao de cliente).
- **Dependentes:** `features/clients` (`useSales` usado no ClientDetail para historico), `tabs/index` (Home usa `useTodaySummary`).

## Code pointers

| Arquivo                                                     | Descricao                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/sales/api.ts`                     | Funcoes HTTP (fetchSales, fetchSale, fetchTodaySummary, createSale, updateSaleStatus) |
| `apps/mobile/src/features/sales/hooks.ts`                   | React Query hooks                                                                     |
| `apps/mobile/src/features/sales/components/sale-card.tsx`   | Card de venda na listagem                                                             |
| `apps/mobile/src/features/sales/components/sale-detail.tsx` | Detalhe da venda com acoes de status                                                  |
| `apps/mobile/src/app/tabs/new-sale.tsx`                     | Screen do wizard de nova venda (tab)                                                  |

## Components

### `SaleCard`

- **Props:** `{ sale: Sale; onPress?: () => void }`
- Exibe dot de status colorido, nome do primeiro produto (+N), itens resumidos, valor total, Badge de status (Pago/Pendente/Cancelado) e forma de pagamento.

### `SaleDetail`

- **Props:** `{ sale: Sale; onStatusUpdated?: () => void }`
- Exibe status com Badge, dados do cliente, forma de pagamento, data formatada, observacoes.
- Lista de itens com quantidade x preco unitario e subtotal.
- Card de total com fundo verde.
- Botao "Marcar como pago" (se pending) e "Cancelar venda" (se nao cancelled), ambos com confirmacao Alert.

### `NewSaleScreen` (tela/wizard, definido no screen)

- Wizard de 4 steps:
  1. **Selecionar produtos:** grid 2 colunas com busca, tap para adicionar ao carrinho, long press para remover. Badge de quantidade. Barra de total no rodape.
  2. **Selecionar cliente:** opcao "Sem cliente (avulso)", busca de clientes, selecao com borda destacada.
  3. **Forma de pagamento:** opcoes Pix, Dinheiro, Cartao, Fiado, Transferencia com icones.
  4. **Revisar e confirmar:** resumo de itens, cliente, pagamento, total. Botao "Registrar venda".
- Progress dots no topo.
- Checa limite freemium via `useLimitCheck("sales")` antes de submeter.
- Modal inline para criar produto caso nao exista nenhum.

## Hooks

| Hook                    | Tipo          | Descricao                                                                                                                     |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `useSales(opts?)`       | `useQuery`    | Lista paginada. Query key: `["sales", opts]`                                                                                  |
| `useSale(id)`           | `useQuery`    | Detalhe. Query key: `["sales", id]`                                                                                           |
| `useTodaySummary()`     | `useQuery`    | Resumo do dia (totalSales, totalAmount, averageTicket). `refetchInterval: 60_000`. Query key: `["sales", "summary", "today"]` |
| `useCreateSale()`       | `useMutation` | Cria venda. Invalida `["sales"]`.                                                                                             |
| `useUpdateSaleStatus()` | `useMutation` | Atualiza status. Invalida `["sales"]`.                                                                                        |

## API Integration

| Endpoint                      | Verbo | Funcao              | Parametros                        |
| ----------------------------- | ----- | ------------------- | --------------------------------- |
| `/api/v1/sales`               | GET   | `fetchSales`        | `?page=N&status=paid&clientId=ID` |
| `/api/v1/sales/:id`           | GET   | `fetchSale`         | path param `id`                   |
| `/api/v1/sales/summary/today` | GET   | `fetchTodaySummary` | -                                 |
| `/api/v1/sales`               | POST  | `createSale`        | body: `CreateSale`                |
| `/api/v1/sales/:id/status`    | PATCH | `updateSaleStatus`  | body: `UpdateSaleStatus`          |

## Contracts

- `Sale` — venda (id, clientId, clientName, paymentMethod, status, total, soldAt, notes, items[]).
- `Sale.items[]` — item da venda (id, productId, productName, quantity, unitPrice, subtotal).
- `CreateSale` — payload (clientId?, paymentMethod, items[{ productId, quantity, unitPrice }]).
- `UpdateSaleStatus` — payload ({ status: SaleStatus }).
- `SaleStatus` — `"paid" | "pending" | "cancelled"`.
- `DaySummary` — tipo local (totalSales, totalAmount, averageTicket).

## Error Handling

- **Erro de criacao:** `Alert.alert("Erro", "Nao foi possivel registrar a venda. Tente novamente.")`.
- **Erro de status:** `Alert.alert("Erro", "Nao foi possivel atualizar/cancelar o status.")`.
- **Validacao local:** carrinho nao vazio, forma de pagamento selecionado.
- **Limite freemium:** `useLimitCheck("sales")` bloqueia criacao e mostra paywall.

## Performance

- `useTodaySummary` com `refetchInterval: 60_000` (atualiza a cada 1 minuto na Home).
- Grid de produtos usa `FlatList` com `numColumns={2}`.
- Busca de produtos filtrada localmente (client-side filter).
- Busca de clientes usa query param `search` (server-side).

## Test matrix

- [ ] Wizard navega entre 4 steps corretamente
- [ ] Adicionar/remover produto do carrinho
- [ ] Total do carrinho calculado corretamente
- [ ] `useCreateSale` envia payload com items
- [ ] `useUpdateSaleStatus` muda status
- [ ] `useTodaySummary` refetch a cada 60s
- [ ] Limite freemium bloqueia criacao
- [ ] Venda sem cliente (avulso) funciona

## Examples

- Nova venda acessada via tab "Nova Venda" ou botao "Venda" na Home.
- Rota: `/tabs/new-sale`.
- Fluxo: step 1 (produtos) -> 2 (cliente) -> 3 (pagamento) -> 4 (revisar) -> registrar.

## Change log / Decisions

- Wizard de 4 steps segue principio de "maximo 3 toques para acao principal" (cada step e 1 toque).
- Status da venda: paid (default se nao fiado), pending (se fiado), cancelled.
- Formas de pagamento: pix, cash, card, credit, transfer.
- Resumo do dia usa auto-refresh para manter Home atualizada.
