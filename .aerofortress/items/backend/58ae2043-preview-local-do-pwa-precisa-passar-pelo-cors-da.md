---
id: 58ae2043-1b1e-47c0-ad43-05b2aa321fa5
slug: backend
type: scar
title: Preview local do PWA precisa passar pelo CORS da API de produção
tags: cors, pwa, localhost, preflight, api, production
provenance: observado
evidence: apps/api/src/shared/middleware/cors.ts; apps/api/src/main.ts; apps/api/src/shared/middleware/security.test.ts; Railway HTTP logs e curl OPTIONS em 2026-08-04
decay: stable
created: 2026-08-05T00:42:34.820966200+00:00
updated: 2026-08-05T00:42:34.820966200+00:00
validated: 2026-08-05T00:42:34.820966200+00:00
links:
---

SINTOMA (2026-08-04): o Lucro Caseiro aberto no navegador local não carregava produtos, clientes, vendas, agenda nem financeiro. Nos logs HTTP da API, todos os preflights OPTIONS vindos do Chrome recebiam 401; o probe confirmou que Origin http://localhost:8083 recebia 401, enquanto https://app.lucrocaseiro.com.br recebia 204. CAUSA: o callback CORS só permitia localhost quando NODE_ENV da API não era production, mas o preview PWA local usa a API de produção. CORREÇÃO CANÔNICA: permitir origens loopback http/https (localhost e 127.0.0.1, qualquer porta) independentemente do ambiente da API, mantendo a allowlist para domínios não locais. PREVENÇÃO: ao validar PWA local contra backend publicado, provar o preflight real com Origin e Access-Control-Request-Headers authorization,x-brand; health 200 não cobre CORS.
