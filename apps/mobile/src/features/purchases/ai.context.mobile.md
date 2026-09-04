# ai.context.mobile.md — Purchases (Compras / Contas a pagar)

---

## Purpose

Registrar compras de fornecedores como **contas a pagar** e **saídas do caixa**: listar (filtro Todas/A pagar/Pagas), ver o total a pagar, criar e editar uma compra, marcar uma conta como paga (gera a saída no caixa) e excluir.

## Non-goals

- Não cadastra fornecedores (feature `suppliers`).
- Não edita o livro-caixa diretamente (feature `finance`).
- Não implementa pedidos de compra, recebimentos parciais ou múltiplos depósitos.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Purchase`, `CreatePurchase`, `PurchasePaymentStatus`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`, `shared/utils/currency-input`, `shared/utils/date`, `features/suppliers` (`SupplierSelector`, `useSupplierName`), `features/products/display` (nome visível sem prefixo técnico).
- **Dependentes:** `tabs/more` (item "Compras" → `/purchases`).

## Code pointers

| Arquivo                                                                  | Descrição                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `apps/mobile/src/features/purchases/api.ts`                              | HTTP (fetch, create, update, pay, delete)                           |
| `apps/mobile/src/features/purchases/hooks.ts`                            | React Query hooks                                                   |
| `apps/mobile/src/features/purchases/domain.ts`                           | categorias, total pendente, contadores, ordenação e resumo de itens |
| `apps/mobile/src/features/purchases/components/create-purchase-form.tsx` | Formulário de criação                                               |
| `apps/mobile/src/features/purchases/components/purchase-card.tsx`        | Card (info + "marcar paga" + editar + excluir)                      |
| `apps/mobile/src/app/purchases.tsx`                                      | Screen (rota `/purchases`)                                          |
| `apps/mobile/src/assets/compras-hero-3d.png`                             | PNG 3D do card "Total a pagar"                                      |

## Components

### `CreatePurchaseForm`

- **Props:** `{ visible, onClose, purchase?, onSuccess? }`; `purchase` ativa o modo edição.
- Na marca com `comprasComEstoque`, alterna entre **Entrada de estoque** e **Somente despesa**.
- Entrada de estoque seleciona produtos, variação, quantidade e custo unitário; o total é calculado e o backend repõe o estoque.
- Somente despesa preserva fornecedor, descrição, valor, categoria, data e pagamento.

### `PurchaseCard`

- **Props:** `{ purchase: Purchase; onPay: () => void; onEdit: () => void; onDelete: () => void; isPaying?: boolean; payDisabled?: boolean; isDeleting?: boolean; deleteDisabled?: boolean; editDisabled?: boolean }`
- Mostra descrição, fornecedor (via `useSupplierName`), categoria, data, valor e chip (A pagar / Pago). Nomes de itens usam `displayProductName` (sem prefixos como `[massa]`). Botão "Marcar como paga" quando pendente; ícones de editar e excluir.

## Hooks

| Hook                  | Tipo          | Descrição                                                             |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `usePurchases(opts?)` | `useQuery`    | Lista (`status`, `page`, `limit`). Query key: `["purchases", opts]`   |
| `useCreatePurchase()` | `useMutation` | Cria. Invalida `["purchases"]` e `["finance"]` (compra paga = caixa). |
| `useUpdatePurchase()` | `useMutation` | Edita e invalida compras, financeiro e produtos/estoque.              |
| `usePayPurchase()`    | `useMutation` | Marca paga. Invalida `["purchases"]` e `["finance"]`.                 |
| `useDeletePurchase()` | `useMutation` | Remove. Invalida `["purchases"]`.                                     |

## API Integration

| Endpoint                    | Verbo  | Função           | Parâmetros               |
| --------------------------- | ------ | ---------------- | ------------------------ |
| `/api/v1/purchases`         | GET    | `fetchPurchases` | `?page=N&status=pending` |
| `/api/v1/purchases`         | POST   | `createPurchase` | body: `CreatePurchase`   |
| `/api/v1/purchases/:id`     | PATCH  | `updatePurchase` | body: `UpdatePurchase`   |
| `/api/v1/purchases/:id/pay` | POST   | `payPurchase`    | -                        |
| `/api/v1/purchases/:id`     | DELETE | `deletePurchase` | -                        |

## Contracts

- `Purchase` — compra com os campos financeiros e `items[]` quando houve recebimento.
- `CreatePurchase` — payload aceita `amount` para despesa ou `items` para mercadoria.
- `PurchasePaymentStatus` — `"pending" | "paid"`.

## Error Handling

- **Listagem:** `EmptyState` com retry; vazio e filtro sem resultados são estados distintos.
- **Criar/pagar/excluir:** `alertError` com mensagem. Exclusão pede confirmação. Pagamento e exclusão travam o card em andamento.
- **Validação local:** descrição obrigatória, valor > 0, data válida (DD/MM/AAAA).

## Performance

- A tela busca até 100 compras (`limit: 100`) e filtra/ordena localmente. A ordem é mais recente primeiro; em "Todas", pendentes continuam no topo. Total e contadores usam a mesma lista, sem recarregar ao trocar o filtro.
- Pagar/criar-paga invalidam `["finance"]` para o dashboard financeiro refletir a saída.

## Test matrix

- [x] `categoryLabel` mapeia categorias / fallback Outro (domain.test)
- [x] `pendingTotal` soma só as pendentes (domain.test)
- [x] `pendingCountLabel` singular/plural (domain.test)
- [x] `purchaseFilterCounts` e `sortPurchasesMostRecentFirst` (domain.test)
- [x] `formatPurchaseItemsLine` omite prefixos técnicos via mapper (domain.test)
- [ ] `CreatePurchaseForm` valida descrição/valor/data
- [ ] marcar como paga move o card de "A pagar" para "Pago"

## Examples

- Acessado via aba "Mais" → "Compras".
- Rota: `/purchases`.

## Change log / Decisions

- Criação inicial (Fase 3 de Fornecedores): compras → contas a pagar + saídas do caixa.
  `pending` = conta a pagar (não toca o caixa); "marcar paga" cria a despesa em `finance`
  (espelha o fiado das vendas). Total a pagar no topo. O modo de despesa sem itens foi
  preservado para marcas sem recebimento de estoque e para lançamentos operacionais.
- 2026-07-19: Papelaria ganhou entrada de estoque com produto/variação, quantidade, custo,
  total calculado e invalidação imediata das queries de produtos/estoque baixo.
- 2026-07-19: cards ganharam ação **Editar** e o formulário passou a reutilizar os dados da
  compra. Compras pagas sincronizam valor/descrição/categoria com o caixa; alterações de itens
  ajustam somente a diferença de estoque e são recusadas se tentarem remover estoque já vendido.
- 2026-08-20: tela editorial (card vinho + PNG 3D `compras-hero-3d.png`, filtros com
  contagem, CTA inferior fixo). Lista carrega até 100 itens e filtra localmente; nomes de
  produto omitem prefixos técnicos só na UI.
- 2026-08-24: refinamento responsivo da tela editorial: filtros limitados a chips de 44 px,
  ordenação identificada por chevron para baixo, estado vazio com altura natural e CTA próprio.
  O CTA inferior fica visível somente quando existem compras; cards preservam todas as ações.
- 2026-08-31: o CTA `Adicionar compra` passou a `ScreenCreateBar` (`+ Adicionar compra`)
  no fluxo, sem `insets.bottom` — o Stack já reserva a tab bar.
