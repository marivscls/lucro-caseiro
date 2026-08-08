---
id: 58ae2043-1b1e-47c0-ad43-05b2aa321fa5
slug: backend
type: scar
title: Todo domínio ativo do PWA precisa passar pelo CORS da API de produção
tags: cors, pwa, railway, localhost, preflight, api, production
provenance: observado
evidence: apps/api/src/shared/middleware/cors.ts; apps/api/src/config.ts; apps/api/src/shared/middleware/security.test.ts; Railway HTTP logs com OPTIONS 401 em /api/v1/finance, /products, /clients e /sales em 2026-08-08; curl OPTIONS comparando app.lucrocaseiro.com.br=204 e lucro-caseiromobile-production.up.railway.app=401
decay: stable
created: 2026-08-05T00:42:34.820966200+00:00
updated: 2026-08-08T15:33:58.755265200+00:00
validated: 2026-08-08T15:33:58.755265200+00:00
links:
---

SINTOMAS: em 2026-08-04, o preview local do PWA não carregava produtos, clientes, vendas, agenda nem financeiro; em 2026-08-08, o mesmo bloqueio atingiu o PWA publicado no domínio de serviço da Railway. Em ambos os casos, os logs HTTP mostraram preflights OPTIONS 401 em todas as rotas autenticadas, enquanto o health check seguia 200. CAUSAS: primeiro, loopback era condicionado ao NODE_ENV da API; depois, a allowlist continha apenas o domínio customizado app.lucrocaseiro.com.br e omitia lucro-caseiromobile-production.up.railway.app (e o frontend web equivalente). CORREÇÃO CANÔNICA: permitir origens loopback http/https (localhost e 127.0.0.1, qualquer porta) e manter uma lista explícita de todos os domínios oficiais ativos, customizados e gerados pela Railway; nunca liberar wildcard de \*.railway.app. PREVENÇÃO: depois de cada publicação, provar OPTIONS real com Origin de cada frontend ativo, Access-Control-Request-Method e Access-Control-Request-Headers authorization,x-brand. Health 200 não cobre CORS nem rotas autenticadas.
