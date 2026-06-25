# ai.context.mobile.md — Suppliers (Mobile Feature)

---

## Purpose

Cadastro de fornecedores do usuario: listar, buscar, criar, editar e excluir fornecedores (de quem a pessoa compra insumos e embalagens). Guarda nome, telefone/WhatsApp, email, endereco e observacoes.

## Non-goals

- Nao registra compras nem contas a pagar (feature `purchases`, fase futura).
- Nao cria lancamento financeiro (feature `finance`).
- Nao gerencia assinaturas (feature `subscription`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Supplier`, `CreateSupplier`, `UpdateSupplier`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/hooks/use-paywall`, `shared/utils/api-client`, `shared/utils/phone`, `shared/utils/whatsapp`, `shared/utils/alerts`.
- **Dependentes:** `tabs/more` (item de menu "Fornecedores" → `/suppliers`). Materials/Packaging poderao usar um seletor de fornecedor (fase futura).

## Code pointers

| Arquivo                                                                  | Descricao                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------- |
| `apps/mobile/src/features/suppliers/api.ts`                              | Funcoes HTTP (fetch, create, update, delete)       |
| `apps/mobile/src/features/suppliers/hooks.ts`                            | React Query hooks                                  |
| `apps/mobile/src/features/suppliers/components/supplier-list.tsx`        | Lista (FlatList) com estados de loading/erro/vazio |
| `apps/mobile/src/features/suppliers/components/supplier-card.tsx`        | Card individual (nome + contato)                   |
| `apps/mobile/src/features/suppliers/components/create-supplier-form.tsx` | Formulario de criacao (com gate freemium)          |
| `apps/mobile/src/features/suppliers/components/edit-supplier-form.tsx`   | Formulario de edicao                               |
| `apps/mobile/src/features/suppliers/components/supplier-detail.tsx`      | Detalhe (contato, acoes WhatsApp/editar)           |
| `apps/mobile/src/app/suppliers.tsx`                                      | Screen (rota `/suppliers`)                         |

## Components

### `SupplierList`

- **Props:** `{ search?: string; onSupplierPress?: (id: string) => void; onAddPress?: () => void }`
- FlatList de fornecedores com `RefreshControl`. Estados de loading, erro e `EmptyState` quando vazio.

### `SupplierCard`

- **Props:** `{ supplier: Supplier; onPress?: () => void }`
- Card com avatar (icone), nome e contato (telefone ou email).

### `CreateSupplierForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), telefone/WhatsApp, email, endereco, observacoes. Gate freemium via `useLimitCheck("suppliers")`.

### `EditSupplierForm`

- **Props:** `{ supplier: Supplier; onSuccess?: () => void }`
- Mesmos campos do create, pre-preenchidos.

### `SupplierDetail`

- **Props:** `{ supplierId: string; onEditPress?: () => void }`
- Mostra contato e acoes (Editar, WhatsApp quando ha telefone).

### `SupplierSelector`

- **Props:** `{ value: string | null; onChange: (supplierId: string | null) => void }`
- Campo reutilizavel (bottom-sheet com busca + "Nenhum" + "Cadastrar novo") usado nos forms de
  insumo (`materials`) e embalagem (`packaging`) para vincular um fornecedor cadastrado. Auto-seleciona
  o fornecedor criado na hora. Helper `useSupplierName(id)` resolve o nome a partir do cache.

## Hooks

| Hook                  | Tipo          | Descricao                                                     |
| --------------------- | ------------- | ------------------------------------------------------------- |
| `useSuppliers(opts?)` | `useQuery`    | Lista paginada/busca. Query key: `["suppliers", opts]`        |
| `useSupplier(id)`     | `useQuery`    | Detalhe. Query key: `["suppliers", id]`                       |
| `useCreateSupplier()` | `useMutation` | Cria. Invalida `["suppliers"]` e `["subscription"]` (limite). |
| `useUpdateSupplier()` | `useMutation` | Atualiza. Invalida `["suppliers"]`.                           |
| `useDeleteSupplier()` | `useMutation` | Remove. Invalida `["suppliers"]` e `["subscription"]`.        |

## API Integration

| Endpoint                | Verbo  | Funcao           | Parametros             |
| ----------------------- | ------ | ---------------- | ---------------------- |
| `/api/v1/suppliers`     | GET    | `fetchSuppliers` | `?page=N&search=texto` |
| `/api/v1/suppliers/:id` | GET    | `fetchSupplier`  | -                      |
| `/api/v1/suppliers`     | POST   | `createSupplier` | body: `CreateSupplier` |
| `/api/v1/suppliers/:id` | PATCH  | `updateSupplier` | body: `UpdateSupplier` |
| `/api/v1/suppliers/:id` | DELETE | `deleteSupplier` | -                      |

## Contracts

- `Supplier` — fornecedor (id, userId, name, phone, email, address, notes, createdAt).
- `CreateSupplier` — payload de criacao (name, phone?, email?, address?, notes?).
- `UpdateSupplier` — payload de edicao (`Partial<CreateSupplier>`).

## Freemium

- Recurso `suppliers`: **3 no plano gratuito**, ilimitado no Premium.
- Gate no form de criacao via `useLimitCheck("suppliers")` (bloqueia antes de enviar) + tratamento de `ApiError` com `code === "LIMIT_EXCEEDED"` → `showPaywall("suppliers")`.
- `LimitBanner resource="suppliers"` na screen mostra quantos restam.
- Enforcement real no backend (`freemiumGuard(subscriptionRepo, "suppliers")`).

## Error Handling

- **Erro de listagem:** `EmptyState` generico.
- **Erro de criacao/edicao:** `alertError` com mensagem.
- **Validacao local:** nome obrigatorio; telefone valido (BR) quando presente; email valido quando presente.

## Performance

- Lista carrega via `useSuppliers` (React Query) com cache por query key.
- Busca altera o param `search` e o React Query refaz o fetch (ILIKE no backend).
- Mutations invalidam `["suppliers"]` e `["subscription"]` para manter contagem de limite e lista em dia.

## Test matrix

- [ ] `useSuppliers` lista e busca
- [ ] `CreateSupplierForm` valida nome obrigatorio
- [ ] `CreateSupplierForm` bloqueia no limite freemium (paywall)
- [ ] `SupplierDetail` mostra contato e acao WhatsApp quando ha telefone

## Examples

- Acessado via aba "Mais" → "Fornecedores".
- Rota: `/suppliers`.

## Change log / Decisions

- Criacao inicial: CRUD de fornecedores como entidade propria (antes era so um campo de texto livre em insumos/embalagens).
- Limite freemium: 3 fornecedores no plano gratuito.
- Fase 2: `SupplierSelector` + `useSupplierName` permitem vincular um fornecedor a um insumo
  (`materials`) ou embalagem (`packaging`) via `supplierId`. O form de embalagem trocou o campo de
  texto livre pelo seletor; o de insumo ganhou o campo (antes nao tinha).
