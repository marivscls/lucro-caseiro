# ai.context.api.md — account

## Purpose

Exclusão definitiva da conta do usuário autenticado. Atende requisitos legais
(LGPD — direito de eliminação) e das lojas de aplicativos (Apple/Google exigem
exclusão de conta dentro do app). Remove tanto a identidade no Supabase Auth
quanto os dados do usuário no banco (em cascata).

## Non-goals

- Não faz "soft delete" / desativação reversível: a exclusão é definitiva.
- Não exporta nem faz backup dos dados antes de apagar (sem período de carência).
- Não cancela assinaturas em provedores externos (Stripe/Google Play): a
  cobrança recorrente deve ser cancelada pelo próprio usuário na loja/portal.
- Não administra contas de terceiros: cada usuário só pode excluir a própria.

## Boundaries & Ownership

- Owner: feature `account`.
- Depende de: tabela `users` (e o cascade de todas as tabelas user-scoped) e do
  Supabase Auth Admin API (service-role key).
- Dependentes: mobile `features/account` (botão "Excluir conta" em Configurações).
- Não importa arquivos internos de outras features.

## Code pointers

- `account.routes.ts` — `DELETE /api/v1/account` (protegido por authMiddleware).
- `account.usecases.ts` — orquestra: apaga Auth → apaga dados.
- `account.repo.pg.ts` — `DELETE FROM users WHERE id = userId` (cascade).
- `account.types.ts` — `IAccountRepo`, `IAuthAdmin`.
- Wiring + impl do `IAuthAdmin` (Supabase admin): `apps/api/src/main.ts`.
- Config da credencial: `apps/api/src/config.ts` (`SUPABASE_SERVICE_ROLE_KEY`).

## Data Model

- Não cria tabelas. Opera sobre `users`.
- Todas as tabelas user-scoped (`sales`, `clients`, `finance`, `products`,
  `recipes`, `materials`, `packaging`, `labels`, `pricing`, `goals`, `orders`,
  etc.) referenciam `users.id` com `ON DELETE CASCADE`. Apagar a linha em
  `users` remove em cascata os dados do usuário e seus filhos
  (`sale_items`, `recipe_ingredients`, `product_components`, ...).

## Invariants

- Escopo: um usuário só pode excluir a própria conta (`userId` vem do token).
- Ordem: a remoção no Auth ocorre ANTES da remoção dos dados. Se o Auth falhar,
  nenhum dado é apagado (estado consistente, usuário pode tentar de novo).
- Idempotência: `deleteUser` é seguro mesmo se a linha já não existir.
- Sem service-role key configurada, a operação falha com 503 (nunca apaga só
  os dados deixando o login órfão).

## Operations

```yaml
feature: account
app: api
mobile_counterpart: account
api:
  base: /api/v1/account
  endpoints:
    - DELETE / -> 200 { deleted: true }
db:
  tables: [users]
  indexes: []
invariants:
  - user-scoped (userId do token)
  - auth deletado antes dos dados
  - 503 se service-role key ausente
```

## Authorization & RLS

- Requer autenticação (`authMiddleware`). `userId` é sempre extraído do token,
  nunca do corpo/params — impossível excluir a conta de outro usuário.
- A remoção no Auth usa a service-role key (somente backend); a key nunca é
  exposta ao cliente.

## Contracts (Zod/DTO)

- Request: sem corpo.
- Response: `{ deleted: true }` (200).
- Não há DTO em `@lucro-caseiro/contracts` (sem payload de entrada).

## Errors

- `401 UNAUTHORIZED` — sem token / sessão inválida (authMiddleware).
- `503 SERVICE_UNAVAILABLE` — service-role key ausente ou falha no Auth Admin
  ("Não foi possível excluir a conta agora. Tente novamente mais tarde.").
- `500 INTERNAL_ERROR` — falha inesperada ao apagar os dados.

## Events / Side effects

- Remove o usuário do Supabase Auth (irreversível).
- Cascade no Postgres apaga os dados do usuário.
- Efeito no cliente: a sessão é encerrada e o app volta para o login.

## Performance

- Operação pontual e rara; uma chamada Admin + um `DELETE` com cascade.
- O cascade pode tocar muitas linhas, mas é executado em uma transação do
  Postgres por FK; sem necessidade de índice adicional além das PKs/FKs.

## Security

- Dados sensíveis (clientes, financeiro) são apagados de forma definitiva.
- Service-role key tem privilégios totais: vive apenas no backend (Railway),
  nunca no mobile nem em contracts.
- Sem injeção: `userId` é um UUID validado pelo Supabase no authMiddleware.

## Test matrix

- usecases: apaga Auth e depois dados; ordem (auth antes de data); não apaga
  dados se o Auth falhar. Ver `account.usecases.test.ts`.
- Manual/integração: 503 quando a key não está configurada; após exclusão, o
  login do usuário deixa de existir (não recria conta vazia).

## Examples

Request:

```
DELETE /api/v1/account
Authorization: Bearer <access_token>
```

Response (200):

```json
{ "deleted": true }
```

Response (503, key ausente):

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Exclusão de conta indisponível no momento. Tente novamente mais tarde."
}
```

## Change log / Decisions

- Exclusão é total e irreversível (decisão de produto): atende loja/LGPD.
- Auth deletado antes dos dados para manter consistência em caso de falha.
- Requer `SUPABASE_SERVICE_ROLE_KEY` no ambiente da API (Railway + local).
- Cancelamento de assinatura externa fica a cargo do usuário (fora do escopo).
