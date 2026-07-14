# ai.context.api.md — Product analytics

---

## Purpose

Registrar instalações observadas e um único dia ativo por instalação para medir aquisição,
ativação e retenção sem uma plataforma externa de eventos.

## Non-goals

- Não rastreia telas, cliques, campanhas, crashes ou conteúdo criado.
- Não substitui métricas de download e aquisição da Google Play.
- Não oferece endpoint público de relatório; o painel exige autenticação e allowlist.

## Boundaries & Ownership

- Depende das tabelas `analytics_installations`, `analytics_installation_users`,
  `analytics_activity_days`, `analytics_user_activity_days` e `users`.
- O relatório deriva ativação de `pricing_calculations`, `sales` e `orders`.
- O mobile `features/analytics` envia as aberturas.

## Code pointers

- `analytics.routes.ts`: abertura anônima, identificação autenticada e painel administrativo.
- `analytics.admin.ts`: regra pura de autorização por UUID configurado.
- `analytics.usecases.ts`: relógio e chave de dia UTC.
- `analytics.repo.pg.ts`: upserts idempotentes e vínculo retroativo.
- `analytics.report-query.ts`: consulta canônica compartilhada pelo endpoint e pelo comando.
- `report.ts`: relatório operacional via `pnpm analytics:report`.
- `packages/database/src/migrations/034_product_analytics.sql`: tabelas e segurança.

## Data Model

- `analytics_installations`: uma linha por UUID local; primeira/última abertura, plataforma,
  versão e build.
- `analytics_installation_users`: vínculos muitos-para-muitos entre instalações e contas.
- `analytics_activity_days`: chave composta instalação + data UTC; no máximo um dia ativo.
- `analytics_user_activity_days`: chave composta usuário + data UTC para usuários ativos.

## Invariants

- A primeira abertura nunca é sobrescrita.
- Trocar de conta na mesma instalação não reatribui o histórico da conta anterior.
- A atividade diária é idempotente pela chave composta.

## Operations

- `POST /api/v1/analytics/open`: abertura anônima.
- `POST /api/v1/analytics/identify`: abertura autenticada e vínculo.
- `GET /api/v1/analytics/admin/access`: informa se a conta está em `ADMIN_USER_IDS`.
- `GET /api/v1/analytics/admin/dashboard`: relatório autenticado e autorizado.
- `pnpm analytics:report`: consulta agregada com `DATABASE_URL`.

## Authorization & RLS

- `/open` é anônimo e recebe payload estritamente limitado.
- `/identify` usa `authMiddleware`; o `userId` nunca vem do corpo.
- `/admin/dashboard` exige `authMiddleware` e UUID presente em `ADMIN_USER_IDS`.
- As quatro tabelas têm RLS e privilégios de `anon`/`authenticated` revogados.

## Contracts (Zod/DTO)

`{ installationId: UUID, platform: android|ios|web, appVersion: 1..32, appBuild?: 1..32 }`.

## Errors

- 400 para payload inválido, via error handler existente.
- 401 em `/identify` sem sessão válida.
- 401 no painel sem sessão e 403 para conta fora da allowlist.
- Erro de banco é propagado ao error handler; o cliente trata telemetria como best effort.

## Events / Side effects

- Upsert da instalação e do dia ativo na mesma transação.
- Identificação cria/atualiza o vínculo instalação-conta e o dia ativo do usuário.

## Performance

- Uma transação curta por abertura.
- Índices por usuário, primeira/última abertura e data de atividade.
- A chave composta impede crescimento por múltiplas aberturas no mesmo dia.

## Security

- Não persiste IP, e-mail, telefone, Advertising ID ou modelo do aparelho.
- O endpoint anônimo não aceita propriedades arbitrárias.
- Lista administrativa vazia nega o painel a todas as contas.
- O rate limit global da API também cobre estas rotas.

## Test matrix

- Use case repassa usuário e metadados com timestamp e dia UTC determinísticos.
- `utcDateKey` independe do fuso local.
- Typecheck cobre schema, transação, rotas e relatório.
- Autorização nega conta comum e configuração vazia; mapping normaliza números do Postgres.

## Examples

`POST /api/v1/analytics/open` com UUID, `android`, versão `1.2.0` e build `19` retorna 204.

## Change log / Decisions

- 2026-07-13: implementação inicial sem SDK externo; ativação derivada das tabelas canônicas.
- Retenção usa dia exato D1/D7/D30 e calendário UTC.
- 2026-07-13: painel interno usa a mesma consulta do comando e autorização por `ADMIN_USER_IDS`.
