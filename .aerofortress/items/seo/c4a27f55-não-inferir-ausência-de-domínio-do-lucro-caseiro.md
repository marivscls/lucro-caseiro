---
id: c4a27f55-a655-4dcc-9236-120588859b1c
slug: seo
type: scar
title: Não inferir ausência de domínio do Lucro Caseiro pelo seed do Selenita
tags: seo, dominio, sitemap, correcao, selenita
provenance: dito
evidence: C:\Users\maria\Documents\projects\lucro-caseiro\apps\web\src\features\landing\site-constants.ts; C:\Users\maria\Documents\projects\lucro-caseiro\apps\web\src\app\robots.ts; C:\Users\maria\Documents\projects\lucro-caseiro\apps\web\src\app\sitemap.ts; HTTP observado em 2026-07-21
decay: stable
created: 2026-07-21T17:35:02.006706+00:00
updated: 2026-07-21T17:35:02.006706+00:00
validated: 2026-07-21T17:35:02.006706+00:00
links:
---

CORREÇÃO DA USUÁRIA (2026-07-21): ao pedir domínio e sitemap para configurar o SEO Ops, foi incorreto concluir que o Lucro Caseiro não tinha domínio olhando apenas o workspace seed do Selenita. O repositório real confirma `lucrocaseiro.com.br` como domínio público canônico e gera `/sitemap.xml`; `app.lucrocaseiro.com.br` é o PWA, não o domínio editorial de SEO. PREVENÇÃO: para dados de um cliente importado, consultar o repositório/rede do cliente antes de interpretar placeholders ou seeds do produto agregador. Validar também a publicação: nesta data, o domínio raiz estava estacionado, com `robots.txt` bloqueando tudo e `sitemap.xml` respondendo HTML, embora o código já tenha sitemap real.
