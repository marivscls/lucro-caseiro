# PRD — Hardening de segurança do aplicativo, PWA, site e API

**Status:** Concluído e validado em produção com probes não destrutivos
**Data:** 2026-08-04
**Responsável:** Lucro Caseiro
**Escopo:** `apps/api`, `apps/mobile`, `apps/web`, banco, CI e operação Railway/Supabase/Stripe/Google Play
**Decisão relacionada:** [ADR 0010 — Segurança por defesa em profundidade](../../docs/adr/0010-seguranca-defesa-em-profundidade.md)

## 1. Contexto

Uma auditoria inicial de código, configuração, dependências e respostas HTTP de produção confirmou
uma base adequada de autenticação, validação e isolamento por usuário, mas encontrou lacunas que
permitem fraude de assinatura ou ampliam o impacto de abuso e de uma eventual injeção no navegador.

Controles já presentes e que devem ser preservados:

- token Supabase validado no backend antes das rotas privadas;
- `userId` autenticado propagado aos casos de uso e filtros dos repositórios;
- sessão nativa armazenada no `expo-secure-store`;
- contratos Zod para entradas da API;
- corpo bruto do webhook Stripe antes do parser JSON;
- erros internos não expostos ao cliente;
- HTTPS com redirecionamento nos domínios públicos;
- políticas de Storage escopadas pela pasta do usuário.

## 2. Problemas confirmados

### P0 — Webhook Stripe falha aberto

Quando `STRIPE_WEBHOOK_SECRET` está vazio, o endpoint desserializa o corpo e processa o evento sem
assinatura. Uma configuração incompleta pode transformar metadados controlados pelo remetente em
alteração de plano.

### P0 — Compra Google Play não está vinculada à conta

O app envia o UUID autenticado em `obfuscatedAccountId`, e a API do Google devolve esse valor em
`externalAccountIdentifiers.obfuscatedExternalAccountId`. O backend não compara os dois valores e
não registra unicidade do token; uma compra válida pode ser reapresentada por outra conta.

### P0 — Dependências com avisos conhecidos

`pnpm audit --prod` em 2026-08-04 encontrou 52 ocorrências: 1 crítica, 25 altas, 24 moderadas e 2
baixas. Parte é tooling transitivo, mas existe dependência direta do Next.js com correção disponível.

### P1 — Navegador sem headers de defesa

Site, PWA e catálogo não enviam CSP, HSTS, `X-Content-Type-Options`, política de enquadramento nem
`Referrer-Policy`. A sessão web persiste em `localStorage`, portanto reduzir a superfície de XSS é
obrigatório.

### P1 — CORS e limites de consumo permissivos

A API responde `Access-Control-Allow-Origin: *`. O limitador é global, em memória e igual para
operações baratas e fluxos sensíveis. Agendamentos, pedidos públicos, analytics, IA e pagamentos
precisam de quotas próprias. O parser JSON não declara um teto explícito.

### P1 — Ausência de regressão automatizada de segurança

O CI executa qualidade funcional, mas não audita dependências nem segredos. Faltam testes explícitos
para assinatura de webhook, replay de compra, acesso cruzado entre usuários e respostas sem token.

### P1 — Chaves reais dentro da árvore local

Duas credenciais Google service account existem na raiz local. Estão ignoradas pelo Git e não foram
encontradas no histórico pelos mesmos caminhos, mas a árvore do projeto não deve funcionar como
cofre.

## 3. Objetivo

Fazer os fluxos sensíveis falharem fechados, vincular compras à identidade autenticada, reduzir a
superfície web/API e tornar regressões de segurança bloqueadoras no CI sem alterar a experiência
funcional do produto.

## 4. Fora de escopo

- pentest destrutivo ou tentativa de fraude em produção;
- troca do Supabase Auth, Railway, Stripe ou Google Play;
- implantação de WAF/CDN ou compra de serviço externo;
- criptografia própria de dados já protegidos pelo banco/provedor;
- reescrita da aplicação para autenticação exclusivamente por cookies.

## 5. Requisitos

### RF-01 — Stripe sempre autenticado

- Produção não inicia pagamentos Stripe sem `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` coerentes.
- Webhook sem segredo, sem `Stripe-Signature`, com assinatura inválida ou corpo alterado responde 400
  e nunca chama o caso de uso.
- Eventos válidos continuam idempotentes e aceitam somente os tipos já suportados.
- Testes cobrem configuração ausente, assinatura ausente, assinatura inválida e evento válido.

