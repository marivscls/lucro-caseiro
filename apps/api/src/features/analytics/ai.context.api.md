# ai.context.api.md — Product analytics

---

## Purpose

Registrar instalações, dias ativos e eventos comportamentais canônicos para medir aquisição,
uso, funil, ativação e retenção sem uma plataforma externa de eventos.

## Non-goals

- Não rastreia toques livres, texto digitado ou conteúdo criado; de crashes guarda só
  `app_crashed` com tipo do erro e tela; de campanha guarda só os
  UTM e o host de origem da primeira abertura.
- Não substitui métricas de download e aquisição da Google Play.
- Não oferece endpoint público de relatório; o painel exige autenticação e allowlist.

## Boundaries & Ownership

- Depende das tabelas `analytics_installations`, `analytics_installation_users`,
  `analytics_activity_days`, `analytics_user_activity_days`, `analytics_events` e `users`.
- O relatório deriva ativação de `pricing_calculations`, `sales` e `orders`.
- O mobile `features/analytics` envia as aberturas.

## Code pointers

- `analytics.routes.ts`: abertura anônima, identificação autenticada e painel administrativo.
- `analytics.admin.ts`: regra pura de autorização por UUID configurado.
- `analytics.usecases.ts`: relógio, chave de dia UTC e cadastro registrado pelo servidor.
- `analytics.domain.ts`: regra pura do cadastro recente e dos eventos que só o servidor emite.
- `analytics.repo.pg.ts`: upserts idempotentes e vínculo retroativo.
- `analytics.report-query.ts`: consulta canônica compartilhada pelo endpoint e pelo comando.
- `report.ts`: relatório operacional via `pnpm analytics:report`.
- `packages/database/src/migrations/034_product_analytics.sql`: instalações e atividade.
- `packages/database/src/migrations/035_analytics_behavior_events.sql`: eventos e segurança.
- `packages/database/src/migrations/20260923100200_analytics_event_props.sql`: coluna `props`.
- `packages/database/src/migrations/20260923100100_analytics_installation_acquisition.sql`:
  colunas de origem da instalação.
- `packages/database/src/migrations/20260923100000_analytics_event_name_format.sql`: troca a
  lista fechada de nomes no banco por uma checagem de formato.
- `analytics.pglite.test.ts`: persistência e relatório contra as migrations reais em PGlite.

## Data Model

