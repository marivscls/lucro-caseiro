# ai.context.mobile.md — Clients (Mobile Feature)

---

## Purpose

Gerenciar a carteira de clientes do usuario: listar, buscar, criar, editar, excluir e visualizar detalhes de clientes. Mostra historico de compras, total gasto, tags, aniversarios e integra com WhatsApp para contato rapido.

## Non-goals

- Nao realiza vendas diretamente (isso e da feature `sales`).
- Nao gerencia assinaturas ou planos (feature `subscription`).
- Nao calcula metricas financeiras (feature `finance`).

## Boundaries & Ownership

- **Depende de:** `@lucro-caseiro/contracts` (tipos `Client`, `CreateClient`, `UpdateClient`), `@lucro-caseiro/ui` (componentes genericos), `shared/hooks/use-auth`, `shared/hooks/use-limit-check`, `shared/utils/api-client`.
- **Depende de (cross-feature):** `features/sales/hooks` (`useSales`) para exibir historico de compras no detalhe do cliente.
- **Dependentes:** `features/sales` (tela `new-sale` usa `useClients` para selecionar cliente na venda), `tabs/index` (Home usa `useBirthdays`).

## Code pointers

| Arquivo                                                              | Descricao                                                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apps/mobile/src/features/clients/api.ts`                            | Funcoes de chamada HTTP (fetchClients, fetchClient, fetchBirthdays, createClient, updateClient, deleteClient) |
| `apps/mobile/src/features/clients/hooks.ts`                          | React Query hooks (useClients, useClient, useBirthdays, useCreateClient, useUpdateClient, useDeleteClient)    |
| `apps/mobile/src/features/clients/components/client-card.tsx`        | Card de cliente na listagem                                                                                   |
| `apps/mobile/src/features/clients/components/client-detail.tsx`      | Tela de detalhe do cliente                                                                                    |
| `apps/mobile/src/features/clients/components/client-list.tsx`        | Lista agrupada por letra inicial                                                                              |
| `apps/mobile/src/features/clients/components/create-client-form.tsx` | Formulario de criacao                                                                                         |
| `apps/mobile/src/features/clients/components/edit-client-form.tsx`   | Formulario de edicao                                                                                          |
| `apps/mobile/src/features/clients/components/tag-input.tsx`          | Input de tags reutilizavel                                                                                    |
| `apps/mobile/src/app/tabs/clients.tsx`                               | Screen principal (tab)                                                                                        |

## Components

### `ClientCard`

- **Props:** `{ client: Client; onPress?: () => void }`
- Exibe avatar com inicial, nome, telefone e total gasto.

### `ClientDetail`

- **Props:** `{ clientId: string; onEditPress?: () => void }`
- Exibe avatar grande, nome, tags (Badge), informacoes de contato, total gasto, botao WhatsApp e historico de compras (ultimas 10 vendas com status via Badge).
- Usa `useClient` e `useSales({ clientId })`.

### `ClientList`

- **Props:** `{ search?: string; onClientPress?: (id: string) => void; onAddPress?: () => void }`
- FlatList com agrupamento alfabetico por inicial do nome.
- Pull-to-refresh via RefreshControl.
- EmptyState quando sem dados.

### `CreateClientForm`

- **Props:** `{ onSuccess?: () => void }`
- Campos: nome (obrigatorio), telefone, endereco, aniversario (AAAA-MM-DD), observacoes, tags.
- Checa limite freemium via `useLimitCheck("clients")` antes de submeter.

### `EditClientForm`

- **Props:** `{ client: Client; onSuccess?: () => void }`
- Mesmos campos do create, pre-preenchidos com dados existentes.

### `TagInput`

- **Props:** `{ tags: string[]; onChange: (tags: string[]) => void; max?: number }`
- Adiciona tag ao digitar virgula ou Enter. Maximo 10 tags, 50 chars por tag.

## Hooks

| Hook                | Tipo          | Descricao                                                       |
| ------------------- | ------------- | --------------------------------------------------------------- |
| `useClients(opts?)` | `useQuery`    | Lista paginada de clientes. Query key: `["clients", opts]`      |
| `useClient(id)`     | `useQuery`    | Detalhe de um cliente. Query key: `["clients", id]`             |
| `useBirthdays()`    | `useQuery`    | Lista de aniversariantes. Query key: `["clients", "birthdays"]` |
| `useCreateClient()` | `useMutation` | Cria cliente. Invalida `["clients"]` no sucesso.                |
| `useUpdateClient()` | `useMutation` | Atualiza cliente. Invalida `["clients"]` no sucesso.            |
| `useDeleteClient()` | `useMutation` | Remove cliente. Invalida `["clients"]` no sucesso.              |

## API Integration

| Endpoint                    | Verbo  | Funcao           | Parametros            |
| --------------------------- | ------ | ---------------- | --------------------- |
| `/api/v1/clients`           | GET    | `fetchClients`   | `?page=N&search=term` |
| `/api/v1/clients/:id`       | GET    | `fetchClient`    | path param `id`       |
| `/api/v1/clients/birthdays` | GET    | `fetchBirthdays` | -                     |
| `/api/v1/clients`           | POST   | `createClient`   | body: `CreateClient`  |
| `/api/v1/clients/:id`       | PATCH  | `updateClient`   | body: `UpdateClient`  |
| `/api/v1/clients/:id`       | DELETE | `deleteClient`   | -                     |

Resposta paginada: `{ items: Client[], total, page, limit, totalPages }`.

## Contracts

- `Client` — tipo do cliente retornado pela API (id, name, phone, address, birthday, notes, tags, totalSpent, createdAt).
- `CreateClient` — payload de criacao (name obrigatorio, demais opcionais).
- `UpdateClient` — payload de edicao (campos opcionais).

Importados de `@lucro-caseiro/contracts`.

## Error Handling

- **Erro de listagem:** `EmptyState` com mensagem "Nao foi possivel carregar seus clientes. Tente novamente."
- **Erro de detalhe:** Typography com "Nao foi possivel carregar os dados do cliente."
- **Erro de criacao/edicao:** `Alert.alert("Erro", message)` onde `message` vem da exception ou fallback generico.
- **Validacao local:** nome obrigatorio, telefone minimo 8 digitos.
- **Limite freemium:** `useLimitCheck("clients")` bloqueia criacao e mostra paywall.

## Performance

- Listagem usa `FlatList` com agrupamento em memoria (nao virtualizado por grupo, mas FlatList por grupo).
- Pull-to-refresh para invalidar cache.
- React Query gerencia cache automaticamente com invalidacao por query key.

## Test matrix

- [ ] `useClients` retorna dados paginados
- [ ] `useCreateClient` invalida cache apos criacao
- [ ] `CreateClientForm` valida nome obrigatorio
- [ ] `CreateClientForm` checa limite freemium
- [ ] `TagInput` respeita limite maximo de tags
- [ ] `ClientList` agrupa clientes por inicial
- [ ] `ClientDetail` exibe historico de compras do cliente

## Examples

- Tela acessada via tab "Clientes" no bottom tab bar.
- Navegacao interna: lista -> detalhe (inline) -> editar (modal).
- Criacao via modal (FAB ou botao do EmptyState).

## Change log / Decisions

- Historico de compras no detalhe do cliente importa `useSales` da feature `sales` (cross-feature via hook, nao via arquivo interno).
- Tags limitadas a 10 por cliente para manter UX simples.
