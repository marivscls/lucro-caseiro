# ai.context.mobile.md — Product analytics

---

## Purpose

Registrar abertura e atividade diária do app com um identificador persistente por instalação,
antes e depois da autenticação, sem bloquear a experiência.

## Non-goals

- Não rastreia telas, cliques, conteúdo, crashes ou origem de campanha.
- Não mostra métricas ao usuário final.
- Não adiciona SDK ou dependência analítica externa.

## Boundaries & Ownership

- Depende de `asyncStorage`, `apiClient`, `useAuth`, Expo Constants e AppState.
- Counterpart: API `features/analytics`.
- É montado uma vez no `AppContent` raiz.

## Code pointers

- `installation.ts`: UUID persistente da instalação.
- `api.ts`: envio anônimo ou autenticado.
- `use-app-metrics.ts`: boot, troca de identidade e retorno ao app.
- `installation.test.ts`: persistência e formato do UUID.

## Components

Nenhum componente visual.

## Hooks

`useAppMetrics` aguarda a inicialização da autenticação, registra a identidade atual e repete o
upsert quando o app volta ao estado ativo.

## API Integration

- Sem token: `POST /api/v1/analytics/open`.
- Com token: `POST /api/v1/analytics/identify`.
- Payload: UUID da instalação, plataforma, versão e build.

## Contracts

`AppOpenPayload` limita plataforma a Android, iOS ou web; não aceita dados pessoais.

## Error Handling

Telemetria é best effort. Qualquer erro é ignorado em produção e apenas avisado em desenvolvimento;
boot, autenticação e navegação continuam normalmente.

## Performance

- Uma chamada no boot/troca de identidade e ao retornar ao app.
- O servidor deduplica por instalação/dia, então reativações repetidas não inflam atividade.

## Test matrix

- UUID v4 válido.
- Identidade existente é reutilizada sem nova escrita.
- Identidade ausente é criada e persistida.

## Examples

Uma instalação anônima abre o app, recebe UUID local e chama `/open`; após login, o mesmo UUID chama
`/identify`, vinculando também os dias anteriores.

## Change log / Decisions

- 2026-07-13: coleta mínima própria, sem SDK externo e sem fila dedicada; falhas tentam novamente
  em uma abertura futura.