### RF-02 — Google Play vinculado e resistente a replay

- O backend compara `obfuscatedExternalAccountId` retornado pelo Google com o `userId` autenticado.
- Compras legadas sem identificador não ativam uma nova conta automaticamente; devem exigir caminho
  operacional explícito, sem relaxar a regra para todas as compras.
- Um hash do `purchaseToken` fica associado a um único usuário em tabela com restrição única; o token
  bruto não é persistido.
- Reapresentar a mesma compra na mesma conta é idempotente; em outra conta é proibido e auditável.
- Testes cobrem vínculo correto, ausente, divergente, primeira associação e replay cruzado.

### RF-03 — Dependências sem vulnerabilidade corrigível conhecida

- Atualizar dependências diretas para versões corrigidas compatíveis.
- Usar overrides apenas para transitivas sem atualização disponível no pai.
- `pnpm audit --prod --audit-level=high` deve passar; achados restantes abaixo de alto precisam de
  justificativa documentada e não podem ser alcançáveis por entrada não confiável em produção.

### RF-04 — Headers e CSP

- Site Next: CSP com nonce por resposta, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`,
  `form-action`, `nosniff`, HSTS em produção, `Referrer-Policy` e `Permissions-Policy` mínima.
- PWA estático: CSP compatível com o bundle, preferindo hashes dos scripts inline; mesmos headers de
  transporte, conteúdo, frame e referrer.
- Catálogo HTML: nonce por resposta nos scripts inline e CSP estrita compatível com fontes/imagens.
- API JSON: headers aplicáveis (`nosniff`, referrer, cache apropriado), sem políticas HTML inúteis.
- Nenhuma página ou fluxo OAuth pode quebrar por CSP.

### RF-05 — CORS por allowlist

- Produção aceita somente origens configuradas e os domínios oficiais.
- Clientes nativos ou server-to-server sem header `Origin` continuam funcionando.
- Desenvolvimento permite localhost; `*` só é aceito fora de produção.
- Preflight de origem não autorizada não recebe permissão CORS.

### RF-06 — Limites de recursos

- JSON geral com limite explícito; webhook Stripe conserva parser bruto e limite próprio.
- Barreira global por IP continua barata e não faz varredura linear por requisição.
- Fluxos públicos de escrita, analytics, checkout, sincronização de plano e IA têm limites menores,
  por IP e/ou usuário conforme a identidade disponível.
- Limites sensíveis usam armazenamento compartilhado no PostgreSQL para funcionar com múltiplas
  instâncias; falha do armazenamento não libera silenciosamente o fluxo protegido.
- Respostas 429 informam `Retry-After` sem revelar chaves internas.

### RF-07 — Uploads e armazenamento local no navegador

- Upload mantém limite de tamanho, tipos permitidos e pasta do usuário no Storage.
- Nomes exibidos continuam escapados pelo React; URLs assinadas continuam temporárias.
- Cache e rascunhos privados em `localStorage` são apagados no logout e não são compartilhados entre
  contas no mesmo navegador.

### RF-08 — Autorização e IDOR

- Toda rota privada rejeita ausência/token inválido.
- Leitura, alteração e exclusão por ID exigem simultaneamente ID do recurso e `userId` autenticado.
- Operações auxiliares que recebem apenas IDs internos são chamadas somente após comprovação de posse
  ou passam a receber `userId`.
- Testes exercitam pelo menos um recurso CRUD completo com usuário proprietário e usuário diferente.

### RF-09 — CI e gestão de segredos

- CI executa auditoria de dependências de produção, verificação de segredos e testes de segurança.
- Actions externas são fixadas de forma reproduzível.
- Credenciais reais não ficam dentro da árvore do projeto; arquivos locais existentes são movidos
  para diretório privado fora do workspace.
- Se houver suspeita de cópia, sincronização ou exposição, a chave é revogada no provedor e recriada.

### RF-10 — Observabilidade operacional

- Logs registram rejeições de assinatura, replay/vínculo de compra e rate limit sem gravar token,
  segredo, autorização ou dados pessoais.
- Railway mantém alertas de disponibilidade e custo; Stripe/Google mantêm alertas de webhook/compra.
- Checklist de release confirma health, headers, CORS e um fluxo real de compra em sandbox/teste.

## 6. Critérios de aceite

- [x] API não processa webhook Stripe não assinado em nenhuma configuração.
- [x] Compra Google Play não ativa conta diferente da vinculada.
- [x] Hash de token não pode pertencer a dois usuários.
- [x] Auditoria de produção não contém vulnerabilidade conhecida corrigível.
- [x] Domínios oficiais enviam os headers acordados e continuam carregando sem erro CSP.
- [x] Origem arbitrária não recebe CORS; PWA, site, catálogo e app nativo funcionam em produção.
- [x] Endpoints sensíveis retornam 429 ao exceder sua quota em teste automatizado.
- [x] Payload acima do teto é rejeitado com 413 em teste automatizado.
- [x] Testes de autenticação, IDOR, assinatura e replay passam.
- [x] CI bloqueia dependência vulnerável e segredo provável.
- [x] Credenciais reais não permanecem dentro do workspace.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` e builds afetados passam.

