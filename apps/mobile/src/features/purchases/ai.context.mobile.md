# ai.context.mobile.md — Purchases (Compras / Contas a pagar)

---

## Purpose

Registrar compras de fornecedores como **contas a pagar** e **saídas do caixa**: listar (filtro Todas/A pagar/Pagas), ver o total a pagar, criar uma compra (a pagar ou já paga), marcar uma conta como paga (gera a saída no caixa) e excluir.

## Non-goals

- Não cadastra fornecedores (feature `suppliers`).
- Não edita o livro-caixa diretamente (feature `finance`).
- Não registra itens de linha nem dá baixa de estoque (evolução futura).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Purchase`, `CreatePurchase`, `PurchasePaymentStatus`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`, `shared/utils/currency-input`, `shared/utils/date`, `features/suppliers` (`SupplierSelector`, `useSupplierName`).
- **Dependentes:** `tabs/more` (item "Compras" → `/purchases`).

## Code pointers

| Arquivo                                                                  | Descrição                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `apps/mobile/src/features/purchases/api.ts`                              | HTTP (fetch, create, pay, delete)                            |
| `apps/mobile/src/features/purchases/hooks.ts`                            | React Query hooks                                            |
| `apps/mobile/src/features/purchases/domain.ts`                           | categorias, total pendente e ordenação por status (+ testes) |
| `apps/mobile/src/features/purchases/components/create-purchase-form.tsx` | Formulário de criação                                        |
| `apps/mobile/src/features/purchases/components/purchase-card.tsx`        | Card (info + "marcar paga" + excluir)                        |
| `apps/mobile/src/app/purchases.tsx`                                      | Screen (rota `/purchases`)                                   |

## Components

### `CreatePurchaseForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: fornecedor (opcional, via `SupplierSelector`), descrição, valor, categoria (chips), data da compra (default hoje), pagamento (chips "A pagar" / "Já paguei"). "Já paguei" envia `paymentStatus: "paid"` → vira saída no caixa na hora.

### `PurchaseCard`

- **Props:** `{ purchase: Purchase; onPay: () => void; onDelete: () => void; isPaying?: boolean }`
- Mostra descrição, fornecedor (via `useSupplierName`), categoria, data, valor e badge (A pagar / Pago). Botão "Marcar como paga" quando pendente; ícone de excluir.

## Hooks

| Hook                  | Tipo          | Descrição                                                             |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `usePurchases(opts?)` | `useQuery`    | Lista (filtro `status`). Query key: `["purchases", opts]`             |
| `useCreatePurchase()` | `useMutation` | Cria. Invalida `["purchases"]` e `["finance"]` (compra paga = caixa). |
| `usePayPurchase()`    | `useMutation` | Marca paga. Invalida `["purchases"]` e `["finance"]`.                 |
| `useDeletePurchase()` | `useMutation` | Remove. Invalida `["purchases"]`.                                     |

## API Integration

| Endpoint                    | Verbo  | Função           | Parâmetros               |
| --------------------------- | ------ | ---------------- | ------------------------ |
| `/api/v1/purchases`         | GET    | `fetchPurchases` | `?page=N&status=pending` |
| `/api/v1/purchases`         | POST   | `createPurchase` | body: `CreatePurchase`   |
| `/api/v1/purchases/:id/pay` | POST   | `payPurchase`    | -                        |
| `/api/v1/purchases/:id`     | DELETE | `deletePurchase` | -                        |

## Contracts

- `Purchase` — compra (id, userId, supplierId, description, amount, category, paymentStatus, purchasedAt, dueDate, paidAt, financeEntryId, createdAt).
- `CreatePurchase` — payload (supplierId?, description, amount, category?, paymentStatus?, purchasedAt, dueDate?).
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
  (espelha o fiado das vendas). Total a pagar no topo. Sem itens de linha/estoque (evolução).
