# ai.context.mobile.md — Product analytics

---

## Purpose

Registrar abertura, atividade diária, tempo ativo por tela e ações canônicas com um identificador
persistente por instalação, sem bloquear a experiência, e apresentar o relatório apenas para uma
conta autorizada pelo backend.

## Non-goals

- Não rastreia toques livres, texto, conteúdo ou buscas; de crashes envia só o tipo do erro e a
  tela; de campanha envia só UTM e host
  de origem da primeira abertura.
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
- `crash-report.ts`: `reportAppCrash` envia `app_crashed` (tipo do erro + tela), no máximo 5 por
  sessão; nunca mensagem, pilha ou dados digitados.
- `shared/components/app-error-boundary.tsx`: barreira raiz montada em `app/_layout.tsx`.
- `event-props.ts`: remove props que a API recusaria (vazio, espaço, chave inválida) e corta texto
  longo, para não perder o lote inteiro.
- `hooks.ts`: acesso administrativo e consulta do painel com React Query.
- `app/admin-metrics.tsx`: painel visual interno.
- `installation.test.ts`: persistência e formato do UUID.
- `acquisition-parse.ts`: leitura pura de UTM (URL do PWA ou Install Referrer) e host de origem.
- `acquisition.ts`: captura única por instalação, persistida em `analytics:acquisition`.
- `acquisition-source.web.ts`: guarda a query e o `document.referrer` ao carregar o bundle.
- `acquisition-source.ts`: nativo; `readNativeInstallReferrer` é o ponto de extensão do Play
  Install Referrer e hoje retorna null (exige módulo nativo, ex.: `expo-application`).

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
- Payload: UUID da instalação, plataforma, versão, build e `acquisition` opcional (só aberturas).
- Eventos: `POST /events` sem token e `POST /events/identify` com token.
- `GET /api/v1/analytics/admin/access`: decide se o item aparece em “Mais”.
- `GET /api/v1/analytics/admin/dashboard`: carrega os dados; o servidor continua sendo a barreira.

## Contracts

`AppOpenPayload` limita plataforma a Android, iOS ou web. Telas e ações vêm das allowlists do
contrato compartilhado. Ações podem levar `props` curtos (identificadores como recurso, plano e
tela); nunca texto digitado, nomes, valores ou dados de clientes.

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

## Orientação contextual — 2026-09-07

Orientações usam allowlist compartilhada (área + evento, sem payload livre). Sucessos de mutations acionam conclusão local após hidratação, isolada por conta, mesmo se a coleta falhar. Cliques e ajuda não completam tarefas; preço percebido é separado de preço salvo.

Contrato e matriz: `docs/orientacao-contextual-primeiro-valor.md`; composição: `shared/guidance`.

## Funil do painel — 2026-09-23

A etapa `signup` do painel é exibida como "Conta criada ou login": o backend passou a contar a
primeira identificação da instalação, além do cadastro por e-mail.

## Cadastro — 2026-09-23

O app não envia mais `signup_completed` (antes só a tela de cadastro por e-mail enviava). A API
registra o evento na primeira identificação de uma conta recém-criada, cobrindo também o Google.

## Origem da instalação — 2026-09-23

Na primeira execução o app lê a origem uma única vez e grava o resultado (inclusive "sem origem"),
para que links abertos depois não troquem a origem original. Toda abertura reenvia esse valor; a
API só o grava no primeiro registro. O painel mostra "Origem das instalações" em Visão geral.

## Propriedades de ações — 2026-09-23

`trackAnalyticsAction(name, token, props?)`. `screen-tracking.ts` guarda a tela canônica em foco
(`currentAnalyticsScreen`), atualizada por `useScreenMetrics`. `useLimitCheck` envia
`plan_limit_reached` com `resource` e `screen`; `usePaywall.show(resource, plan?, trigger?)` envia
`paid_feature_requested` com `feature`, `trigger`, `screen` e `plan`.

## Novos marcos — 2026-09-23

| Ação                         | Onde                                                       | Props                                                        |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `business_profile_completed` | `useBusinessOnboarding.save` com respostas                 | `first`, `segment`, `stage`, `goal`, `channels` (quantidade) |
| `business_profile_skipped`   | `useBusinessOnboarding.save(null)`                         | `first`                                                      |
| `plan_chosen`                | Planos → "Continuar para pagamento"                        | `plan`, `period`, `current`, `provider`                      |
| `purchase_result`            | `useSubscription` (Google Play) e `useStripeCheckout`      | `result`, `provider`, `plan`, `period`                       |
| `ad_impression`              | `AdBanner` nativo, primeiro `onAdLoaded` do banner montado | `size`, `screen`                                             |

Os eventos só saem depois de sucesso confirmado (perfil salvo, anúncio carregado). No Google Play,
`purchase_result` só vale para compras iniciadas na sessão: `success` após a verificação no backend,
`cancel` para `user-cancelled`, `failure` para o resto. Na Stripe, `success` quando o plano pago
aparece em até cerca de 15 s depois de fechar o checkout, `cancel` quando não aparece e `failure`
quando o checkout não abre. Nome e nome do negócio nunca entram nas props.

## Erros que derrubam a tela — 2026-09-23

`AppErrorBoundary` envolve `AppContent` no layout raiz (dentro dos providers de tema e de dados).
Quando uma tela quebra, mostra "Algo deu errado" com o botão "Tentar de novo", que reinicia a
barreira, e chama `reportAppCrash`. Props de `app_crashed`: `error` (nome do tipo, só `\w`, até 40) e `screen`. Erros fora da árvore React (promessas soltas, crash nativo) não são capturados;
um serviço dedicado (ex.: Sentry) exigiria conta e DSN do responsável.
