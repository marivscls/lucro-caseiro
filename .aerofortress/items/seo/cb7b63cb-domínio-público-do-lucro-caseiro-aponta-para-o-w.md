---
id: cb7b63cb-5f1f-4d9b-8494-c2fd90bfaf59
slug: seo
type: fact
title: Domínio público do Lucro Caseiro aponta para o web Railway e possui sitemap válido
tags: seo, dns, railway, search-console, sitemap, robots, producao
provenance: observado
evidence: apps/web/src/app/robots.ts; apps/web/src/app/sitemap.ts; Railway domain id 8cc67232-b648-44a3-b64b-0be4f1c9427c; preflight e chamadas Search Console executadas em 2026-07-23
decay: seasonal
created: 2026-07-23T17:39:12.150418700+00:00
updated: 2026-07-23T17:39:12.150418700+00:00
validated: 2026-07-23T17:39:12.150418700+00:00
links:
---

Em 2026-07-23, `lucrocaseiro.com.br` deixou de ser uma página estacionada da Hostinger e foi conectado ao serviço Railway `@lucro-caseiro/web` do projeto `heroic-wholeness`. O DNS raiz usa ALIAS/CNAME para `w3it7ixf.up.railway.app`, com TXT `_railway-verify`; o Railway marcou DNS propagado, propriedade verificada e certificado ECDSA válido para o domínio. O preflight público confirmou HTTPS 200 em `/landing`, `robots.txt` em texto liberando `/landing`, sitemap XML com raiz `urlset` e 9 URLs, todas HTTP 200. O Selenita validou as 9 URLs e submeteu `https://lucrocaseiro.com.br/sitemap.xml` com sucesso à propriedade `sc-domain:lucrocaseiro.com.br`; a inspeção imediata de `/landing` retornou `NEUTRAL`/“O Google não reconhece o URL”, esperado enquanto a descoberta inicial ainda não ocorreu. Manter os TXT do Google e Railway e não remover MX/SPF.
