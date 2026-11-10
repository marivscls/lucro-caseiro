# Deploy no Fly.io

Execute os comandos a partir da raiz do repositorio. Os tres apps usam a regiao `gru`; o Postgres e a autenticacao continuam no mesmo projeto Supabase.

| Aplicacao      | Manifest               | Dominio                                                   |
| -------------- | ---------------------- | --------------------------------------------------------- |
| API e catalogo | `apps/api/fly.toml`    | `api.lucrocaseiro.com.br`, `catalogo.lucrocaseiro.com.br` |
| Site           | `apps/web/fly.toml`    | `lucrocaseiro.com.br`, `www.lucrocaseiro.com.br`          |
| PWA            | `apps/mobile/fly.toml` | `app.lucrocaseiro.com.br`                                 |

## Publicar

```sh
fly auth docker
# Compile com Docker usando a raiz como contexto e os build.args do manifest.
docker build -f apps/api/Dockerfile -t registry.fly.io/lucro-caseiro-api:TAG .
docker push registry.fly.io/lucro-caseiro-api:TAG
fly deploy -c apps/api/fly.toml --image registry.fly.io/lucro-caseiro-api:TAG --ha=false
# Repita para site e app, passando seus argumentos publicos de build.
```

No Windows, a versao atual do flyctl resolve o caminho do Dockerfile relativamente ao manifest;
use a compilacao Docker explicita acima para evitar duplicar `apps/api` no caminho.
Para site/PWA, todos os `[build.args]` do respectivo manifest devem ser enviados como
`--build-arg NOME=valor` ao Docker. Use tags unicas por commit.

A API permanece ligada com 1 GB de memoria. Site (512 MB) e PWA (256 MB) param automaticamente quando ociosos e iniciam ao receber requisicoes. Ha uma maquina por app; essa configuracao prioriza custo e nao oferece redundancia.

Os secrets da API sao configurados no Fly, nunca nos manifests ou argumentos de build. Ao transferir valores contendo espacos, aspas ou JSON, passe cada `NOME=valor` como um argumento direto ao processo `fly secrets set`; nao monte uma linha de shell nem acrescente aspas ao valor. Use `--stage` para agrupar alteracoes antes do deploy. Nao imprima credenciais.

As URLs e chaves publicaveis do Supabase nos manifests sao publicas. Mudancas de `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*` exigem reconstruir o frontend. O app Android usa `apps/mobile/eas.json` e tambem precisa de nova compilacao para alterar a URL da API.

## DNS e HTTPS

| Registro                 | Destino                              |
| ------------------------ | ------------------------------------ |
| A `@`                    | `66.241.125.227`                     |
| AAAA `@`                 | `2a09:8280:1::1f6:4c62:0`            |
| CNAME `www`              | `9m9k28j.lucro-caseiro-site.fly.dev` |
| CNAME `app`              | `q8em0or.lucro-caseiro-app.fly.dev`  |
| CNAME `api` e `catalogo` | `wk03rgg.lucro-caseiro-api.fly.dev`  |

TTL dos novos registros: 300 segundos. Caches anteriores podem persistir pelo TTL antigo (14400 segundos). Preserve registros de email e verificacoes de propriedade. Consulte `fly certs setup DOMINIO -a APP` se o Fly alterar os destinos ou precisar de desafio DNS.

## Validar

```sh
fly checks list -a lucro-caseiro-api
fly certs list -a lucro-caseiro-api
fly certs list -a lucro-caseiro-site
fly certs list -a lucro-caseiro-app
curl https://api.lucrocaseiro.com.br/api/v1/health
```

Verifique tambem login, produto, precificacao e venda com uma conta temporaria, removendo os dados ao finalizar. O webhook Stripe deve permanecer em `https://api.lucrocaseiro.com.br/api/v1/webhooks/stripe`. Os retornos de checkout usam `https://app.lucrocaseiro.com.br/plans?checkout=success` e `?checkout=cancel`.

