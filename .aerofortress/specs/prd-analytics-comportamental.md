# PRD — Analytics comportamental e funis de produto

**Status:** implementado
**Data:** 2026-07-14
**Responsável:** Lucro Caseiro
**Dependência:** PRD de métricas de instalação, ativação e retenção

## Problema

As métricas atuais explicam quantas instalações abriram o Lucro Caseiro, quantas contas ativaram e
quantas retornaram. Elas ainda não mostram quais telas entregam valor, quais funcionalidades são
adotadas, onde o funil perde pessoas nem quais comportamentos aumentam a retenção.

## Objetivo

Responder, no painel administrativo, sem SDK externo e sem conteúdo pessoal:

1. quais telas são mais visitadas e por quantas pessoas;
2. quanto tempo ativo as pessoas passam em cada tela;
3. quais funcionalidades e ações importantes são mais usadas;
4. quantas instalações avançam pelos funis principais;
5. qual versão do app está efetivamente em uso;
6. quais comportamentos se relacionam com maior retenção.

## Princípios

- Tempo isolado não representa valor: deve aparecer junto de visitas, usuários e conclusão de ação.
- O servidor aceita apenas nomes de tela e ação definidos no contrato; texto livre é proibido.
- Nunca coletar nomes de clientes/produtos, valores, telefone, e-mail, conteúdo, termos de busca ou
  parâmetros de rota.
- A telemetria é best effort e nunca bloqueia navegação, cadastro, compra ou operações do negócio.
- O painel e o endpoint continuam restritos a `ADMIN_USER_IDS`.
- O comando operacional e o painel usam a mesma consulta canônica.

## Escopo funcional

### 1. Telas e tempo ativo

Registrar automaticamente todas as rotas estáticas do aplicativo por um identificador canônico.
Cada sessão de tela informa duração ativa em milissegundos. O relógio para quando o app sai do
estado ativo e reinicia ao retornar, impedindo que tempo em segundo plano infle o resultado.

O painel, para os últimos 30 dias, mostra por tela:

- visitas;
- instalações/contas únicas;
- minutos ativos;
- média de tempo ativo por visita.

### 2. Funcionalidades e ações importantes

Registrar somente após sucesso da ação canônica:

| Evento                  | Momento canônico                                    |
| ----------------------- | --------------------------------------------------- |
| `signup_completed`      | cadastro por e-mail concluído                       |
| `pricing_completed`     | precificação persistida                             |
| `product_created`       | produto criado                                      |
| `sale_completed`        | venda criada e confirmada pela API                  |
| `order_created`         | encomenda criada                                    |
| `catalog_shared`        | compartilhamento do catálogo acionado               |
| `quote_created`         | orçamento criado                                    |
| `quote_pdf_exported`    | PDF de orçamento gerado sem erro                    |
| `finance_entry_created` | lançamento financeiro criado                        |
| `subscription_started`  | checkout Google Play ou Stripe iniciado com sucesso |

O painel mostra eventos totais e instalações/contas únicas por ação nos últimos 30 dias.

### 3. Funis

Medir instalações que completaram marcos na ordem correta:

1. instalação observada → cadastro concluído;
2. cadastro concluído → primeira precificação;
3. primeira precificação → primeiro produto;
4. primeiro produto → primeira venda.

Para cada etapa, mostrar total de instalações e conversão em relação à etapa anterior. Eventos
anteriores à instrumentação não são reconstruídos artificialmente.

### 4. Adoção por versão

Para cada instalação ativa nos últimos 30 dias, considerar a versão vista no dia ativo mais recente.
Mostrar versão, instalações ativas e participação percentual. Uma instalação conta em apenas uma
versão.

### 5. Retenção por comportamento

Comparar retenção D7 entre instalações maduras que, nos primeiros sete dias, concluíram:

- uma precificação;
- um compartilhamento de catálogo.

Mostrar elegíveis, retidas e percentual. A análise é descritiva; não declara causalidade.

### 6. Painel administrativo

Organizar a tela em quatro seções navegáveis:

1. **Visão geral:** instalações, cadastros, ativação, atividade e adoção por versão.
2. **Telas e funcionalidades:** ranking de telas, tempo ativo e ações importantes.
3. **Funil de ativação:** quatro marcos e conversão entre etapas.
4. **Retenção:** D1/D7/D30 geral e D7 por comportamento.

O painel mantém pull-to-refresh, estados de loading/erro e acessibilidade nas barras e percentuais.

## Modelo de dados

Criar `analytics_events` com:

- ID crescente;
- instalação e usuário autenticado opcional;
- tipo `screen_view` ou `action`;
- nome canônico validado;
- duração somente para tela;
- versão/build do app;
- timestamp do servidor.

Índices cobrem data, tipo/nome, instalação e usuário. RLS permanece habilitado e os papéis
`anon`/`authenticated` não acessam a tabela via PostgREST; somente a API escreve e consulta.

## API

- `POST /api/v1/analytics/events`: eventos anônimos.
- `POST /api/v1/analytics/events/identify`: eventos autenticados e vinculados à conta.
- Máximo de 25 eventos por requisição.
- Payload estrito com UUID da instalação, plataforma, versão/build e união discriminada de evento.
- Duração aceita somente em `screen_view`, limitada a seis horas por segmento.

## Privacidade e Data Safety

- Coleta: interação no app, identificador aleatório da instalação, versão, tela canônica, ação
  canônica e duração ativa.
- Finalidade: analytics de produto, melhoria de experiência e confiabilidade do funil.
- Não coleta conteúdo do usuário nem identificadores publicitários.
- Dados não são vendidos nem compartilhados com uma plataforma externa de analytics.
- Política de privacidade e declaração da Google Play devem descrever uso e duração de tela.

## Fora de escopo

- Replay de sessão, heatmap, gravação de toque ou texto digitado.
- Identificação de campanha, UTM, custo de aquisição ou atribuição de anúncio.
- Rastreamento de cada toque, erro técnico ou conteúdo criado.
- Inferência causal automática entre comportamento e retenção.

## Critérios de aceite

- [x] Todas as rotas estáticas possuem nome canônico ou são deliberadamente ignoradas em teste.
- [x] Tempo para enquanto o app está inativo/background.
- [x] Nenhum payload aceita nome livre de tela, ação ou metadata arbitrária.
- [x] As dez ações da tabela são registradas somente após sucesso ou início real do checkout.
- [x] Funil respeita a ordem temporal dos quatro marcos.
- [x] Versão conta cada instalação ativa uma única vez.
- [x] Retenção comportamental inclui numerador, denominador e percentual.
- [x] Painel possui as quatro seções e expõe todas as métricas deste PRD.
- [x] Conta fora de `ADMIN_USER_IDS` continua sem acesso ao relatório.
- [x] Falha de telemetria não altera o resultado da ação principal.
- [x] Política de privacidade, Data Safety e contextos técnicos estão atualizados.
- [x] Lint, typecheck, testes, Sherif e context lint passam.

## Implantação

1. Aplicar `035_analytics_behavior_events.sql` no Supabase.
2. Publicar a API com os endpoints de eventos e painel expandido.
3. Publicar atualização do app com a instrumentação e painel.
4. Aguardar sete dias para a primeira retenção comportamental madura.
5. Usar a linha de base para definir metas, sem interpretar correlação como causalidade.
