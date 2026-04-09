# ai.context.mobile.md — Packaging (Mobile Feature)

---

## Purpose

Gerenciar embalagens utilizadas nos produtos: cadastrar, listar, editar e excluir embalagens com tipo, custo unitario e fornecedor. Permite vincular embalagens a produtos para uso na precificacao.

## Non-goals

- Nao calcula preco final do produto (feature `pricing`).
- Nao gerencia rotulos (feature `labels`).
- Nao faz compras de embalagens (apenas cataloga).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Packaging`, `CreatePackaging`, `UpdatePackaging`), `@lucro-caseiro/ui`, `shared/hooks/use-auth`, `shared/utils/api-client`.
- **Dependentes:** `features/pricing` (custo de embalagem como input da precificacao).

## Code pointers

| Arquivo                                                                   | Descricao                                                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/packaging/api.ts`                               | Funcoes HTTP (fetchPackagingList, fetchPackaging, createPackaging, updatePackaging, deletePackaging, linkPackagingToProduct) |
| `apps/mobile/src/features/packaging/hooks.ts`                             | React Query hooks                                                                                                            |
| `apps/mobile/src/features/packaging/components/create-packaging-form.tsx` | Formulario de criacao                                                                                                        |
| `apps/mobile/src/app/packaging.tsx`                                       | Screen (rota `/packaging`)                                                                                                   |

## Components

### `CreatePackagingForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), tipo (chips: Caixa, Sacola, Pote, Filme, Rotulo, Outro), custo unitario em R$ (obrigatorio, > 0), fornecedor (opcional).
- Tipos mapeados para valores: `box`, `bag`, `pot`, `film`, `label`, `other`.

## Hooks

| Hook                          | Tipo          | Descricao                                              |
| ----------------------------- | ------------- | ------------------------------------------------------ |
| `usePackagingList(opts?)`     | `useQuery`    | Lista paginada. Query key: `["packaging", opts]`       |
| `usePackaging(id)`            | `useQuery`    | Detalhe. Query key: `["packaging", id]`                |
| `useCreatePackaging()`        | `useMutation` | Cria embalagem. Invalida `["packaging"]`.              |
| `useUpdatePackaging()`        | `useMutation` | Atualiza embalagem. Invalida `["packaging"]`.          |
| `useDeletePackaging()`        | `useMutation` | Remove embalagem. Invalida `["packaging"]`.            |
| `useLinkPackagingToProduct()` | `useMutation` | Vincula embalagem a produto. Invalida `["packaging"]`. |

## API Integration

| Endpoint                                             | Verbo  | Funcao                   | Parametros              |
| ---------------------------------------------------- | ------ | ------------------------ | ----------------------- |
| `/api/v1/packaging`                                  | GET    | `fetchPackagingList`     | `?page=N`               |
| `/api/v1/packaging/:id`                              | GET    | `fetchPackaging`         | path param `id`         |
| `/api/v1/packaging`                                  | POST   | `createPackaging`        | body: `CreatePackaging` |
| `/api/v1/packaging/:id`                              | PATCH  | `updatePackaging`        | body: `UpdatePackaging` |
| `/api/v1/packaging/:id`                              | DELETE | `deletePackaging`        | -                       |
| `/api/v1/packaging/:packagingId/products/:productId` | POST   | `linkPackagingToProduct` | -                       |

## Contracts

- `Packaging` — embalagem (id, name, type, unitCost, supplier).
- `CreatePackaging` — payload de criacao (name, type, unitCost, supplier?).
- `UpdatePackaging` — payload de edicao.

## Error Handling

- **Erro de listagem:** EmptyState com "Nao foi possivel carregar suas embalagens. Tente novamente."
- **Erro de criacao:** `Alert.alert("Erro", message)` com mensagem da exception ou fallback.
- **Validacao local:** nome obrigatorio, custo > 0.

## Performance

- FlatList simples para listagem.
- Sem cache especial alem do React Query padrao.

## Test matrix

- [ ] `useCreatePackaging` invalida cache apos criacao
- [ ] `CreatePackagingForm` valida nome obrigatorio
- [ ] `CreatePackagingForm` valida custo > 0
- [ ] `useLinkPackagingToProduct` envia POST correto
- [ ] Listagem exibe tipo como Badge

## Examples

- Acessado via Home (quick access "Embalagens") ou rota `/packaging`.
- Fluxo: lista com FAB -> modal criacao -> salvar -> lista atualizada.
- Screen usa inline rendering (FlatList + EmptyState) sem sub-navegacao.

## Change log / Decisions

- Limite freemium: 3 embalagens no Free, ilimitado no Premium (enforcement no backend).
- Link entre embalagem e produto via endpoint dedicado (POST /packaging/:id/products/:productId).