Validacao da migracao em 10/11/2026: health HTTP 200; login Supabase; criacao/leitura de produto; calculo de preco; criacao/leitura de venda; catalogo publico com produto renderizado; exclusao das contas temporarias; webhook com assinatura Stripe valida; CORS dos tres dominios publicos e rejeicao de acesso anonimo a produtos. Os cinco certificados HTTPS foram emitidos. App e catalogo tambem foram verificados com `curl --resolve` contra os IPs novos, sem desativar validacao TLS, enquanto caches antigos ainda apontavam para Railway.

O smoke check `scripts/check-landing.mjs` possui uma expectativa antiga de exatamente nove URLs no sitemap. O site atual publica 16. A verificacao adicional em memoria confirmou a presenca das nove URLs esperadas, seus HTTP 200, redirects, canonical, robots e imagem social; o script original nao foi alterado nesta migracao.

## Recuperacao

Antes de cada deploy, registre a imagem atual com `fly status -a APP --json`. Para restaurar uma imagem conhecida, use `fly deploy -c MANIFEST --image IMAGEM --ha=false`. A imagem inicial desta migracao tem a tag `registry.fly.io/APP:migration-20261110`. Rollback de imagem nao desfaz migracoes de banco.

Nao exclua o projeto Railway inteiro: ele contem servicos de outros produtos. Versoes Android anteriores a 1.2.3 (34) ainda podem usar a URL Railway e dependem de atualizacao. O perfil EAS de submissao `production` atualmente aponta para teste interno; isso nao equivale a publicar na faixa de producao do Google Play.

## Android 1.2.3 (34)

Build EAS concluido: `6aee9fd0-0e28-452a-b0d8-e73018aec5b3`. O bundle assinado foi inspecionado: contem `https://api.lucrocaseiro.com.br` e nao contem a URL antiga da API Railway.

Em 10/11/2026, a versao foi enviada pelo Play Console da ORIONSEVEN SOFTWARE para revisao na faixa de producao, com lancamento de 100% e os mesmos paises/dispositivos da versao 33. O console confirmou "1 mudanca enviada para revisao" e "Alteracoes em analise". A publicacao gerenciada permanece desativada; a disponibilizacao depende da aprovacao do Google. A conta de servico existente permite upload, mas nao autoriza lancar em producao; nenhuma permissao foi ampliada.

Os tres servicos do Lucro Caseiro no Railway foram verificados sem deployments ativos (ultimo deployment `FAILED`). O projeto e os servicos de outros produtos foram preservados.

## Atualizacao de planos — 10/11/2026

PR #9 integrado em `1ac886df`; main publicada em `f26ec337`. Os tres apps Fly usam
`registry.fly.io/APP:plans-20261110-f26ec337`. A API, o site e a PWA foram publicados
e os dominios publicos responderam pelo Fly. O bundle PWA contem a rota
`welcome-plans` e a URL nova da API.

Smoke de producao com conta temporaria: login, produto com cinco fotos, rejeicao
da sexta foto, precificacao, venda com baixa de estoque, catalogo Gratuito com
dez produtos e PDF mensal no Gratuito. Conta e dados temporarios excluidos.

Dependencias atualizadas; auditoria sem advisories bloqueantes high/critical.
O patch CommonJS do decoder inclui a correcao linear 0.5.1, verificada por hash
e teste com milhares de trechos malformados. Zod 4.6.6 preserva defaults internos
com prefault. Tipos, lint, testes e builds passaram localmente; o hook de push
passou integralmente com VITEST_MAX_WORKERS=2 e TURBO_ENV_MODE=loose para reduzir
o consumo de memoria. O CI do GitHub passou seguranca, lint, tipos, testes e
sherif, mas continua falhando em knip:full por arquivos/exports sem uso ja existentes;
nenhum gate foi removido ou desativado. Run: 42871074916.

O Play Console confirmou a versao 34 (1.2.3) publicada as 13:41 de 10/11/2026.
A versao 35 (1.2.4), com o PR #9, usa o build EAS
`b9ded2d5-f02c-4daf-80b0-f70514834268`.
