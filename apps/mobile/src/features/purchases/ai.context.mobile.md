# ai.context.mobile.md — Purchases (Compras / Contas a pagar)

---

## Purpose

Registrar compras de fornecedores como **contas a pagar** e **saídas do caixa**: listar (filtro Todas/A pagar/Pagas), ver o total a pagar, criar e editar uma compra, marcar uma conta como paga (gera a saída no caixa) e excluir.

## Non-goals

- Não cadastra fornecedores (feature `suppliers`).
- Não edita o livro-caixa diretamente (feature `finance`).
- Não implementa pedidos de compra, recebimentos parciais ou múltiplos depósitos.

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Purchase`, `CreatePurchase`, `PurchasePaymentStatus`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`, `shared/utils/currency-input`, `shared/utils/date`, `features/suppliers` (`SupplierSelector`, `useSupplierName`).
- **Dependentes:** `tabs/more` (item "Compras" → `/purchases`).

## Code pointers

| Arquivo                                                                  | Descrição                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `apps/mobile/src/features/purchases/api.ts`                              | HTTP (fetch, create, update, pay, delete)                    |
| `apps/mobile/src/features/purchases/hooks.ts`                            | React Query hooks                                            |
| `apps/mobile/src/features/purchases/domain.ts`                           | categorias, total pendente e ordenação por status (+ testes) |
| `apps/mobile/src/features/purchases/components/create-purchase-form.tsx` | Formulário de criação                                        |
| `apps/mobile/src/features/purchases/components/purchase-card.tsx`        | Card (info + "marcar paga" + excluir)                        |
| `apps/mobile/src/app/purchases.tsx`                                      | Screen (rota `/purchases`)                                   |

## Components

### `CreatePurchaseForm`

- **Props:** `{ visible, onClose, purchase?, onSuccess? }`; `purchase` ativa o modo edição.
- Na marca com `comprasComEstoque`, alterna entre **Entrada de estoque** e **Somente despesa**.
- Entrada de estoque seleciona produtos, variação, quantidade e custo unitário; o total é calculado e o backend repõe o estoque.
- Somente despesa preserva fornecedor, descrição, valor, categoria, data e pagamento.

### `PurchaseCard`

- **Props:** `{ purchase: Purchase; onPay: () => void; onDelete: () => void; isPaying?: boolean }`
- Mostra descrição, fornecedor (via `useSupplierName`), categoria, data, valor e badge (A pagar / Pago). Botão "Marcar como paga" quando pendente; ações de editar e excluir.

## Hooks

| Hook                  | Tipo          | Descrição                                                             |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `usePurchases(opts?)` | `useQuery`    | Lista (filtro `status`). Query key: `["purchases", opts]`             |
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

- **Listagem:** `EmptyState` genérico.
- **Criar/pagar/excluir:** `alertError` com mensagem.
- **Validação local:** descrição obrigatória, valor > 0, data válida (DD/MM/AAAA).

## Performance

- Lista via React Query (cache por query key). O total a pagar usa uma query separada `status: "pending"` (1ª página) para ficar visível em qualquer filtro.
- Pagar/criar-paga invalidam `["finance"]` para o dashboard financeiro refletir a saída.

## Test matrix

- [x] `categoryLabel` mapeia categorias / fallback Outro (domain.test)
- [x] `pendingTotal` soma só as pendentes (domain.test)
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