- `analytics_installations`: uma linha por UUID local; primeira/última abertura, plataforma,
  versão, build e origem (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer`,
  cada uma anuláveis e gravadas só no primeiro insert).
- `analytics_installation_users`: vínculos muitos-para-muitos entre instalações e contas.
- `analytics_activity_days`: chave composta instalação + data UTC; no máximo um dia ativo.
- `analytics_user_activity_days`: chave composta usuário + data UTC para usuários ativos.
- `analytics_events`: tela ou ação canônica, instalação/conta, versão, timestamp do servidor e
  `props` JSONB opcional (só em ações).

## Invariants

- A primeira abertura nunca é sobrescrita, nem a origem da instalação.
- Trocar de conta na mesma instalação não reatribui o histórico da conta anterior.
- A atividade diária é idempotente pela chave composta.
- A allowlist de nomes vive no contrato e no zod da API; o banco só garante o formato
  `^[a-z][a-z0-9_]{0,79}$`, para que um nome novo do contrato não seja descartado em silêncio.

## Operations

- `POST /api/v1/analytics/open`: abertura anônima.
- `POST /api/v1/analytics/identify`: abertura autenticada e vínculo.
- `POST /api/v1/analytics/events`: lote anônimo de até 25 eventos.
- `POST /api/v1/analytics/events/identify`: lote autenticado e vínculo.
- `GET /api/v1/analytics/admin/access`: informa se a conta está em `ADMIN_USER_IDS`.
- `GET /api/v1/analytics/admin/dashboard`: relatório autenticado e autorizado.
- `pnpm analytics:report`: consulta agregada com `DATABASE_URL`.

## Authorization & RLS

- `/open` é anônimo e recebe payload estritamente limitado.
- `/identify` usa `authMiddleware`; o `userId` nunca vem do corpo.
- `/admin/dashboard` exige `authMiddleware` e UUID presente em `ADMIN_USER_IDS`.
- As cinco tabelas têm RLS e privilégios de `anon`/`authenticated` revogados.

## Contracts (Zod/DTO)

O envelope usa `{ installationId, platform, appVersion, appBuild?, acquisition? }`.
`acquisition` é estrito: `utmSource`, `utmMedium`, `utmCampaign`, `utmContent` (1–100) e
`referrer` (host, 1–200), sem caracteres de controle nem chaves extras. Eventos são uma união
discriminada: `screen_view` exige nome permitido e duração de 250 ms a 6 h; `action` aceita apenas
as ações do contrato e um `props` opcional: de 1 a 5 chaves `^[a-z][a-z0-9_]*$` (até 32),
valores texto sem espaços `[\w.:/()[\]-]` (até 64), número finito até 1e9 ou booleano. Objetos
aninhados, arrays, texto livre e props em `screen_view` são rejeitados.

## Errors

- 400 para payload inválido, via error handler existente.
- 401 em `/identify` sem sessão válida.
- 401 no painel sem sessão e 403 para conta fora da allowlist.
- Erro de banco é propagado ao error handler; o cliente trata telemetria como best effort.

## Events / Side effects

- Upsert da instalação e do dia ativo na mesma transação.
- Identificação cria/atualiza o vínculo instalação-conta e o dia ativo do usuário.

## Performance

- Uma transação curta por abertura e uma inserção em lote por envio de eventos.
- Índices por usuário, primeira/última abertura e data de atividade.
- A chave composta impede crescimento por múltiplas aberturas no mesmo dia.

## Security

- Não persiste IP, e-mail, telefone, Advertising ID ou modelo do aparelho.
- Os endpoints anônimos não aceitam nomes livres; `props` só aceita identificadores curtos (sem
  espaços), nunca texto digitado ou dado de cliente.
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
- 2026-07-14: eventos comportamentais alimentam uso de telas, funcionalidades, funil temporal,
  adoção de versão e retenção D7 por comportamento.
- 2026-07-18: a migração `037_activation_funnel_events.sql` completou os marcos de aquisição,
  paywall e assinatura. Ativação agora exige a sequência `pricing_completed` →
  `product_created_from_pricing` → (`catalog_published` ou `sale_completed`); eventos do ciclo
  de assinatura são emitidos no backend apenas quando o plano realmente muda.

## Orientação contextual — 2026-09-07

O contrato compartilhado aceita áreas e ações de orientação em allowlist (apresentação, dispensa, ajuda, início, conclusão e retomada), erros de produto/financeiro por identificadores fixos, cadastros de apoio, resultado de preço e conteúdo de catálogo publicado. `catalog_published` continua registrando apenas ativação de link; `catalog_content_published` exige salvamento confirmado no editor e itens públicos. Nenhum texto de formulário é aceito como metadata adicional. Coleta e permissões mantêm o comportamento anterior. Os novos marcos são definidos em `docs/orientacao-contextual-primeiro-valor.md`; o relatório histórico não ganha inferências causais automaticamente.

## Nomes de eventos no banco — 2026-09-23

A checagem `analytics_events_event_name_check` (037) listava só 17 ações e 29 telas; ações de
cadastros de apoio, orientação, validação e a tela `services` falhavam no insert e, como a coleta é
best effort, se perdiam sem erro visível. A migration `20260923100000_analytics_event_name_format.sql`
substitui a lista por `analytics_events_event_name_format_check` (formato apenas).

## Funil do painel — 2026-09-23

- Etapa `signup`: primeiro `signup_completed` da instalação ou a primeira identificação de uma conta
  nela (`analytics_installation_users.first_identified_at`), o que vier antes. Contas Google entram
  no funil mesmo sem o evento do cadastro por e-mail.
- Etapa `product`: `product_created` ou `product_created_from_pricing`.
- Cada etapa usa o primeiro marco a partir da etapa anterior (antes era o primeiro marco absoluto,
  o que descartava quem criou um produto antes de precificar e depois criou outro).

## Cadastro registrado pelo servidor — 2026-09-23

- `signup_completed` passou a ser emitido pela API, seja o cadastro por e-mail ou Google:
  na primeira vez que a conta é vinculada a uma instalação (`/identify` ou `/events/identify`),
  se `users.created_at` estiver a no máximo 7 dias da identificação (`isFreshSignup`).
- "Primeiro vínculo": o insert em `analytics_installation_users` criou a linha (`xmax = 0`) e não
  existe vínculo da conta com outra instalação. Contas antigas que só agora aparecem não contam.
- `recordSignupOnce` insere com `NOT EXISTS`, então há no máximo um `signup_completed` por conta.
- O app não envia mais o evento; versões antigas ainda enviam e a API o descarta
  (`withoutServerOwnedEvents`) antes de persistir, sem rejeitar o lote.
- `signups.total`/`last30Days` continuam vindo de `users`; o evento alimenta uso de funções e funil.

## Origem da instalação — 2026-09-23

- `/open`, `/identify` e os lotes de eventos aceitam `acquisition` opcional; o repositório só o usa
  no `INSERT` e o `ON CONFLICT` não toca nessas colunas.
- Painel: `acquisition` agrega as instalações dos últimos 30 dias por `utm_source` + `utm_content`
  (até 20 linhas, `null` = sem origem) com quantas já têm conta vinculada.
- A web envia os UTM da URL do PWA. No Android a origem fica vazia até existir leitura do Play
  Install Referrer no app, que depende de um módulo nativo ainda não aprovado.

## Propriedades de ações — 2026-09-23

- Coluna `analytics_events.props` (JSONB, anulável). O banco exige objeto, `event_type = 'action'`
  e no máximo 1 KB (`analytics_events_props_check`); o zod aplica os limites finos de
  `ANALYTICS_EVENT_PROPS_LIMITS`.
- Uso atual: `plan_limit_reached` → `resource`, `screen`; `paid_feature_requested` → `feature`,
  `trigger` (`limit` ou `feature`), `screen`, `plan` recomendado.
- O relatório ainda não agrega por `props`; a consulta ad hoc lê `props->>'chave'`.

## Novos marcos — 2026-09-23

Ações novas no contrato e em "Funcionalidades mais usadas": `business_profile_completed`,
`business_profile_skipped`, `plan_chosen`, `purchase_result` (props `result` = `success`,
`failure` ou `cancel`, `provider`, `plan`, `period`), `ad_impression` e `app_crashed` (props
`error` = tipo do erro e `screen`). São emitidas pelo app; a
API só valida e persiste.
