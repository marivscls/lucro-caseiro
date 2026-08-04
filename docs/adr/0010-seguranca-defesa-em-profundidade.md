# ADR 0010 — Segurança por defesa em profundidade

> **Status:** Aceito · **Data:** 2026-08-04 · **Escopo:** aplicativo, PWA, site, API, banco e CI
> **PRD:** [Hardening de segurança 2026-08](../../.aerofortress/specs/prd-hardening-seguranca-2026-08.md)

## 1. Contexto

O Lucro Caseiro usa clientes públicos (Android, PWA e site), Supabase Auth/Storage, API Express em
Railway, PostgreSQL e dois provedores de assinatura. Não existe uma rede confiável entre essas
partes: headers, IDs, tokens de compra, eventos e dados de formulário devem ser tratados como não
confiáveis até validação no servidor.

A auditoria de 2026-08-04 encontrou dois fluxos de billing que não falham fechados e controles web
e operacionais incompletos. A solução precisa evitar dependência de comportamento do cliente e
continuar válida quando a API tiver mais de uma instância.

## 2. Decisão

Adotamos as seguintes regras arquiteturais obrigatórias.

### 2.1 Billing falha fechado

- Webhooks Stripe só existem quando assinatura criptográfica pode ser verificada. Segredo ausente é
  erro de configuração, nunca modo degradado.
- Estado de plano deriva de objeto obtido/verificado no provedor; metadados do request não são prova.
- Compra Google Play é vinculada à identidade por `obfuscatedExternalAccountId` e por hash único do
  token. Token bruto não é persistido nem logado.

### 2.2 Autorização no servidor e junto da consulta

- O token autentica a identidade; não autoriza automaticamente um recurso por ID.
- Consultas por recurso privado combinam `resource.id` e `resource.userId` na mesma operação.
- O cliente pode esconder ações por UX, mas plano, feature, propriedade e limites são decididos na
  API.

### 2.3 Navegador sob CSP e origem mínima

- CSP é emitida por resposta. Next e catálogo usam nonce; o servidor PWA calcula hashes de scripts
  inline do artefato gerado.
- Sessão web pode continuar no armazenamento suportado pelo Supabase nesta etapa, mas CSP forte e
  limpeza no logout são controles compensatórios obrigatórios.
- CORS usa allowlist. Requisição sem `Origin` é aceita para clientes nativos; origem arbitrária não
  ganha permissão de leitura pelo navegador.

### 2.4 Limites em duas camadas

- Um limitador em memória protege cada processo contra rajadas baratas.
- Fluxos caros/sensíveis usam contador PostgreSQL compartilhado, com chaves hasheadas/normalizadas e
  buckets fixos. Isso evita depender de Redis inexistente e mantém consistência entre instâncias.
- Quotas são específicas por operação; um limite global não substitui proteção de billing, IA,
  analytics ou formulários públicos.

### 2.5 Supply chain e segredos são gates

- Dependências diretas são atualizadas; override transitivo é permitido somente com versão corrigida
  compatível e comentário no manifesto.
- Auditoria de produção e secret scanning rodam no CI.
- Credenciais ficam no cofre do ambiente ou em diretório privado fora do workspace, nunca em arquivos
  rastreados ou na raiz local do projeto.

## 3. Alternativas consideradas

### Aceitar webhook sem segredo em desenvolvimento

Rejeitada. Testes podem injetar um verificador falso; manter um bypass no código de produção cria
um estado inseguro condicionado apenas à configuração.

### Confiar apenas no retorno da Google Play

Rejeitada. O retorno prova a compra, mas sem comparar a conta externa e controlar replay não prova
para qual conta do Lucro Caseiro ela deve conceder acesso.

### Manter apenas rate limit em memória

Rejeitada para fluxos sensíveis. Contadores divergem entre réplicas e reiniciam em deploy. O escudo
local continua útil para rajadas, mas não é a quota canônica.

### Adicionar Redis

Adiada. O projeto já possui PostgreSQL disponível, e o volume atual permite contadores curtos nele.
Redis passa a ser indicado quando métricas provarem contenção ou volume que justifique outro serviço.

### CSP estática com `unsafe-inline` para scripts

Rejeitada como estado final. Ela manteria compatibilidade, mas não reduziria adequadamente o impacto
de injeção em páginas que guardam sessão no navegador.

### Migrar autenticação web inteira para cookie HTTP-only

Adiada. É uma mudança arquitetural maior, com impacto no Supabase PKCE, PWA e Next. Pode ser avaliada
se o web app ganhar backend-for-frontend; não bloqueia o hardening atual.

## 4. Consequências

### Positivas

- configuração incompleta não vira autorização implícita;
- fraude por replay de compra fica bloqueada e auditável;
- XSS, clickjacking, MIME sniffing e vazamento de referrer têm defesa adicional;
- abuso fica limitado por operação e por instância/conjunto;
- regressões passam a falhar antes do deploy.

### Custos e riscos

- CSP exige nonce/hash e testes em todas as páginas públicas;
- contador PostgreSQL adiciona escrita curta em endpoints protegidos;
- compras antigas sem identificador podem exigir atendimento operacional;
- atualizações transitivas podem revelar incompatibilidades em build/teste;
- allowlist CORS precisa ser atualizada quando uma nova marca ganhar domínio web.

## 5. Invariantes de implementação

1. Nunca processar billing com autenticidade desconhecida.
2. Nunca logar token de compra, Bearer token, chave ou corpo completo de webhook.
3. Nunca confiar em `userId`, plano, preço ou propriedade enviados pelo cliente.
4. Nunca liberar um fluxo sensível porque o limitador compartilhado falhou.
5. Nunca usar `*` no CORS de produção.
6. Nunca adicionar `unsafe-inline` a `script-src` como correção permanente.
7. Toda exceção temporária deve ter teste, prazo e caminho de remoção.

## 6. Verificação

- testes unitários de pagamentos e middleware;
- teste de integração de autorização cruzada;
- `pnpm audit --prod` e scanner de segredos no CI;
- sondagem HTTP de headers, CORS e limites após deploy;
- compra de teste Google Play e evento Stripe de teste válidos;
- checklist de release do PRD.
