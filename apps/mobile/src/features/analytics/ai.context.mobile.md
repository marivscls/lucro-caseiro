# ai.context.mobile.md — Product analytics

---

## Purpose

Registrar abertura, atividade diária, tempo ativo por tela e ações canônicas com um identificador
persistente por instalação, sem bloquear a experiência, e apresentar o relatório apenas para uma
conta autorizada pelo backend.

## Non-goals

- Não rastreia toques livres, texto, conteúdo, buscas, crashes ou origem de campanha.
- Não mostra métricas a contas comuns.
- Não adiciona SDK ou dependência analítica externa.

## Boundaries & Ownership

- Depende de `asyncStorage`, `apiClient`, `useAuth`, Expo Constants e AppState.
- Counterpart: API `features/analytics`.
- É montado uma vez no `AppContent` raiz.

## Code pointers

- `installation.ts`: UUID persistente da instalação.
- `api.ts`: envio anônimo ou autenticado.
- `use-app-metrics.ts`: boot, troca de identidade e retorno ao app.
- `use-screen-metrics.ts`: troca de rota, foreground/background e duração ativa.
- `screen-tracking.ts`: allowlist de rotas e cálculo puro de duração.
- `tracker.ts`: envio best effort de telas e ações.
- `hooks.ts`: acesso administrativo e consulta do painel com React Query.
- `app/admin-metrics.tsx`: painel visual interno.
- `installation.test.ts`: persistência e formato do UUID.

## Components

`admin-metrics.tsx` reutiliza Card, Typography, Button e EmptyState. Possui Visão geral, Telas e
funções, Funil e Retenção, com pull-to-refresh.

## Hooks

`useAppMetrics` aguarda a inicialização da autenticação, registra a identidade atual e repete o
upsert quando o app volta ao estado ativo.

`useScreenMetrics` envia o segmento anterior ao trocar de rota ou ir para background e reinicia o
relógio no foreground. Segmentos menores que 250 ms são ignorados e os demais limitados a 6 h.

## API Integration

- Sem token: `POST /api/v1/analytics/open`.
- Com token: `POST /api/v1/analytics/identify`.
- Payload: UUID da instalação, plataforma, versão e build.
- Eventos: `POST /events` sem token e `POST /events/identify` com token.
- `GET /api/v1/analytics/admin/access`: decide se o item aparece em “Mais”.
- `GET /api/v1/analytics/admin/dashboard`: carrega os dados; o servidor continua sendo a barreira.

## Contracts

`AppOpenPayload` limita plataforma a Android, iOS ou web. Telas e ações vêm das allowlists do
contrato compartilhado; não há metadata nem dados pessoais.

## Error Handling

Telemetria é best effort. Qualquer erro é ignorado em produção e apenas avisado em desenvolvimento;
boot, autenticação e navegação continuam normalmente.

## Performance

- Uma chamada no boot/troca de identidade e ao retornar ao app.
- Uma chamada best effort ao encerrar um segmento de tela ou concluir uma ação importante.
- O servidor deduplica por instalação/dia, então reativações repetidas não inflam atividade.

## Test matrix

- UUID v4 válido.
- Identidade existente é reutilizada sem nova escrita.
- Identidade ausente é criada e persistida.
- Mapa de rotas rejeita caminhos desconhecidos e duração ignora visitas acidentais.

## Examples

Uma instalação anônima abre o app, recebe UUID local e chama `/open`; após login, o mesmo UUID chama
`/identify`, vinculando também os dias anteriores.

## Change log / Decisions

- 2026-07-13: coleta mínima própria, sem SDK externo e sem fila dedicada; falhas tentam novamente
  em uma abertura futura.
- 2026-07-13: painel administrativo protegido por allowlist do backend, sem dependência de gráficos.
- 2026-07-14: instrumentação própria cobre telas, ações, funil, versões e retenção comportamental.
- 2026-07-18: o funil passou a registrar início de precificação, produto criado pelo CTA do
  resultado, publicação do catálogo, limite atingido e intenção de recurso pago. Conclusão e
  cancelamento de assinatura ficam no backend para refletir a transição real do plano.