## 7. Rollout e rollback

1. As migrações `049` e `050` são idempotentes e executam com a `DATABASE_URL` do ambiente antes de
   a API começar a aceitar tráfego.
2. O health de produção confirma Stripe e Google Play configurados sem expor seus valores.
3. API, site e PWA foram publicados pela Railway a partir de `ad4f1f3`; a correção do store de rate
   limit foi publicada em `75013cb`.
4. CSP foi publicada diretamente em enforcement após builds e probes locais; os três serviços
   concluíram o deploy e responderam pelos domínios oficiais.
5. Não foi necessário novo binário Android: biblioteca e configuração de compra no cliente não
   mudaram neste hardening.
6. Em rollback, nunca reativar o webhook sem assinatura nem remover a unicidade de compra; pode-se
   relaxar somente uma diretiva CSP específica e documentada enquanto se corrige o recurso bloqueado.

## 8. Evidências da auditoria inicial

- `apps/api/src/features/payments/stripe.routes.ts`
- `apps/api/src/features/subscription/google-play.client.ts`
- `apps/mobile/src/features/subscription/use-subscription.ts`
- `apps/api/src/main.ts`
- `apps/mobile/scripts/serve-pwa.mjs`
- `.github/workflows/ci.yml`
- `pnpm audit --prod` executado em 2026-08-04
- respostas HTTP reais dos domínios oficiais inspecionadas em 2026-08-04

## 9. Resultado da implementação em 2026-08-04

- Webhook Stripe falha fechado e possui testes isolados de segredo/assinatura.
- Google Play compara a conta ofuscada e registra somente SHA-256 do token em vínculo único.
- Migrações `049_subscription_purchase_claims.sql` e `050_api_rate_limit_buckets.sql` foram aplicadas
  pelo boot idempotente da API no banco configurado na Railway.
- Auditoria caiu de 52 ocorrências para zero vulnerabilidades conhecidas em produção.
- Next respondeu localmente com CSP/nonce variável, HSTS e `nosniff`; PWA respondeu com CSP, HSTS e
  `nosniff`; catálogo aplica nonce por resposta.
- CORS de produção exige allowlist, JSON geral tem teto de 256 KiB e fluxos sensíveis usam buckets
  compartilhados no PostgreSQL com falha fechada.
- CI executa auditoria e scanner de segredos; actions externas estão fixadas por commit.
- Duas contas de serviço locais foram movidas para `C:\Users\maria\.secrets\lucro-caseiro`.
- Validação observada: lint, 7 typechecks, 1.119 testes, build de API/Next/PWA, Sherif, scanner e
  auditoria passaram. Knip continua acusando débitos preexistentes fora do escopo deste hardening.
- Produção confirmou HSTS e `nosniff` na API, site, PWA e catálogo; nonce no CSP do Next; hash no CSP
  do PWA; origem oficial aceita e origem arbitrária sem ACAO; payload de 270 KB rejeitado com 413;
  assinatura Stripe inválida rejeitada com 400; e contador PostgreSQL retornando 429 na 21ª chamada.
- O primeiro probe do limitador revelou 503 na consulta SQL bruta. A implementação foi corrigida para
  o query builder tipado do Drizzle, republicada e comprovada contra o PostgreSQL real.
- O job do GitHub Actions passou scanner, auditoria, lint, tipos, testes e Sherif, mas o status geral
  permaneceu vermelho no `knip:full` por dívida preexistente já registrada, sem relação com os gates
  de segurança. Uma compra real não foi criada durante os probes não destrutivos; fluxos válidos de
  Stripe e Google Play permanecem cobertos por testes e pela confirmação de configuração no health.
